import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app';
import User, { UserRole } from '../src/models/User';

export function getApp() {
  return createApp();
}

export async function clearDb(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

export interface TestUser {
  name: string;
  email: string;
  password: string;
  token: string;
  id: string;
  role?: UserRole;
}

export async function registerUser(
  app: ReturnType<typeof createApp>,
  overrides: Partial<{ name: string; email: string; password: string }> = {}
): Promise<TestUser> {
  const name = overrides.name ?? 'Test User';
  const email = overrides.email ?? `user${Math.random()}@example.com`;
  const password = overrides.password ?? 'Password123!';

  const res = await request(app).post('/api/auth/register').send({
    name,
    email,
    password,
  });

  return {
    name,
    email,
    password,
    token: res.body.data.token,
    id: res.body.data.user.id,
    role: res.body.data.user.role ?? 'member',
  };
}

// Register a user with a specific role directly in the DB, then log in to get a token.
export async function registerUserWithRole(
  app: ReturnType<typeof createApp>,
  role: UserRole,
  overrides: Partial<{ name: string; email: string; password: string }> = {}
): Promise<TestUser> {
  const name = overrides.name ?? 'Role User';
  const email = overrides.email ?? `role${Math.random()}@example.com`;
  const password = overrides.password ?? 'Password123!';

  const created = await User.create({ name, email, password, role });
  const token = await loginUser(app, email, password);

  return {
    name,
    email,
    password,
    token,
    id: created._id.toString(),
    role,
  };
}

export async function loginUser(
  app: ReturnType<typeof createApp>,
  email: string,
  password: string
): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.data.token;
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
