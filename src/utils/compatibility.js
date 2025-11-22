export function calculateCompatibility(userA, userB) {
    if (!userA || !userB) return { score: 0, summary: "Calculating...", reasons: [] };

    let score = 0;
    let reasons = [];

    // --- 1. INTEREST MATCHING (Max 35 points) ---
    const interestsA = (userA.interests || []).map(i => i.toLowerCase());
    const interestsB = (userB.interests || []).map(i => i.toLowerCase());
    
    // Find shared interests (Case Insensitive)
    const sharedInterests = interestsA.filter(i => interestsB.includes(i));
    const count = sharedInterests.length;

    if (count > 0) {
        if (count === 1) score += 10;
        else if (count === 2) score += 20;
        else if (count === 3) score += 28;
        else score += 35; // Cap at 35

        reasons.push(`${count} Shared Interests`);
    }

    // --- 2. VIBE CHECK (Max 30 points) ---
    // Does A want "gym" and B mentions "gym"? (Whole word check only)
    
    const cleanText = (str) => (str || "").toLowerCase();
    const introA = cleanText(userA.self_intro);
    const lookingA = cleanText(userA.looking_for);
    const introB = cleanText(userB.self_intro);
    const lookingB = cleanText(userB.looking_for);

    // Keywords to scan for cross-matching
    const vibeKeywords = [
        "gym", "study", "gamer", "gaming", "movie", "music", "travel", 
        "food", "quiet", "chill", "party", "introvert", "extrovert", 
        "coding", "art", "nature", "hike", "coffee", "date",
        "cat", "dog", "relationship", "casual", "serious", "muslim", "christian"
    ];

    let vibeMatches = 0;

    vibeKeywords.forEach(word => {
        // \b ensures we match "art" but NOT "party"
        const regex = new RegExp(`\\b${word}\\b`, 'i');

        // Check: User A wants X, User B has X
        if (regex.test(lookingA) && regex.test(introB)) vibeMatches++;
        
        // Check: User B wants Y, User A has Y
        if (regex.test(lookingB) && regex.test(introA)) vibeMatches++;
    });

    if (vibeMatches > 0) {
        // 15 points per match, max 30
        score += Math.min(30, vibeMatches * 15);
        reasons.push("Vibe Check Passed");
    }

    // --- 3. LOCATION MATCH (Max 15 points) ---
    if (userA.city && userB.city) {
        const cityA = userA.city.trim().toLowerCase();
        const cityB = userB.city.trim().toLowerCase();
        
        if (cityA.includes(cityB) || cityB.includes(cityA)) {
            score += 15;
            if (score === 15) reasons.push("Same Location");
        }
    }

    // --- 4. AGE COMPATIBILITY (Max 15 points) ---
    const ageGap = Math.abs((userA.age || 18) - (userB.age || 18));
    if (ageGap === 0) score += 15;
    else if (ageGap <= 2) score += 10;
    else if (ageGap <= 4) score += 5;

    // --- 5. BASELINE & CLAMPING ---
    score += 5; // Base score
    score = Math.min(100, Math.max(10, score));

    // Generate Summary
    let summary = "";
    if (score >= 90) summary = "Soulmate Potential? 💍";
    else if (score >= 75) summary = "High Compatibility! 🔥";
    else if (score >= 50) summary = "Worth a shot! 😉";
    else if (score >= 30) summary = "Opposites attract? 🤷‍♂️";
    else summary = "Challenging Match 🧊";

    return { score, summary, reasons };
}