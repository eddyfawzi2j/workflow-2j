
import { db } from '../db';
import { eq, and, lt, gt } from 'drizzle-orm';
import { approvalSteps, requests, users } from '@shared/schema';

export class NotificationService {
  async sendReminderNotifications() {
    const pendingSteps = await db
      .select()
      .from(approvalSteps)
      .where(
        and(
          eq(approvalSteps.status, 'pending'),
          lt(approvalSteps.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
        )
      );

    for (const step of pendingSteps) {
      await db.insert(notifications).values({
        userId: step.userId,
        requestId: step.requestId,
        message: `Rappel: Une demande attend votre validation depuis plus de 24h`
      });
    }
  }
}
