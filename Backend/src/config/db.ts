import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './index';

let memoryServer: MongoMemoryServer | undefined;

export async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (error) {
    if (config.nodeEnv !== 'development' || process.env.USE_MONGO_MEMORY !== 'true') {
      throw error;
    }

    console.warn('MongoDB Atlas unavailable; starting an in-memory MongoDB for development.');
    memoryServer = await MongoMemoryServer.create();
    await mongoose.connect(memoryServer.getUri());
  }

  if (config.nodeEnv !== 'test') {
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = undefined;
  }
}
