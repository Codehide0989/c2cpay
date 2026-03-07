# ShopC2C Secure Payment Gateway (Astro Edition)

ShopC2C is a high-performance, full-stack UPI payment gateway built with **Astro**, **Prisma**, and **Neon PostgreSQL**. It features AI-powered screenshot verification using Google Gemini, manual UTR validation, and a sleek glassmorphic Admin Dashboard.

## 🚀 Evolution: Migrated from React to Astro
This project has been fully migrated from a React/Vite/Appwrite stack to a modern **Astro** architecture.
- **Framework**: Astro (SSR Mode)
- **Database**: Neon PostgreSQL (Serverless)
- **ORM**: Prisma
- **Styles**: Tailwind CSS
- **AI**: Google Gemini 2.5 Flash

## ✨ Features

*   **Universal UPI Support**: Generates dynamic QR codes compatible with GPay, PhonePe, Paytm, and BHIM.
*   **Astro Speed**: Blazing fast performance with Astro's server-side rendering and minimal client-side JS.
*   **AI Verification**: Uses Google Gemini to analyze payment screenshots for fraud detection.
*   **Manual Verification**: Strict validation logic for 12-digit UTR numbers.
*   **Admin Dashboard**:
    *   **Configuration**: Update Merchant VPA, Name, and Redirect URL instantly.
    *   **History**: Track transactions with detailed Prisma-backed logs.
    *   **Docs**: Built-in developer integration guide.
*   **Security**: Amount locking, input sanitization, and PIN-protected admin access.

## 🛠️ Setup & Installation

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
    Copy `env.example` to `.env.local` and fill in your Neon DB URL and Gemini API Key:
    ```bash
    cp env.example .env.local
    ```

4.  **Database Migration**
    Sync the Prisma schema with your Neon database:
    ```bash
    npx prisma db push
    npx prisma generate
    ```

5.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Visit: `http://localhost:4321`

## 📖 Integration Guide

Integrate ShopC2C into any app using simple URL parameters:

**Example Link**:
```
https://your-app.vercel.app/?pa=store@upi&pn=MyStore&am=500&locked=true&redirect_url=https://myshop.com/success
```

**Parameters**:
*   `pa`: Merchant UPI ID
*   `pn`: Merchant Name
*   `am`: Amount
*   `tn`: Transaction Note
*   `locked`: `true` to lock amount
*   `redirect_url`: Final destination after success

## 🌐 Deployment (Vercel)

1.  **Push to GitHub**.
2.  **Import to Vercel**.
3.  **Set Environment Variables**: `DATABASE_URL`, `GEMINI_API_KEY`, `ADMIN_PIN`.
4.  Vercel will automatically detect the Astro project and deploy it.

## 🔐 Admin Access
1. Visit `/admin`.
2. Default PIN: `1234` (Configurable in `.env`).

## License
MIT License - Free for everyone.
