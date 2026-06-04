import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import ApiError from '../../errors/apiError';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AuthServices } from './auth.service';
import config from '../../config';

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.login(req.body);
  const { accessToken, refreshToken } = result;
  const isProduction = config.node_env === 'production';

  res.cookie('accessToken', accessToken, {
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60,
  });
  res.cookie('refreshToken', refreshToken, {
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 90,
  });
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'User loggedin successfully!',
    data: {
      result,
    },
  });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User logged out successfully!',
    data: null,
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthServices.forgotPassword(req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: 'Check your email for reset password link!',
    data: null,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const token = req.query.token as string;

  if (!token) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Reset token is required!');
  }

  await AuthServices.resetPassword(token, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: 'Password reset successfully!',
    data: null,
  });
});

const sendSignupOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.sendSignupOtp(req.body);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: 'OTP sent to email successfully!',
    data: result,
  });
});

const verifySignup = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.verifySignup(req.body);
  const { accessToken, refreshToken, user } = result;
  const isProduction = config.node_env === 'production';

  res.cookie('accessToken', accessToken, {
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60,
  });
  res.cookie('refreshToken', refreshToken, {
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 90,
  });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'User registered and logged in successfully!',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
      accessToken,
      refreshToken,
    },
  });
});

export const AuthController = {
  login,
  logout,
  forgotPassword,
  resetPassword,
  sendSignupOtp,
  verifySignup,
};
