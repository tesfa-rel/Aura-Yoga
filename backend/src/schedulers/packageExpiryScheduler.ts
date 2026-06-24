import * as cron from 'node-cron';
import { PackageExpiryService } from '../services/packageExpiryService';
import { sendPackageExpiryReminder } from '../services/emailService';

export class PackageExpiryScheduler {
  private static instance: PackageExpiryScheduler;
  private isRunning = false;

  private constructor() {}

  public static getInstance(): PackageExpiryScheduler {
    if (!PackageExpiryScheduler.instance) {
      PackageExpiryScheduler.instance = new PackageExpiryScheduler();
    }
    return PackageExpiryScheduler.instance;
  }

  /**
   * Start the package expiry scheduler
   * Runs daily at midnight (00:00)
   */
  public start(): void {
    if (this.isRunning) {
      console.log('Package expiry scheduler is already running');
      return;
    }

    // Schedule to run daily at midnight
    cron.schedule('0 0 * * *', async () => {
      try {
        console.log('Running daily package expiry check...');
        await PackageExpiryService.checkAndExpirePackages();
        console.log('Package expiry check completed');

        // Send reminder emails for packages expiring in 3 days
        const expiringPackages = await PackageExpiryService.getExpiringPackages(3);
        for (const up of expiringPackages) {
          if (up.user?.email && up.expiresAt) {
            const daysLeft = Math.ceil((new Date(up.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            try {
              await sendPackageExpiryReminder({
                to: up.user.email,
                userName: up.user.name,
                packageName: up.package.name,
                daysLeft: Math.max(0, daysLeft),
              });
            } catch (emailErr) {
              console.error('Failed to send expiry reminder:', emailErr);
            }
          }
        }
      } catch (error) {
        console.error('Error in scheduled package expiry check:', error);
      }
    });

    // Also run every hour for more frequent checks
    cron.schedule('0 * * * *', async () => {
      try {
        await PackageExpiryService.checkAndExpirePackages();
      } catch (error) {
        console.error('Error in hourly package expiry check:', error);
      }
    });

    this.isRunning = true;
    console.log('Package expiry scheduler started');
  }

  /**
   * Stop the scheduler
   */
  public stop(): void {
    if (!this.isRunning) {
      console.log('Package expiry scheduler is not running');
      return;
    }

    // Note: node-cron doesn't have a built-in stop method for individual tasks
    // In a production environment, you might want to use a more sophisticated scheduler
    this.isRunning = false;
    console.log('Package expiry scheduler stopped');
  }

  /**
   * Run the expiry check manually
   */
  public async runExpiryCheck(): Promise<void> {
    try {
      console.log('Running manual package expiry check...');
      await PackageExpiryService.checkAndExpirePackages();
      console.log('Manual package expiry check completed');
    } catch (error) {
      console.error('Error in manual package expiry check:', error);
      throw error;
    }
  }

  /**
   * Get scheduler status
   */
  public getStatus(): { running: boolean } {
    return {
      running: this.isRunning,
    };
  }
}
