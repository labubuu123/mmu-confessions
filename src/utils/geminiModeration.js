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
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    const prompt = `
        You are a Universal Content Safety Classifier for a Malaysian confession site.
        
        INSTRUCTION:
        1. Auto-detect the language of the text (English, Malay, Chinese, Tamil, Hindi, or any other).
        2. Translate the context internally to understand the meaning.
        3. Apply the STRICT Malaysian context rules below.

        Analyze the text: "${text}"

        STRICT BLOCKING RULES (Return safe: false):
        1. Hate Speech / Racism:
           - Racial/Religious slurs in ANY language (e.g., 'keling', 'pariah', 'nigger', 'sohai', '黑鬼', '阿三').
           - Insulting any race, religion, or royalty (3R).
        2. Sexual Violence:
           - Non-consensual content, rape, child abuse (e.g., 'rape', 'rogol', '强奸').
        3. Solicitation (Buying/Selling):
           - Selling drugs (e.g., 'ice', 'bato', 'ganja', '冰毒').
           - Selling sex/nudes (e.g., 'selling nudes', 'hookup', '约炮').
        4. Severe Self-Harm:
           - Encouraging suicide.
        5. Doxxing:
           - Real names, phone numbers, addresses.

        ALLOW RULES (Return safe: true):
        1. Casual Conversation: Greetings, life updates in any language (e.g., 'Vanakkam', 'Ni Hao', 'Apa khabar').
        2. Adult Themes: Consensual relationship stories, sexual fantasies (ALLOWED if consensual).
        3. Venting/Swearing: Complaining about life using "bad words" is ALLOWED as long as it is NOT hate speech.
           - Examples of ALLOWED venting words: 'babi' (Malay), 'punda'/'otha' (Tamil), 'tmd'/'cibai' (Chinese), 'fuck' (English).
           - Context matters: "My boss is punda" is ALLOWED (Venting). "All Indians are punda" is BLOCKED (Hate Speech).

        RESPONSE FORMAT:
        Return valid JSON ONLY:
        { "safe": boolean, "reason": "Explanation (e.g. 'Tamil hate speech detected')" }
        `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      safetySettings: safetySettings,
    });

    const response = await result.response;
    const textResponse = response.text();
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error("Invalid JSON from AI");

    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    console.error("Gemini AI Error:", error);
    return {
      safe: false,
      reason: "AI moderation unavailable. Please try again later.",
    };
  }
}