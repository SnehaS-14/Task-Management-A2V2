import express, { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, me, updatePassword } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from '../validators/auth';
import { authenticate } from '../middleware/auth';

const router: Router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/me', authenticate, me);
router.patch(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  updatePassword
);

export default router;
