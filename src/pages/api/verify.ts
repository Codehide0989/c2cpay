import type { APIRoute } from 'astro';
import { GoogleGenerativeAI } from "@google/generative-ai";

export const POST: APIRoute = async ({ request }) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        return new Response(JSON.stringify({ isValid: false, message: "Server Error: AI Configuration Missing." }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { imageBase64, expectedAmount, expectedVpa } = await request.json();

        if (!imageBase64) {
            return new Response(JSON.stringify({ error: "No image data provided" }), { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const prompt = `
          Act as a strict fraud detection expert. Analyze this payment screenshot for validity.
          
          CRITICAL: You must detect "Fake Payment Apps" (e.g., "Prank Payment", "Spoof Paytm").
          
          1. ANALYZE VISUALS:
             - Are fonts pixel-perfect and consistent?
             - Is the "Paid to" text aligned correctly?
          
          2. EXTRACT & VERIFY:
             - Status: Must be 'Successful', 'Completed', or 'Paid'.
             - Amount: Must match roughly ${expectedAmount}.
             - Payee: Must closely match ${expectedVpa}.
             - UTR/Ref ID: Extract the 12-digit number.
          
          Return JSON:
          {
            "isSuccessful": boolean,
            "utr": string,
            "confidence": number,
            "isManipulated": boolean,
            "isFakeApp": boolean,
            "reason": string
          }
        `;

        const result = await model.generateContent([
            { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
            prompt
        ]);

        const responseText = result.response.text();
        const analysis = JSON.parse(responseText || '{}');

        if (analysis.isManipulated || analysis.isFakeApp) {
            return new Response(JSON.stringify({
                isValid: false,
                message: analysis.reason || "Security Alert: Fake payment app detected.",
                extractedData: { utr: analysis.utr }
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        if (analysis.isSuccessful && analysis.confidence > 0.8) {
            return new Response(JSON.stringify({
                isValid: true,
                message: "Payment verified successfully.",
                extractedData: { utr: analysis.utr, amount: expectedAmount, status: 'SUCCESS' }
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } else {
            return new Response(JSON.stringify({
                isValid: false,
                message: analysis.reason || "Verification failed.",
                extractedData: { utr: analysis.utr }
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

    } catch (error: any) {
        console.error("AI Verify Error:", error);
        return new Response(JSON.stringify({
            isValid: false, message: "AI Verification service currently unavailable: " + error.message
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};
