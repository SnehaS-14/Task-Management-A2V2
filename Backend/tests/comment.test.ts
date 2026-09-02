import mongoose from 'mongoose';
import request from 'supertest';
import { getApp, clearDb, registerUser, authHeader } from './helpers';

describe('COMMENTS - Comment endpoints', () => {
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

  async function createTaskWithToken(token: string) {
    const res = await request(app)
      .post('/api/tasks')
      .set(authHeader(token))
      .send({ title: 'Task with comments' });
    return res.body.data.task.id;
  }

  async function addComment(token: string, taskId: string, content: string) {
    const res = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set(authHeader(token))
      .send({ content });
    return res;
  }

  describe('POST /api/tasks/:taskId/comments', () => {
    it('should create a comment', async () => {
      const user = await registerUser(app);
      const taskId = await createTaskWithToken(user.token);

      const res = await addComment(user.token, taskId, 'Great work!');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comment.content).toBe('Great work!');
      expect(res.body.data.comment.author.id).toBe(user.id);
    });

    it('should return 401 for unauthenticated comment', async () => {
      const user = await registerUser(app);
      const taskId = await createTaskWithToken(user.token);

      const res = await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .send({ content: 'Hi' });

      expect(res.status).toBe(401);
    });

    it('should return 404 for nonexistent task', async () => {
      const user = await registerUser(app);
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await addComment(user.token, fakeId, 'Hi');

      expect(res.status).toBe(404);
    });

    it('should return 422 for empty comment', async () => {
      const user = await registerUser(app);
      const taskId = await createTaskWithToken(user.token);

      const res = await addComment(user.token, taskId, '');

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/tasks/:taskId/comments', () => {
    it('should list comments for a task', async () => {
      const user = await registerUser(app);
      const taskId = await createTaskWithToken(user.token);
      await addComment(user.token, taskId, 'First comment');
      await addComment(user.token, taskId, 'Second comment');

      const res = await request(app)
        .get(`/api/tasks/${taskId}/comments`)
        .set(authHeader(user.token));

      expect(res.status).toBe(200);
      expect(res.body.data.comments.length).toBe(2);
      expect(res.body.data.comments[0].author.name).toBeDefined();
      expect(res.body.data.comments[0].author.password).toBeUndefined();
    });
  });

  describe('PATCH /api/comments/:commentId', () => {
    it('should allow author to update own comment', async () => {
      const user = await registerUser(app);
      const taskId = await createTaskWithToken(user.token);
      const created = await addComment(user.token, taskId, 'Original');
      const commentId = created.body.data.comment.id;

      const res = await request(app)
        .patch(`/api/comments/${commentId}`)
        .set(authHeader(user.token))
        .send({ content: 'Updated' });

      expect(res.status).toBe(200);
      expect(res.body.data.comment.content).toBe('Updated');
    });

    it('should prevent another user from updating the comment', async () => {
      const author = await registerUser(app);
      const other = await registerUser(app);
      const taskId = await createTaskWithToken(author.token);
      const created = await addComment(author.token, taskId, 'Original');
      const commentId = created.body.data.comment.id;

      const res = await request(app)
        .patch(`/api/comments/${commentId}`)
        .set(authHeader(other.token))
        .send({ content: 'Hijacked' });

      expect(res.status).toBe(403);
    });

    it('should return 404 for nonexistent comment', async () => {
      const user = await registerUser(app);
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .patch(`/api/comments/${fakeId}`)
        .set(authHeader(user.token))
        .send({ content: 'X' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/comments/:commentId', () => {
    it('should allow author to delete own comment', async () => {
      const user = await registerUser(app);
      const taskId = await createTaskWithToken(user.token);
      const created = await addComment(user.token, taskId, 'Delete me');
      const commentId = created.body.data.comment.id;

      const res = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set(authHeader(user.token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should prevent another user from deleting the comment', async () => {
      const author = await registerUser(app);
      const other = await registerUser(app);
      const taskId = await createTaskWithToken(author.token);
      const created = await addComment(author.token, taskId, 'Delete me');
      const commentId = created.body.data.comment.id;

      const res = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set(authHeader(other.token));

      expect(res.status).toBe(403);
    });

    it('should return 404 for nonexistent comment', async () => {
      const user = await registerUser(app);
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .delete(`/api/comments/${fakeId}`)
        .set(authHeader(user.token));

      expect(res.status).toBe(404);
    });
  });
});
