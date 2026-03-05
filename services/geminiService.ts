import { GoogleGenAI, Type } from "@google/genai";
import { VerificationResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

export const analyzePaymentScreenshot = async (base64Image: string, expectedAmount: string, expectedVpa: string): Promise<VerificationResult> => {
  try {
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

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
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

    const result = JSON.parse(response.text || '{}');

    // Stricter logic for ShopC2C Security
    if (result.isManipulated || result.isFakeApp) {
      return {
        isValid: false,
        message: result.reason || "Security Alert: Fake payment app or edited screenshot detected."
      };
    }

    if (result.isSuccessful && result.confidence > 0.85) {
      return {
        isValid: true,
        message: "Payment verified successfully.",
        extractedData: {
          utr: result.utr,
          amount: expectedAmount,
          status: 'SUCCESS'
        }
      };
    } else {
      return {
        isValid: false,
        message: result.reason || "Verification failed. Please ensure the screenshot is clear and valid.",
        extractedData: {
          utr: result.utr
        }
      };
    }

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      isValid: false,
      message: "AI service temporary unavailable. Please use manual UTR verification.",
    };
  }
};