/**
 * GET /api/auth/verify-email?token=<token>
 * Verifies user's email address and sends welcome email.
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";
import Activity from "@/models/Activity";
import { hashToken } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return redirectWithMessage("error", "Invalid verification link");
    }

    await connectDB();

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) {
      return redirectWithMessage("error", "Verification link is invalid or has expired");
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Create notification
    await Notification.create({
      userId: user._id,
      type: "system",
      title: "Email Verified",
      message: "Your email address has been verified successfully. Welcome aboard!",
    });

    // Log activity
    await Activity.create({
      userId: user._id,
      action: "user_email_verified",
      description: `Email verified for ${user.email}`,
    });

    // Send welcome email (async)
    sendWelcomeEmail(user.email, user.fullName).catch((err) =>
      console.error("[verify-email] Failed to send welcome email:", err)
    );

    // Redirect to login with success message
    return redirectWithMessage("success", "Email verified successfully! You can now log in.");
  } catch (error: unknown) {
    console.error("[verify-email] Error:", error);
    return redirectWithMessage("error", "Verification failed. Please try again.");
  }
}

function redirectWithMessage(type: string, message: string) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = new URL("/login", APP_URL);
  url.searchParams.set("verified", type);
  url.searchParams.set("message", message);
  return NextResponse.redirect(url);
}
