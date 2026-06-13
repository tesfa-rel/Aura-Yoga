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

// Join the waitlist for a class (only allowed when the class is full)
router.post(
  '/',
  authenticateToken,
  [body('classId').notEmpty().withMessage('Class ID is required')],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { classId } = req.body;
      const userId = req.user!.id;

      const classItem = await prisma.class.findUnique({
        where: { id: classId },
        include: { bookings: true },
      });

      if (!classItem) {
        return res.status(404).json({ error: 'Class not found' });
      }

      const classDateTime = new Date(
        `${classItem.date.toISOString().split('T')[0]}T${classItem.time}`
      );
      if (classDateTime < new Date()) {
        return res.status(400).json({ error: 'Cannot join the waitlist for a past class' });
      }

      const activeBookings = classItem.bookings.filter((b) => b.status !== 'CANCELLED');
      if (activeBookings.length < classItem.capacity) {
        return res
          .status(400)
          .json({ error: 'Class still has open spots — please book it directly' });
      }

      // Already booked?
      const existingBooking = classItem.bookings.find(
        (b) => b.userId === userId && b.status !== 'CANCELLED'
      );
      if (existingBooking) {
        return res.status(400).json({ error: 'You already have a booking for this class' });
      }

      const existingEntry = await prisma.waitlistEntry.findUnique({
        where: { userId_classId: { userId, classId } },
      });
      if (existingEntry && existingEntry.status !== 'CANCELLED') {
        return res.status(400).json({ error: 'You are already on the waitlist for this class' });
      }

      const lastEntry = await prisma.waitlistEntry.findFirst({
        where: { classId, status: 'WAITING' },
        orderBy: { position: 'desc' },
      });
      const position = (lastEntry?.position ?? 0) + 1;

      // Reuse a prior CANCELLED entry (unique constraint on userId+classId).
      const entry = existingEntry
        ? await prisma.waitlistEntry.update({
            where: { id: existingEntry.id },
            data: { status: 'WAITING', position, promotedAt: null },
          })
        : await prisma.waitlistEntry.create({
            data: { userId, classId, position, status: 'WAITING' },
          });

      res.status(201).json({
        message: `You're on the waitlist at position ${position}. We'll notify you if a spot opens up.`,
        waitlistEntry: entry,
      });
    } catch (error) {
      console.error('Join waitlist error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Current user's waitlist entries
router.get('/my-waitlist', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const entries = await prisma.waitlistEntry.findMany({
      where: { userId, status: { not: 'CANCELLED' } },
      include: {
        class: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(entries);
  } catch (error) {
    console.error('Get waitlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Leave the waitlist
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const entry = await prisma.waitlistEntry.findUnique({ where: { id } });
    if (!entry) {
      return res.status(404).json({ error: 'Waitlist entry not found' });
    }
    if (entry.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to modify this waitlist entry' });
    }

    await prisma.waitlistEntry.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    res.json({ message: 'Removed from waitlist' });
  } catch (error) {
    console.error('Leave waitlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
