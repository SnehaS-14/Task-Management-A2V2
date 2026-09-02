import User, { IUser, SafeUser, toSafeUser } from '../models/User';
import { signToken } from '../utils/jwt';
import { sanitizeEmail } from '../utils/sanitize';
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from '../utils/errors';
import {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
} from '../validators/auth';
import { AuthUser } from '../types';

export async function registerUser(
  input: RegisterInput
): Promise<{ user: SafeUser; token: string }> {
  const email = sanitizeEmail(input.email);

  const existing = await User.findOne({ email }).lean();
  if (existing) {
    throw new ConflictError('An account with this email already exists');
  }

  const user = (await User.create({
    name: input.name,
    email,
    password: input.password,
  })) as IUser;

  const authUser: AuthUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const token = signToken(authUser);

  return { user: toSafeUser(user), token };
}

export async function loginUser(
  input: LoginInput
): Promise<{ user: SafeUser; token: string }> {
  const email = sanitizeEmail(input.email);

  const user = (await User.findOne({ email }).select('+password')) as
    | (IUser & { _id: unknown })
    | null;
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const passwordMatches = await user.comparePassword(input.password);
  if (!passwordMatches) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const authUser: AuthUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const token = signToken(authUser);

  return { user: toSafeUser(user), token };
}

export async function getUserProfile(userId: string): Promise<SafeUser> {
  const user = (await User.findById(userId)) as IUser | null;
  if (!user) {
    throw new ValidationError('User not found');
  }
  return toSafeUser(user);
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput
): Promise<void> {
  const user = (await User.findById(userId).select('+password')) as IUser | null;
  if (!user) {
    throw new ValidationError('User not found');
  }

  if (!(await user.comparePassword(input.currentPassword))) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  user.password = input.newPassword;
  await user.save();
}
