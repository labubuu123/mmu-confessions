import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Heart, MapPin, Frown, Sparkles, AlertTriangle, X, Check } from 'lucide-react';
import ShareProfileButton from './ShareProfileButton';

export default function MatchmakerBrowse({ user }) {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reportTarget, setReportTarget] = useState(null);
    const [reportReason, setReportReason] = useState('');
    const [submittingReport, setSubmittingReport] = useState(false);

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
        setProfiles(prev => prev.map(p =>
            p.author_id === targetId
                ? { ...p, hasSentLove: true }
                : p
        ));

        try {
            const { error } = await supabase.rpc('handle_love_action', {
                target_user_id: targetId,
                action_type: 'love'
            });
            if (error) throw error;
        } catch (err) {
            console.error("Failed to send love:", err);
            setProfiles(prev => prev.map(p =>
                p.author_id === targetId
                    ? { ...p, hasSentLove: false }
                    : p
            ));
            alert("Failed to send love. Please try again.");
        }
    };

    const handleReportSubmit = async () => {
        if (!reportTarget || !reportReason.trim()) return;
        setSubmittingReport(true);

        const originalProfiles = [...profiles];
        setProfiles(prev => prev.filter(p => p.author_id !== reportTarget.id));

        try {
            const { error: reportError } = await supabase.from('matchmaker_reports').insert({
                reporter_id: user.id,
                reported_id: reportTarget.id,
                reason: reportReason,
                status: 'pending'
            });
            if (reportError) throw reportError;

            const { error: rejectError } = await supabase.rpc('handle_love_action', {
                target_user_id: reportTarget.id,
                action_type: 'reject'
            });
            if (rejectError) throw rejectError;

            setReportTarget(null);
            setReportReason('');
        } catch (err) {
            console.error("Report error:", err);
            setProfiles(originalProfiles);
            alert("Failed to report user. Please check your connection.");
        } finally {
            setSubmittingReport(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="relative">
                <div className="absolute -inset-4 bg-indigo-500/20 rounded-full blur-xl animate-pulse"></div>
                <Sparkles className="w-10 h-10 text-indigo-500 animate-bounce relative z-10" />
            </div>
            <p className="text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">Looking for matches...</p>
        </div>
    );

    return (
        <div className="relative min-h-screen w-full">
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] right-[-5%] w-72 h-72 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
                <div className="absolute top-[20%] left-[-10%] w-72 h-72 bg-pink-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
            </div>

            <div className="pb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {profiles.map(profile => (
                        <div key={profile.author_id} className="group relative bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 overflow-hidden transition-all duration-300 hover:-translate-y-2">
                            <div className="relative h-32 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-gray-800 dark:to-gray-700/50">
                                <div className="absolute top-4 right-4 transform scale-110 hover:scale-125 transition-transform">
                                    <ShareProfileButton profile={profile} />
                                </div>
                            </div>

                            <div className="px-6 pb-6 relative">
                                <div className="flex justify-center -mt-16 mb-4">
                                    <img
                                        src={`https://api.dicebear.com/9.x/notionists/svg?seed=${profile.avatar_seed}&backgroundColor=${profile.gender === 'male' ? 'e0e7ff' : 'fce7f3'}&brows=variant10&lips=variant05`}
                                        className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-lg bg-white dark:bg-gray-700"
                                        alt="Avatar"
                                    />
                                </div>

                                <div className="text-center mb-6">
                                    <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-1">{profile.nickname}, {profile.age}</h3>
                                    <div className="flex items-center justify-center gap-1 text-sm text-indigo-500 dark:text-indigo-400 font-medium">
                                        <MapPin className="w-4 h-4" /> {profile.city}
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-2xl border border-white/60 dark:border-gray-700">
                                        <h4 className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide mb-2">About Me</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{profile.self_intro}</p>
                                    </div>
                                    {profile.interests && profile.interests.length > 0 && (
                                        <div>
                                            <div className="flex flex-wrap justify-center gap-2">
                                                {profile.interests.slice(0, 5).map(i => (
                                                    <span key={i} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-full font-bold border border-indigo-100 dark:border-indigo-800/30">
                                                        {i}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => handleLove(profile.author_id)}
                                        disabled={profile.hasSentLove}
                                        className={`w-full py-4 font-bold rounded-2xl shadow-lg transition-all transform flex items-center justify-center gap-2 text-lg
                                            ${profile.hasSentLove
                                                ? 'bg-green-500 text-white cursor-default'
                                                : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:shadow-indigo-500/50 active:scale-95'
                                            }`}
                                    >
                                        {profile.hasSentLove ? (
                                            <>
                                                <Check className="w-6 h-6" />
                                                Love Sent
                                            </>
                                        ) : (
                                            <>
                                                <Heart className="w-6 h-6 fill-white/20" />
                                                Send Love
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => setReportTarget({ id: profile.author_id, name: profile.nickname })}
                                        className="w-full py-2 text-xs text-gray-400 dark:text-gray-500 font-medium hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                    >
                                        Report / Block User
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {reportTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-500" /> Report User
                                </h3>
                                <button onClick={() => setReportTarget(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                Reporting <strong>{reportTarget.name}</strong> will permanently remove them from your feed and alert the admins.
                            </p>
                            <textarea
                                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl mb-4 text-sm outline-none focus:ring-2 focus:ring-red-500"
                                rows={3}
                                placeholder="Reason (e.g. Harassment, Fake Profile)"
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                            />
                            <div className="flex gap-3">
                                <button onClick={() => setReportTarget(null)} className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-bold">Cancel</button>
                                <button
                                    onClick={handleReportSubmit}
                                    disabled={submittingReport || !reportReason.trim()}
                                    className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 disabled:opacity-50"
                                >
                                    {submittingReport ? 'Sending...' : 'Report & Block'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {profiles.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-full shadow-lg mb-6">
                            <Frown className="w-16 h-16 text-gray-300 dark:text-gray-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">No new profiles</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                            We couldn't find anyone new right now. Check back later!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}