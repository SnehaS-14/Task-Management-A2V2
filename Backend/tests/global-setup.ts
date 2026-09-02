import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

export default async function globalSetup(): Promise<void> {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  (global as unknown as Record<string, unknown>).__MONGO_SERVER__ = mongoServer;
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri);
}
