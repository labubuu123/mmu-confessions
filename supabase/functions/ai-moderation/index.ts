import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MEME_TEMPLATES = [
    { id: 'fine', name: 'This is Fine' },
    { id: 'drake', name: 'Drake Hotline Bling' },
    { id: 'disastergirl', name: 'Disaster Girl' },
    { id: 'success', name: 'Success Kid' },
    { id: 'mw', name: 'Mind Blown' },
    { id: 'wonka', name: 'Condescending Wonka' },
    { id: 'pooh', name: 'Tuxedo Pooh' },
    { id: 'pigeon', name: 'Is this a pigeon?' },
    { id: 'mocking', name: 'Mocking Spongebob' },
    { id: 'toy', name: 'Toy Story Everywhere' }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, action = 'safety', mode } = await req.json()
    if (!text) throw new Error("No text provided")

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY")

    const genAI = new GoogleGenerativeAI(apiKey)
    
    const modelName = (action === 'safety' || action === 'rewrite') ? "gemini-2.5-flash-lite" : "gemini-2.5-flash"
    const model = genAI.getGenerativeModel({ model: modelName })

    let prompt = ""

    switch (action) {
        case 'safety':
            prompt = `
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
            `
            break;

        case 'viral':
            prompt = `
                Analyze this confession text intended for a university student page: "${text.substring(0, 1000)}"
                Predict its "Virality Score" from 0 to 100 based on humor, relatability, drama, or shock value.
                Provide 3 short, punchy tips to make it spicier or get more engagement.
                Output ONLY JSON: { "score": number, "tips": ["string", "string", "string"] }
            `
            break;

        case 'meme':
            const templateIds = MEME_TEMPLATES.map(t => t.id).join(', ')
            prompt = `
                Analyze this confession: "${text.substring(0, 500)}".
                Choose the best meme template ID from this list: [${templateIds}].
                Generate a short, funny TOP text and BOTTOM text for the meme based on the confession.
                Output ONLY JSON: { "template_id": "string", "top": "string", "bottom": "string" }
            `
            break;

        case 'rewrite':
            let style = "polish"
            if (mode === 'funny') style = "humorous and witty"
            else if (mode === 'dramatic') style = "dramatic, intense, and soap-opera style"
            else if (mode === 'poetic') style = "beautiful, poetic style"
            else if (mode === 'anonymize') style = "neutral to remove identifying writing styles"
            
            prompt = `Rewrite the following text to be ${style}. Output ONLY the rewritten text: "${text}"`
            break;

        default:
            throw new Error("Invalid action")
    }

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    const cleanText = responseText.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim()
    
    let jsonData
    if (action === 'rewrite') {
        jsonData = { text: cleanText }
    } else {
        jsonData = JSON.parse(cleanText)
    }

    return new Response(JSON.stringify(jsonData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("Error:", error.message)
    return new Response(JSON.stringify({ safe: false, reason: "Server Error: " + error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})