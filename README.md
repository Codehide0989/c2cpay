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
    
    # Appwrite Configuration
    NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
    NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
    APPWRITE_DATABASE_ID=your_database_id_here
    APPWRITE_BUCKET_ID=your_bucket_id_here
    APPWRITE_API_KEY=your_appwrite_api_key_here
    ```

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
    -   **Configuring Appwrite Backend Parameters:**
        -   `NEXT_PUBLIC_APPWRITE_ENDPOINT`
        -   `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
        -   `APPWRITE_DATABASE_ID`
        -   `APPWRITE_BUCKET_ID`
        -   `APPWRITE_API_KEY`
    -   **Other:**
        -   `GEMINI_API_KEY` - If using AI features
    
5.  **Deploy**:
    -   Click **Deploy**.
    -   Once deployed, the backend API is available at `/api/*` automatically.
    -   Once deployed, visit `/api/status` (e.g., `https://your-app.vercel.app/api/status`) to confirm the backend is running.

## Security Notes
*   **Database**: This project uses Appwrite. Ensure your Security Rules are configured correctly.
*   **API Keys**: Keep `GEMINI_API_KEY` and `APPWRITE_API_KEY` secure (backend only).

## Tech Stack

*   **Frontend**: React 19, TypeScript, Tailwind CSS
*   **Backend**: Appwrite (Database, Auth, Storage) + Vercel Serverless
*   **AI**: Google GenAI SDK (Gemini 2.5 Flash)
*   **Icons**: Lucide React
*   **Styling**: Glassmorphism, 3D CSS Transforms

## 🔐 Admin Login Guide

Access the Admin Dashboard to configure UPI settings and view transaction history.

1. **Open Admin Panel**: 
   - Click the "Admin" button in the top navigation bar.
   - Or visit the secret path `/c2c` (e.g., `your-domain.com/c2c`).

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
   - Check `.env.local` for correct Appwrite credentials.
3. **Database Issues**:
   - Ensure a document exists in `configs` collection (or let the app create it).

### Appwrite Database Connection Issues on Vercel

If your database connection fails after deploying to Vercel:

1. **Check Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Verify Appwrite variables are set.

2. **Test Connection:**
   - Visit `https://your-app.vercel.app/api/status` to check connection status
   - Visit `https://your-app.vercel.app/api/diagnose` for comprehensive diagnostics

3. **Common Issues:**
   - **"Missing credentials" error:** Make sure you added APPWRITE variables
   - **"Permission denied" error:** Check Appwrite Security Rules and ensure proper permissions

4. **Redeploy After Changes:**
   - After adding/updating environment variables in Vercel, you must redeploy
   - Go to Deployments → Click "..." → Redeploy

## License

MIT License - Free for personal and commercial use.
