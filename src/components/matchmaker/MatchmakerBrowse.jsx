import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Heart, MapPin, Sparkles, AlertTriangle, X, Check, User, Search, Hash, Flag, Calendar, Info } from 'lucide-react';
import ShareProfileButton from './ShareProfileButton';
import CompatibilityBadge from './CompatibilityBadge';

const AvatarGenerator = ({ nickname, gender }) => {
    const seed = useMemo(() => {
        const str = (nickname || 'User') + gender;
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
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
        <svg viewBox="0 0 100 100" className="w-full h-full transition-transform duration-500 group-hover:scale-110">
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

const ExpandableText = ({ text, limit = 150 }) => {
    const [expanded, setExpanded] = useState(false);
    if (!text) return null;

    const style = "text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed";

    if (text.length <= limit) return <p className={style}>{text}</p>;
    return (
        <div className="w-full">
            <p className={style}>
                {expanded ? text : text.slice(0, limit) + '...'}
            </p>
            <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="text-xs font-bold text-indigo-500 mt-2 hover:underline py-1 px-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                {expanded ? 'Show Less' : 'Read More'}
            </button>
        </div>
    );
};

export default function MatchmakerBrowse({ user, userProfile }) {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [reportTarget, setReportTarget] = useState(null);
    const [reportReason, setReportReason] = useState('');
    const [submittingReport, setSubmittingReport] = useState(false);
    const [filters, setFilters] = useState({ gender: 'all', maxAge: 30, radius: 0, userLat: null, userLong: null });

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_browse_profiles', {
                viewer_id: user.id,
                filter_gender: filters.gender,
                filter_max_age: filters.maxAge,
                filter_lat: filters.radius > 0 ? filters.userLat : null,
                filter_long: filters.radius > 0 ? filters.userLong : null,
                filter_radius_km: filters.radius > 0 ? filters.radius : null
            });
            if (error) throw error;
            setProfiles(data || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => {
        if (userProfile?.lat && userProfile?.long) {
            setFilters(prev => ({ ...prev, userLat: userProfile.lat, userLong: userProfile.long }));
        }
        fetchProfiles();

        const channel = supabase.channel('browse_realtime')
            .on('postgres_changes', {
                event: 'DELETE',
                schema: 'public',
                table: 'matchmaker_loves'
            }, () => {
                fetchProfiles();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [userProfile]);

    useEffect(() => {
        const timeout = setTimeout(() => fetchProfiles(), 500);
        return () => clearTimeout(timeout);
    }, [filters.gender, filters.maxAge, filters.radius]);

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
        if (selectedProfile?.author_id === targetId) setSelectedProfile(prev => ({ ...prev, hasSentLove: true }));
        try { await supabase.rpc('handle_love_action', { target_user_id: targetId, action_type: 'love' }); } catch (err) { alert("Failed to send love."); }
    };

    const handleReportSubmit = async () => {
        if (!reportTarget || !reportReason.trim()) return;
        setSubmittingReport(true);
        try {
            await supabase.from('matchmaker_reports').insert({ reporter_id: user.id, reported_id: reportTarget.id, reason: reportReason, status: 'pending' });
            await supabase.rpc('handle_love_action', { target_user_id: reportTarget.id, action_type: 'reject' });
            setProfiles(prev => prev.filter(p => p.author_id !== reportTarget.id));
            setReportTarget(null);
            setSelectedProfile(null);
        } catch (err) { alert("Failed to report."); }
        finally { setSubmittingReport(false); }
    };

    if (loading && profiles.length === 0 && !selectedProfile) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <Sparkles className="w-10 h-10 text-indigo-500 animate-bounce mb-4" />
            <p className="text-indigo-600 font-bold">Finding matches...</p>
        </div>
    );

    return (
        <div className="pb-20 min-h-screen">
            <div className="mb-6 flex flex-col md:flex-row gap-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-4 rounded-2xl border border-white/50 dark:border-gray-700 shadow-sm sticky top-0 z-30">
                <div className="flex flex-col sm:flex-row gap-4 justify-between w-full">
                    <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1 self-start w-full sm:w-auto">
                        {['all', 'male', 'female'].map(g => (
                            <button key={g} onClick={() => setFilters(prev => ({ ...prev, gender: g }))}
                                className={`flex-1 sm:flex-none px-3 py-2 rounded-md text-xs font-bold capitalize transition-all ${filters.gender === g ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'}`}>
                                {g}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">Max Age: {filters.maxAge}</span>
                            <input type="range" min="18" max="50" value={filters.maxAge} onChange={(e) => setFilters(prev => ({ ...prev, maxAge: parseInt(e.target.value) }))} className="w-full sm:w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg accent-indigo-600 cursor-pointer" />
                        </div>
                        <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-4 flex-1 sm:flex-initial">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 whitespace-nowrap">
                                    <MapPin className="w-3 h-3" />
                                    {filters.radius === 0 ? "Global" : `< ${filters.radius} km`}
                                </span>
                                {!filters.userLat && <span className="text-[10px] text-red-400">No GPS</span>}
                            </div>
                            <input type="range" min="0" max="100" step="5" disabled={!filters.userLat} value={filters.radius} onChange={(e) => setFilters(prev => ({ ...prev, radius: parseInt(e.target.value) }))} className="w-full sm:w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg accent-pink-500 cursor-pointer disabled:opacity-50" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredProfiles.map(profile => (
                    <div key={profile.author_id} onClick={() => setSelectedProfile(profile)} className="relative group bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 border border-gray-100 dark:border-gray-700">
                        <div className={`h-16 sm:h-20 bg-gradient-to-br ${profile.gender === 'male' ? 'from-indigo-400 to-blue-500' : 'from-pink-400 to-rose-500'}`}>
                            <div className="absolute top-6 sm:top-8 left-1/2 -translate-x-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white dark:border-gray-800 shadow-md bg-white overflow-hidden transition-all">
                                <AvatarGenerator nickname={profile.nickname} gender={profile.gender} />
                            </div>
                        </div>

                        <div className="pt-9 sm:pt-10 pb-3 px-2 sm:px-4 text-center">
                            <h3 className="text-sm sm:text-lg font-black text-gray-900 dark:text-white truncate">{profile.nickname}, {profile.age}</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center justify-center gap-1 mb-2 sm:mb-3">
                                <MapPin className="w-3 h-3" /> {profile.distance_km ? `${profile.distance_km.toFixed(1)} km` : profile.city}
                            </p>

                            <div className="flex flex-wrap justify-center gap-1 mb-2 sm:mb-3">
                                {profile.mbti && <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md border dark:border-gray-600">{profile.mbti}</span>}
                                {profile.zodiac && <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md border dark:border-gray-600">{profile.zodiac.split(' ')[1]}</span>}
                            </div>

                            <CompatibilityBadge myProfile={userProfile} theirProfile={profile} />

                            <button onClick={(e) => handleLove(e, profile.author_id)} disabled={profile.hasSentLove} className={`mt-3 w-full py-2 sm:py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition-all active:scale-95 shadow-md hover:shadow-lg ${profile.hasSentLove ? 'bg-green-50 text-green-600 border border-green-200 cursor-default' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                                {profile.hasSentLove ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />}
                                {profile.hasSentLove ? 'Sent' : 'Connect'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedProfile && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedProfile(null)}>
                    <div
                        className="bg-white dark:bg-gray-900 w-full h-[90vh] sm:h-auto sm:max-h-[90vh] sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={`p-6 text-center relative flex-shrink-0 bg-gradient-to-br ${selectedProfile.gender === 'male' ? 'from-indigo-600 to-blue-600' : 'from-pink-600 to-rose-600'}`}>
                            <button onClick={() => setSelectedProfile(null)} className="absolute top-4 right-4 bg-black/20 hover:bg-black/30 p-2 rounded-full text-white transition-colors"><X className="w-5 h-5" /></button>
                            <div className="absolute top-4 left-4"><ShareProfileButton profile={selectedProfile} /></div>

                            <div className="w-28 h-28 mx-auto bg-white dark:bg-gray-800 rounded-full border-4 border-white/20 mb-3 overflow-hidden shadow-xl">
                                <AvatarGenerator nickname={selectedProfile.nickname} gender={selectedProfile.gender} />
                            </div>
                            <h2 className="text-3xl font-black text-white tracking-tight">{selectedProfile.nickname}</h2>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <span className="px-3 py-1 bg-black/20 text-white text-xs font-bold rounded-full backdrop-blur-md flex items-center gap-1">
                                    <User className="w-3 h-3" /> {selectedProfile.age} Years
                                </span>
                                <CompatibilityBadge myProfile={userProfile} theirProfile={selectedProfile} compact />
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 bg-white dark:bg-gray-900 scroll-smooth">
                            <div className="grid grid-cols-2 gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl flex flex-col items-center text-center">
                                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Gender</span>
                                    <span className="font-bold text-gray-900 dark:text-white capitalize flex items-center gap-1">
                                        <User className="w-4 h-4 text-indigo-500" /> {selectedProfile.gender}
                                    </span>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl flex flex-col items-center text-center">
                                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Location</span>
                                    <span className="font-bold text-gray-900 dark:text-white truncate max-w-full flex items-center gap-1">
                                        <MapPin className="w-4 h-4 text-pink-500" /> {selectedProfile.city}
                                    </span>
                                </div>
                            </div>

                            <div className="p-5 space-y-6 pb-24">
                                {(selectedProfile.zodiac || selectedProfile.mbti) && (
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {selectedProfile.zodiac && <span className="px-4 py-2 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-bold rounded-2xl border border-purple-100 dark:border-purple-800">{selectedProfile.zodiac}</span>}
                                        {selectedProfile.mbti && <span className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-bold rounded-2xl border border-blue-100 dark:border-blue-800">{selectedProfile.mbti}</span>}
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Info className="w-4 h-4" /> About Me
                                    </h3>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <ExpandableText text={selectedProfile.self_intro} />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-black text-pink-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Search className="w-4 h-4" /> Looking For
                                    </h3>
                                    <div className="bg-pink-50 dark:bg-pink-900/10 p-4 rounded-2xl border border-pink-100 dark:border-pink-900/30">
                                        <ExpandableText text={selectedProfile.looking_for} />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Hash className="w-4 h-4" /> Interests
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedProfile.interests?.map(tag => (
                                            <span key={tag} className="px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                                                {tag}
                                            </span>
                                        ))}
                                        {!selectedProfile.interests?.length && <span className="text-gray-400 text-sm italic">No interests listed.</span>}
                                    </div>
                                </div>

                                {selectedProfile.red_flags && selectedProfile.red_flags.length > 0 && (
                                    <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-2xl border border-red-100 dark:border-red-900/30">
                                        <h3 className="text-xs font-black text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Flag className="w-4 h-4" /> My Red Flags
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedProfile.red_flags.map((flag, idx) => (
                                                <span key={idx} className="px-3 py-1.5 bg-white dark:bg-gray-800 text-red-600 dark:text-red-300 text-xs font-bold rounded-lg border border-red-200 dark:border-red-800 shadow-sm">
                                                    {flag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-3 flex-shrink-0 pb-8 sm:pb-4 z-20">
                            <button
                                onClick={(e) => handleLove(e, selectedProfile.author_id)}
                                disabled={selectedProfile.hasSentLove}
                                className={`flex-1 py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl active:scale-95 ${selectedProfile.hasSentLove ? 'bg-green-500 text-white cursor-default' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                            >
                                {selectedProfile.hasSentLove ? <><Check className="w-5 h-5" /> Request Sent</> : <><Heart className="w-5 h-5 fill-current" /> Connect</>}
                            </button>
                            <button
                                onClick={() => setReportTarget({ id: selectedProfile.author_id, name: selectedProfile.nickname })}
                                className="px-5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-2xl transition-colors flex items-center justify-center"
                            >
                                <AlertTriangle className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {reportTarget && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                        <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Report {reportTarget.name}?</h3>
                        <textarea className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl mb-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" rows={3} placeholder="Reason..." value={reportReason} onChange={e => setReportReason(e.target.value)} />
                        <div className="flex gap-2">
                            <button onClick={() => { setReportTarget(null); setReportReason(''); }} className="flex-1 py-2.5 bg-gray-200 dark:bg-gray-700 rounded-lg font-bold text-gray-700 dark:text-gray-300">Cancel</button>
                            <button onClick={handleReportSubmit} disabled={submittingReport || !reportReason.trim()} className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600">Report</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}