import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Heart, X, Instagram, MapPin, Trash2, Ban, Flag, User, Calendar, Search, Hash, Info, AlertTriangle, Check } from 'lucide-react';
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
    const style = "text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed";
    if (text.length <= limit) return <p className={style}>{text}</p>;
    return (
        <div className="w-full">
            <p className={style}>{expanded ? text : text.slice(0, limit) + '...'}</p>
            <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="text-xs font-bold text-indigo-500 mt-2 hover:underline py-1 px-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                {expanded ? 'Show Less' : 'Read More'}
            </button>
        </div>
    );
};

export default function MatchmakerConnections({ user, userProfile }) {
    const [activeTab, setActiveTab] = useState('received');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingProfile, setViewingProfile] = useState(null);

    const fetchConnections = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_my_connections', { viewer_id: user.id });
            if (error) throw error;
            const formattedItems = (data || []).map(item => ({
                id: item.connection_id,
                status: item.status,
                updated_at: item.updated_at,
                other_user: {
                    id: item.other_user_id,
                    nickname: item.nickname,
                    avatar_seed: item.avatar_seed,
                    gender: item.gender,
                    city: item.city,
                    contact_info: item.contact_info,
                    self_intro: item.status === 'matched' ? 'Matched! Check contact info.' : '...',
                }
            }));
            setItems(formattedItems);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const fetchFullProfile = async (userId) => {
        const { data } = await supabase.from('matchmaker_profiles').select('*').eq('author_id', userId).single();
        if (data) setViewingProfile(data);
    };

    useEffect(() => {
        fetchConnections();
        const channel = supabase.channel('connections_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'matchmaker_loves' }, fetchConnections)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'matchmaker_matches' }, fetchConnections)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user.id]);

    const handleAction = async (targetId, connectionId, action) => {
        const previousItems = [...items];
        setItems(prev => prev.filter(i => i.other_user.id !== targetId));
        if (viewingProfile?.author_id === targetId && action !== 'accept') {
            setViewingProfile(null);
        }

        try {
            if (action === 'delete') {
                let deleteError = null;
                let deleteCount = 0;
                if (connectionId) {
                    const res = await supabase.from('matchmaker_loves').delete().eq('id', connectionId).select();
                    deleteError = res.error;
                    deleteCount = res.data?.length || 0;
                }
                if ((deleteError || deleteCount === 0)) {
                    const res = await supabase.from('matchmaker_loves').delete().eq('from_user_id', user.id).eq('to_user_id', targetId).select();
                    deleteError = res.error;
                    deleteCount = res.data?.length || 0;
                }
                if (deleteCount === 0) {
                    const { error: rpcError } = await supabase.rpc('handle_love_action', { target_user_id: targetId, action_type: 'delete' });
                    if (rpcError) throw rpcError;
                }
            } else {
                const { error } = await supabase.rpc('handle_love_action', { target_user_id: targetId, action_type: action });
                if (error) throw error;
            }
        } catch (err) {
            console.error("Action error:", err);
            setItems(previousItems);
            alert("Action failed. Please try again.");
        }
    };

    const filteredItems = items.filter(i => {
        if (activeTab === 'received') return i.status === 'pending_received';
        if (activeTab === 'sent') return i.status === 'pending_sent';
        if (activeTab === 'matches') return i.status === 'matched';
        if (activeTab === 'rejected') return i.status === 'rejected';
        return false;
    });

    const getTabCount = (tab) => {
        if (tab === 'received') return items.filter(i => i.status === 'pending_received').length;
        if (tab === 'sent') return items.filter(i => i.status === 'pending_sent').length;
        if (tab === 'matches') return items.filter(i => i.status === 'matched').length;
        if (tab === 'rejected') return items.filter(i => i.status === 'rejected').length;
        return 0;
    };

    if (loading && items.length === 0) return <div className="p-10 text-center text-gray-500">Loading...</div>;

    return (
        <div className="min-h-[60vh]">
            <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6 overflow-x-auto no-scrollbar sticky top-0 z-10">
                {['received', 'matches', 'sent', 'rejected'].map(tab => {
                    const count = getTabCount(tab);
                    return (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 min-w-[80px] py-2.5 px-2 text-sm font-bold rounded-lg capitalize transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                            {tab} {count > 0 && <span className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full ${tab === 'matches' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{count}</span>}
                        </button>
                    )
                })}
            </div>

            <div className="space-y-3">
                {filteredItems.length === 0 && <div className="text-center py-10 text-gray-400 italic">No {activeTab} connections.</div>}
                {filteredItems.map(item => (
                    <div key={item.other_user.id} className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col xs:flex-row gap-3">
                        <div className="flex items-center gap-3 w-full">
                            <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden flex-shrink-0" onClick={() => fetchFullProfile(item.other_user.id)}>
                                <AvatarGenerator nickname={item.other_user.nickname} gender={item.other_user.gender} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 dark:text-white text-base">{item.other_user.nickname}</h4>
                                <div className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.other_user.city || 'Unknown'}</div>
                                <button onClick={() => fetchFullProfile(item.other_user.id)} className="text-xs font-bold text-indigo-500 mt-1">View Profile</button>
                            </div>
                        </div>

                        <div className="flex gap-2 w-full xs:w-auto mt-1 xs:mt-0">
                            {activeTab === 'received' && (
                                <>
                                    <button onClick={() => handleAction(item.other_user.id, item.id, 'reject')} className="flex-1 py-2 bg-gray-100 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-500"><X className="w-5 h-5 mx-auto" /></button>
                                    <button onClick={() => handleAction(item.other_user.id, item.id, 'accept')} className="flex-1 py-2 bg-pink-500 rounded-xl text-white shadow-lg shadow-pink-500/30"><Heart className="w-5 h-5 fill-white mx-auto" /></button>
                                </>
                            )}
                            {activeTab === 'sent' && (
                                <button
                                    onClick={() => handleAction(item.other_user.id, item.id, 'delete')}
                                    // Changed background and text colors to red
                                    className="w-full px-4 py-2 bg-red-50 dark:bg-red-900/40 rounded-xl text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900 text-xs font-bold"
                                >
                                    Withdraw
                                </button>
                            )}
                            {activeTab === 'rejected' && (
                                <button onClick={() => handleAction(item.other_user.id, item.id, 'delete')} className="w-full py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-500 hover:text-red-500"><Trash2 className="w-5 h-5 mx-auto" /></button>
                            )}
                            {activeTab === 'matches' && (
                                <div className="w-full py-2 bg-green-50 dark:bg-green-900/20 rounded-xl text-center text-xs font-bold text-green-700 dark:text-green-400 flex items-center justify-center gap-1">
                                    <Instagram className="w-4 h-4" /> {item.other_user.contact_info?.replace('@', '')}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {viewingProfile && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewingProfile(null)}>
                    <div
                        className="bg-white dark:bg-gray-900 w-full h-[90vh] sm:h-auto sm:max-h-[90vh] sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={`p-6 text-center relative flex-shrink-0 bg-gradient-to-br ${viewingProfile.gender === 'male' ? 'from-indigo-600 to-blue-600' : 'from-pink-600 to-rose-600'}`}>
                            <button onClick={() => setViewingProfile(null)} className="absolute top-4 right-4 bg-black/20 hover:bg-black/30 p-2 rounded-full text-white transition-colors"><X className="w-5 h-5" /></button>
                            <div className="absolute top-4 left-4"><ShareProfileButton profile={viewingProfile} /></div>
                            <div className="w-28 h-28 mx-auto bg-white dark:bg-gray-800 rounded-full border-4 border-white/20 mb-3 overflow-hidden shadow-xl">
                                <AvatarGenerator nickname={viewingProfile.nickname} gender={viewingProfile.gender} />
                            </div>
                            <h2 className="text-3xl font-black text-white tracking-tight">{viewingProfile.nickname}</h2>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <span className="px-3 py-1 bg-black/20 text-white text-xs font-bold rounded-full backdrop-blur-md flex items-center gap-1">
                                    <User className="w-3 h-3" /> {viewingProfile.age} Years
                                </span>
                                <CompatibilityBadge myProfile={userProfile} theirProfile={viewingProfile} compact />
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 bg-white dark:bg-gray-900 scroll-smooth">
                            <div className="grid grid-cols-2 gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl flex flex-col items-center text-center">
                                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Gender</span>
                                    <span className="font-bold text-gray-900 dark:text-white capitalize flex items-center gap-1"><User className="w-4 h-4 text-indigo-500" /> {viewingProfile.gender}</span>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl flex flex-col items-center text-center">
                                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Location</span>
                                    <span className="font-bold text-gray-900 dark:text-white truncate max-w-full flex items-center gap-1"><MapPin className="w-4 h-4 text-pink-500" /> {viewingProfile.city}</span>
                                </div>
                            </div>

                            <div className="p-5 space-y-6 pb-8">
                                {(viewingProfile.zodiac || viewingProfile.mbti) && (
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {viewingProfile.zodiac && <span className="px-4 py-2 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-bold rounded-2xl border border-purple-100 dark:border-purple-800">{viewingProfile.zodiac}</span>}
                                        {viewingProfile.mbti && <span className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-bold rounded-2xl border border-blue-100 dark:border-blue-800">{viewingProfile.mbti}</span>}
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Info className="w-4 h-4" /> About Me</h3>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <ExpandableText text={viewingProfile.self_intro} />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-black text-pink-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Search className="w-4 h-4" /> Looking For</h3>
                                    <div className="bg-pink-50 dark:bg-pink-900/10 p-4 rounded-2xl border border-pink-100 dark:border-pink-900/30">
                                        <ExpandableText text={viewingProfile.looking_for} />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Hash className="w-4 h-4" /> Interests</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {viewingProfile.interests?.map(tag => (
                                            <span key={tag} className="px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">{tag}</span>
                                        ))}
                                        {!viewingProfile.interests?.length && <span className="text-gray-400 text-sm italic">No interests listed.</span>}
                                    </div>
                                </div>

                                {viewingProfile.red_flags && viewingProfile.red_flags.length > 0 && (
                                    <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-2xl border border-red-100 dark:border-red-900/30">
                                        <h3 className="text-xs font-black text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Flag className="w-4 h-4" /> My Red Flags</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {viewingProfile.red_flags.map((flag, idx) => (
                                                <span key={idx} className="px-3 py-1.5 bg-white dark:bg-gray-800 text-red-600 dark:text-red-300 text-xs font-bold rounded-lg border border-red-200 dark:border-red-800 shadow-sm">{flag}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}