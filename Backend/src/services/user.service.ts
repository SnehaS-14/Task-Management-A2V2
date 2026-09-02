import fs from 'fs/promises';
import path from 'path';
import User, { IUser, JobRole, UserRole, USER_ROLES } from '../models/User';
import { ValidationError, NotFoundError } from '../utils/errors';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  jobRole: JobRole;
  avatarUrl?: string;
}

export async function listUsers(search?: string): Promise<PublicUser[]> {
  const filter = search
    ? {
        $or: [
          { name: { $regex: escapeRegex(search), $options: 'i' } },
          { email: { $regex: escapeRegex(search), $options: 'i' } },
        ],
      }
    : {};

  const users = await User.find(filter)
    .select('name email role jobRole')
    .sort({ name: 1 })
    .limit(50)
    .lean();

  return users.map((u) => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: (u.role as UserRole) || 'member',
    jobRole: (u.jobRole as JobRole) || 'Engineer',
    avatarUrl: u.avatarUrl ?? undefined,
  }));
}

export async function assignUserRole(
  targetUserId: string,
  role: UserRole,
  actorId: string,
  actorRole: UserRole
): Promise<PublicUser> {
  if (!USER_ROLES.includes(role)) {
    throw new ValidationError('Invalid role');
  }

  const target = await User.findById(targetUserId);
  if (!target) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  if (actorId === targetUserId) {
    throw new ValidationError('You cannot change your own role');
  }

  if (target.role === 'admin' && actorRole !== 'admin') {
    throw new ValidationError('Only an admin can change another admin role');
  }

  const permissionRank: Record<UserRole, number> = {
    admin: 3,
    manager: 2,
    member: 1,
  };

  if (
    actorRole !== 'admin' &&
    permissionRank[role] >= permissionRank[actorRole]
  ) {
    throw new ValidationError(
      'You cannot assign a role equal to or higher than your own'
    );
  }

  target.role = role;
  await target.save();

  return {
    id: target._id.toString(),
    name: target.name,
    email: target.email,
    role: target.role,
    jobRole: target.jobRole ?? 'Engineer',
    avatarUrl: target.avatarUrl ?? undefined,
  };
}

export async function getAdmins(): Promise<PublicUser[]> {
  const users = await User.find({ role: 'admin' })
    .select('name email role jobRole')
    .sort({ name: 1 })
    .lean();

  return users.map((u) => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role as UserRole,
    jobRole: (u.jobRole as JobRole) || 'Engineer',
    avatarUrl: u.avatarUrl ?? undefined,
  }));
}

export async function updateOwnProfile(
  userId: string,
  input: { name?: string; jobRole?: JobRole }
): Promise<PublicUser> {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  if (input.name !== undefined) user.name = input.name;
  if (input.jobRole !== undefined && user.role !== 'admin') {
    user.jobRole = input.jobRole;
  }
  await user.save();

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    jobRole: user.jobRole ?? 'Engineer',
    avatarUrl: user.avatarUrl ?? undefined,
  };
}

const AVATAR_DIRECTORY = path.resolve(process.cwd(), 'uploads', 'avatars');
const MAX_AVATAR_BYTES = 1024 * 1024;

export async function uploadAvatar(
  userId: string,
  dataUrl: string
): Promise<PublicUser> {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found', 'USER_NOT_FOUND');

  const [metadata, encodedImage] = dataUrl.split(',', 2);
  const mimeType = metadata.match(/^data:image\/(jpeg|png|webp);base64$/)?.[1];
  if (!mimeType || !encodedImage) {
    throw new ValidationError('Upload a PNG, JPEG, or WebP image');
  }

  const image = Buffer.from(encodedImage, 'base64');
  if (!image.length || image.length > MAX_AVATAR_BYTES) {
    throw new ValidationError('Image must be 1 MB or smaller');
  }

  const extension = mimeType === 'jpeg' ? 'jpg' : mimeType;
  const filename = `${user._id.toString()}-${Date.now()}.${extension}`;
  await fs.mkdir(AVATAR_DIRECTORY, { recursive: true });
  await fs.writeFile(path.join(AVATAR_DIRECTORY, filename), image, { flag: 'wx' });

  const previousAvatar = user.avatarUrl;
  user.avatarUrl = `/uploads/avatars/${filename}`;
  await user.save();
  await deleteLocalAvatar(previousAvatar);

  return toPublicUser(user);
}

export async function removeAvatar(userId: string): Promise<PublicUser> {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found', 'USER_NOT_FOUND');

  const previousAvatar = user.avatarUrl;
  user.avatarUrl = undefined;
  await user.save();
  await deleteLocalAvatar(previousAvatar);
  return toPublicUser(user);
}

function toPublicUser(user: IUser): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    jobRole: user.jobRole ?? 'Engineer',
    avatarUrl: user.avatarUrl ?? undefined,
  };
}

async function deleteLocalAvatar(avatarUrl?: string): Promise<void> {
  if (!avatarUrl?.startsWith('/uploads/avatars/')) return;
  const filename = path.basename(avatarUrl);
  try {
    await fs.unlink(path.join(AVATAR_DIRECTORY, filename));
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
