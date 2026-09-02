import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import * as commentService from '../services/comment.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ForbiddenError } from '../utils/errors';
import { CreateCommentInput, UpdateCommentInput } from '../validators/comment';

export const addComment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { taskId } = req.params;
    const input = req.body as CreateCommentInput;
    const comment = await commentService.addComment(
      taskId,
      req.user!.id,
      input.content
    );
    sendSuccess(res, { comment }, 201);
  }
);

export const getComments = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { taskId } = req.params;
    const comments = await commentService.listComments(taskId);
    sendSuccess(res, { comments });
  }
);

export const updateComment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { commentId } = req.params;
    const input = req.body as UpdateCommentInput;

    const comment = await commentService.getCommentOrNull(commentId);
    if (!comment) {
      const { NotFoundError } = await import('../utils/errors');
      throw new NotFoundError('Comment not found', 'COMMENT_NOT_FOUND');
    }

    if (comment.author !== req.user!.id) {
      throw new ForbiddenError('Only the comment author can update this comment');
    }

    const updated = await commentService.updateComment(commentId, input.content);
    sendSuccess(res, { comment: updated });
  }
);

export const deleteComment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { commentId } = req.params;

    const comment = await commentService.getCommentOrNull(commentId);
    if (!comment) {
      const { NotFoundError } = await import('../utils/errors');
      throw new NotFoundError('Comment not found', 'COMMENT_NOT_FOUND');
    }

    if (comment.author !== req.user!.id) {
      throw new ForbiddenError('Only the comment author can delete this comment');
    }

    await commentService.deleteComment(commentId);
    sendSuccess(res, { message: 'Comment deleted successfully' });
  }
);
