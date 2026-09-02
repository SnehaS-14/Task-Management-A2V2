import { Request } from 'express';
import { Types } from 'mongoose';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}
