# 🚀 ShopC2C Gateway: Vercel Deployment Guide 

Deploying the **ShopC2C Infrastructure (v4.0.0-PROTOTYPE)** to Vercel is highly efficient. The system is architected with Atomic Serverless Functions (`/api`) and a high-performance Vite frontend.

## 1. Prerequisites
- A GitHub account with the code pushed to a private/public repo.
- A Vercel account connected to GitHub.
- **Firebase Project Access** (Wait for the `.env.local` synchronization before deploying).

## 2. Environment Configuration (⚡ CRITICAL)

Vercel requires specific Environment Variables to handle the **Admin SDK** and **AI Verification Layer**. Add these in **Dashboard -> Settings -> Environment Variables**:

### 🛡️ Backend & Admin SDK (Serverless Layer)
| Variable Name | Value Note |
|---------------|------------|
| `FIREBASE_PROJECT_ID` | e.g. `shopc2cpay` |
| `FIREBASE_CLIENT_EMAIL` | Service Account Email |
| `FIREBASE_PRIVATE_KEY` | Paste the **entire** key including `-----BEGIN...` and `\n` characters. DO NOT use quotes. |
| `FIREBASE_STORAGE_BUCKET` | e.g. `shopc2cpay.firebasestorage.app` |
| `GEMINI_API_KEY` | Google Gemini AI Key |

### 📱 Frontend & Client Sync (Vite Layer)
| Variable Name | Value Note |
|---------------|------------|
| `VITE_FIREBASE_API_KEY` | Client SDK API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `project-id.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Project ID |
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
- **L7 Health Monitoring**: Real-time status of Auth, Firestore, and Storage.
- **Node Sync Cycle**: 30-second heartbeats for infrastructure health.
- **Handshake Verification**: Visual confirmation of Vercel-to-Firebase connectivity.

---

## 5. Troubleshooting (Protocol Failures)

- **Firebase Auth Unavailable**: Usually means Identity Platform is not enabled in the Firebase Console. Go to **Authentication -> Get Started**.
- **Storage Node Synced/Failed**: Ensure the Storage bucket is created in the Firebase Console and matches the environment variable.
- **Handshake Error (500)**: Check Vercel **Function Logs**. Most common cause is a malformed `FIREBASE_PRIVATE_KEY` (ensure it has explicit `\n` characters if pasting into Vercel's multi-line editor).

---

**System Version**: `4.0.12-Release`
**Last Calibration**: Fixed Auth verification logic and synchronized API URL Handshake.
