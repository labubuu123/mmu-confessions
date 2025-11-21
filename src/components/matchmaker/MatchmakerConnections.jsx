import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Heart, X, Instagram, MapPin, User, Search, Hash, Trash2, Ban } from 'lucide-react';
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

export default function MatchmakerConnections({ user }) {
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
                    self_intro: item.status === 'matched' ? 'Matched! Check contact info.' : '...'
                }
            }));

            setItems(formattedItems);
        } catch (err) {
            console.error("Error fetching connections:", err);
        } finally {
            setLoading(false);
        }
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

    const handleAction = async (targetId, action) => {
        setItems(prev => prev.filter(i => i.other_user.id !== targetId));

        await supabase.rpc('handle_love_action', { target_user_id: targetId, action_type: action });
        fetchConnections();
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

    if (loading && items.length === 0) return <div className="p-10 text-center text-gray-500">Loading connections...</div>;

    return (
        <div className="min-h-[60vh]">
            <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6 overflow-x-auto no-scrollbar">
                {['received', 'matches', 'sent', 'rejected'].map(tab => {
                    const count = getTabCount(tab);
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2.5 px-2 text-sm font-bold rounded-lg capitalize transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            {tab}
                            {count > 0 && (
                                <span className={`ml-2 px-1.5 py-0.5 text-[10px] rounded-full ${tab === 'matches' ? 'bg-green-500 text-white' : 'bg-red-500 text-white animate-pulse'}`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            <div className="space-y-4">
                {filteredItems.length === 0 && (
                    <div className="text-center py-10 text-gray-400 italic bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                        No {activeTab} connections.
                    </div>
                )}

                {filteredItems.map(item => (
                    <div key={item.other_user.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                        <div
                            className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 cursor-pointer hover:opacity-90 ring-2 ring-transparent hover:ring-indigo-400 transition-all"
                            onClick={() => fetchFullProfile(item.other_user.id)}
                        >
                            <AvatarGenerator nickname={item.other_user.nickname} gender={item.other_user.gender} />
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 dark:text-white truncate text-lg">{item.other_user.nickname}</h4>
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1 font-medium uppercase tracking-wide">
                                <MapPin className="w-3 h-3" /> {item.other_user.city || 'Unknown'}
                            </div>
                            {activeTab === 'rejected' ? (
                                <span className="text-xs font-bold text-red-500 flex items-center gap-1">
                                    <Ban className="w-3 h-3" /> Application Rejected
                                </span>
                            ) : (
                                <button onClick={() => fetchFullProfile(item.other_user.id)} className="text-xs font-bold text-indigo-500 dark:text-indigo-400 hover:underline">
                                    View Full Profile
                                </button>
                            )}
                        </div>

                        {activeTab === 'received' && (
                            <div className="flex gap-2">
                                <button onClick={() => handleAction(item.other_user.id, 'reject')} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"><X className="w-5 h-5" /></button>
                                <button onClick={() => handleAction(item.other_user.id, 'accept')} className="p-3 bg-pink-500 rounded-xl text-white hover:bg-pink-600 shadow-lg shadow-pink-500/30 transition-transform active:scale-90"><Heart className="w-5 h-5 fill-white" /></button>
                            </div>
                        )}

                        {activeTab === 'sent' && (
                            <div className="flex gap-2">
                                <button onClick={() => handleAction(item.other_user.id, 'withdraw')} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 text-xs font-bold transition-colors">
                                    Withdraw
                                </button>
                            </div>
                        )}

                        {activeTab === 'rejected' && (
                            <div className="flex gap-2">
                                <button onClick={() => handleAction(item.other_user.id, 'withdraw')} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-600 transition-colors" title="Dismiss">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        {activeTab === 'matches' && (
                            <div className="text-right">
                                <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Contact</div>
                                <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg text-sm">
                                    <Instagram className="w-4 h-4" />
                                    {item.other_user.contact_info?.replace('@', '')}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {viewingProfile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setViewingProfile(null)}>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className={`p-6 text-white text-center relative bg-gradient-to-br ${viewingProfile.gender === 'male' ? 'from-indigo-600 to-blue-600' : 'from-pink-600 to-rose-600'}`}>
                            <button onClick={() => setViewingProfile(null)} className="absolute top-4 right-4 text-white/80 hover:text-white"><X className="w-6 h-6" /></button>
                            <div className="absolute top-4 left-4 text-white/80 hover:text-white">
                                <ShareProfileButton profile={viewingProfile} />
                            </div>

                            <div className="w-24 h-24 mx-auto bg-white dark:bg-gray-900 rounded-full border-4 border-white/20 mb-3 overflow-hidden shadow-lg">
                                <AvatarGenerator nickname={viewingProfile.nickname} gender={viewingProfile.gender} />
                            </div>
                            <h2 className="text-2xl font-black">{viewingProfile.nickname}, {viewingProfile.age}</h2>
                            <div className="flex justify-center items-center gap-2 opacity-90 text-sm font-medium uppercase tracking-wide">
                                <span className="capitalize">{viewingProfile.gender}</span> • <span>{viewingProfile.city}</span>
                            </div>
                        </div>

                        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                <h5 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2"><User className="w-3 h-3" /> About Me</h5>
                                <ExpandableText text={viewingProfile.self_intro} />
                            </div>

                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                                <h5 className="text-xs font-bold text-indigo-500 uppercase mb-2 flex items-center gap-2"><Search className="w-3 h-3" /> Looking For</h5>
                                <ExpandableText text={viewingProfile.looking_for} />
                            </div>

                            <div>
                                <h5 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2"><Hash className="w-3 h-3" /> Interests</h5>
                                <div className="flex flex-wrap gap-2">
                                    {viewingProfile.interests?.map(i => (
                                        <span key={i} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-xs font-bold rounded-md text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">{i}</span>
                                    ))}
                                </div>
                            </div>

                            {activeTab === 'matches' && viewingProfile.contact_info && (
                                <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-4">
                                    <p className="text-center text-xs text-gray-500 dark:text-gray-400 mb-2">You matched! Here is their contact:</p>
                                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-center font-mono font-bold text-green-700 dark:text-green-400 select-all">
                                        {viewingProfile.contact_info}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}