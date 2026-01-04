import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text } = await req.json()
    if (!text) throw new Error("No text provided")

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY")

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" })

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
    `

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    const cleanText = responseText.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim()
    const jsonData = JSON.parse(cleanText)

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