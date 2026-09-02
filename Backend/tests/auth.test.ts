import mongoose from 'mongoose';
import request from 'supertest';
import { getApp, clearDb, registerUser, authHeader } from './helpers';

describe('AUTH - Authentication endpoints', () => {
  let app: ReturnType<typeof getApp>;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI ?? '');
    app = getApp();
  });

  afterEach(async () => {
    await clearDb();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user and return a token', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'Password123!',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.name).toBe('Alice');
      expect(res.body.data.user.email).toBe('alice@example.com');
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should return 422 for duplicate email', async () => {
      const payload = {
        name: 'Alice',
        email: 'alice@example.com',
        password: 'Password123!',
      };
      await request(app).post('/api/auth/register').send(payload);
      const res = await request(app).post('/api/auth/register').send(payload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('should return 422 for invalid registration data', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: '',
        email: 'not-an-email',
        password: 'short',
      });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details.length).toBeGreaterThan(0);
    });

    it('should normalize email to lowercase', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Bob',
        email: 'BOB@Example.COM',
        password: 'Password123!',
      });

      expect(res.status).toBe(201);
      expect(res.body.data.user.email).toBe('bob@example.com');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully and return a token', async () => {
      await registerUser(app, {
        name: 'Alice',
        email: 'alice@example.com',
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'alice@example.com',
        password: 'Password123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('alice@example.com');
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should return 401 for invalid credentials', async () => {
      await registerUser(app, {
        name: 'Alice',
        email: 'alice@example.com',
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'alice@example.com',
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 for nonexistent email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@example.com',
        password: 'Password123!',
      });

      expect(res.status).toBe(401);
    });

    it('should return 422 for missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alice@example.com' });

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return the authenticated user profile', async () => {
      const user = await registerUser(app, { email: 'me@example.com' });

      const res = await request(app)
        .get('/api/auth/me')
        .set(authHeader(user.token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('me@example.com');
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 for an invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set(authHeader('invalid-token'));

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/auth/change-password', () => {
    it('updates the password and rejects the old password on the next login', async () => {
      const user = await registerUser(app, { email: 'password@example.com' });

      const update = await request(app)
        .patch('/api/auth/change-password')
        .set(authHeader(user.token))
        .send({
          currentPassword: 'Password123!',
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        });

      expect(update.status).toBe(200);

      const oldLogin = await request(app).post('/api/auth/login').send({
        email: 'password@example.com',
        password: 'Password123!',
      });
      expect(oldLogin.status).toBe(401);

      const newLogin = await request(app).post('/api/auth/login').send({
        email: 'password@example.com',
        password: 'NewPassword123!',
      });
      expect(newLogin.status).toBe(200);
    });

    it('rejects an incorrect current password', async () => {
      const user = await registerUser(app, { email: 'password@example.com' });

      const res = await request(app)
        .patch('/api/auth/change-password')
        .set(authHeader(user.token))
        .send({
          currentPassword: 'WrongPassword!',
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        });

      expect(res.status).toBe(401);
    });
  });
});
