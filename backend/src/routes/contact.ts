import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { sendContactNotification } from '../services/emailService';

const router = express.Router();

router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('message').isLength({ min: 5 }).withMessage('Message must be at least 5 characters'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array().map((e: any) => e.msg).join(', ') });
    }

    const { name, email, message } = req.body;
    await sendContactNotification({ name, email, message });

    res.json({ message: 'Thank you for reaching out. We will get back to you soon.' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
