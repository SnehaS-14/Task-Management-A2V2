import { NextFunction, Response } from 'express';
import User from '../models/User';
import { AuthenticatedRequest } from '../types';
import { UnauthorizedError } from '../utils/errors';
import { verifyToken } from '../utils/jwt';

export async function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header');
    }

    const token = authHeader.substring(7).trim();
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }

    const user = await User.findById(payload.id).lean();
    if (!user) {
      throw new UnauthorizedError('Authenticated user no longer exists');
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: (user.role as string) || 'member',
    };
    next();
  } catch (error) {
    next(error);
  }
}
