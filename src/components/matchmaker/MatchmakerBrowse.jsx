import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Heart, MapPin, Frown } from 'lucide-react';
import ShareProfileButton from './ShareProfileButton';

export default function MatchmakerBrowse({ user }) {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_browse_profiles', {
                viewer_id: user.id
            });
            if (error) throw error;
            setProfiles(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProfiles(); }, []);

    const handleLove = async (targetId) => {
        setProfiles(prev => prev.filter(p => p.author_id !== targetId));
        await supabase.rpc('handle_love_action', {
            target_user_id: targetId,
            action_type: 'love'
        });
    };

    if (loading) return <div className="text-center text-indigo-500 dark:text-indigo-400 p-10 animate-pulse font-medium">Finding matches near you...</div>;

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles.map(profile => (
                    <div key={profile.author_id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                        <div className="bg-gradient-to-b from-indigo-50 to-white dark:from-gray-700 dark:to-gray-800 p-6 flex flex-col items-center relative">
                            <img
                                src={`https://api.dicebear.com/9.x/notionists/svg?seed=${profile.avatar_seed}&backgroundColor=${profile.gender === 'male' ? 'e0e7ff' : 'fce7f3'}&brows=variant10&lips=variant05`}
                                className="w-28 h-28 rounded-full border-4 border-white dark:border-gray-600 shadow-md mb-3 bg-white dark:bg-gray-700"
                                alt="Avatar"
                            />
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{profile.nickname}, {profile.age}</h3>
                            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-2">
                                <MapPin className="w-3 h-3" /> {profile.city}
                            </div>
                            <div className="absolute top-4 right-4">
                                <ShareProfileButton profile={profile} />
                            </div>
                        </div>

                        <div className="px-6 pb-6">
                            <div className="mb-4">
                                <h4 className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide mb-1">About Me</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">{profile.self_intro}</p>
                            </div>

                            <div className="mb-4">
                                <h4 className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide mb-1">Looking For</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">{profile.looking_for}</p>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-6">
                                {profile.interests && profile.interests.slice(0, 3).map(i => (
                                    <span key={i} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full font-medium">{i}</span>
                                ))}
                            </div>

                            <button
                                onClick={() => handleLove(profile.author_id)}
                                className="w-full py-3 bg-white dark:bg-gray-700 border-2 border-pink-500 dark:border-pink-600 text-pink-600 dark:text-pink-400 font-bold rounded-xl hover:bg-pink-500 hover:text-white dark:hover:bg-pink-600 dark:hover:text-white transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02] active:scale-95"
                            >
                                <Heart className="w-5 h-5" /> Send Love
                            </button>

                            <button className="mt-3 w-full text-xs text-gray-400 dark:text-gray-500 underline hover:text-gray-600 dark:hover:text-gray-300">Report User</button>
                        </div>
                    </div>
                ))}
            </div>

            {profiles.length === 0 && (
                <div className="text-center py-20 flex flex-col items-center">
                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                        <Frown className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No new profiles found.</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Check back later or edit your preferences.</p>
                </div>
            )}
        </div>
    );
}