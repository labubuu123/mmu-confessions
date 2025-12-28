import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export async function checkContentSafety(text) {
  if (!text || text.trim().length === 0)
    return { safe: false, reason: "Empty content" };

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  if (!API_KEY) {
    console.error("CRITICAL: VITE_GEMINI_API_KEY is missing in .env file.");
    return { safe: false, reason: "System configuration error." };
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    const prompt = `
        You are a Zero-Tolerance Safety System for a Malaysian adult website.
        
        INPUT TEXT: "${text}"

        INSTRUCTIONS:
        Analyze the text in this STRICT order. If any Step 1, 2, or 3 is violated, STOP and return "safe": false.
        
        STEP 1: CHECK FOR SOLICITATION (The content implies buying/selling services)
        - Does it mention "price", "rate", "money", "pay", "deposit"?
        - Does it ask to "PM" (Private Message) specifically for details/deal?
        - Keywords to BLOCK: "PM price", "PM rate", "PM我", "私聊", "价钱", "约炮", "援交", "hookup rate".
        - EXAMPLE: "Want sex? PM price" -> ❌ UNSAFE (Solicitation).
        - EXAMPLE: "Looking for sugar baby" -> ❌ UNSAFE (Solicitation).
        
        STEP 2: CHECK FOR HATE SPEECH & DOXXING
        - Any racial slurs (Malaysian context: 'keling', 'babi' [targeted at race], 'sohai' [targeted at race]).
        - Real phone numbers or addresses.
        
        STEP 3: CHECK FOR NON-CONSENSUAL HARM
        - Rape, violence, self-harm, suicide.

        STEP 4: ALLOW CONSENSUAL ADULT CONTENT (Only if Steps 1-3 are CLEAN)
        - General relationship issues, finding a partner (without money), or sexual confessions.
        - EXAMPLE: "I want sex" -> ✅ SAFE (No money mentioned).
        - EXAMPLE: "My boss is a sohai" -> ✅ SAFE (Venting, not racist).
        
        FINAL DECISION RULES:
        - If "PM" AND "Sex/Price" are in the same context -> BLOCK.
        - If "Price/Money" is involved with "Sex/Date" -> BLOCK.

        OUTPUT JSON ONLY:
        { "safe": boolean, "reason": "Explain which Step failed (e.g. 'Step 1: Solicitation detected')" }
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      safetySettings: safetySettings,
    });

    const response = await result.response;
    const textResponse = response.text();
    const cleanJson = textResponse.replace(/```json|```/g, '').trim();
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error("Invalid JSON from AI");

    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    console.error("Gemini AI Error:", error);
    return {
      safe: false,
      reason: "AI_SERVICE_UNAVAILABLE",
    };
  }
}