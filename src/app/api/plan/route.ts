/**
 * GET  /api/plan   — Return current plan, usage, and limits
 * POST /api/plan   — Upgrade/change plan
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User, { PLAN_LIMITS, PlanType } from "@/models/User";
import { getAuthUser } from "@/lib/auth";
import Activity from "@/models/Activity";
import Notification from "@/models/Notification";

/**
 * Reset the monthly counter if the reset date has passed.
 */
async function ensureMonthlyReset(userId: string) {
  const user = await User.findById(userId);
  if (!user) return null;

  const now = new Date();
  if (user.documentsResetAt && now >= user.documentsResetAt) {
    // Reset counter and set next reset to first of next month
    user.documentsUsedThisMonth = 0;
    user.documentsResetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    await user.save();
  }

  return user;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await ensureMonthlyReset(authUser._id.toString());
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const plan = (user.plan || "free") as PlanType;
    const limits = PLAN_LIMITS[plan];
    const used = user.documentsUsedThisMonth || 0;
    const remaining = Math.max(0, limits.documentsPerMonth - used);
    const usagePercent =
      limits.documentsPerMonth === Infinity
        ? 0
        : Math.min((used / limits.documentsPerMonth) * 100, 100);

    return NextResponse.json({
      plan,
      label: limits.label,
      documentsPerMonth: limits.documentsPerMonth === Infinity ? "Unlimited" : limits.documentsPerMonth,
      documentsUsed: used,
      documentsRemaining: limits.documentsPerMonth === Infinity ? "Unlimited" : remaining,
      usagePercent: Math.round(usagePercent * 10) / 10,
      maxUsers: limits.users,
      planStartedAt: user.planStartedAt,
      planExpiresAt: user.planExpiresAt || null,
      resetsAt: user.documentsResetAt,
    });
  } catch (error: unknown) {
    console.error("[plan] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { plan: newPlan } = body as { plan: string };

    if (!newPlan || !["free", "starter", "professional", "enterprise"].includes(newPlan)) {
      return NextResponse.json(
        { error: "Invalid plan. Choose from: free, starter, professional, enterprise" },
        { status: 400 }
      );
    }

    const currentPlan = authUser.plan || "free";
    if (currentPlan === newPlan) {
      return NextResponse.json(
        { error: "You are already on this plan" },
        { status: 400 }
      );
    }

    // In a real app, this is where you'd integrate Stripe/Paddle for payment.
    // For now we just switch the plan directly.
    const user = await User.findByIdAndUpdate(
      authUser._id,
      {
        plan: newPlan,
        planStartedAt: new Date(),
        // Set plan expiry to 30 days from now for paid plans
        planExpiresAt:
          newPlan === "free"
            ? undefined
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const limits = PLAN_LIMITS[newPlan as PlanType];

    // Log activity
    await Activity.create({
      userId: authUser._id,
      action: "plan_changed",
      description: `Upgraded from ${PLAN_LIMITS[currentPlan as PlanType].label} to ${limits.label} plan`,
      metadata: { from: currentPlan, to: newPlan },
    });

    // Send notification
    await Notification.create({
      userId: authUser._id,
      type: "system",
      title: "Plan Updated",
      message: `You've been upgraded to the ${limits.label} plan! You now have ${limits.documentsPerMonth === Infinity ? "unlimited" : limits.documentsPerMonth} documents/month.`,
    });

    return NextResponse.json({
      success: true,
      plan: newPlan,
      label: limits.label,
      documentsPerMonth: limits.documentsPerMonth === Infinity ? "Unlimited" : limits.documentsPerMonth,
      message: `Successfully upgraded to ${limits.label} plan`,
    });
  } catch (error: unknown) {
    console.error("[plan] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
