import express, { Router } from 'express';
import {
  getUsers,
  assignRole,
  getAdmins,
  updateProfile,
  uploadAvatar,
  removeAvatar,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { validate } from '../middleware/validate';
import { userSearchSchema } from '../validators/auth';
import {
  assignmentRoleSchema,
  roleParamSchema,
  updateProfileSchema,
  uploadAvatarSchema,
} from '../validators/user';

const router: Router = express.Router();

router.use(authenticate);

router.get('/', validate(userSearchSchema, 'query'), getUsers);
router.get('/admins', getAdmins);
router.patch('/me/profile', validate(updateProfileSchema), updateProfile);
router.post('/me/avatar', validate(uploadAvatarSchema), uploadAvatar);
router.delete('/me/avatar', removeAvatar);

router.patch(
  '/:id/role',
  requireRole('admin', 'manager'),
  validate(roleParamSchema, 'params'),
  validate(assignmentRoleSchema),
  assignRole
);

export default router;
