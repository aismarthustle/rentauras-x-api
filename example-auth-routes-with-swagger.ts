// Example of how your src/routes/auth.ts should look with Swagger documentation
// Copy the JSDoc comments to your actual auth.ts file

import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from '@/controllers/authController';
import { authenticateToken } from '@/middleware/auth';
import { authRateLimiter, otpRateLimiter } from '@/middleware/rateLimiter';
import { validateRequest } from '@/middleware/validateRequest';
import { asyncHandler } from '@/middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/send-otp:
 *   post:
 *     summary: Send OTP for authentication
 *     description: Send OTP via SMS, WhatsApp, or Email for user login or registration
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - method
 *               - type
 *             properties:
 *               phone:
 *                 type: string
 *                 pattern: '^\\+[1-9]\\d{1,14}$'
 *                 description: Phone number in E.164 format (required for SMS/WhatsApp)
 *                 example: '+212612345678'
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address (required for email method)
 *                 example: 'user@example.com'
 *               method:
 *                 type: string
 *                 enum: [sms, whatsapp, email]
 *                 description: OTP delivery method
 *               type:
 *                 type: string
 *                 enum: [login, register]
 *                 description: Authentication type
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: 'OTP sent successfully'
 *               data:
 *                 expires_in: 300
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many OTP requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/send-otp',
  otpRateLimiter,
  [
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Invalid phone number format'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format'),
    body('method')
      .isIn(['sms', 'whatsapp', 'email'])
      .withMessage('Method must be sms, whatsapp, or email'),
    body('type')
      .isIn(['login', 'register'])
      .withMessage('Type must be login or register')
  ],
  validateRequest,
  asyncHandler(authController.sendOTP)
);

/**
 * @swagger
 * /api/v1/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and authenticate
 *     description: Verify OTP code and complete login or registration process
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *               - type
 *             properties:
 *               phone:
 *                 type: string
 *                 pattern: '^\\+[1-9]\\d{1,14}$'
 *                 example: '+212612345678'
 *               email:
 *                 type: string
 *                 format: email
 *                 example: 'user@example.com'
 *               otp:
 *                 type: string
 *                 pattern: '^\\d{4,6}$'
 *                 description: OTP code received
 *                 example: '123456'
 *               type:
 *                 type: string
 *                 enum: [login, register]
 *               full_name:
 *                 type: string
 *                 description: Required for registration
 *                 example: 'Ahmed Ben Ali'
 *               role:
 *                 type: string
 *                 enum: [passenger, driver]
 *                 description: Required for registration
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Authentication successful'
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     access_token:
 *                       type: string
 *                       description: JWT access token
 *                     refresh_token:
 *                       type: string
 *                       description: JWT refresh token
 *                     expires_in:
 *                       type: integer
 *                       description: Token expiration time in seconds
 *       400:
 *         description: Invalid OTP or request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/verify-otp',
  authRateLimiter,
  [
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Invalid phone number format'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format'),
    body('otp')
      .isLength({ min: 4, max: 6 })
      .isNumeric()
      .withMessage('OTP must be 4-6 digits'),
    body('type')
      .isIn(['login', 'register'])
      .withMessage('Type must be login or register'),
    body('full_name')
      .if(body('type').equals('register'))
      .notEmpty()
      .withMessage('Full name is required for registration'),
    body('role')
      .if(body('type').equals('register'))
      .isIn(['passenger', 'driver'])
      .withMessage('Role must be passenger or driver')
  ],
  validateRequest,
  asyncHandler(authController.verifyOTP)
);

/**
 * @swagger
 * /api/v1/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     description: Generate a new access token using a valid refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: Valid refresh token
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *                     expires_in:
 *                       type: integer
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/refresh-token',
  [
    body('refresh_token')
      .notEmpty()
      .withMessage('Refresh token is required')
  ],
  validateRequest,
  asyncHandler(authController.refreshToken)
);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Invalidate the current user session and tokens
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/logout',
  authenticateToken,
  asyncHandler(authController.logout)
);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me',
  authenticateToken,
  asyncHandler(authController.getCurrentUser)
);

export default router;
