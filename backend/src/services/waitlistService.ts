import { Prisma } from '@prisma/client';

type TxClient = Prisma.TransactionClient;

/**
 * Promote the next waiting person for a class. Call this inside the same
 * transaction that frees a spot (e.g. a booking cancellation) so a promotion is
 * never recorded without the spot actually opening up. Returns the promoted
 * entry (including the user) so the caller can notify them, or null when nobody
 * is waiting.
 */
export async function promoteNextForClass(tx: TxClient, classId: string) {
  const next = await tx.waitlistEntry.findFirst({
    where: { classId, status: 'WAITING' },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  });

  if (!next) {
    return null;
  }

  return tx.waitlistEntry.update({
    where: { id: next.id },
    data: { status: 'PROMOTED', promotedAt: new Date() },
    include: {
      user: { select: { id: true, name: true, email: true } },
      class: { select: { id: true, name: true, date: true, time: true } },
    },
  });
}
