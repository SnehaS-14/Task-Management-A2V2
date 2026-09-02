import { z } from 'zod';
import { isValidObjectId } from '../types';

const USER_ROLE_VALUES = ['admin', 'manager', 'member'] as const;
const JOB_ROLE_VALUES = [
  'Engineer',
  'Product Designer',
  'UI/UX Designer',
  'Product Manager',
  'QA Engineer',
  'Other',
] as const;

export const assignmentRoleSchema = z.object({
  role: z.enum(USER_ROLE_VALUES),
});

export type AssignmentRoleSchema = z.infer<typeof assignmentRoleSchema>;

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    jobRole: z.enum(JOB_ROLE_VALUES).optional(),
  })
  .refine((input) => input.name !== undefined || input.jobRole !== undefined, {
    message: 'Provide a name or job role to update',
  });

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;

export const uploadAvatarSchema = z.object({
  dataUrl: z
    .string()
    .regex(
      /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/,
      'Upload a PNG, JPEG, or WebP image'
    )
    .max(1_400_000, 'Image must be 1 MB or smaller'),
});

export type UploadAvatarSchema = z.infer<typeof uploadAvatarSchema>;

export const roleParamSchema = z.object({
  id: z.string().refine((v) => isValidObjectId(v), 'Invalid ID format'),
});
