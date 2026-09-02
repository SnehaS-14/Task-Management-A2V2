import mongoose from 'mongoose';

export default async function globalTeardown(): Promise<void> {
  await mongoose.disconnect();
  const mongoServer = (global as unknown as Record<string, unknown>)
    .__MONGO_SERVER__ as { stop(): Promise<void> } | undefined;
  if (mongoServer) {
    await mongoServer.stop();
  }
}
