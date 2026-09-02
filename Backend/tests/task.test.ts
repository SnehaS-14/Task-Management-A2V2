import mongoose from 'mongoose';
import request from 'supertest';
import { getApp, clearDb, registerUser, registerUserWithRole, authHeader } from './helpers';

describe('TASKS - Task endpoints', () => {
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

  function taskPayload(assignee?: string) {
    return {
      title: 'Implement login',
      description: 'Build JWT login',
      status: 'Todo',
      priority: 'High',
      ...(assignee ? { assignee } : {}),
    };
  }

  describe('POST /api/tasks', () => {
    it('should create a task', async () => {
      const user = await registerUser(app);

      const res = await request(app)
        .post('/api/tasks')
        .set(authHeader(user.token))
        .send(taskPayload());

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.title).toBe('Implement login');
      expect(res.body.data.task.creator.id).toBe(user.id);
      expect(res.body.data.task.status).toBe('Todo');
      expect(res.body.data.task.priority).toBe('High');
    });

    it('should return 401 for unauthenticated task creation', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send(taskPayload());

      expect(res.status).toBe(401);
    });

    it('should return 422 for invalid task data', async () => {
      const user = await registerUser(app);

      const res = await request(app)
        .post('/api/tasks')
        .set(authHeader(user.token))
        .send({ title: '', status: 'InvalidStatus' });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should not allow client to set creator', async () => {
      const user = await registerUser(app);
      const other = await registerUser(app);

      const res = await request(app)
        .post('/api/tasks')
        .set(authHeader(user.token))
        .send({ ...taskPayload(), creator: other.id });

      expect(res.status).toBe(201);
      expect(res.body.data.task.creator.id).toBe(user.id);
    });

    it('should return 404 when assigning to a nonexistent user', async () => {
      const user = await registerUserWithRole(app, 'admin');
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post('/api/tasks')
        .set(authHeader(user.token))
        .send(taskPayload(fakeId));

      expect(res.status).toBe(404);
    });

    it('should return 403 when a member assigns a task to another user', async () => {
      const member = await registerUser(app);
      const other = await registerUser(app);

      const res = await request(app)
        .post('/api/tasks')
        .set(authHeader(member.token))
        .send(taskPayload(other.id));

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow a member to self-assign a task', async () => {
      const member = await registerUser(app);

      const res = await request(app)
        .post('/api/tasks')
        .set(authHeader(member.token))
        .send(taskPayload(member.id));

      expect(res.status).toBe(201);
      expect(res.body.data.task.assignee.id).toBe(member.id);
    });
  });

  describe('GET /api/tasks', () => {
    it('should list tasks with pagination', async () => {
      const user = await registerUser(app);
      for (let i = 0; i < 15; i++) {
        await request(app)
          .post('/api/tasks')
          .set(authHeader(user.token))
          .send({ ...taskPayload(), title: `Task ${i}` });
      }

      const res = await request(app)
        .get('/api/tasks?page=1&limit=10')
        .set(authHeader(user.token));

      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBe(10);
      expect(res.body.data.pagination.total).toBe(15);
      expect(res.body.data.pagination.totalPages).toBe(2);
      expect(res.body.data.pagination.page).toBe(1);
    });

    it('should respect page parameter', async () => {
      const user = await registerUser(app);
      for (let i = 0; i < 15; i++) {
        await request(app)
          .post('/api/tasks')
          .set(authHeader(user.token))
          .send({ ...taskPayload(), title: `Task ${i}` });
      }

      const res = await request(app)
        .get('/api/tasks?page=2&limit=10')
        .set(authHeader(user.token));

      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBe(5);
    });

    it('should search tasks by title', async () => {
      const user = await registerUser(app);
      await request(app)
        .post('/api/tasks')
        .set(authHeader(user.token))
        .send({ ...taskPayload(), title: 'Authentication implementation' });
      await request(app)
        .post('/api/tasks')
        .set(authHeader(user.token))
        .send({ ...taskPayload(), title: 'Other thing' });

      const res = await request(app)
        .get('/api/tasks?search=authentication')
        .set(authHeader(user.token));

      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBe(1);
      expect(res.body.data.tasks[0].title).toBe('Authentication implementation');
    });

    it('should search by partial title and description, case-insensitively', async () => {
      const user = await registerUser(app);
      await request(app)
        .post('/api/tasks')
        .set(authHeader(user.token))
        .send({
          ...taskPayload(),
          title: 'Design review',
          description: 'Improve the authentication screen flow',
        });

      const titleResult = await request(app)
        .get('/api/tasks?search=DESI')
        .set(authHeader(user.token));
      const descriptionResult = await request(app)
        .get('/api/tasks?search=thentic')
        .set(authHeader(user.token));

      expect(titleResult.body.data.tasks).toHaveLength(1);
      expect(descriptionResult.body.data.tasks).toHaveLength(1);
      expect(descriptionResult.body.data.tasks[0].title).toBe('Design review');
    });

    it('should filter by status', async () => {
      const user = await registerUser(app);
      await request(app)
        .post('/api/tasks')
        .set(authHeader(user.token))
        .send({ ...taskPayload(), status: 'Todo' });
      await request(app)
        .post('/api/tasks')
        .set(authHeader(user.token))
        .send({ ...taskPayload(), status: 'Done' });

      const res = await request(app)
        .get('/api/tasks?status=Done')
        .set(authHeader(user.token));

      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBe(1);
      expect(res.body.data.tasks[0].status).toBe('Done');
    });

    it('should filter by priority', async () => {
      const user = await registerUser(app);
      await request(app)
        .post('/api/tasks')
        .set(authHeader(user.token))
        .send({ ...taskPayload(), priority: 'High' });
      await request(app)
        .post('/api/tasks')
        .set(authHeader(user.token))
        .send({ ...taskPayload(), priority: 'Low' });

      const res = await request(app)
        .get('/api/tasks?priority=High')
        .set(authHeader(user.token));

      expect(res.body.data.tasks.length).toBe(1);
      expect(res.body.data.tasks[0].priority).toBe('High');
    });

    it('should filter by assignee', async () => {
      const user = await registerUserWithRole(app, 'manager');
      const other = await registerUser(app);

      await request(app)
        .post('/api/tasks')
        .set(authHeader(user.token))
        .send(taskPayload(other.id));
      await request(app)
        .post('/api/tasks')
        .set(authHeader(user.token))
        .send(taskPayload());

      const res = await request(app)
        .get(`/api/tasks?assignee=${other.id}`)
        .set(authHeader(user.token));

      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBe(1);
      expect(res.body.data.tasks[0].assignee.id).toBe(other.id);
    });

    it('should sort by title ascending', async () => {
      const user = await registerUser(app);
      await request(app)
        .post('/api/tasks')
        .set(authHeader(user.token))
        .send({ ...taskPayload(), title: 'Banana' });
      await request(app)
        .post('/api/tasks')
        .set(authHeader(user.token))
        .send({ ...taskPayload(), title: 'Apple' });

      const res = await request(app)
        .get('/api/tasks?sortBy=title&sortOrder=asc')
        .set(authHeader(user.token));

      expect(res.status).toBe(200);
      expect(res.body.data.tasks[0].title).toBe('Apple');
    });

    it('should combine search, filter, sort, and pagination', async () => {
      const user = await registerUser(app);
      await request(app)
        .post('/api/tasks')
        .set(authHeader(user.token))
        .send({ ...taskPayload(), title: 'API design', status: 'Todo', priority: 'High' });
      await request(app)
        .post('/api/tasks')
        .set(authHeader(user.token))
        .send({ ...taskPayload(), title: 'API tests', status: 'Done', priority: 'High' });
      await request(app)
        .post('/api/tasks')
        .set(authHeader(user.token))
        .send({ ...taskPayload(), title: 'API schema', status: 'Todo', priority: 'Low' });

      const res = await request(app)
        .get('/api/tasks?search=API&status=Todo&priority=High&sortBy=title&sortOrder=desc&limit=10')
        .set(authHeader(user.token));

      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBe(1);
      expect(res.body.data.tasks[0].title).toBe('API design');
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should return task details with creator and assignee', async () => {
      const user = await registerUser(app);
      const created = await request(app)
        .post('/api/tasks')
        .set(authHeader(user.token))
        .send(taskPayload(user.id));
      const taskId = created.body.data.task.id;

      const res = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set(authHeader(user.token));

      expect(res.status).toBe(200);
      expect(res.body.data.task.id).toBe(taskId);
      expect(res.body.data.task.creator.name).toBeDefined();
      expect(res.body.data.task.assignee.name).toBeDefined();
    });

    it('should return 422 for invalid task id', async () => {
      const user = await registerUser(app);
      const res = await request(app)
        .get('/api/tasks/invalidid')
        .set(authHeader(user.token));
      expect(res.status).toBe(422);
    });

    it('should return 404 for nonexistent task', async () => {
      const user = await registerUser(app);
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/api/tasks/${fakeId}`)
        .set(authHeader(user.token));
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    it('should update own task', async () => {
      const user = await registerUser(app);
      const created = await request(app)
        .post('/api/tasks')
        .set(authHeader(user.token))
        .send(taskPayload());
      const taskId = created.body.data.task.id;

      const res = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set(authHeader(user.token))
        .send({ title: 'Updated title', priority: 'Low' });

      expect(res.status).toBe(200);
      expect(res.body.data.task.title).toBe('Updated title');
      expect(res.body.data.task.priority).toBe('Low');
    });

    it('should allow assignee to update status only', async () => {
      const creator = await registerUserWithRole(app, 'admin');
      const assignee = await registerUser(app);

      const created = await request(app)
        .post('/api/tasks')
        .set(authHeader(creator.token))
        .send(taskPayload(assignee.id));
      const taskId = created.body.data.task.id;

      const res = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set(authHeader(assignee.token))
        .send({ status: 'In Progress' });

      expect(res.status).toBe(200);
      expect(res.body.data.task.status).toBe('In Progress');
    });

    it('should not allow assignee to change title', async () => {
      const creator = await registerUserWithRole(app, 'admin');
      const assignee = await registerUser(app);

      const created = await request(app)
        .post('/api/tasks')
        .set(authHeader(creator.token))
        .send(taskPayload(assignee.id));
      const taskId = created.body.data.task.id;

      const res = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set(authHeader(assignee.token))
        .send({ title: 'Hijacked' });

      expect(res.status).toBe(403);
    });

    it('should return 403 when a non-creator, non-assignee edits', async () => {
      const creator = await registerUser(app);
      const stranger = await registerUser(app);

      const created = await request(app)
        .post('/api/tasks')
        .set(authHeader(creator.token))
        .send(taskPayload());
      const taskId = created.body.data.task.id;

      const res = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set(authHeader(stranger.token))
        .send({ title: 'Hijacked' });

      expect(res.status).toBe(403);
    });

    it('should return 404 for nonexistent task', async () => {
      const user = await registerUser(app);
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/tasks/${fakeId}`)
        .set(authHeader(user.token))
        .send({ title: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete own task', async () => {
      const user = await registerUser(app);
      const created = await request(app)
        .post('/api/tasks')
        .set(authHeader(user.token))
        .send(taskPayload());
      const taskId = created.body.data.task.id;

      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set(authHeader(user.token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 403 when a stranger deletes', async () => {
      const creator = await registerUser(app);
      const stranger = await registerUser(app);
      const created = await request(app)
        .post('/api/tasks')
        .set(authHeader(creator.token))
        .send(taskPayload());
      const taskId = created.body.data.task.id;

      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set(authHeader(stranger.token));

      expect(res.status).toBe(403);
    });

    it('should cascade delete comments when task deleted', async () => {
      const user = await registerUser(app);
      const created = await request(app)
        .post('/api/tasks')
        .set(authHeader(user.token))
        .send(taskPayload());
      const taskId = created.body.data.task.id;

      await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set(authHeader(user.token))
        .send({ content: 'A comment' });

      await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set(authHeader(user.token));

      const commentsRes = await request(app)
        .get(`/api/tasks/${taskId}/comments`)
        .set(authHeader(user.token));
      expect(commentsRes.status).toBe(404);
    });
  });
});
