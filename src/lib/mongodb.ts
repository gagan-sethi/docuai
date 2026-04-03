/**
 * MongoDB connection singleton using Mongoose.
 * Caches the connection across hot-reloads in development.
 */

import mongoose from "mongoose";

const MONGOURI = process.env.MONGOURI;

if (!MONGOURI) {
  throw new Error("Please define MONGOURI in your .env file");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Augment globalThis for HMR caching
const globalWithMongo = globalThis as typeof globalThis & {
  _mongooseCache?: MongooseCache;
};

if (!globalWithMongo._mongooseCache) {
  globalWithMongo._mongooseCache = { conn: null, promise: null };
}

const cached = globalWithMongo._mongooseCache;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    console.log("[mongodb] Connecting to MongoDB Atlas...");
    cached.promise = mongoose
      .connect(MONGOURI!, {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      })
      .then((m) => {
        console.log("[mongodb] Connected successfully");
        return m;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export default connectDB;
