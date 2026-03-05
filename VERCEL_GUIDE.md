# 🚀 ShopC2C Gateway: Vercel Deployment Guide 

Deploying the **ShopC2C Infrastructure (v4.0.0-PROTOTYPE)** to Vercel is highly efficient. The system is architected with Atomic Serverless Functions (`/api`) and a high-performance Vite frontend.

## 1. Prerequisites
- A GitHub account with the code pushed to a private/public repo.
- A Vercel account connected to GitHub.
- **Appwrite Project Access** (Wait for the `.env.local` synchronization before deploying).

## 2. Environment Configuration (⚡ CRITICAL)

Vercel requires specific Environment Variables to handle the **Appwrite Backend** and **AI Verification Layer**. Add these in **Dashboard -> Settings -> Environment Variables**:

### 🛡️ Backend & Serverless Layer
| Variable Name | Value Note |
|---------------|------------|
| `NEXT_PUBLIC_APPWRITE_ENDPOINT` | `https://cloud.appwrite.io/v1` |
| `NEXT_PUBLIC_APPWRITE_PROJECT_ID` | Your Project ID |
| `APPWRITE_DATABASE_ID` | Unique Database ID |
| `APPWRITE_BUCKET_ID` | Your storage bucket ID |
| `APPWRITE_API_KEY` | Optional / Required for some admin functions in Appwrite |
| `GEMINI_API_KEY` | Google Gemini AI Key |
| `NEXT_PUBLIC_BASE_URL` | Your production URL (e.g. `https://pay.yourdomain.com`) |
| `API_SERVER_URL` | Same as `NEXT_PUBLIC_BASE_URL` (Ensures API-Frontend Handshake) |

---

## 3. Deployment Steps

1. **Connect Repo**: In Vercel, "Add New Project" and select your repository.
2. **Framework Preset**: Vercel will detect **Vite**. Keep defaults.
3. **Environment**: Paste the variables from step 2.
4. **Deploy**: Click "Deploy". The process takes ~60 seconds.

---

## 4. Real-time Diagnostics
Once deployed, navigate to:
`https://your-domain.vercel.app/base`

This is your **Command Center**. It provides:
- **L7 Health Monitoring**: Real-time status of Database, Auth, and Storage.
- **Node Sync Cycle**: 30-second heartbeats for infrastructure health.
- **Handshake Verification**: Visual confirmation of Vercel-to-Appwrite connectivity.

---

## 5. Troubleshooting (Protocol Failures)

- **Database Node Synced/Failed**: Ensure the Database and Collections are created in the Appwrite Console and match the environment parameters perfectly.
- **Storage Node Synced/Failed**: Ensure the Storage bucket is created in the Appwrite Console and matches the environment variable.
- **Handshake Error (500)**: Check Vercel **Function Logs**. Most common cause is malformed Appwrite configuration or API Key format.

---

**System Version**: `4.0.12-Release`
**Last Calibration**: Appwrite synchronization and Serverless API verification.
