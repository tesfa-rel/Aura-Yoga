import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { supabase, supabaseAuth } from '../lib/supabase';

const router = express.Router();

// Helper: ensure Prisma user profile exists for a Supabase auth user
async function ensureUserProfile(authUser: { id: string; email?: string | null; user_metadata?: any }) {
  let user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true }
  });

  if (!user) {
    const meta = authUser.user_metadata || {};
    user = await prisma.user.create({
      data: {
        id: authUser.id,
        email: authUser.email || meta.email || '',
        name: meta.name || meta.full_name || 'User',
        phone: meta.phone || null,
        role: meta.role || 'USER',
      },
      select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true }
    });
  }

  return user;
}

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

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone },
    });

    if (authError || !authData.user) {
      return res.status(400).json({ error: authError?.message || 'Registration failed' });
    }

    // Create Prisma profile
    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        email,
        name,
        phone: phone || null,
        role: 'USER',
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    });

    const token = generateAccessToken(user.id);
    const refreshToken = await issueRefreshToken(user.id);

    res.status(201).json({
      message: 'User created successfully',
      user,
      token: sessionData.session.access_token,
      refreshToken: sessionData.session.refresh_token,
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

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user || !authData.session) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Ensure Prisma profile exists
    const user = await ensureUserProfile(authData.user);

    res.json({
      message: 'Login successful',
      user,
      token: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
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

    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await ensureUserProfile(authData.user);
    res.json({ user });
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
});

// Logout
router.post('/logout', async (_req: Request, res: Response) => {
  // Supabase sessions are invalidated client-side; backend just acknowledges.
  res.json({ message: 'Logged out successfully' });
});

// Refresh access token using Supabase refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const { data, error } = await supabaseAuth.auth.refreshSession(refreshToken);

    if (error || !data.session) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    res.json({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });
  } catch (error) {
    res.status(403).json({ error: 'Invalid refresh token' });
  }
});

// Forgot password — delegate to Supabase
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // In a real app, set the redirect URL to your frontend reset-password page
    const redirectUrl = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/reset-password`
      : 'http://localhost:3000/reset-password';

    const { error } = await supabaseAuth.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error('Supabase forgot password error:', error);
    }

    // Always return success to avoid email enumeration
    res.json({ message: 'If an account exists, a reset email has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
