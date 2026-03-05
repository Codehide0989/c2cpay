# ShopC2C Secure Payment Gateway

ShopC2C is a production-ready, frontend-first UPI payment gateway designed for seamless integration with e-commerce platforms. It features AI-powered screenshot verification, manual UTR validation, automatic post-payment redirection, and a robust Admin Console.

## Features

*   **Universal UPI Support**: Generates dynamic QR codes compatible with GPay, PhonePe, Paytm, and BHIM.
*   **Post-Payment Redirection**: Automatically redirects customers back to your website or a success page after payment verification.
*   **Deep Linking**: Mobile-first design automatically opens installed UPI apps.
*   **AI Verification**: Uses Google Gemini 2.5 Flash to analyze payment screenshots for fraud detection.
*   **Manual Verification**: Strict validation logic for 12-digit UTR numbers to prevent common spoofing patterns.
*   **Admin Console**:
    *   **Configuration**: Update Merchant VPA, Name, Page Title, and Redirect URL instantly.
    *   **History**: Track successful and failed transactions with detailed audit logs.
    *   **Integration Docs**: Built-in guide for developers.
*   **Security**:
    *   Amount Locking.
    *   Input Sanitization.
    *   Secure PIN authentication (client-side demo).

## Setup & Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/shopc2c-gateway.git
    cd shopc2c-gateway
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ``` 

3.  **Environment Configuration**
    Create a `.env.local` file in the root directory.
    
    **Quick Start:** Copy `env.example` to `.env.local` and fill in your values:
    ```bash
    cp env.example .env.local
    ```
    
    Or manually create `.env.local` with:
    ```env
    # Required for AI Receipt Verification
    GEMINI_API_KEY=your_google_gemini_api_key_here
    
    # Firebase Admin SDK (Server-side - REQUIRED for API routes)
    # Get these from Firebase Console → Project Settings → Service Accounts → Generate New Private Key
    FIREBASE_PROJECT_ID=your_project_id
    FIREBASE_CLIENT_EMAIL=your_service_account_email@your-project.iam.gserviceaccount.com
    FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"
    FIREBASE_STORAGE_BUCKET=your_project.appspot.com
    
    # Firebase Client SDK (Frontend - optional, if using client-side Firebase)
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```

    **Important Notes:**
    - For **server-side** (API routes): Use `FIREBASE_*` variables (without `VITE_` prefix) - **REQUIRED**
    - For **client-side** (React app): Use `VITE_FIREBASE_*` variables (optional)
    - The `FIREBASE_PRIVATE_KEY` should include the full key with newlines (use `\n` in the .env file)
    - Get your service account credentials from [Firebase Console](https://console.firebase.google.com/) → Project Settings → Service Accounts
    - **If you see "Firebase Admin Credentials missing" error**, check that all three `FIREBASE_*` variables are set correctly

4.  **Run Development Server**
    Start both frontend and backend servers with a single command:
    ```bash
    npm run dev
    ```
    *   Frontend: http://localhost:3000
    *   Backend: http://localhost:3001

    **Alternatively, using Vercel CLI:**
    ```bash
    vercel dev
    ```

5.  **Build for Production**
    ```bash
    npm run build
    ```

## Integration Guide

You can integrate ShopC2C into any website without backend code by using URL parameters.

**Base URL**: `https://your-deployment-url.com`

**Parameters**:
*   `pa`: Merchant UPI ID (e.g., `business@upi`)
*   `pn`: Merchant Name (e.g., `ShopC2C Store`)
*   `am`: Amount (e.g., `199.00`)
*   `tn`: Transaction Note (e.g., `Order #5521`)
*   `title`: Custom Page Title (e.g., `Checkout`)
*   `redirect_url`: URL to redirect after successful payment (e.g. `https://myshop.com/success`)
*   `locked`: Set to `true` to prevent users from editing the amount.

**Example Link**:
```
https://shopc2c.vercel.app/?pa=store@upi&pn=MyStore&am=500&locked=true&redirect_url=https://myshop.com/success
```

## Deployment to Vercel
## 🚀 Deployment (Vercel) - Recommended

**ONE DEPLOYMENT DOES IT ALL.**
You do NOT need to deploy the frontend and backend separately. Vercel automatically deploys both the React Frontend and the Serverless Backend from this single repository.

This project is optimized for Vercel deployment. It uses a **Hybrid** structure:
*   **Frontend**: Vite (Static)
*   **Backend**: Serverless Functions (in `api/` folder)

1.  **Push to GitHub**:
    ```bash
    git push origin main
    ```

