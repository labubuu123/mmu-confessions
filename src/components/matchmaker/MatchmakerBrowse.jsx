import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Heart, MapPin, Frown, Sparkles, AlertTriangle, X, Check, Filter, User, Search, Hash } from 'lucide-react';
import ShareProfileButton from './ShareProfileButton';

const AvatarGenerator = ({ nickname, gender }) => {
    const seed = useMemo(() => {
        const str = (nickname || 'User') + gender;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash);
    }, [nickname, gender]);

    const pick = (options, offset = 0) => options[(seed + offset) % options.length];
    const skinColors = ['#f3d2c1', '#f5e0d7', '#e6c3b3', '#ffdfc4', '#dbb298'];
    const bgColors = gender === 'male' ? ['#e0e7ff', '#dbeafe', '#ccfbf1', '#f3f4f6'] : ['#fce7f3', '#ffe4e6', '#fef3c7', '#fae8ff'];
    const skin = pick(skinColors);
    const bg = pick(bgColors, 1);
    const eyesVariant = seed % 3;
    const mouthVariant = (seed >> 1) % 3;

    return (
        <svg viewBox="0 0 100 100" className="w-full h-full transition-all duration-500 group-hover:scale-110">
            <rect width="100" height="100" fill={bg} />
            <path d="M20 100 Q50 80 80 100" fill={gender === 'male' ? '#6366f1' : '#ec4899'} opacity="0.8" />
            <circle cx="50" cy="50" r="35" fill={skin} />
            <g fill="#1f2937">
                {eyesVariant === 0 && (<><circle cx="38" cy="48" r="4" /><circle cx="62" cy="48" r="4" /></>)}
                {eyesVariant === 1 && (<><path d="M34 50 Q38 42 42 50" stroke="#1f2937" strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M58 50 Q62 42 66 50" stroke="#1f2937" strokeWidth="3" fill="none" strokeLinecap="round" /></>)}
                {eyesVariant === 2 && (<><circle cx="38" cy="48" r="4" /><path d="M58 48 L66 48" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" /></>)}
            </g>
            <g stroke="#1f2937" strokeWidth="3" fill="none" strokeLinecap="round">
                {mouthVariant === 0 && (<path d="M42 65 Q50 70 58 65" />)}
                {mouthVariant === 1 && (<path d="M38 62 Q50 75 62 62" />)}
                {mouthVariant === 2 && (<circle cx="50" cy="66" r="4" fill="#1f2937" stroke="none" />)}
            </g>
            {gender === 'male' ? (<path d="M25 40 Q50 15 75 40" fill="#1f2937" opacity="0.1" />) : (<path d="M20 45 Q50 10 80 45" fill="#1f2937" opacity="0.1" />)}
        </svg>
    );
};

const ExpandableText = ({ text, limit = 120 }) => {
    const [expanded, setExpanded] = useState(false);
    if (!text) return null;

    const classes = "text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-words";

    if (text.length <= limit) return <p className={classes}>{text}</p>;

    return (
        <div>
            <p className={classes}>
                {expanded ? text : text.slice(0, limit) + '...'}
            </p>
            <button
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1 hover:underline focus:outline-none"
            >
                {expanded ? 'Show Less' : 'Read More'}
            </button>
        </div>
    );
};

export default function MatchmakerBrowse({ user }) {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [reportTarget, setReportTarget] = useState(null);
    const [reportReason, setReportReason] = useState('');
    const [submittingReport, setSubmittingReport] = useState(false);
    const [filters, setFilters] = useState({ gender: 'all', maxAge: 30 });

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_browse_profiles', { viewer_id: user.id });
            if (error) throw error;
            setProfiles(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProfiles(); }, []);

    const closeProfileModal = () => {
        setSelectedProfile(null);
    };

    const filteredProfiles = useMemo(() => {
        return profiles.filter(profile => {
            if (filters.gender !== 'all' && profile.gender !== filters.gender) return false;
            if (profile.age > filters.maxAge) return false;
            return true;
        });
    }, [profiles, filters]);

    const handleLove = async (e, targetId) => {
        e.stopPropagation();
        setProfiles(prev => prev.map(p => p.author_id === targetId ? { ...p, hasSentLove: true } : p));
        if (selectedProfile?.author_id === targetId) {
            setSelectedProfile(prev => ({ ...prev, hasSentLove: true }));
        }

        try {
            await supabase.rpc('handle_love_action', { target_user_id: targetId, action_type: 'love' });
        } catch (err) {
            alert("Failed to send love.");
        }
    };

    const handleReportSubmit = async () => {
        if (!reportTarget || !reportReason.trim()) return;
        setSubmittingReport(true);
        try {
            await supabase.from('matchmaker_reports').insert({
                reporter_id: user.id, reported_id: reportTarget.id, reason: reportReason, status: 'pending'
            });
            await supabase.rpc('handle_love_action', { target_user_id: reportTarget.id, action_type: 'reject' });
            setProfiles(prev => prev.filter(p => p.author_id !== reportTarget.id));
            setReportTarget(null);
            closeProfileModal();
        } catch (err) {
            alert("Failed to report.");
        } finally {
            setSubmittingReport(false);
        }
    };

    if (loading && profiles.length === 0 && !selectedProfile) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <Sparkles className="w-10 h-10 text-indigo-500 animate-bounce mb-4" />
            <p className="text-indigo-600 font-bold">Finding matches...</p>
        </div>
    );

    return (
        <div className="pb-20 min-h-screen">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-4 rounded-2xl border border-white/50 dark:border-gray-700 shadow-sm sticky top-0 z-30">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 font-bold">
                    <Filter className="w-5 h-5 text-indigo-500" /> Filters
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
                        {['all', 'male', 'female'].map(g => (
                            <button key={g} onClick={() => setFilters(prev => ({ ...prev, gender: g }))}
                                className={`px-3 py-1 rounded-md text-xs font-bold capitalize transition-all ${filters.gender === g ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'}`}>
                                {g}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Max Age: {filters.maxAge}</span>
                        <input type="range" min="18" max="50" value={filters.maxAge} onChange={(e) => setFilters(prev => ({ ...prev, maxAge: parseInt(e.target.value) }))} className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg accent-indigo-600 cursor-pointer" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProfiles.map(profile => (
                    <div
                        key={profile.author_id}
                        onClick={() => setSelectedProfile(profile)}
                        className="group bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:scale-[1.02] transition-all duration-300 cursor-pointer flex flex-col"
                    >
                        <div className={`relative h-24 bg-gradient-to-br ${profile.gender === 'male' ? 'from-indigo-400 via-blue-400 to-indigo-500' : 'from-pink-400 via-rose-400 to-pink-500'}`}>
                            <div className="absolute top-2 right-2 z-10">
                                <ShareProfileButton profile={profile} />
                            </div>

                            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                                <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 shadow-lg overflow-hidden bg-white dark:bg-gray-900">
                                    <AvatarGenerator nickname={profile.nickname} gender={profile.gender} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-14 px-5 pb-5 flex-1 flex flex-col">
                            <div className="text-center mb-3">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">{profile.nickname}, {profile.age}</h3>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                                    <MapPin className="w-3 h-3" /> {profile.city}
                                </p>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 mb-3 flex-1 border border-gray-100 dark:border-gray-700">
                                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed break-words">
                                    {profile.self_intro}
                                </p>
                            </div>

                            <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                                {profile.interests?.slice(0, 3).map(tag => (
                                    <span key={tag} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-[10px] font-semibold rounded border border-indigo-200 dark:border-indigo-800">
                                        {tag}
                                    </span>
                                ))}
                                {profile.interests?.length > 3 && (
                                    <span className="px-2 py-0.5 text-gray-400 text-[10px] font-semibold">+{profile.interests.length - 3}</span>
                                )}
                            </div>

                            <button
                                onClick={(e) => handleLove(e, profile.author_id)}
                                disabled={profile.hasSentLove}
                                className={`w-full py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${profile.hasSentLove
                                    ? 'bg-green-500 text-white cursor-default'
                                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg'
                                    }`}
                            >
                                {profile.hasSentLove ? <Check className="w-4 h-4" /> : <Heart className="w-4 h-4 fill-white" />}
                                {profile.hasSentLove ? 'Request Sent' : 'Connect'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredProfiles.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
                    <Frown className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No profiles match your filters</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Try adjusting your search criteria</p>
                </div>
            )}

            {selectedProfile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeProfileModal}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="relative px-6 pt-6">
                            <button onClick={closeProfileModal} className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-gray-600 dark:text-gray-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                            <div className="absolute top-4 left-4">
                                <ShareProfileButton profile={selectedProfile} />
                            </div>
                        </div>

                        <div className="px-6 pb-6">
                            <div className="flex flex-col items-center">
                                <div className="w-32 h-32 rounded-full border-4 border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden bg-white dark:bg-gray-900 mb-3">
                                    <AvatarGenerator nickname={selectedProfile.nickname} gender={selectedProfile.gender} />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{selectedProfile.nickname}, {selectedProfile.age}</h2>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-5">
                                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium capitalize">{selectedProfile.gender}</span>
                                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {selectedProfile.city}</span>
                                </div>

                                <div className="w-full space-y-4 text-left">
                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                                        <h3 className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5" /> About Me
                                        </h3>
                                        <ExpandableText text={selectedProfile.self_intro} />
                                    </div>

                                    <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-xl border border-pink-100 dark:border-pink-800/30">
                                        <h3 className="text-xs font-semibold text-pink-600 dark:text-pink-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                            <Search className="w-3.5 h-3.5" /> Looking For
                                        </h3>
                                        <ExpandableText text={selectedProfile.looking_for} />
                                    </div>

                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                            <Hash className="w-3.5 h-3.5" /> Interests
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedProfile.interests?.map(tag => (
                                                <span key={tag} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full pt-5 mt-5 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                                    <button
                                        onClick={(e) => handleLove(e, selectedProfile.author_id)}
                                        disabled={selectedProfile.hasSentLove}
                                        className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${selectedProfile.hasSentLove ? 'bg-green-500 text-white cursor-default' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg'}`}
                                    >
                                        {selectedProfile.hasSentLove ? <><Check className="w-4 h-4" /> Request Sent</> : <><Heart className="w-4 h-4 fill-white" /> Send Request</>}
                                    </button>
                                    <button
                                        onClick={() => setReportTarget({ id: selectedProfile.author_id, name: selectedProfile.nickname })}
                                        className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors"
                                    >
                                        <AlertTriangle className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {reportTarget && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6">
                        <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Report {reportTarget.name}?</h3>
                        <textarea
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl mb-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            rows={3}
                            placeholder="Please describe the reason for reporting..."
                            value={reportReason}
                            onChange={e => setReportReason(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setReportTarget(null); setReportReason(''); }}
                                className="flex-1 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReportSubmit}
                                disabled={submittingReport || !reportReason.trim()}
                                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {submittingReport ? 'Reporting...' : 'Report'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}