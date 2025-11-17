export const BADGE_DEFINITIONS = [
    {
        id: "first_post",
        name: "First Steps",
        icon: "🎉",
        description: "Posted first confession",
        tier: "bronze",
    },
    {
        id: "prolific",
        name: "Prolific Writer",
        icon: "✍️",
        description: "10 confessions posted",
        tier: "silver",
        requirement: { posts: 10 },
    },
    {
        id: "viral",
        name: "Viral Star",
        icon: "🌟",
        description: "Got 50+ reactions on a post",
        tier: "gold",
        requirement: { max_post_reactions: 50 },
    },
    {
        id: "supportive",
        name: "Supportive Friend",
        icon: "🤝",
        description: "Made 20 comments",
        tier: "silver",
        requirement: { comments: 20 },
    },
    {
        id: "popular",
        name: "Community Favorite",
        icon: "❤️",
        description: "Received 100+ total reactions",
        tier: "gold",
        requirement: { total_reactions: 100 },
    },
    {
        id: "streak_7",
        name: "Weekly Warrior",
        icon: "🔥",
        description: "7 day posting streak",
        tier: "silver",
        requirement: { streak: 7 },
    },
    {
        id: "helpful",
        name: "Helper",
        icon: "💡",
        description: "Comments received 50+ reactions",
        tier: "gold",
        requirement: { comment_reactions: 50 },
    },
    {
        id: "influencer",
        name: "Influencer",
        icon: "👑",
        description: "25 posts with 1000+ total reactions",
        tier: "platinum",
        requirement: { posts: 25, total_reactions: 1000 },
    },
    {
        id: "discussion_starter",
        name: "Discussion Starter",
        icon: "💬",
        description: "Posts received 100+ comments",
        tier: "gold",
        requirement: { total_post_comments: 100 },
    },
    {
        id: "early_bird",
        name: "Early Bird",
        icon: "🌅",
        description: "Active in first 100 users",
        tier: "legendary",
        requirement: { early_adopter: true },
    },
    {
        id: "consistent",
        name: "Consistent Contributor",
        icon: "📅",
        description: "Posted for 30 days",
        tier: "gold",
        requirement: { streak: 30 },
    },
    {
        id: "superhero",
        name: "Community Hero",
        icon: "🦸",
        description: "Helped 50+ people with comments",
        tier: "platinum",
        requirement: { helpful_comments: 50 },
    },
];

/**
 * Calculate which badges a user has earned based on their stats
 * @param {Object} userStats - User statistics object
 * @returns {Array} - Array of earned badge objects
 */
export function calculateUserBadges(userStats) {
    const earnedBadges = [];

    if (!userStats) return earnedBadges;

    BADGE_DEFINITIONS.forEach((badge) => {
        let earned = false;

        if (!badge.requirement) {
            if (badge.id === "first_post") {
                earned = userStats.posts >= 1;
            }
        } else {
            earned = true;
            Object.entries(badge.requirement).forEach(([key, value]) => {
                const userValue = userStats[key];

                if (userValue === undefined || userValue === null) {
                    earned = false;
                    return;
                }

                if (typeof value === 'boolean') {
                    if (userValue !== value) earned = false;
                } else if (typeof value === 'number') {
                    if (userValue < value) earned = false;
                }
            });
        }

        if (earned) {
            earnedBadges.push(badge);
        }
    });

    return earnedBadges;
}

/**
 * Get progress towards a specific badge
 * @param {string} badgeId - Badge identifier
 * @param {Object} userStats - User statistics
 * @returns {Object} - Progress information {current, required, percentage, earned}
 */
export function getBadgeProgress(badgeId, userStats) {
    const badge = BADGE_DEFINITIONS.find(b => b.id === badgeId);

    if (!badge) return null;

    if (!badge.requirement) {
        return {
            earned: userStats.posts >= 1,
            percentage: userStats.posts >= 1 ? 100 : 0
        };
    }

    let totalProgress = 0;
    let requirementCount = 0;
    let allRequirementsMet = true;

    Object.entries(badge.requirement).forEach(([key, required]) => {
        requirementCount++;
        const current = userStats[key] || 0;

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
    const earnedBadges = calculateUserBadges(userStats);
    const earnedIds = new Set(earnedBadges.map(b => b.id));

    const unearnedWithProgress = BADGE_DEFINITIONS
        .filter(badge => !earnedIds.has(badge.id))
        .map(badge => ({
            ...badge,
            progress: getBadgeProgress(badge.id, userStats)
        }))
        .sort((a, b) => b.progress.percentage - a.progress.percentage);

    return unearnedWithProgress[0] || null;
}