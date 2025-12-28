import { runLiteAI } from './aiService';

export async function checkContentSafety(text) {
  if (!text || text.trim().length === 0)
    return { safe: false, reason: "Empty content" };

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  if (!API_KEY) {
    console.error("CRITICAL: VITE_GEMINI_API_KEY is missing in .env file.");
    return { safe: false, reason: "System configuration error." };
  }

  try {
    const prompt = `
        You are a Zero-Tolerance Safety System for a Malaysian adult website.
        
        INPUT TEXT: "${text}"

        INSTRUCTIONS:
        Analyze the text in this STRICT order. If any Step 1, 2, or 3 is violated, STOP and return "safe": false.
        
        STEP 1: CHECK FOR SOLICITATION (Buying/Selling Services)
        - Mentions "price", "rate", "money", "pay", "deposit"?
        - Asks to "PM" specifically for a deal?
        - Keywords: "PM price", "PM rate", "PM我", "私聊", "价钱", "约炮", "援交", "hookup rate".
        - EXAMPLE: "Want sex? PM price" -> ❌ UNSAFE.
        
        STEP 2: CHECK FOR HATE SPEECH & DOXXING
        - Racial slurs (Malaysian context: 'keling', 'babi' [racist context], 'sohai' [racist context]).
        - Real phone numbers/addresses.
        
        STEP 3: CHECK FOR NON-CONSENSUAL HARM
        - Rape, violence, self-harm.

        STEP 4: ALLOW CONSENSUAL ADULT CONTENT (If Steps 1-3 are CLEAN)
        - Relationship issues, finding a partner (no money), sexual confessions.
        - EXAMPLE: "I want sex" -> ✅ SAFE.
        - EXAMPLE: "My boss is a sohai" -> ✅ SAFE (Venting).

        OUTPUT JSON ONLY:
        { "safe": boolean, "reason": "Step X: Reason" }
    `;

    const result = await runLiteAI({
        apiKey: API_KEY,
        prompt: prompt,
        jsonMode: true
    });

    return result;

  } catch (error) {
    console.error("Gemini AI Error:", error);
    return {
      safe: false,
      reason: "AI_SERVICE_UNAVAILABLE",
    };
  }
}