# 🚀 SHER Frontend Deployment Guide (Vercel)

This document covers the 6-step protocol to deploy the Sher AI UI node to Vercel.

## 🔹 Step 1: Preparation
Ensure you are in the project root and build locally to verify:
```bash
npm install
npm run build
```

## 🔹 Step 2: Vercel Handshake
Install Vercel CLI and login:
```bash
npm install -g vercel
vercel login
```

## 🔹 Step 3: Deploy
Run the initialization command:
```bash
vercel
```
Select `No` for linking existing project, and `Yes` for all default framework detections.

## 🔹 Step 4: Environment Sharding
In the Vercel Dashboard (Project Settings > Environment Variables), add:
`NEXT_PUBLIC_API_URL` = `[YOUR_GCP_CLOUD_RUN_URL]`

Redeploy for production:
```bash
vercel --prod
```

## 🔹 Step 5: Custom Domain & HTTPS
1. Go to **Settings > Domains** in Vercel.
2. Add your domain (e.g., `quant.sher.ai`).
3. Update DNS at your provider:
   - **A Record**: `@` -> `76.76.21.21`
   - **CNAME**: `www` -> `cname.vercel-dns.com`

## 🔹 Step 6: Post-Deployment Check
Verify that the `GlobalStatusBar.tsx` shows "NEURAL NODE SYNCHRONIZED".
