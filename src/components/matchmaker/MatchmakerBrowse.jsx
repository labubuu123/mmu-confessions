import React, { useState, useEffect, useMemo, memo, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { calculateCompatibility } from '../../utils/compatibility';
import { Heart, MapPin, Sparkles, AlertTriangle, X, Check, User, Search, Hash, Flag, Info, Loader2 } from 'lucide-react';
import ShareProfileButton from './ShareProfileButton';
import CompatibilityBadge from './CompatibilityBadge';

const AvatarGenerator = memo(({ nickname, gender }) => {
    const seed = useMemo(() => {
        const str = (nickname || 'User') + gender;
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        return Math.abs(hash);
    }, [nickname, gender]);

    const pick = (options, offset = 0) => options[(seed + offset) % options.length];
    const bgColors = gender === 'male' ? ['#e0e7ff', '#dbeafe', '#ccfbf1', '#f3f4f6'] : ['#fce7f3', '#ffe4e6', '#fef3c7', '#fae8ff'];
    const skinColors = ['#f3d2c1', '#f5e0d7', '#e6c3b3', '#ffdfc4', '#dbb298'];
    const bg = pick(bgColors, 1);
    const skin = pick(skinColors);

    return (
        <svg viewBox="0 0 100 100" className="w-full h-full transition-transform duration-500 group-hover:scale-110">
            <rect width="100" height="100" fill={bg} />
            <path d="M20 100 Q50 80 80 100" fill={gender === 'male' ? '#6366f1' : '#ec4899'} opacity="0.8" />
            <circle cx="50" cy="50" r="35" fill={skin} />
            <circle cx="35" cy="45" r="4" fill="#1f2937" />
            <circle cx="65" cy="45" r="4" fill="#1f2937" />
            <path d="M40 65 Q50 75 60 65" stroke="#1f2937" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
    );
});

const ExpandableText = memo(({ text, limit = 150 }) => {
    const [expanded, setExpanded] = useState(false);
    if (!text) return null;
    const style = "text-xs sm:text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed";
    if (text.length <= limit) return <p className={style}>{text}</p>;
    return (
        <div className="w-full">
            <p className={style}>{expanded ? text : text.slice(0, limit) + '...'}</p>
            <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="text-[10px] sm:text-xs font-bold text-indigo-500 mt-2 hover:underline py-1 px-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                {expanded ? 'Show Less' : 'Read More'}
            </button>
        </div>
    );
});

const MiniMatchPill = ({ myProfile, theirProfile }) => {
    const score = useMemo(() => {
        if (!myProfile || !theirProfile) return 0;
        return calculateCompatibility(myProfile, theirProfile)?.score || 0;
    }, [myProfile, theirProfile]);

    let colors = "bg-gray-100 text-gray-500 border-gray-200";
    if (score >= 80) colors = "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";
    else if (score >= 50) colors = "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
    else colors = "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800";

    return (
        <div className={`mt-2 mb-3 px-3 py-1.5 rounded-full border ${colors} flex items-center justify-center gap-1.5 w-full max-w-[140px] mx-auto transition-colors`}>
            <div className="relative w-3.5 h-3.5">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="50%" cy="50%" r="6" stroke="currentColor" strokeWidth="2.5" fill="none" className="opacity-20" />
                    <circle cx="50%" cy="50%" r="6" stroke="currentColor" strokeWidth="2.5" fill="none" strokeDasharray={37.7} strokeDashoffset={37.7 - (37.7 * score) / 100} strokeLinecap="round" />
                </svg>
            </div>
            <span className="text-[10px] sm:text-xs font-black tracking-wide">{score}% Match</span>
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
    const [messageTarget, setMessageTarget] = useState(null);
    const [connectMessage, setConnectMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const modalRef = useRef(null);
    const scrollContentRef = useRef(null);
    const isDragging = useRef(false);
    const dragStartY = useRef(0);
    const currentDragY = useRef(0);

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
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'matchmaker_loves' }, () => fetchProfiles())
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

    const handleLove = (e, targetId) => {
        e?.stopPropagation();
        const profile = profiles.find(p => p.author_id === targetId);
        if (profile.hasSentLove) return;
        setMessageTarget(profile);
    };

    const sendLove = async () => {
        if (!messageTarget || isSending) return;

        setIsSending(true);
        const targetId = messageTarget.author_id;

        try {
            await supabase.rpc('handle_love_action', {
                target_user_id: targetId,
                action_type: 'love',
                message_in: connectMessage.trim() || null
            });

            setProfiles(prev => prev.map(p => p.author_id === targetId ? { ...p, hasSentLove: true } : p));
            if (selectedProfile?.author_id === targetId) setSelectedProfile(prev => ({ ...prev, hasSentLove: true }));

            setMessageTarget(null);
            setConnectMessage('');
        } catch (err) {
            console.error("Failed to send love:", err);
            alert("Failed to send connection request. Please try again.");
            setProfiles(prev => prev.map(p => p.author_id === targetId ? { ...p, hasSentLove: false } : p));
        } finally {
            setIsSending(false);
        }
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

    const handleTouchStart = (e) => {
        if (window.innerWidth >= 768) return;

        if (scrollContentRef.current && scrollContentRef.current.scrollTop > 0) return;

        isDragging.current = true;
        dragStartY.current = e.touches[0].clientY;

        if (modalRef.current) {
            modalRef.current.style.transition = 'none';
        }
    };

    const handleTouchMove = (e) => {
        if (!isDragging.current) return;
        if (window.innerWidth >= 768) return;

        const currentY = e.touches[0].clientY;
        const delta = currentY - dragStartY.current;

        if (delta > 0) {
            if (e.cancelable) e.preventDefault();

            currentDragY.current = delta;

            if (modalRef.current) {
                modalRef.current.style.transform = `translateY(${delta}px)`;
            }
        }
    };

    const handleTouchEnd = () => {
        if (!isDragging.current) return;
        isDragging.current = false;

        if (currentDragY.current > 120) {
            if (modalRef.current) {
                modalRef.current.style.transition = 'transform 0.2s ease-out';
                modalRef.current.style.transform = `translateY(100%)`;
            }
            setTimeout(() => setSelectedProfile(null), 100);
        } else {
            if (modalRef.current) {
                modalRef.current.style.transition = 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)';
                modalRef.current.style.transform = 'translateY(0px)';
            }
        }
        currentDragY.current = 0;
    };

    if (loading && profiles.length === 0 && !selectedProfile) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
            <Sparkles className="w-10 h-10 text-violet-500 animate-bounce mb-4" />
            <p className="text-sm font-bold text-violet-600">Finding matches...</p>
        </div>
    );

    return (
        <div className="pb-24 min-h-screen">
            <div className="mb-4 flex flex-col gap-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-3 sm:p-4 rounded-b-2xl sm:rounded-2xl border-b sm:border border-white/50 dark:border-gray-700 shadow-sm sticky top-0 z-30">
                <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1 w-full">
                    {['all', 'male', 'female'].map(g => (
                        <button key={g} onClick={() => setFilters(prev => ({ ...prev, gender: g }))}
                            className={`flex-1 px-2 py-1.5 rounded-md text-[10px] sm:text-xs font-bold capitalize transition-all ${filters.gender === g ? 'bg-white dark:bg-gray-700 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'}`}>
                            {g}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex-1">
                        <span className="text-[10px] font-bold text-gray-500 mb-1 block">Max Age: {filters.maxAge}</span>
                        <input type="range" min="18" max="50" value={filters.maxAge} onChange={(e) => setFilters(prev => ({ ...prev, maxAge: parseInt(e.target.value) }))} className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg accent-violet-600 cursor-pointer" />
                    </div>
                    <div className="flex-1 border-l border-gray-200 dark:border-gray-700 pl-3">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {filters.radius === 0 ? "Global" : `< ${filters.radius}km`}</span>
                        </div>
                        <input type="range" min="0" max="100" step="5" disabled={!filters.userLat} value={filters.radius} onChange={(e) => setFilters(prev => ({ ...prev, radius: parseInt(e.target.value) }))} className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg accent-pink-500 cursor-pointer disabled:opacity-50" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 px-2 sm:px-0">
                {filteredProfiles.map(profile => (
                    <div
                        key={profile.author_id}
                        onClick={() => setSelectedProfile(profile)}
                        className="relative group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 dark:border-gray-700 flex flex-col h-full"
                    >
                        <div className={`h-14 sm:h-16 bg-gradient-to-br ${profile.gender === 'male' ? 'from-blue-400 to-indigo-500' : 'from-pink-400 to-rose-500'} relative flex-shrink-0`}>
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-[3px] border-white dark:border-gray-800 shadow-sm bg-white overflow-hidden">
                                <AvatarGenerator nickname={profile.nickname} gender={profile.gender} />
                            </div>
                        </div>

                        <div className="pt-9 pb-3 px-2 flex-1 flex flex-col text-center">
                            <h3 className="text-sm font-black text-gray-900 dark:text-white leading-tight mb-0.5 truncate px-1">
                                {profile.nickname}, {profile.age}
                            </h3>
                            <p className="text-[10px] font-bold text-gray-400 flex items-center justify-center gap-1 mb-2">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate max-w-[80px]">
                                    {profile.distance_km ? `${profile.distance_km.toFixed(1)} km` : profile.city}
                                </span>
                            </p>

                            <div className="flex flex-wrap justify-center gap-1 mb-1 px-1">
                                {profile.mbti && (
                                    <span className="px-2 py-0.5 text-[9px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full border dark:border-gray-600">
                                        {profile.mbti}
                                    </span>
                                )}
                                {profile.zodiac && (
                                    <span className="px-2 py-0.5 text-[9px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full border dark:border-gray-600">
                                        {profile.zodiac.split(' ')[1] || profile.zodiac}
                                    </span>
                                )}
                            </div>

                            <MiniMatchPill myProfile={userProfile} theirProfile={profile} />

                            <button
                                onClick={(e) => handleLove(e, profile.author_id)}
                                disabled={profile.hasSentLove}
                                className={`mt-auto w-full py-2.5 rounded-xl font-bold text-[10px] sm:text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${profile.hasSentLove
                                    ? 'bg-green-50 text-green-600 border border-green-200 cursor-default'
                                    : 'bg-violet-600 text-white hover:bg-violet-700 shadow-md hover:shadow-lg'
                                    }`}
                            >
                                {profile.hasSentLove ? <Check className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5 fill-current" />}
                                {profile.hasSentLove ? 'Sent' : 'Connect'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedProfile && (
                <div
                    className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setSelectedProfile(null)}
                >
                    <div
                        ref={modalRef}
                        className="bg-white dark:bg-gray-900 w-full h-[100dvh] sm:h-auto sm:max-h-[85vh] sm:max-w-lg sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col sm:animate-in sm:zoom-in-95 duration-300 overscroll-y-contain will-change-transform"
                        onClick={e => e.stopPropagation()}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div className="absolute top-0 left-0 right-0 h-6 flex items-center justify-center z-50 pointer-events-none md:hidden">
                            <div className="w-12 h-1.5 bg-white/40 rounded-full shadow-sm backdrop-blur-md"></div>
                        </div>

                        <div className={`p-4 sm:p-6 text-center relative flex-shrink-0 bg-gradient-to-br ${selectedProfile.gender === 'male' ? 'from-indigo-600 to-blue-600' : 'from-pink-600 to-rose-600'}`}>

                            <button onClick={() => setSelectedProfile(null)} className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/20 hover:bg-black/30 p-2 rounded-full text-white transition-colors z-10">
                                <X className="w-5 h-5" />
                            </button>
                            <div className="absolute top-3 left-3 sm:top-4 sm:left-4"><ShareProfileButton profile={selectedProfile} /></div>

                            <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto bg-white dark:bg-gray-800 rounded-full border-4 border-white/20 mb-2 sm:mb-3 overflow-hidden shadow-xl mt-4 sm:mt-0">
                                <AvatarGenerator nickname={selectedProfile.nickname} gender={selectedProfile.gender} />
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">{selectedProfile.nickname}</h2>
                            <div className="flex items-center justify-center gap-2 mt-3">
                                <span className="px-2.5 py-1 bg-black/20 text-white text-[10px] sm:text-xs font-bold rounded-full backdrop-blur-md flex items-center gap-1">
                                    <User className="w-3 h-3" /> {selectedProfile.age}
                                </span>
                                <div className="max-w-[180px]">
                                    <CompatibilityBadge myProfile={userProfile} theirProfile={selectedProfile} />
                                </div>
                            </div>
                        </div>

                        <div
                            ref={scrollContentRef}
                            className="overflow-y-auto flex-1 bg-white dark:bg-gray-900 scroll-smooth overscroll-y-contain"
                        >
                            <div className="grid grid-cols-2 gap-2 p-3 border-b border-gray-100 dark:border-gray-800">
                                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-xl flex flex-col items-center text-center">
                                    <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Gender</span>
                                    <span className="text-xs font-bold text-gray-900 dark:text-white capitalize flex items-center gap-1">
                                        <User className="w-3 h-3 text-indigo-500" /> {selectedProfile.gender}
                                    </span>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-xl flex flex-col items-center text-center">
                                    <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Location</span>
                                    <span className="text-xs font-bold text-gray-900 dark:text-white break-words w-full justify-center flex items-center gap-1 leading-tight">
                                        <MapPin className="w-3 h-3 text-pink-500 flex-shrink-0" /> {selectedProfile.city}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 space-y-5 pb-32 sm:pb-8">
                                {(selectedProfile.zodiac || selectedProfile.mbti) && (
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {selectedProfile.zodiac && <span className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-xl border border-purple-100 dark:border-purple-800">{selectedProfile.zodiac}</span>}
                                        {selectedProfile.mbti && <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl border border-blue-100 dark:border-blue-800">{selectedProfile.mbti}</span>}
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Info className="w-3 h-3" /> About Me
                                    </h3>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <ExpandableText text={selectedProfile.self_intro} />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Search className="w-3 h-3" /> Looking For
                                    </h3>
                                    <div className="bg-pink-50 dark:bg-pink-900/10 p-3 rounded-2xl border border-pink-100 dark:border-pink-900/30">
                                        <ExpandableText text={selectedProfile.looking_for} />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Hash className="w-3 h-3" /> Interests
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedProfile.interests?.map(tag => (
                                            <span key={tag} className="px-2.5 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] font-bold rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm whitespace-normal leading-tight">
                                                {tag}
                                            </span>
                                        ))}
                                        {!selectedProfile.interests?.length && <span className="text-gray-400 text-xs italic">No interests listed.</span>}
                                    </div>
                                </div>

                                {selectedProfile.red_flags && selectedProfile.red_flags.length > 0 && (
                                    <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-2xl border border-red-100 dark:border-red-900/30">
                                        <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Flag className="w-3 h-3" /> My Red Flags
                                        </h3>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedProfile.red_flags.map((flag, idx) => (
                                                <span key={idx} className="px-2.5 py-1 bg-white dark:bg-gray-800 text-red-600 dark:text-red-300 text-[10px] font-bold rounded-lg border border-red-200 dark:border-red-800 shadow-sm whitespace-normal leading-tight">
                                                    {flag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-2 flex-shrink-0 pb-safe-area-bottom z-20">
                            <button
                                onClick={() => handleLove(null, selectedProfile.author_id)}
                                disabled={selectedProfile.hasSentLove}
                                className={`flex-1 py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${selectedProfile.hasSentLove ? 'bg-green-500 text-white cursor-default' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                            >
                                {selectedProfile.hasSentLove ? <><Check className="w-5 h-5" /> Request Sent</> : <><Heart className="w-5 h-5 fill-current" /> Connect</>}
                            </button>
                            <button
                                onClick={() => setReportTarget({ id: selectedProfile.author_id, name: selectedProfile.nickname })}
                                className="px-4 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-xl transition-colors flex items-center justify-center"
                            >
                                <AlertTriangle className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {messageTarget && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => { if (!isSending) setMessageTarget(null); }}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white">Say Hi to {messageTarget.nickname}</h3>
                        <textarea
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl mb-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition"
                            rows={4}
                            placeholder="Write a message (optional, max 200 chars)..."
                            value={connectMessage}
                            onChange={e => setConnectMessage(e.target.value)}
                            maxLength={200}
                            disabled={isSending}
                        />
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{connectMessage.length}/200</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => { if (!isSending) setMessageTarget(null); setConnectMessage(''); }}
                                disabled={isSending}
                                className="flex-1 py-2.5 bg-gray-200 dark:bg-gray-700 rounded-lg font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700/80 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={sendLove}
                                disabled={isSending}
                                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center transition"
                            >
                                {isSending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null} Send Connect
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {reportTarget && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                        <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Report {reportTarget.name}?</h3>
                        <textarea className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl mb-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none" rows={3} placeholder="Reason..." value={reportReason} onChange={e => setReportReason(e.target.value)} />
                        <div className="flex gap-2">
                            <button onClick={() => { setReportTarget(null); setReportReason(''); }} className="flex-1 py-2.5 bg-gray-200 dark:bg-gray-700 rounded-lg font-bold">Cancel</button>
                            <button onClick={handleReportSubmit} disabled={submittingReport || !reportReason.trim()} className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-bold">Report</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}