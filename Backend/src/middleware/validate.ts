import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

type Source = 'body' | 'query' | 'params';

export function validate(schema: ZodTypeAny, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = formatZodError(result.error);
      throw new ValidationError('Invalid request data', details);
    }
    (req as unknown as Record<string, unknown>)[source] = result.data;
    next();
  };
}

function formatZodError(error: ZodError): unknown[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}
