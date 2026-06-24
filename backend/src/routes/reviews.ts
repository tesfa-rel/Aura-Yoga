import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const router = express.Router();

// Get reviews for a class
router.get('/class/:classId', async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const reviews = await prisma.review.findMany({
      where: { classId },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const average = reviews.length
      ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length
      : 0;
    res.json({ reviews, average: Math.round(average * 10) / 10, count: reviews.length });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a review
router.post('/', authenticateToken, [
  body('classId').notEmpty().withMessage('Class ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  body('comment').optional().isLength({ max: 500 }).withMessage('Comment max 500 chars'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { classId, rating, comment } = req.body;
    const userId = req.user!.id;

    // Verify user attended the class
    const booking = await prisma.booking.findFirst({
      where: { userId, classId, status: 'CONFIRMED' },
    });
    if (!booking) {
      return res.status(403).json({ error: 'You must attend a class to review it' });
    }

    const existing = await prisma.review.findUnique({
      where: { userId_classId: { userId, classId } },
    });
    if (existing) {
      return res.status(400).json({ error: 'You have already reviewed this class' });
    }

    const review = await prisma.review.create({
      data: { userId, classId, rating, comment },
      include: { user: { select: { name: true } } },
    });
    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
