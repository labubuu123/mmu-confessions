import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Heart, MapPin, Frown, Sparkles } from 'lucide-react';
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
        // Optimistic UI update
        setProfiles(prev => prev.filter(p => p.author_id !== targetId));
        await supabase.rpc('handle_love_action', {
            target_user_id: targetId,
            action_type: 'love'
        });
    };

    const handleReport = async (targetId, nickname) => {
        const reason = window.prompt(`Why are you reporting ${nickname}? (e.g., Fake Profile, Harassment)`);
        if (!reason) return;

        setProfiles(prev => prev.filter(p => p.author_id !== targetId));

        try {
            const { error } = await supabase.from('matchmaker_reports').insert({
                reporter_id: user.id,
                reported_id: targetId,
                reason: reason,
                status: 'pending'
            });
            if (error) throw error;
            alert(`User ${nickname} has been reported.`);
        } catch (err) {
            console.error('Report error:', err);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="relative">
                <div className="absolute -inset-4 bg-indigo-500/20 rounded-full blur-xl animate-pulse"></div>
                <Sparkles className="w-10 h-10 text-indigo-500 animate-bounce relative z-10" />
            </div>
            <p className="text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">Looking for your soulmate...</p>
        </div>
    );

    return (
        <div className="relative min-h-screen w-full">
            {/* Romantic Background Blobs (Matches Welcome Page) */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] right-[-5%] w-72 h-72 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
                <div className="absolute top-[20%] left-[-10%] w-72 h-72 bg-pink-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
            </div>

            <div className="pb-20"> {/* Padding for bottom scrolling */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {profiles.map(profile => (
                        <div key={profile.author_id} className="group relative bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 overflow-hidden transition-all duration-300 hover:-translate-y-2">
                            
                            {/* Card Header / Avatar Area */}
                            <div className="relative h-32 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-gray-800 dark:to-gray-700/50">
                                <div className="absolute top-4 right-4 transform scale-125">
                                    {/* Slightly enlarged Share button as requested for icons */}
                                    <ShareProfileButton profile={profile} />
                                </div>
                            </div>

                            <div className="px-6 pb-6 relative">
                                {/* Avatar - Centered and overlapping the header */}
                                <div className="flex justify-center -mt-16 mb-4">
                                    <img
                                        src={`https://api.dicebear.com/9.x/notionists/svg?seed=${profile.avatar_seed}&backgroundColor=${profile.gender === 'male' ? 'e0e7ff' : 'fce7f3'}&brows=variant10&lips=variant05`}
                                        className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-lg bg-white dark:bg-gray-700"
                                        alt="Avatar"
                                    />
                                </div>

                                {/* Name & Details */}
                                <div className="text-center mb-6">
                                    <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-1">{profile.nickname}, {profile.age}</h3>
                                    <div className="flex items-center justify-center gap-1 text-sm text-indigo-500 dark:text-indigo-400 font-medium">
                                        <MapPin className="w-4 h-4" /> {profile.city}
                                    </div>
                                </div>

                                {/* Content Sections */}
                                <div className="space-y-4 mb-8">
                                    <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-2xl border border-white/60 dark:border-gray-700">
                                        <h4 className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide mb-2">About Me</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{profile.self_intro}</p>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide mb-2 px-1">Interests</h4>
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {profile.interests && profile.interests.slice(0, 4).map(i => (
                                                <span key={i} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-full font-bold border border-indigo-100 dark:border-indigo-800/30">
                                                    {i}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions - Mobile optimized: Big Buttons */}
                                <div className="space-y-3">
                                    <button
                                        onClick={() => handleLove(profile.author_id)}
                                        className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all transform active:scale-95 flex items-center justify-center gap-2 text-lg"
                                    >
                                        <Heart className="w-6 h-6 fill-white/20" /> 
                                        Send Love
                                    </button>

                                    <button
                                        onClick={() => handleReport(profile.author_id, profile.nickname)}
                                        className="w-full py-2 text-xs text-gray-400 dark:text-gray-500 font-medium hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        Report / Block User
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {profiles.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-full shadow-lg mb-6">
                            <Frown className="w-16 h-16 text-gray-300 dark:text-gray-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">No new profiles nearby</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                            We couldn't find anyone new right now. Adjust your filters or check back later!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}