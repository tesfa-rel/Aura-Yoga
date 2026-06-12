import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { findUserByEmail, validatePassword } from '../mocks/mockAuth';
import {
  generateAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
  issuePasswordResetToken,
  consumePasswordResetToken,
} from '../services/authTokenService';
import { emailService } from '../services/emailService';

const router = express.Router();

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('name').trim().isLength({ min: 2 }),
  body('password').isLength({ min: 6 }),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, name, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      }
    });

    const token = generateAccessToken(user.id);
    const refreshToken = await issueRefreshToken(user.id);

    res.status(201).json({
      message: 'User created successfully',
      user,
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Try database first, then fall back to mock
    let user = null;
    
    try {
      user = await prisma.user.findUnique({
        where: { email }
      });

      if (user) {
        // Check password with bcrypt
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          user = null;
        }
      }
    } catch (dbError) {
      console.log('Database not available, using mock auth');
    }

    // Fall back to mock authentication
    if (!user) {
      const mockUser = findUserByEmail(email);
      if (mockUser && validatePassword(mockUser, password)) {
        user = mockUser;
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateAccessToken(user.id);
    // Mock users aren't in the DB, so they can't have a persisted refresh token.
    let refreshToken: string | undefined;
    try {
      refreshToken = await issueRefreshToken(user.id);
    } catch (refreshError) {
      console.log('Skipping refresh token issuance (likely a mock user)');
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Exchange a refresh token for a fresh access token (and rotate the refresh token)
router.post('/refresh', [body('refreshToken').notEmpty()], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { refreshToken } = req.body;
    const rotated = await rotateRefreshToken(refreshToken);

    if (!rotated) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const token = generateAccessToken(rotated.userId);
    res.json({ token, refreshToken: rotated.refreshToken });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout: revoke the supplied refresh token (idempotent)
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body || {};
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    res.json({ message: 'Logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Request a password reset link. Always returns 200 so the endpoint can't be
// used to probe which emails are registered.
router.post('/forgot-password', [body('email').isEmail().normalizeEmail()], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    const response: { message: string; resetToken?: string } = {
      message: 'If an account exists for that email, a reset link has been sent.',
    };

    if (user) {
      const resetToken = await issuePasswordResetToken(user.id);
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;
      const sent = await emailService.sendPasswordResetEmail(user.email, resetUrl);

      // When SMTP isn't configured (dev), surface the token so the flow is usable.
      if (!sent && process.env.NODE_ENV !== 'production') {
        response.resetToken = resetToken;
      }
    }

    res.json(response);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete a password reset using a valid token
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 6 }),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;
    const userId = await consumePasswordResetToken(token);

    if (!userId) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Force re-login everywhere after a password change.
    await revokeAllRefreshTokens(userId);

    res.json({ message: 'Password has been reset. Please log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({ user });
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
});

export default router;