2.  **Import to Vercel**:
    -   Go to [Vercel Dashboard](https://vercel.com/dashboard) -> **Add New Project**.
    -   Import your GitHub repository.

3.  **Configure Project**:
    -   **Framework Preset**: Vite
    -   **Root Directory**: `./` (Default)
    -   **Build Command**: `vite build` (Default)
    -   **Output Directory**: `dist` (Default)

4.  **Environment Variables (CRITICAL)**:
    -   Go to **Environment Variables** section in Vercel Dashboard.
    -   **For Serverless Functions (API routes) - REQUIRED:**
        -   `FIREBASE_PROJECT_ID` - Your Firebase project ID
        -   `FIREBASE_CLIENT_EMAIL` - Service account email (ends with @...iam.gserviceaccount.com)
        -   `FIREBASE_PRIVATE_KEY` - Service account private key (paste the full key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
        -   `FIREBASE_STORAGE_BUCKET` - Your storage bucket (optional, has default)
    -   **For Client-side (Frontend) - Optional:**
        -   Add all `VITE_FIREBASE_*` variables if you need client-side Firebase features
    -   **Other:**
        -   `GEMINI_API_KEY` - If using AI features
    
    **⚠️ CRITICAL:** The `FIREBASE_PRIVATE_KEY` must be pasted exactly as it appears in your Firebase service account JSON file. In Vercel, you can paste it with actual newlines or use `\n` characters. The system will handle both formats automatically.

5.  **Deploy**:
    -   Click **Deploy**.
    -   Once deployed, the backend API is available at `/api/*` automatically.
    -   Once deployed, visit `/api/status` (e.g., `https://your-app.vercel.app/api/status`) to confirm the backend is running.

## Security Notes
*   **Database**: This project uses Firebase Firestore. Ensure your Security Rules are configured correctly.
*   **API Keys**: Your Firebase API Key is safe to expose in the frontend, but keep `GEMINI_API_KEY` secure (backend only).

## Tech Stack

*   **Frontend**: React 19, TypeScript, Tailwind CSS
*   **Backend**: Firebase (Firestore, Auth, Storage) + Vercel Serverless
*   **AI**: Google GenAI SDK (Gemini 2.5 Flash)
*   **Icons**: Lucide React
*   **Styling**: Glassmorphism, 3D CSS Transforms

## 🔐 Admin Login Guide

Access the Admin Dashboard to configure UPI settings and view transaction history.

1. **Open Admin Panel**: 
   - Click the "Admin" button in the top navigation bar.
   - Or append `?admin=true` to the URL.

2. **Default Credentials**:
   - **PIN**: `1234`
   - *Note: If this is your first time, the system will automatically create this default PIN.*

3. **Changing PIN**:
   - Go to the **Settings** tab in the Admin Dashboard.
   - Scroll down to "Security Settings".
   - Enter current PIN (`1234`) and your new desired PIN.

## 🛠️ Troubleshooting

### Server Connection Failed
If you see "API Gateway Unreachable" or "Connection Failed":
1. Ensure the development server is running:
   ```bash
   npm run dev
   ```
2. Verify:
   - Check terminal for `✅ Local API Server running`.
   - Check `.env.local` for correct Firebase credentials.
3. **Database Issues**:
   - Ensure a document exists in `configs` collection (or let the app create it).

### Firebase Database Connection Issues on Vercel

If your database connection fails after deploying to Vercel:

1. **Check Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Verify these variables are set (without `VITE_` prefix):
     - `FIREBASE_PROJECT_ID`
     - `FIREBASE_CLIENT_EMAIL`
     - `FIREBASE_PRIVATE_KEY`
   - **Important:** The `FIREBASE_PRIVATE_KEY` must be the full key from your Firebase service account JSON file

2. **Test Connection:**
   - Visit `https://your-app.vercel.app/api/status` to check connection status
   - Visit `https://your-app.vercel.app/api/test_db` for detailed connection test
   - Visit `https://your-app.vercel.app/api/diagnose` for comprehensive diagnostics

3. **Common Issues:**
   - **"Missing credentials" error:** Make sure you added `FIREBASE_*` variables (not just `VITE_FIREBASE_*`)
   - **"Invalid private key" error:** The private key must include the full key with `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
   - **"Permission denied" error:** Check Firebase Security Rules and ensure your service account has proper permissions

4. **Get Firebase Service Account Credentials:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Download the JSON file
   - Extract values:
     - `project_id` → `FIREBASE_PROJECT_ID`
     - `client_email` → `FIREBASE_CLIENT_EMAIL`
     - `private_key` → `FIREBASE_PRIVATE_KEY`

5. **Redeploy After Changes:**
   - After adding/updating environment variables in Vercel, you must redeploy
   - Go to Deployments → Click "..." → Redeploy
   - Or push a new commit to trigger automatic deployment

## License

MIT License - Free for personal and commercial use.
