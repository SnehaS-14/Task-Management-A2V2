import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import * as authService from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { RegisterInput, LoginInput } from '../validators/auth';

export const register = asyncHandler(
  async (req: Request, res: Response) => {
    const input = req.body as RegisterInput;
    const result = await authService.registerUser(input);
    sendSuccess(res, result, 201);
  }
);

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as LoginInput;
  const result = await authService.loginUser(input);
  sendSuccess(res, result);
});

export const me = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = await authService.getUserProfile(req.user!.id);
    sendSuccess(res, { user });
  }
);
