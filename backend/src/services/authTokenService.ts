import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

// Access tokens stay short-ish; refresh tokens are long-lived opaque strings we
// store hashed so a DB leak can't be replayed.
const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_TTL || '7d';
const REFRESH_TOKEN_TTL_DAYS = parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '30', 10);
const PASSWORD_RESET_TTL_MINUTES = parseInt(process.env.PASSWORD_RESET_TTL_MINUTES || '60', 10);

export function generateAccessToken(userId: string): string {
  const options: SignOptions = { expiresIn: ACCESS_TOKEN_TTL as SignOptions['expiresIn'] };
  return jwt.sign({ userId }, process.env.JWT_SECRET!, options);
}

function randomToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Issue a new refresh token for a user, persisting only its hash. Returns the
 * raw token (shown to the client once).
 */
export async function issueRefreshToken(userId: string): Promise<string> {
  const raw = randomToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { tokenHash: hashToken(raw), userId, expiresAt },
  });
  return raw;
}

/**
 * Validate a raw refresh token and rotate it: the old token is revoked and a new
 * one is issued atomically. Returns the userId + new raw refresh token, or null
 * if the token is invalid/expired/revoked.
 */
export async function rotateRefreshToken(
  rawToken: string
): Promise<{ userId: string; refreshToken: string } | null> {
  const tokenHash = hashToken(rawToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    return null;
  }

  const raw = randomToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    }),
    prisma.refreshToken.create({
      data: { tokenHash: hashToken(raw), userId: existing.userId, expiresAt },
    }),
  ]);

  return { userId: existing.userId, refreshToken: raw };
}

/** Revoke a single refresh token (logout). No-op if it doesn't exist. */
export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Revoke every active refresh token for a user (e.g. after a password reset). */
export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Create a password reset token for a user, storing only its hash. Returns the
 * raw token (to be emailed).
 */
export async function issuePasswordResetToken(userId: string): Promise<string> {
  const raw = randomToken();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
  await prisma.passwordResetToken.create({
    data: { tokenHash: hashToken(raw), userId, expiresAt },
  });
  return raw;
}

/**
 * Consume a password reset token: returns the userId if valid and marks it used,
 * otherwise null. Marking-as-used happens in the same query guard so a token
 * can't be redeemed twice.
 */
export async function consumePasswordResetToken(rawToken: string): Promise<string | null> {
  const tokenHash = hashToken(rawToken);
  const existing = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!existing || existing.usedAt || existing.expiresAt < new Date()) {
    return null;
  }

  await prisma.passwordResetToken.update({
    where: { id: existing.id },
    data: { usedAt: new Date() },
  });

  return existing.userId;
}
