export const BADGES = [
    {
        id: 'early_bird',
        label: 'Early Bird',
        icon: '🌅',
        description: 'Posted between 6 AM - 9 AM',
        criteria: (posts) => posts.some(post => new Date(post.created_at).getHours() >= 6 && new Date(post.created_at).getHours() < 9)
    },
    {
        id: 'night_owl',
        label: 'Night Owl',
        icon: '🦉',
        description: 'Posted between 2 AM - 5 AM',
        criteria: (posts) => posts.some(post => new Date(post.created_at).getHours() >= 2 && new Date(post.created_at).getHours() < 5)
    },
    {
        id: 'influencer',
        label: 'Influencer',
        icon: '💎',
        description: 'Has a post with over 100 likes',
        criteria: (posts) => posts.some(post => (post.likes_count || 0) > 100)
    },

    {
        id: 'karma_millionaire',
        label: 'High Roller',
        icon: '🤑',
        description: 'Earned over 1,000 Karma Points',
        criteria: (posts, events, profile) => (profile?.karma_points || 0) >= 1000
    },
    {
        id: 'dedication_streak',
        label: 'Dedicated',
        icon: '🔥',
        description: 'Achieved a 7-day login streak',
        criteria: (posts, events, profile) => (profile?.highest_streak || 0) >= 7
    }
];

export function calculateBadges(posts = [], events = [], profile = null) {
    return BADGES.filter(badge => badge.criteria(posts, events, profile));
}