import { createApp } from './app';
import { connectDB } from './config/db';
import { config } from './config';

async function start(): Promise<void> {
  try {
    await connectDB();
    const app = createApp();
    app.listen(config.port, '0.0.0.0', () => {
      console.log(
        `Server running in ${config.nodeEnv} mode on port ${config.port}`
      );
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

export { start };
