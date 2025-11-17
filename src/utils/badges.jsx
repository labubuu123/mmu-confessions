export const BADGE_DEFINITIONS = [
    {
        id: "first_post",
        name: "First Steps",
        icon: "🎉",
        description: "Posted first confession",
        tier: "bronze",
        requirement: { post_count: 1 },
    },
    {
        id: "prolific",
        name: "Prolific Writer",
        icon: "✍️",
        description: "10 confessions posted",
        tier: "silver",
        requirement: { post_count: 10 },
    },
    {
        id: "supportive",
        name: "Supportive Friend",
        icon: "🤝",
        description: "Made 20 comments",
        tier: "silver",
        requirement: { comment_count: 20 },
    },
    {
        id: "popular",
        name: "Community Favorite",
        icon: "❤️",
        description: "Received 100+ total reactions",
        tier: "gold",
        requirement: { total_reactions: 100 },
    },
];

/**
 * Get all badges a user has earned
 * @param {Object} userStats - User statistics from 'user_reputation' table
 * @returns {Array} - List of earned badge objects
 */
export function calculateUserBadges(userStats) {
    if (!userStats) return [];

    const augmentedStats = {
        ...userStats,
        total_reactions: (userStats.post_reactions_received_count || 0) + (userStats.comment_reactions_received_count || 0)
    };

    const earnedBadges = [];

    for (const badge of BADGE_DEFINITIONS) {
        if (!badge.requirement) continue;

        let hasEarned = true;
        for (const [key, required] of Object.entries(badge.requirement)) {

            const current = augmentedStats[key] || 0;

            if (typeof required === 'number' && current < required) {
                hasEarned = false;
                break;
            }
            if (typeof required === 'boolean' && current !== required) {
                hasEarned = false;
                break;
            }
        }

        if (hasEarned) {
            earnedBadges.push(badge);
        }
    }
    return earnedBadges;
}

/**
 * Get progress for a specific badge
 * @param {string} badgeId - The ID of the badge
 * @param {Object} userStats - User statistics
 * @returns {Object} - Progress info { earned, percentage, requirements }
 */
export function getBadgeProgress(badgeId, userStats) {
    const badge = BADGE_DEFINITIONS.find(b => b.id === badgeId);
    if (!badge) return { earned: false, percentage: 0 };
    if (!badge.requirement) return { earned: false, percentage: 0 };

    const augmentedStats = {
        ...userStats,
        total_reactions: (userStats.post_reactions_received_count || 0) + (userStats.comment_reactions_received_count || 0)
    };

    let totalProgress = 0;
    let requirementCount = 0;
    let allRequirementsMet = true;

    Object.entries(badge.requirement).forEach(([key, required]) => {
        requirementCount++;
        const current = augmentedStats[key] || 0;

        if (typeof required === 'number') {
            const progress = Math.min((current / required) * 100, 100);
            totalProgress += progress;
            if (current < required) allRequirementsMet = false;
        } else if (typeof required === 'boolean') {
            if (current === required) {
                totalProgress += 100;
            } else {
                allRequirementsMet = false;
            }
        }
    });

    return {
        earned: allRequirementsMet,
        percentage: requirementCount > 0 ? totalProgress / requirementCount : 0,
        requirements: badge.requirement
    };
}

/**
 * Get next badge user should aim for
 * @param {Object} userStats - User statistics
 * @returns {Object} - Next badge and progress info
 */
export function getNextBadge(userStats) {
    if (!userStats) return null;

    const earnedBadges = calculateUserBadges(userStats);
    const earnedIds = new Set(earnedBadges.map(b => b.id));

    const unearnedWithProgress = BADGE_DEFINITIONS
        .filter(badge => !earnedIds.has(badge.id))
        .map(badge => ({
            ...badge,
            progress: getBadgeProgress(badge.id, userStats)
        }))
        .sort((a, b) => b.progress.percentage - a.progress.percentage);

    return unearnedWithProgress.length > 0 ? unearnedWithProgress[0] : null;
}