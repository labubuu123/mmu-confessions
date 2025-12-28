import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_SMART = "gemini-2.5-flash";
const MODEL_LITE = "gemini-2.5-flash-lite";

const cleanResponseText = (text) => {
    return text.trim()
        .replace(/^```json\s*/, '')
        .replace(/^```\s*/, '')
        .replace(/```$/, '')
        .trim();
};

async function executeGeminiCall(apiKey, modelName, prompt, systemInstruction, jsonMode) {
    if (!apiKey) throw new Error("Missing API Key");
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return jsonMode ? JSON.parse(cleanResponseText(text)) : text;
}

export async function runLiteAI({ apiKey, prompt, systemInstruction = null, jsonMode = false }) {
    console.log(`🤖 AI Service: Running Lite Mode (${MODEL_LITE})...`);
    try {
        return await executeGeminiCall(apiKey, MODEL_LITE, prompt, systemInstruction, jsonMode);
    } catch (error) {
        console.error(`❌ Lite Model Failed:`, error.message);
        throw error;
    }
}

export async function runSmartAI({ apiKey, prompt, systemInstruction = null, jsonMode = false }) {
    try {
        console.log(`🧠 AI Service: Attempting Smart Mode (${MODEL_SMART})...`);
        return await executeGeminiCall(apiKey, MODEL_SMART, prompt, systemInstruction, jsonMode);
    } catch (primaryError) {
        console.warn(`⚠️ Smart Model Failed (${primaryError.message}). Switching to Backup...`);
        
        try {
            console.log(`🛡️ AI Service: Fallback to Lite Mode (${MODEL_LITE})...`);
            return await executeGeminiCall(apiKey, MODEL_LITE, prompt, systemInstruction, jsonMode);
        } catch (backupError) {
            console.error("❌ All AI models failed.");
            throw backupError;
        }
    }
}