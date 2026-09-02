import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import * as userService from '../services/user.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import {
  AssignmentRoleSchema,
  UpdateProfileSchema,
  UploadAvatarSchema,
} from '../validators/user';
import { ValidationError } from '../utils/errors';

export const getUsers = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const search = (req.query.search as string | undefined) ?? undefined;
    const users = await userService.listUsers(search);
    sendSuccess(res, { users });
  }
);

export const assignRole = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { role } = req.body as AssignmentRoleSchema;

    if (!req.user) {
      throw new ValidationError('Not authenticated');
    }

    const user = await userService.assignUserRole(
      id,
      role,
      req.user.id,
      req.user.role as 'admin' | 'manager' | 'member'
    );

    sendSuccess(res, { user });
  }
);

export const getAdmins = asyncHandler(
  async (_req: AuthenticatedRequest, res: Response) => {
    const admins = await userService.getAdmins();
    sendSuccess(res, { admins });
  }
);

export const updateProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = await userService.updateOwnProfile(
      req.user!.id,
      req.body as UpdateProfileSchema
    );
    sendSuccess(res, { user });
  }
);

export const uploadAvatar = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { dataUrl } = req.body as UploadAvatarSchema;
    const user = await userService.uploadAvatar(req.user!.id, dataUrl);
    sendSuccess(res, { user });
  }
);

export const removeAvatar = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = await userService.removeAvatar(req.user!.id);
    sendSuccess(res, { user });
  }
);
