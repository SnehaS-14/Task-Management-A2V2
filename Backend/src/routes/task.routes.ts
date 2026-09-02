import express, { Router } from 'express';
import {
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask,
} from '../controllers/task.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
  idParamSchema,
  taskIdParamSchema,
} from '../validators/task';
import { createCommentSchema } from '../validators/comment';
import { addComment, getComments } from '../controllers/comment.controller';

const router: Router = express.Router();

router.use(authenticate);

router
  .route('/')
  .post(validate(createTaskSchema), createTask)
  .get(validate(listTasksQuerySchema, 'query'), listTasks);

router
  .route('/:id')
  .get(validate(idParamSchema, 'params'), getTask)
  .patch(
    validate(idParamSchema, 'params'),
    validate(updateTaskSchema),
    updateTask
  )
  .delete(validate(idParamSchema, 'params'), deleteTask);

router
  .route('/:taskId/comments')
  .post(validate(taskIdParamSchema, 'params'), validate(createCommentSchema), addComment)
  .get(validate(taskIdParamSchema, 'params'), getComments);

export default router;
