/**
 * GET /api/activities — List activities for the current user with pagination
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Activity from "@/models/Activity";
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
    const action = searchParams.get("action"); // optional filter by action type

    const filter: Record<string, unknown> = { userId: user._id };
    if (action) {
      filter.action = action;
    }

    const [activities, total] = await Promise.all([
      Activity.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Activity.countDocuments(filter),
    ]);

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    console.error("[activities] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
