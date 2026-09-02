import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthUser } from '../types';

export function signToken(payload: AuthUser): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): AuthUser {
  return jwt.verify(token, config.jwtSecret) as AuthUser;
}
