#!/bin/bash

# Swagger OpenAPI Setup Script for Rentauras X API
# Run this script in your rentauras-x-api directory

echo "🚀 Setting up Swagger OpenAPI for Rentauras X API..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the rentauras-x-api directory."
    exit 1
fi

# Install Swagger dependencies
echo "📦 Installing Swagger dependencies..."
npm install swagger-ui-express swagger-jsdoc
npm install --save-dev @types/swagger-ui-express @types/swagger-jsdoc

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create src/config directory if it doesn't exist
mkdir -p src/config

# Check if swagger config already exists
if [ -f "src/config/swagger.ts" ]; then
    echo "✅ Swagger config already exists at src/config/swagger.ts"
else
    echo "❌ Please move swagger-config.ts to src/config/swagger.ts manually"
fi

echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. Move swagger-config.ts to src/config/swagger.ts (if not done already)"
echo ""
echo "2. Add these imports to your src/index.ts file:"
echo "   import swaggerUi from 'swagger-ui-express';"
echo "   import { specs, swaggerUiOptions } from '@/config/swagger';"
echo ""
echo "3. Add this middleware to src/index.ts (before your API routes):"
echo "   // Swagger API Documentation"
echo "   if (process.env.NODE_ENV !== 'production') {"
echo "     app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));"
echo "     logger.info(\`📚 API Documentation: http://localhost:\${PORT}/api-docs\`);"
echo "   }"
echo ""
echo "4. Add JSDoc comments to your route files using the examples in:"
echo "   - swagger-route-examples.ts"
echo "   - example-auth-routes-with-swagger.ts"
echo ""
echo "5. Start your server and visit: http://localhost:3000/api-docs"
echo ""
echo "📚 Documentation files created:"
echo "   ✅ src/config/swagger.ts - Main Swagger configuration"
echo "   ✅ swagger-integration.md - Detailed integration instructions"
echo "   ✅ example-auth-routes-with-swagger.ts - Example route documentation"
echo "   ✅ swagger-route-examples.ts - JSDoc comment examples"
echo ""
echo "🎉 Swagger OpenAPI setup is ready!"
echo "Follow the integration instructions in swagger-integration.md"
