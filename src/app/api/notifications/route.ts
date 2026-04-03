/**
 * GET  /api/notifications        — List notifications for the current user
 * PATCH /api/notifications       — Mark all notifications as read
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const unreadOnly = searchParams.get("unread") === "true";

    const filter: Record<string, unknown> = { userId: user._id };
    if (unreadOnly) {
      filter.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId: user._id, isRead: false }),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    console.error("[notifications] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications — Mark all notifications as read
 * Body: { ids?: string[] }  — if ids provided, mark only those; else mark all
 */
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { ids } = body as { ids?: string[] };

    const filter: Record<string, unknown> = {
      userId: user._id,
      isRead: false,
    };

    if (ids && Array.isArray(ids) && ids.length > 0) {
      filter._id = { $in: ids };
    }

    const result = await Notification.updateMany(filter, {
      isRead: true,
      readAt: new Date(),
    });

    return NextResponse.json({
      message: "Notifications marked as read",
      modified: result.modifiedCount,
    });
  } catch (error: unknown) {
    console.error("[notifications] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
