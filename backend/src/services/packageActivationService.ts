import { Prisma } from '@prisma/client';

type TxClient = Prisma.TransactionClient;

interface ActivatablePayment {
  id: string;
  userId: string;
  packageId: string | null;
}

/**
 * Activate the package linked to a verified payment by creating the matching
 * UserPackage (sessions + expiry). Returns the created UserPackage, or null when
 * the payment is not tied to a package (e.g. a per-class booking payment).
 *
 * Must be called inside a transaction so payment verification and package grant
 * are atomic. Idempotency is the caller's responsibility (only verify a payment
 * that is still PENDING).
 */
export async function activateUserPackageFromPayment(
  tx: TxClient,
  payment: ActivatablePayment
) {
  if (!payment.packageId) {
    return null;
  }

  const pkg = await tx.package.findUnique({
    where: { id: payment.packageId },
  });

  if (!pkg) {
    return null;
  }

  let expiresAt: Date | null = null;
  if (pkg.validityDays) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + pkg.validityDays);
    expiresAt = expiry;
  }

  return tx.userPackage.create({
    data: {
      userId: payment.userId,
      packageId: pkg.id,
      remainingSessions: pkg.sessionsCount,
      expiresAt,
      source: 'PURCHASED',
    },
  });
}
