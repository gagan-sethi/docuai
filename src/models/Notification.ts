/**
 * Mongoose model — Notification
 * Stores user notifications for document events, system alerts, etc.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export type NotificationType =
  | "doc_processed"
  | "doc_review"
  | "doc_approved"
  | "doc_rejected"
  | "doc_error"
  | "whatsapp_received"
  | "welcome"
  | "system"
  | "batch_complete";

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  data?: Record<string, unknown>; // e.g. { documentId, confidence }
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "doc_processed",
        "doc_review",
        "doc_approved",
        "doc_rejected",
        "doc_error",
        "whatsapp_received",
        "welcome",
        "system",
        "batch_complete",
      ],
      required: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 500 },
    icon: String,
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false, index: true },
    readAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound index for listing unread notifications
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
