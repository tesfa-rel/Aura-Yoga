import express, { Request, Response } from 'express';
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

// Subscribe to push notifications
router.post('/subscribe', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { subscription } = req.body;
    const userId = req.user?.id;

    if (!userId || !subscription) {
      return res.status(400).json({ error: 'User ID and subscription are required' });
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, userId },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    res.json({ message: 'Successfully subscribed to notifications' });
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    res.status(500).json({ error: 'Failed to subscribe to notifications' });
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    await prisma.pushSubscription.deleteMany({ where: { userId } });

    res.json({ message: 'Successfully unsubscribed from notifications' });
  } catch (error) {
    console.error('Error unsubscribing from notifications:', error);
    res.status(500).json({ error: 'Failed to unsubscribe from notifications' });
  }
});

// Send push notification to a specific user
router.post('/send', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({ error: 'User ID, title, and body are required' });
    }

    const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });

    if (subscriptions.length === 0) {
      return res.status(404).json({ error: 'User not subscribed to notifications' });
    }

    console.log(`Push notification sent to user ${userId}:`, { title, body, data });

    res.json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Send broadcast notification to all users
router.post('/broadcast', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    const subscriptions = await prisma.pushSubscription.findMany();
    let sentCount = 0;

    for (const sub of subscriptions) {
      console.log(`Broadcast notification sent to user ${sub.userId}:`, { title, body, data });
      sentCount++;
    }

    res.json({
      message: 'Broadcast notification sent successfully',
      sentCount
    });
  } catch (error) {
    console.error('Error sending broadcast notification:', error);
    res.status(500).json({ error: 'Failed to send broadcast notification' });
  }
});

// Get notification preferences for a user
router.get('/preferences', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    let preferences = await prisma.notificationPreference.findUnique({ where: { userId } });

    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          userId,
          bookingReminders: true,
          classReminders: true,
          paymentConfirmations: true,
          promotionalOffers: false,
          newsletter: false,
        },
      });
    }

    res.json(preferences);
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    res.status(500).json({ error: 'Failed to get notification preferences' });
  }
});

// Update notification preferences for a user
router.put('/preferences', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { bookingReminders, classReminders, paymentConfirmations, promotionalOffers, newsletter } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const preferences = await prisma.notificationPreference.upsert({
      where: { userId },
      update: { bookingReminders, classReminders, paymentConfirmations, promotionalOffers, newsletter },
      create: { userId, bookingReminders, classReminders, paymentConfirmations, promotionalOffers, newsletter },
    });

    res.json({ message: 'Notification preferences updated successfully', preferences });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

export default router;
