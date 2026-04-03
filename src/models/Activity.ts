/**
 * Mongoose model — Activity
 * Audit log of all user / system actions.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export type ActivityAction =
  | "user_signup"
  | "user_login"
  | "user_email_verified"
  | "doc_uploaded"
  | "doc_processing"
  | "doc_processed"
  | "doc_reviewed"
  | "doc_approved"
  | "doc_rejected"
  | "doc_exported"
  | "doc_deleted"
  | "whatsapp_received"
  | "settings_updated"
  | "batch_processed"
  | "plan_changed";

export interface IActivity extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: ActivityAction;
  description: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        "user_signup",
        "user_login",
        "user_email_verified",
        "doc_uploaded",
        "doc_processing",
        "doc_processed",
        "doc_reviewed",
        "doc_approved",
        "doc_rejected",
        "doc_exported",
        "doc_deleted",
        "whatsapp_received",
        "settings_updated",
        "batch_processed",
        "plan_changed",
      ],
      required: true,
      index: true,
    },
    description: { type: String, required: true, maxlength: 500 },
    metadata: { type: Schema.Types.Mixed },
    ip: String,
    userAgent: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// TTL index — auto-delete activities older than 90 days
ActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
ActivitySchema.index({ userId: 1, createdAt: -1 });

const Activity: Model<IActivity> =
  mongoose.models.Activity ||
  mongoose.model<IActivity>("Activity", ActivitySchema);

export default Activity;
