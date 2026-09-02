import mongoose from 'mongoose';
import request from 'supertest';
import { getApp, clearDb, registerUser, registerUserWithRole, authHeader } from './helpers';

describe('USERS - User endpoints', () => {
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

  it('should return 401 when not authenticated', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('should list users without passwords', async () => {
    await registerUser(app, { name: 'Alice', email: 'alice@example.com' });
    await registerUser(app, { name: 'Bob', email: 'bob@example.com' });
    const viewer = await registerUser(app);

    const res = await request(app)
      .get('/api/users')
      .set(authHeader(viewer.token));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const emails = res.body.data.users.map((u: { email: string }) => u.email);
    expect(emails.length).toBe(3);
    expect(res.body.data.users[0].password).toBeUndefined();
  });

  it('should search users by name', async () => {
    await registerUser(app, { name: 'Alice', email: 'alice@example.com' });
    await registerUser(app, { name: 'Bob', email: 'bob@example.com' });
    const viewer = await registerUser(app);

    const res = await request(app)
      .get('/api/users?search=ali')
      .set(authHeader(viewer.token));

    expect(res.status).toBe(200);
    expect(res.body.data.users.length).toBe(1);
    expect(res.body.data.users[0].name).toBe('Alice');
  });

  it('should search users by email', async () => {
    await registerUser(app, { name: 'Alice', email: 'alice@example.com' });
    const viewer = await registerUser(app);

    const res = await request(app)
      .get('/api/users?search=@example.com')
      .set(authHeader(viewer.token));

    expect(res.body.data.users.length).toBe(2);
  });

  it('should list users with role field', async () => {
    await registerUserWithRole(app, 'admin', { email: 'admin@example.com' });
    const viewer = await registerUser(app);

    const res = await request(app)
      .get('/api/users')
      .set(authHeader(viewer.token));

    expect(res.status).toBe(200);
    const adminUser = res.body.data.users.find((u: { email: string }) => u.email === 'admin@example.com');
    expect(adminUser.role).toBe('admin');
    const memberUser = res.body.data.users.find((u: { email: string }) => u.email === viewer.email);
    expect(memberUser.role).toBe('member');
  });

  describe('PATCH /api/users/me/profile', () => {
    it('should let a non-admin select a job role and update their name', async () => {
      const member = await registerUser(app, { name: 'Sam' });

      const res = await request(app)
        .patch('/api/users/me/profile')
        .set(authHeader(member.token))
        .send({ name: 'Sam Patel', jobRole: 'UI/UX Designer' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.name).toBe('Sam Patel');
      expect(res.body.data.user.jobRole).toBe('UI/UX Designer');
      expect(res.body.data.user.role).toBe('member');
    });

    it('should not let an admin change their protected access role through profile editing', async () => {
      const admin = await registerUserWithRole(app, 'admin');

      const res = await request(app)
        .patch('/api/users/me/profile')
        .set(authHeader(admin.token))
        .send({ jobRole: 'Product Designer' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('admin');
      expect(res.body.data.user.jobRole).toBe('Engineer');
    });

    it('should reject an unsupported job role', async () => {
      const member = await registerUser(app);

      const res = await request(app)
        .patch('/api/users/me/profile')
        .set(authHeader(member.token))
        .send({ jobRole: 'Superhero' });

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/users/me/avatar', () => {
    const tinyPng =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL7WQAAAABJRU5ErkJggg==';

    it('should save a supported avatar image and return its local URL', async () => {
      const member = await registerUser(app);

      const res = await request(app)
        .post('/api/users/me/avatar')
        .set(authHeader(member.token))
        .send({ dataUrl: tinyPng });

      expect(res.status).toBe(200);
      expect(res.body.data.user.avatarUrl).toMatch(/^\/uploads\/avatars\/.+\.png$/);
    });

    it('should reject unsupported avatar content', async () => {
      const member = await registerUser(app);

      const res = await request(app)
        .post('/api/users/me/avatar')
        .set(authHeader(member.token))
        .send({ dataUrl: 'data:text/plain;base64,SGVsbG8=' });

      expect(res.status).toBe(422);
    });
  });

  describe('PATCH /api/users/:id/role', () => {
    it('should return 403 when a member assigns a role', async () => {
      const member = await registerUser(app);
      const target = await registerUser(app);

      const res = await request(app)
        .patch(`/api/users/${target.id}/role`)
        .set(authHeader(member.token))
        .send({ role: 'manager' });

      expect(res.status).toBe(403);
    });

    it('should allow an admin to promote a member', async () => {
      const admin = await registerUserWithRole(app, 'admin');
      const target = await registerUser(app);

      const res = await request(app)
        .patch(`/api/users/${target.id}/role`)
        .set(authHeader(admin.token))
        .send({ role: 'manager' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('manager');
    });

    it('should allow an admin to demote a manager', async () => {
      const admin = await registerUserWithRole(app, 'admin');
      const target = await registerUserWithRole(app, 'manager');

      const res = await request(app)
        .patch(`/api/users/${target.id}/role`)
        .set(authHeader(admin.token))
        .send({ role: 'member' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('member');
    });

    it('should not allow an admin to change their own role', async () => {
      const admin = await registerUserWithRole(app, 'admin');

      const res = await request(app)
        .patch(`/api/users/${admin.id}/role`)
        .set(authHeader(admin.token))
        .send({ role: 'member' });

      expect(res.status).toBe(422);
    });

    it('should allow a manager to assign member role but not admin role', async () => {
      const manager = await registerUserWithRole(app, 'manager');
      const target = await registerUser(app);

      const memberRes = await request(app)
        .patch(`/api/users/${target.id}/role`)
        .set(authHeader(manager.token))
        .send({ role: 'member' });
      expect(memberRes.status).toBe(200);

      const adminRes = await request(app)
        .patch(`/api/users/${target.id}/role`)
        .set(authHeader(manager.token))
        .send({ role: 'admin' });
      expect(adminRes.status).toBe(422);
    });

    it('should return 404 for nonexistent user', async () => {
      const admin = await registerUserWithRole(app, 'admin');
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .patch(`/api/users/${fakeId}/role`)
        .set(authHeader(admin.token))
        .send({ role: 'member' });

      expect(res.status).toBe(404);
    });

    it('should return 422 for invalid role', async () => {
      const admin = await registerUserWithRole(app, 'admin');
      const target = await registerUser(app);

      const res = await request(app)
        .patch(`/api/users/${target.id}/role`)
        .set(authHeader(admin.token))
        .send({ role: 'superadmin' });

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/users/admins', () => {
    it('should return the list of admins', async () => {
      await registerUserWithRole(app, 'admin', { email: 'root@example.com' });
      await registerUserWithRole(app, 'admin', { email: 'root2@example.com' });
      const member = await registerUser(app);

      const res = await request(app)
        .get('/api/users/admins')
        .set(authHeader(member.token));

      expect(res.status).toBe(200);
      expect(res.body.data.admins.length).toBe(2);
      expect(res.body.data.admins.every((u: { role: string }) => u.role === 'admin')).toBe(true);
    });
  });
});
