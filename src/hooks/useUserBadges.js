import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { calculateBadges } from '../utils/badgeSystem';

export function useUserBadges(authorId) {
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authorId) {
            setLoading(false);
            return;
        }

        async function fetchBadgeData() {
            try {
                const { data: posts, error: postsError } = await supabase
                    .from('confessions')
                    .select('id, created_at, likes_count, comments_count')
                    .eq('author_id', authorId);

                if (postsError) throw postsError;

                if (!posts || posts.length === 0) {
                    setBadges([]);
                    return;
                }

                const postIds = posts.map(p => p.id);
                let events = [];
                
                if (postIds.length > 0) {
                    const { data: eventData, error: eventsError } = await supabase
                        .from('events')
                        .select('id, confession_id')
                        .in('confession_id', postIds);
                    
                    if (!eventsError) {
                        events = eventData;
                    }
                }

                const earnedBadges = calculateBadges(posts, events);
                setBadges(earnedBadges);

            } catch (err) {
                console.error('Error calculating badges:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchBadgeData();
    }, [authorId]);

    return { badges, loading };
}