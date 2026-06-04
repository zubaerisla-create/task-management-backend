import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import { Secret } from 'jsonwebtoken';
import config from '../../config';
import ApiError from '../../errors/apiError';
import { prisma } from '../../prisma/prisma';
import emailSender from '../../utils/emailSender';
import { jwtHelper } from '../../utils/JwtHelper';
import fs from 'fs';
import path from 'path';

const login = async (payload: { email: string; password: string }) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      email: payload.email,
    },
  });

  if (!user || !user.password) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const isCorrectPassword = await bcrypt.compare(
    payload.password,
    user.password,
  );

  if (!isCorrectPassword) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const accessToken = jwtHelper.generateToken(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.accessToken as string,
    config.jwt.accessTokenExpiresIn as string,
  );
  const refreshToken = jwtHelper.generateToken(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.refreshToken as string,
    config.jwt.refreshTokenExpiresIn as string,
  );

  return {
    accessToken,
    refreshToken,
  };
};

const forgotPassword = async (payload: { email: string }) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!userData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const resetToken = jwtHelper.generateToken(
    {
      id: userData.id,
      email: userData.email,
      role: userData.role,
    },
    config.jwt.reset_pass_secret as Secret,
    config.jwt.reset_pass_token_expires_in as string,
  );

  const resetLink = `${config.reset_pass_link}?token=${resetToken}`;

  try {
    fs.writeFileSync(path.join(process.cwd(), 'reset-link.txt'), resetLink);
  } catch (err) {
    console.error('Failed to write reset-link.txt', err);
  }

  await emailSender(
    'Reset Your Password',
    userData.email,
    `
        <p>Hello ${userData.name || 'User'},</p>
        <p>Click the link below to reset your password:</p>
         <a href="${resetLink}" style="text-decoration: none;">
            <button style="background-color: #007BFF; color: white; padding: 10px 20px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;">
              Reset Password
            </button>
          </a>
        <p>If you didn’t request this, ignore this email.</p>
        `,
  );

  return { message: 'Reset password email sent' };
};

const resetPassword = async (token: string, payload: { password: string }) => {
  // Verify token
  const decoded = jwtHelper.verifyToken(
    token,
    config.jwt.reset_pass_secret as Secret,
  );

  if (!decoded) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Invalid or expired token!');
  }

  const user = await prisma.user.findUnique({
    where: {
      id: decoded.id,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(config.salt_rounds),
  );

  // Update password
  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: hashedPassword,
    },
  });

  return { message: 'Password reset successful' };
};

const signupOtpStore = new Map<string, {
  otp: string;
  expiresAt: number;
  payload: any;
}>();

const sendSignupOtp = async (payload: any) => {
  const isExistingUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (isExistingUser) {
    throw new ApiError(400, 'User already exists!');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  signupOtpStore.set(payload.email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 mins
    payload,
  });

  console.log(`[Signup OTP for ${payload.email}]: ${otp}`);
  try {
    fs.writeFileSync(path.join(process.cwd(), 'otp.txt'), otp);
  } catch (err) {
    console.error('Failed to write otp.txt', err);
  }

  await emailSender(
    'Verify Your Email - Signup OTP',
    payload.email,
    `
    <h3>Email Verification Required</h3>
    <p>Thank you for registering. Use the following 6-digit OTP code to complete your signup process:</p>
    <h2 style="font-size: 24px; color: #7c3aed; letter-spacing: 2px;">${otp}</h2>
    <p>This OTP will expire in 10 minutes.</p>
    `,
  );

  return { message: 'OTP sent to email successfully' };
};

const verifySignup = async (payload: { email: string; otp: string }) => {
  const record = signupOtpStore.get(payload.email);

  if (!record) {
    throw new ApiError(400, 'Invalid verification request or OTP has expired');
  }

  if (Date.now() > record.expiresAt) {
    signupOtpStore.delete(payload.email);
    throw new ApiError(400, 'OTP has expired');
  }

  if (record.otp !== payload.otp) {
    throw new ApiError(400, 'Invalid OTP code');
  }

  // Hash password
  const hashPassword = await bcrypt.hash(record.payload.password, 10);

  // Create User
  const user = await prisma.user.create({
    data: {
      name: record.payload.name,
      email: record.payload.email,
      password: hashPassword,
      role: record.payload.role ?? 'TEAM_MEMBER',
      profilePicture: "https://i.ibb.co.com/q2gwGfV/356306451-54b19ada-d53e-4ee9-8882-9dfed1bf1396.jpg",
    },
  });

  signupOtpStore.delete(payload.email);

  // Generate tokens to log them in automatically
  const accessToken = jwtHelper.generateToken(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.accessToken as string,
    config.jwt.accessTokenExpiresIn as string,
  );
  const refreshToken = jwtHelper.generateToken(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.refreshToken as string,
    config.jwt.refreshTokenExpiresIn as string,
  );

  return {
    user,
    accessToken,
    refreshToken,
  };
};

export const AuthServices = {
  login,
  forgotPassword,
  resetPassword,
  sendSignupOtp,
  verifySignup,
};
