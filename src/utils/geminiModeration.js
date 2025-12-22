import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyAMdJAIELhWvsw4wu1PIbTl3TBT2yeVtW0";

const genAI = new GoogleGenerativeAI(API_KEY);

export async function checkContentSafety(text) {
    if (!text || text.trim().length === 0) return { safe: false, reason: "Empty content" };

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        You are a strict content moderator for an 18+ anonymous confession site.
        Analyze the following text.
        Allow: Adult themes, relationship issues, sexual confessions (consensual), venting.
        BLOCK Strict: Illegal acts, non-consensual content, CSAM (Child Sexual Abuse Material), selling drugs, violence, self-harm, doxxing (sharing real names/phone numbers).
        
        Text to analyze: "${text}"
        
        Respond ONLY with a JSON object: { "safe": boolean, "reason": "string (short explanation if unsafe)" }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();
        
        const jsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Gemini AI Error:", error);
        return { safe: true, reason: "AI Bypass (Error)" };
    }
}