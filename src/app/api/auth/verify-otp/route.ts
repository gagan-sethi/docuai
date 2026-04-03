/**
 * POST /api/auth/verify-otp
 * Verifies a demo OTP for phone number verification.
 *
 * For demo purposes, the valid OTP is always "123456".
 * In production, this would integrate with an SMS gateway (Twilio, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Activity from "@/models/Activity";
import { getAuthUser } from "@/lib/auth";

// Demo OTP — shown on screen to the user
const DEMO_OTP = "123456";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { otp } = body;

    if (!otp) {
      return NextResponse.json(
        { error: "OTP is required" },
        { status: 400 }
      );
    }

    // Validate demo OTP
    if (otp.toString().trim() !== DEMO_OTP) {
      return NextResponse.json(
        { error: "Invalid OTP. Please try again." },
        { status: 400 }
      );
    }

    // Mark mobile as verified
    await User.findByIdAndUpdate(authUser._id, {
      isMobileVerified: true,
    });

    // Log activity
    await Activity.create({
      userId: authUser._id,
      action: "user_email_verified", // reuse action since we don't have a phone-specific one
      description: `Phone number verified for ${authUser.mobile || "N/A"}`,
    });

    return NextResponse.json({
      success: true,
      message: "Phone number verified successfully!",
    });
  } catch (error: unknown) {
    console.error("[verify-otp] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
