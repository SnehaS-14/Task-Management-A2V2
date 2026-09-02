import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { config } from '../config';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/apiResponse';

interface MongoError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
  path?: string;
}

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, 404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const mongoErr = err as MongoError;

  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    sendError(res, 422, 'VALIDATION_ERROR', 'Invalid request data', details);
    return;
  }

  // Handle Mongoose errors
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    sendError(res, 422, 'VALIDATION_ERROR', 'Invalid request data', details);
    return;
  }

  // Duplicate key errors
  if (mongoErr.code === 11000) {
    const fields = Object.keys(mongoErr.keyValue ?? {}).join(', ');
    sendError(
      res,
      409,
      'CONFLICT',
      `Duplicate value for field(s): ${fields}`,
      [
        {
          field: fields,
          message: 'Value already exists and must be unique',
        },
      ]
    );
    return;
  }

  if (
    err instanceof mongoose.Error.CastError ||
    (err instanceof mongoose.Error &&
      mongoErr.path === '_id')
  ) {
    sendError(res, 400, 'INVALID_ID', 'Invalid resource ID format');
    return;
  }

  // Unexpected errors
  console.error('Unhandled error:', err);
  const message = config.isProduction
    ? 'Internal server error'
    : err instanceof Error
      ? err.message
      : 'Internal server error';

  sendError(res, 500, 'INTERNAL_ERROR', message);
}
