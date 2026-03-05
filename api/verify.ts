
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    if (!GEMINI_API_KEY) {
        console.error("❌ GEMINI_API_KEY is missing.");
        return response.status(500).json({
            isValid: false,
            message: "Server Error: AI Configuration Missing."
        });
    }

    try {
        const { imageBase64, expectedAmount, expectedVpa } = request.body;

        if (!imageBase64) {
            return response.status(400).json({ error: "No image data provided" });
        }

        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const MODEL_NAME = 'gemini-2.0-flash-exp'; // Using faster/newer model if available or fallback to flash

        const prompt = `
      Act as a strict fraud detection expert. Analyze this payment screenshot for validity.
      
      CRITICAL: You must detect "Fake Payment Apps" (e.g., "Prank Payment", "Spoof Paytm").
      
      1. ANALYZE VISUALS:
         - Are fonts pixel-perfect and consistent? (Fake apps often have wrong font weights).
         - Is the "Paid to" text aligned correctly?
         - Are there any watermark overlays?
      
      2. EXTRACT & VERIFY:
         - Status: Must be 'Successful', 'Completed', or 'Paid'.
         - Amount: Must match roughly ${expectedAmount}.
         - Payee: Must closely match ${expectedVpa}.
         - UTR/Ref ID: Extract the 12-digit number.
         - Date: Must be RECENT (within last 24 hours). Future dates are FAKE.

      3. FAKE INDICATORS (Fail if ANY are true):
         - "Prank" or "Demo" text visible.
         - Mismatched fonts/colors.
         - Blurry text on clean background.
      
      Return JSON:
      {
        "isSuccessful": boolean,
        "utr": string (12 digits),
        "confidence": number (0.0 to 1.0),
        "isManipulated": boolean,
        "isFakeApp": boolean,
        "reason": string (short user-friendly message, e.g. "Fake App Detected: Font inconsistency")
      }
    `;

        const result = await ai.models.generateContent({
            model: 'gemini-1.5-flash', // Standard reliable model
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isSuccessful: { type: Type.BOOLEAN },
                        utr: { type: Type.STRING },
                        confidence: { type: Type.NUMBER },
                        isManipulated: { type: Type.BOOLEAN },
                        isFakeApp: { type: Type.BOOLEAN },
                        reason: { type: Type.STRING },
                    }
                }
            }
        });

        const analysis = JSON.parse(result.text || '{}');

        // Security Logic
        if (analysis.isManipulated || analysis.isFakeApp) {
            return response.status(200).json({
                isValid: false,
                message: analysis.reason || "Security Alert: Fake payment app or edited screenshot detected.",
                extractedData: { utr: analysis.utr }
            });
        }

        if (analysis.isSuccessful && analysis.confidence > 0.85) {
            return response.status(200).json({
                isValid: true,
                message: "Payment verified successfully.",
                extractedData: {
                    utr: analysis.utr,
                    amount: expectedAmount,
                    status: 'SUCCESS'
                }
            });
        } else {
            return response.status(200).json({
                isValid: false,
                message: analysis.reason || "Verification failed. Please ensure the screenshot is clear and valid.",
                extractedData: { utr: analysis.utr }
            });
        }

    } catch (error) {
        console.error("AI Verify Error:", error);
        return response.status(500).json({
            isValid: false,
            message: "AI Verification service currently unavailable."
        });
    }
}
