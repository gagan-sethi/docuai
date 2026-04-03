/**
 * POST /api/auth/link-whatsapp
 * Marks the user's WhatsApp as linked.
 *
 * For demo purposes, this simply sets isWhatsAppLinked = true.
 * In production, this would verify via WhatsApp Business API.
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";
import Activity from "@/models/Activity";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mark WhatsApp as linked
    await User.findByIdAndUpdate(authUser._id, {
      isWhatsAppLinked: true,
    });

    // Log activity
    await Activity.create({
      userId: authUser._id,
      action: "settings_updated",
      description: "WhatsApp account linked successfully",
    });

    // Send notification
    await Notification.create({
      userId: authUser._id,
      type: "system",
      title: "WhatsApp Linked",
      message:
        "Your WhatsApp is now connected! Send documents directly to our WhatsApp number and they'll appear in your dashboard.",
    });

    return NextResponse.json({
      success: true,
      message: "WhatsApp linked successfully!",
    });
  } catch (error: unknown) {
    console.error("[link-whatsapp] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
