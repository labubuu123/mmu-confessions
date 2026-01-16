export function calculateCompatibility(userA, userB) {
    if (!userA || !userB) return { score: 0, summary: "Calculating...", reasons: [] };

    let score = 0;
    let reasons = [];

    const interestsA = (userA.interests || []).map(i => i.toLowerCase());
    const interestsB = (userB.interests || []).map(i => i.toLowerCase());
    
    const sharedInterests = interestsA.filter(i => interestsB.includes(i));
    const count = sharedInterests.length;

    if (count > 0) {
        if (count === 1) score += 10;
        else if (count === 2) score += 20;
        else if (count === 3) score += 28;
        else score += 35;
        reasons.push(`${count} Shared Interests`);
    }

    const getElement = (sign) => {
        if (!sign) return null;
        if (["Aries ♈", "Leo ♌", "Sagittarius ♐"].includes(sign)) return "Fire";
        if (["Taurus ♉", "Virgo ♍", "Capricorn ♑"].includes(sign)) return "Earth";
        if (["Gemini ♊", "Libra ♎", "Aquarius ♒"].includes(sign)) return "Air";
        if (["Cancer ♋", "Scorpio ♏", "Pisces ♓"].includes(sign)) return "Water";
        return null;
    };

    const elementA = getElement(userA.zodiac);
    const elementB = getElement(userB.zodiac);

    if (elementA && elementB) {
        if (elementA === elementB) {
            score += 10;
            reasons.push(`${elementA} Signs Vibe`);
        }
        else if (
            (elementA === "Fire" && elementB === "Air") || (elementA === "Air" && elementB === "Fire") ||
            (elementA === "Water" && elementB === "Earth") || (elementA === "Earth" && elementB === "Water")
        ) {
            score += 8;
            reasons.push("Zodiac Chemistry");
        }
    }

    if (userA.mbti && userB.mbti) {
        if (userA.mbti[1] === userB.mbti[1]) {
            score += 10;
            reasons.push("Mental Connection");
        }
    }

    const cleanText = (str) => (str || "").toLowerCase();
    const introA = cleanText(userA.self_intro);
    const lookingA = cleanText(userA.looking_for);
    const introB = cleanText(userB.self_intro);
    const lookingB = cleanText(userB.looking_for);

    const vibeKeywords = [
        "gym", "study", "gamer", "gaming", "movie", "music", "travel",
        "food", "quiet", "chill", "party", "introvert", "extrovert",
        "coding", "art", "nature", "hike", "coffee", "date",
        "cat", "dog", "relationship", "casual", "serious", "muslim", "christian"
    ];

    let vibeMatches = 0;
    vibeKeywords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(lookingA) && regex.test(introB)) vibeMatches++;
        if (regex.test(lookingB) && regex.test(introA)) vibeMatches++;
    });

    if (vibeMatches > 0) {
        score += Math.min(25, vibeMatches * 15);
        reasons.push("Vibe Check Passed");
    }

    if (userA.city && userB.city) {
        const cityA = userA.city.trim().toLowerCase();
        const cityB = userB.city.trim().toLowerCase();
        if (cityA.includes(cityB) || cityB.includes(cityA)) {
            score += 10;
            if (score < 30) reasons.push("Same Location");
        }
    }

    const ageGap = Math.abs((userA.age || 18) - (userB.age || 18));
    if (ageGap <= 2) score += 5;

    score += 5;
    score = Math.min(100, Math.max(10, score));

    let summary = "";
    if (score >= 90) summary = "Soulmate Potential? 💍";
    else if (score >= 75) summary = "High Compatibility! 🔥";
    else if (score >= 50) summary = "Worth a shot! 😉";
    else if (score >= 30) summary = "Opposites attract? 🤷‍♂️";
    else summary = "Challenging Match 🧊";

    return { score, summary, reasons };
}