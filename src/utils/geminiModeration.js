import { GoogleGenerativeAI } from "@google/generative-ai";

const BANNED_KEYWORDS = [
    "rape",
    "child porn",
    "cp",
    "kill yourself",
    "suicide",
    "shabu",
    "dadah",
    "pukimak",
    "lancau",
    "sohai",
    "keling",
    "nigger",
    "faggot",
    "selling nudes",
    "selling body",
    "service available",
];

export async function checkContentSafety(text) {
if (!text || text.trim().length === 0)
    return { safe: false, reason: "Empty content" };

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  if (!API_KEY) {
    console.error("CRITICAL: VITE_GEMINI_API_KEY is missing in .env file.");
    return {
      safe: false,
      reason: "System configuration error. Moderation service is unavailable.",
    };
  }

  const lowerContent = text.toLowerCase();
  for (const word of BANNED_KEYWORDS) {
    if (lowerContent.includes(word)) {
      return {
        safe: false,
        reason: "Content contains prohibited keywords (Zero Tolerance Policy).",
      };
    }
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
        You are a strict content moderator for an 18+ anonymous confession site in Malaysia.
        Analyze the following text: "${text}"

        RULES:
        1. ALLOW: Adult themes, relationship issues, sexual confessions (consensual), venting, casual swearing (e.g. 'wtf', 'shit').
        2. BLOCK (Strict): 
           - Non-consensual sexual content (rape, sexual assault).
           - Hate speech (Race, Religion, Royalty - 3R).
           - Self-harm or suicide encouragement.
           - Doxxing (real names, phone numbers, addresses).
           - Solicitation (selling drugs, selling sex/nudes).
           - Child Sexual Abuse Material (CSAM).

        Respond ONLY with a valid JSON object. Do not include markdown formatting (like \`\`\`json).
        Format: { "safe": boolean, "reason": "string (short explanation if unsafe)" }
        `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();

    const jsonString = textResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const analysis = JSON.parse(jsonString);
    return analysis;
  } catch (error) {
    console.error("Gemini AI Error:", error);

    return {
      safe: false,
      reason: "Moderation check failed. Please try again later.",
    };
  }
}
