# Swagger Integration Instructions

## Step 1: Install Dependencies

Run this in your `rentauras-x-api` directory:

```bash
npm install swagger-ui-express swagger-jsdoc
npm install --save-dev @types/swagger-ui-express @types/swagger-jsdoc
```

## Step 2: Add Swagger to your main Express app

Add these imports to your `src/index.ts` file:

```typescript
import swaggerUi from 'swagger-ui-express';
import { specs, swaggerUiOptions } from '@/config/swagger';
```

Then add this middleware BEFORE your API routes (around line 82, before the API routes):

```typescript
// Swagger API Documentation
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));
  logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
}
```

## Step 3: Add JSDoc comments to your route files

Copy the JSDoc comments from `swagger-route-examples.ts` to your actual route files:

### For `src/routes/auth.ts`:

Add these comments above each route handler:

```typescript
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
router.post('/send-otp', ...); // your existing route
```

### For other routes:

Copy the appropriate JSDoc comments from `swagger-route-examples.ts` and place them above each route handler in:
- `src/routes/users.ts`
- `src/routes/rides.ts`
- `src/routes/vehicles.ts`
- `src/routes/payments.ts`
- `src/routes/notifications.ts`

## Step 4: Add Health Check Documentation

Add this to your `src/index.ts` file above the health check route:

```typescript
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if the API server is running and healthy
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: 'OK'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: '1.0.0'
 *                 environment:
 *                   type: string
 *                   example: 'development'
 */
app.get('/health', (req, res) => {
  // your existing health check code
});
```

## Step 5: Test the Setup

1. Start your backend server:
   ```bash
   npm run dev
   ```

2. Open your browser and go to:
   ```
   http://localhost:3000/api-docs
   ```

3. You should see the Swagger UI with your API documentation!

## Step 6: Add More Route Documentation

For each new route you create, add JSDoc comments following the OpenAPI 3.0 specification. Here's a template:

```typescript
/**
 * @swagger
 * /api/v1/your-endpoint:
 *   post:
 *     summary: Brief description
 *     description: Detailed description
 *     tags: [YourTag]
 *     security:
 *       - bearerAuth: []  # if authentication required
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field1:
 *                 type: string
 *                 description: Field description
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

## Features Included

✅ **Complete OpenAPI 3.0 specification**
✅ **JWT Bearer authentication scheme**
✅ **Comprehensive data models** (User, Ride, Vehicle, Payment, Location)
✅ **Error response schemas**
✅ **Request/response examples**
✅ **Parameter validation**
✅ **Custom Swagger UI styling**
✅ **Environment-specific server URLs**

## Next Steps

1. Add JSDoc comments to all your existing routes
2. Test each endpoint in the Swagger UI
3. Add more detailed examples and descriptions
4. Consider adding request/response examples for better documentation
