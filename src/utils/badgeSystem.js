export const BADGES = [
    {
        id: 'early_bird',
        label: 'Early Bird',
        icon: '🌅',
        description: 'Posted between 6 AM - 9 AM',
        criteria: (posts, events) => {
            return posts.some(post => {
                const hour = new Date(post.created_at).getHours();
                return hour >= 6 && hour < 9;
            });
        }
    },
    {
        id: 'night_owl',
        label: 'Night Owl',
        icon: '🦉',
        description: 'Posted between 2 AM - 5 AM',
        criteria: (posts, events) => {
            return posts.some(post => {
                const hour = new Date(post.created_at).getHours();
                return hour >= 2 && hour < 5;
            });
        }
    },
    {
        id: 'influencer',
        label: 'Influencer',
        icon: '💎',
        description: 'Has a post with over 100 likes',
        criteria: (posts, events) => {
            return posts.some(post => (post.likes_count || 0) > 100);
        }
    },
    {
        id: 'town_crier',
        label: 'Town Crier',
        icon: '📢',
        description: 'Posted 5+ events',
        criteria: (posts, events) => {
            return events.length >= 5;
        }
    },
    {
        id: 'conversation_starter',
        label: 'Chatterbox',
        icon: '💭',
        description: 'Has a post with over 50 comments',
        criteria: (posts, events) => {
            return posts.some(post => (post.comments_count || 0) > 50);
        }
    }
];

export function calculateBadges(posts = [], events = []) {
    return BADGES.filter(badge => badge.criteria(posts, events));
}