import express, { Application, Request, Response } from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import taskRoutes from './routes/task.routes';
import commentRoutes from './routes/comment.routes';
import { errorHandler, notFoundHandler } from './middleware/error';
import { sendSuccess } from './utils/apiResponse';

export function createApp(): Application {
  const app: Application = express();

  app.use(helmet());
  app.use(
    cors({
      origin: config.clientUrl,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests, please try again later',
      },
    },
  });
  app.use('/api', generalLimiter);

  app.get('/api/health', (_req: Request, res: Response) => {
    sendSuccess(res, { status: 'ok' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/comments', commentRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
