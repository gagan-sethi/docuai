/**
 * Mongoose model — User
 * Handles authentication, email verification, and profile data.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export type PlanType = "free" | "starter" | "professional" | "enterprise";

export const PLAN_LIMITS: Record<PlanType, { documentsPerMonth: number; label: string; users: number }> = {
  free: { documentsPerMonth: 5, label: "Free", users: 1 },
  starter: { documentsPerMonth: 100, label: "Starter", users: 1 },
  professional: { documentsPerMonth: 1000, label: "Professional", users: 5 },
  enterprise: { documentsPerMonth: Infinity, label: "Enterprise", users: 999 },
};

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  password: string;
  companyName?: string;
  mobile?: string;
  role: "business" | "accounting" | "admin";
  avatar?: string;
  plan: PlanType;
  planStartedAt: Date;
  planExpiresAt?: Date;
  documentsUsedThisMonth: number;
  documentsResetAt: Date;
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  isWhatsAppLinked: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false, // Don't include in queries by default
    },
    companyName: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    mobile: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["business", "accounting", "admin"],
      default: "business",
    },
    avatar: String,
    plan: {
      type: String,
      enum: ["free", "starter", "professional", "enterprise"],
      default: "free",
    },
    planStartedAt: {
      type: Date,
      default: Date.now,
    },
    planExpiresAt: {
      type: Date,
    },
    documentsUsedThisMonth: {
      type: Number,
      default: 0,
    },
    documentsResetAt: {
      type: Date,
      default: () => {
        // First day of next month
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 1);
      },
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isMobileVerified: {
      type: Boolean,
      default: false,
    },
    isWhatsAppLinked: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    lastLoginAt: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transform(_doc: any, ret: any) {
        ret.password = undefined;
        ret.__v = undefined;
        ret.emailVerificationToken = undefined;
        ret.emailVerificationExpires = undefined;
        ret.passwordResetToken = undefined;
        ret.passwordResetExpires = undefined;
        return ret;
      },
    },
  }
);

// Prevent model re-compilation in dev (HMR)
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
