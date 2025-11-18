import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Loader2, Heart, Check, Frown } from 'lucide-react';
import MatchmakerFilter from './MatchmakerFilter';
import MatchmakerProfileCard from './MatchmakerProfileCard';
import MatchmakerProfileModal from './MatchmakerProfileModal';

export default function MatchmakerWall({ user, settings }) {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [filters, setFilters] = useState({});
    const [myLikes, setMyLikes] = useState(new Set());
    const [likeStatus, setLikeStatus] = useState({});
    const [dailyLikeCount, setDailyLikeCount] = useState(0);

    const dailyLikeLimit = parseInt(settings.daily_like_limit || '20', 10);

    const fetchProfiles = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('matchmaker_profiles')
                .select('*')
                .eq('status', 'approved')
                .eq('is_visible', true)
                .neq('author_id', user.id);

            if (filters.gender && filters.gender !== 'all') {
                query = query.eq('gender', filters.gender);
            }
            if (filters.age_range && filters.age_range !== 'all') {
                if (filters.age_range === '18-22') query = query.gte('age', 18).lte('age', 22);
                if (filters.age_range === '23-27') query = query.gte('age', 23).lte('age', 27);
                if (filters.age_range === '28+') query = query.gte('age', 28);
            }
            if (filters.city) {
                query = query.ilike('city', `%${filters.city}%`);
            }
            if (filters.keyword) {
                query = query.or(`nickname.ilike.%${filters.keyword}%,self_intro.ilike.%${filters.keyword}%,interests.cs.{${filters.keyword}}`);
            }

            const { data, error: dbError } = await query.order('created_at', { ascending: false });
            if (dbError) throw dbError;

            setProfiles(data);
        } catch (error) {
            console.error('Error fetching profiles:', error.message);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [user, filters]);

    const fetchLikes = useCallback(async () => {
        const { data: likesData, error: likesError } = await supabase
            .from('matchmaker_likes')
            .select('to_user_id')
            .eq('from_user_id', user.id);
        if (likesData) {
            setMyLikes(new Set(likesData.map((l) => l.to_user_id)));
        }

        const today = new Date().toISOString().slice(0, 10);
        const { count, error: countError } = await supabase
            .from('matchmaker_user_actions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('action_type', 'like')
            .gte('created_at', `${today}T00:00:00.000Z`);

        if (countError) console.error("Error fetching like count:", countError);
        setDailyLikeCount(count || 0);

    }, [user]);

    useEffect(() => {
        fetchProfiles();
        fetchLikes();
    }, [user, filters, fetchProfiles, fetchLikes]);

    const handleLike = async (toUserId) => {
        if (dailyLikeCount >= dailyLikeLimit) {
            alert(`You have reached your daily limit of ${dailyLikeLimit} likes.`);
            return;
        }

        setLikeStatus((prev) => ({ ...prev, [toUserId]: 'loading' }));
        try {
            const { error: likeError } = await supabase
                .from('matchmaker_likes')
                .insert({ from_user_id: user.id, to_user_id: toUserId });
            if (likeError) throw likeError;

            const { error: actionError } = await supabase
                .from('matchmaker_user_actions')
                .insert({ user_id: user.id, action_type: 'like' });
            if (actionError) throw actionError;

            setDailyLikeCount(c => c + 1);

            const { data: matchId, error: rpcError } = await supabase.rpc(
                'check_and_create_match',
                { user1_id_in: user.id, user2_id_in: toUserId }
            );
            if (rpcError) throw rpcError;

            if (matchId) {
                alert('It\'s a match! You can now chat with this user in your "Matches" tab.');
            }

            setMyLikes((prev) => new Set(prev).add(toUserId));
            setLikeStatus((prev) => ({ ...prev, [toUserId]: 'liked' }));
        } catch (error) {
            console.error('Error liking profile:', error.message);
            setLikeStatus((prev) => ({ ...prev, [toUserId]: 'error' }));
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-10">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (error) {
        return <div className="text-center p-10 text-red-500">Error: {error}</div>;
    }

    return (
        <div>
            <MatchmakerFilter onFilterChange={setFilters} />

            <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                Daily Likes: {dailyLikeCount} / {dailyLikeLimit}
            </div>

            {profiles.length === 0 ? (
                <div className="text-center p-10 text-gray-500 dark:text-gray-400">
                    <Frown className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold">No Profiles Found</h3>
                    <p>Try adjusting your filters or check back later!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {profiles.map((profile) => (
                        <MatchmakerProfileCard
                            key={profile.id}
                            profile={profile}
                            onView={setSelectedProfile}
                            onLike={handleLike}
                            isLiked={myLikes.has(profile.author_id) || likeStatus[profile.author_id] === 'liked'}
                        />
                    ))}
                </div>
            )}

            {selectedProfile && (
                <MatchmakerProfileModal
                    profile={selectedProfile}
                    onClose={() => setSelectedProfile(null)}
                />
            )}
        </div>
    );
}