# Deploy Redoc to Vercel 🚀

## Quick Deployment Steps

### 1. Build the Project
```bash
npm run build
```

### 2. Commit Changes
```bash
git add .
git commit -m "feat: migrate to Redoc for serverless compatibility"
git push origin main
```

### 3. Vercel Will Auto-Deploy
If you have Vercel connected to your Git repository, it will automatically:
- Detect the push
- Run `npm run build`
- Deploy to production

### 4. Verify Deployment
Once deployed, visit:
- **API Docs**: https://rentauras-x-api.vercel.app/api-docs
- **OpenAPI Spec**: https://rentauras-x-api.vercel.app/api-docs/swagger.json

## Manual Deployment (if needed)

If auto-deployment isn't set up:

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy
vercel --prod
```

## What's Different Now?

### Before (Swagger UI)
❌ 404 error on `/api-docs`  
❌ Static files not served in serverless  
❌ Blank page in production  

### After (Redoc)
✅ Works perfectly on Vercel  
✅ Loads from CDN (no static files needed)  
✅ Beautiful, modern documentation UI  
✅ Faster and more responsive  

## Vercel Configuration

Your `vercel.json` is already configured correctly:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/index.js",
      "use": "@vercel/node",
      "config": {
        "maxLambdaSize": "50mb",
        "nodeVersion": "18.x"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

No changes needed! ✅

## Environment Variables

Make sure these are set in Vercel Dashboard:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `JWT_SECRET`
- `NODE_ENV=production`
- Any other required env vars from your `.env` file

## Testing After Deployment

1. **Health Check**:
   ```bash
   curl https://rentauras-x-api.vercel.app/health
   ```

2. **API Docs**:
   - Visit: https://rentauras-x-api.vercel.app/api-docs
   - Should see Redoc UI with all your endpoints

3. **OpenAPI Spec**:
   ```bash
   curl https://rentauras-x-api.vercel.app/api-docs/swagger.json
   ```

## Troubleshooting

### Still Getting 404?
1. Check Vercel deployment logs
2. Ensure build completed successfully
3. Verify `dist/index.js` exists after build
4. Check that routes in `vercel.json` are correct

### Blank Page?
1. Check browser console for CSP errors
2. Verify Helmet configuration includes Redoc CDN domains
3. Clear browser cache and hard refresh (Ctrl+Shift+R)

### Build Fails?
1. Check TypeScript errors: `npm run build`
2. Ensure all dependencies are installed
3. Check Node version matches (18.x)

## Success Checklist

- [ ] Local build works: `npm run build`
- [ ] Local server works: `npm run dev`
- [ ] `/api-docs` shows Redoc UI locally
- [ ] `/api-docs/swagger.json` returns JSON locally
- [ ] Changes committed and pushed to Git
- [ ] Vercel deployment completed
- [ ] Production `/api-docs` works
- [ ] Production `/api-docs/swagger.json` works

## Next Steps After Deployment

1. Share the API docs URL with your team
2. Update any documentation that references the old Swagger UI
3. Consider adding the docs link to your README
4. Celebrate! 🎉

---

**Ready to deploy?** Run the commands above and you're good to go!

