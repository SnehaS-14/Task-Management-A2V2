import express, { Router } from 'express';
import { updateComment, deleteComment } from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateCommentSchema } from '../validators/comment';
import { commentIdParamSchema } from '../validators/task';

const router: Router = express.Router();

router.use(authenticate);

router
  .route('/:commentId')
  .patch(
    validate(commentIdParamSchema, 'params'),
    validate(updateCommentSchema),
    updateComment
  )
  .delete(validate(commentIdParamSchema, 'params'), deleteComment);

export default router;
