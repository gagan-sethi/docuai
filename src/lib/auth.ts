/**
 * Authentication utilities — JWT, password hashing, request auth.
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import User, { IUser } from "@/models/User";

// ─── Config ─────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || "docuai-jwt-secret-change-in-production";
const JWT_EXPIRES_IN = "7d";
const SALT_ROUNDS = 12;

// ─── Password helpers ───────────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function comparePassword(
  plain: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

// ─── JWT helpers ────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// ─── Email verification token ───────────────────────────────────

export function generateVerificationToken(): {
  token: string;
  hashed: string;
  expires: Date;
} {
  const token = crypto.randomBytes(32).toString("hex");
  const hashed = crypto.createHash("sha256").update(token).digest("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return { token, hashed, expires };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ─── Extract auth from request ──────────────────────────────────

/**
 * Extracts and validates the JWT from the request.
 * Looks in:  Authorization: Bearer <token>  →  cookie: token=<token>
 * Returns the authenticated user or null.
 */
export async function getAuthUser(
  request: NextRequest
): Promise<IUser | null> {
  try {
    // 1. Try Authorization header
    let token: string | undefined;
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }

    // 2. Try cookie
    if (!token) {
      token = request.cookies.get("token")?.value;
    }

    if (!token) return null;

    // 3. Verify JWT
    const payload = verifyToken(token);
    if (!payload) return null;

    // 4. Fetch user from DB
    await connectDB();
    const user = await User.findById(payload.userId).lean<IUser>();
    if (!user || !user.isActive) return null;

    return user;
  } catch {
    return null;
  }
}

/**
 * Helper that throws 401 if user is not authenticated.
 */
export async function requireAuth(
  request: NextRequest
): Promise<IUser> {
  const user = await getAuthUser(request);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
