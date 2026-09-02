import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User, { UserRole } from '../models/User';
import Task from '../models/Task';
import Comment from '../models/Comment';
import { config } from '../config';

dotenv.config();

const DEMO_PASSWORD = 'Password123!';

interface DemoUser {
  name: string;
  email: string;
  role: UserRole;
}

const demoUsers: DemoUser[] = [
  { name: 'Alice', email: 'alice@example.com', role: 'admin' },
  { name: 'Bob', email: 'bob@example.com', role: 'manager' },
  { name: 'Charlie', email: 'charlie@example.com', role: 'member' },
];

async function seed(): Promise<void> {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('MongoDB connected');

    await Promise.all([
      User.deleteMany({}),
      Task.deleteMany({}),
      Comment.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    const users = [];
    for (const u of demoUsers) {
      // Use create() so the password-hashing pre('save') hook runs.
      const user = await User.create({ ...u, password: DEMO_PASSWORD });
      users.push(user);
    }
    console.log(`Created ${users.length} users`);

    const [alice, bob, charlie] = users;

    const tasksData = [
      {
        title: 'Implement user authentication',
        description: 'Add register, login, and JWT-based auth to the API.',
        status: 'Done',
        priority: 'High',
        creator: alice._id,
        assignee: alice._id,
      },
      {
        title: 'Build task management API',
        description: 'CRUD endpoints for tasks with filtering and pagination.',
        status: 'In Progress',
        priority: 'High',
        creator: alice._id,
        assignee: bob._id,
      },
      {
        title: 'Add comment functionality',
        description: 'Allow users to comment on tasks.',
        status: 'In Progress',
        priority: 'Medium',
        creator: bob._id,
        assignee: alice._id,
      },
      {
        title: 'Write integration tests',
        description: 'Cover auth, tasks, and comments with Jest + Supertest.',
        status: 'Todo',
        priority: 'Medium',
        creator: bob._id,
        assignee: charlie._id,
      },
      {
        title: 'Design task detail page in frontend',
        description: 'Show task info, assignee, and comments.',
        status: 'Todo',
        priority: 'Low',
        creator: charlie._id,
        assignee: null,
      },
    ];

    const tasks = await Task.insertMany(tasksData);
    console.log(`Created ${tasks.length} tasks`);

    const commentsData = [
      {
        task: tasks[0]._id,
        author: alice._id,
        content: 'Auth flow is working in Postman.',
      },
      {
        task: tasks[0]._id,
        author: bob._id,
        content: 'Nice, I will start integration testing.',
      },
      {
        task: tasks[1]._id,
        author: bob._id,
        content: 'Pagination with filters is complete.',
      },
    ];

    await Comment.insertMany(commentsData);
    console.log(`Created ${commentsData.length} comments`);

    console.log('\nSeed complete!');
    console.log('Demo accounts (password: Password123!):');
    demoUsers.forEach((u) => console.log(`  ${u.email} (${u.role})`));
  } catch (error) {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
