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

export function calculateUserBadges(userStats) {
    const earnedBadges = [];

    BADGE_DEFINITIONS.forEach((badge) => {
        let earned = true;

        if (badge.requirement) {
            Object.entries(badge.requirement).forEach(([key, value]) => {
                if (!userStats[key] || userStats[key] < value) {
                    earned = false;
                }
            });
        } else if (badge.id === "first_post") {
            earned = userStats.posts >= 1;
        }

        if (earned) {
            earnedBadges.push(badge);
        }
    });

    return earnedBadges;
}
