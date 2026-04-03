/**
 * POST /api/auth/signup
 * Creates a new user, sends verification email.
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";
import Activity from "@/models/Activity";
import { hashPassword, generateVerificationToken, signToken } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, password, companyName, mobile, role } = body;

    // Validation
    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: "Full name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate email verification token
    const { token: verificationToken, hashed, expires } =
      generateVerificationToken();

    // Create user
    const user = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      companyName: companyName?.trim(),
      mobile: mobile?.trim(),
      role: role || "business",
      emailVerificationToken: hashed,
      emailVerificationExpires: expires,
    });

    // Create welcome notification
    await Notification.create({
      userId: user._id,
      type: "welcome",
      title: "Welcome to DocuAI!",
      message: `Hi ${fullName.split(" ")[0]}, your account has been created. Please verify your email to get started.`,
    });

    // Log activity
    await Activity.create({
      userId: user._id,
      action: "user_signup",
      description: `New account created for ${email}`,
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    // Send verification email (async — don't block response)
    sendVerificationEmail(email, fullName, verificationToken).catch((err) =>
      console.error("[signup] Failed to send verification email:", err)
    );

    // Generate JWT token so user can start using the app immediately
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Set cookie
    const response = NextResponse.json(
      {
        message: "Account created successfully. Please verify your email.",
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          companyName: user.companyName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
        token,
      },
      { status: 201 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    console.error("[signup] Error:", error);
    const message = error instanceof Error ? error.message : "Signup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
