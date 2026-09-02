import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'admin' | 'manager' | 'member';
export type JobRole =
  | 'Engineer'
  | 'Product Designer'
  | 'UI/UX Designer'
  | 'Product Manager'
  | 'QA Engineer'
  | 'Other';

export const USER_ROLES: UserRole[] = ['admin', 'manager', 'member'];
export const JOB_ROLES: JobRole[] = [
  'Engineer',
  'Product Designer',
  'UI/UX Designer',
  'Product Manager',
  'QA Engineer',
  'Other',
];

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  jobRole: JobRole;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  jobRole: JobRole;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
      maxlength: [254, 'Email cannot exceed 254 characters'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'member',
    },
    jobRole: {
      type: String,
      enum: JOB_ROLES,
      default: 'Engineer',
    },
    avatarUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (
  candidate: string
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export function toSafeUser(user: IUser): SafeUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    jobRole: user.jobRole ?? 'Engineer',
    avatarUrl: user.avatarUrl ?? undefined,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export default mongoose.model<IUser>('User', userSchema);
