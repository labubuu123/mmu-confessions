import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Heart, X, MessageCircle, Loader2, Send, Instagram, MapPin, Info, Trash2, Ban } from 'lucide-react';

export default function MatchmakerConnections({ user }) {
    const [activeTab, setActiveTab] = useState('received');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingProfile, setViewingProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);

    const fetchConnections = async () => {
        if (items.length === 0) setLoading(true);

        const { data } = await supabase.rpc('get_my_connections', { viewer_id: user.id });
        setItems(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchConnections();

        const channel = supabase.channel('connections_realtime')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'matchmaker_loves',
                filter: `from_user_id=eq.${user.id}`
            }, () => fetchConnections())
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'matchmaker_loves',
                filter: `to_user_id=eq.${user.id}`
            }, () => fetchConnections())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const handleAction = async (targetId, type) => {
        const originalItems = [...items];

        setItems(prev => prev.filter(i => i.other_user_id !== targetId || type === 'accept'));

        try {
            const { error } = await supabase.rpc('handle_love_action', { target_user_id: targetId, action_type: type });
            if (error) throw error;
            if (type === 'accept') fetchConnections();
        } catch (err) {
            console.error("Connection action failed:", err);
            setItems(originalItems);
            alert("Action failed. Please check your connection.");
        }
    };

    const handleViewProfile = async (targetId) => {
        setProfileLoading(true);
        try {
            const { data, error } = await supabase
                .from('matchmaker_profiles')
                .select('*')
                .eq('author_id', targetId)
                .single();

            if (error) throw error;
            setViewingProfile(data);
        } catch (err) {
            console.error("Error fetching profile:", err);
        } finally {
            setProfileLoading(false);
        }
    };

    const filteredItems = items.filter(i => {
        if (activeTab === 'received') return i.status === 'pending_received';
        if (activeTab === 'sent') return i.status === 'pending_sent' || i.status === 'rejected';
        if (activeTab === 'matches') return i.status === 'matched';
        return false;
    });

    const TabButton = ({ id, label, count, activeColor }) => {
        const isActive = activeTab === id;
        return (
            <button onClick={() => setActiveTab(id)}
                className={`flex-1 py-3 px-2 rounded-xl font-bold text-xs md:text-sm transition-all duration-300 flex items-center justify-center gap-2
                ${isActive
                        ? `bg-${activeColor}-600 text-white shadow-lg shadow-${activeColor}-500/30 transform scale-105`
                        : 'bg-white/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'}`}
            >
                {label}
                {count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black
                    ${isActive
                            ? 'bg-white text-gray-900'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                        {count}
                    </span>
                )}
            </button>
        );
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

    return (
        <div className="relative min-h-[50vh]">
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute bottom-[-10%] left-[-5%] w-64 h-64 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
                <div className="absolute top-[30%] right-[-10%] w-64 h-64 bg-pink-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
            </div>

            <div className="flex gap-2 p-1 bg-gray-100/50 dark:bg-gray-900/30 backdrop-blur-md rounded-2xl mb-6 border border-white/20 dark:border-gray-700/30">
                <TabButton id="received" label="Requests" count={items.filter(i => i.status === 'pending_received').length} activeColor="pink" />
                <TabButton id="sent" label="Sent" count={items.filter(i => i.status === 'pending_sent' || i.status === 'rejected').length} activeColor="indigo" />
                <TabButton id="matches" label="Matches" count={items.filter(i => i.status === 'matched').length} activeColor="green" />
            </div>

            <div className="space-y-4 pb-20">
                {filteredItems.map(item => (
                    <div key={item.id} className={`backdrop-blur-xl p-5 rounded-2xl border shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2
                        ${item.status === 'rejected'
                            ? 'bg-red-50/80 dark:bg-red-900/20 border-red-200 dark:border-red-800/50'
                            : 'bg-white/80 dark:bg-gray-900/80 border-white/50 dark:border-gray-700/50 hover:shadow-md'}`}>

                        <div className="flex items-start gap-4 cursor-pointer group" onClick={() => handleViewProfile(item.other_user_id)}>
                            <div className="relative">
                                <img
                                    src={`https://api.dicebear.com/9.x/notionists/svg?seed=${item.avatar_seed}&backgroundColor=${item.gender === 'male' ? 'e0e7ff' : 'fce7f3'}&brows=variant10&lips=variant05`}
                                    className={`w-16 h-16 rounded-full border-2 shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform
                                        ${item.status === 'rejected' ? 'grayscale border-red-200 dark:border-red-800' : 'bg-gray-50 dark:bg-gray-800 border-white dark:border-gray-600'}`}
                                    alt="Avatar"
                                />
                                {item.status !== 'rejected' && (
                                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 p-1 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
                                        <Info className="w-3 h-3 text-indigo-500" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-black text-lg text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {item.nickname}
                                        </h3>
                                        <p className={`text-xs font-medium mt-0.5 ${item.status === 'rejected' ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {activeTab === 'sent' && item.status === 'pending_sent' && 'Waiting for response...'}
                                            {activeTab === 'sent' && item.status === 'rejected' && 'Request Declined'}
                                            {activeTab === 'received' && 'Sent you a Like!'}
                                            {activeTab === 'matches' && 'You are connected!'}
                                        </p>
                                    </div>
                                    {activeTab === 'received' && (
                                        <span className="text-[10px] font-bold bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300 px-2 py-1 rounded-lg uppercase tracking-wide">New</span>
                                    )}
                                    {item.status === 'rejected' && (
                                        <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 px-2 py-1 rounded-lg uppercase tracking-wide">Declined</span>
                                    )}
                                </div>

                                {activeTab === 'matches' && (
                                    <div className="mt-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-3 rounded-xl border border-green-100 dark:border-green-800/50 cursor-auto" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Instagram className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                            <span className="text-[10px] font-black uppercase tracking-wider text-green-600/80 dark:text-green-400/80">Instagram</span>
                                        </div>
                                        <div className="text-base font-bold text-green-900 dark:text-green-100 select-all">{item.contact_info}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 flex gap-3">
                            {activeTab === 'received' && (
                                <>
                                    <button onClick={() => handleAction(item.other_user_id, 'reject')}
                                        className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors flex items-center justify-center gap-2">
                                        <X className="w-4 h-4" /> Decline
                                    </button>
                                    <button onClick={() => handleAction(item.other_user_id, 'accept')}
                                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-sm shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all flex items-center justify-center gap-2 active:scale-95">
                                        <Heart className="w-4 h-4 fill-white" /> Accept
                                    </button>
                                </>
                            )}
                            {activeTab === 'sent' && item.status === 'pending_sent' && (
                                <button onClick={() => handleAction(item.other_user_id, 'withdraw')}
                                    className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-wide hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    Withdraw Request
                                </button>
                            )}
                            {activeTab === 'sent' && item.status === 'rejected' && (
                                <button onClick={() => handleAction(item.other_user_id, 'withdraw')}
                                    className="w-full py-2.5 rounded-xl bg-red-100/50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wide hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2">
                                    <Trash2 className="w-3.5 h-3.5" /> Dismiss Notification
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {filteredItems.length === 0 && (
                    <div className="text-center py-16 px-6">
                        <div className="inline-block p-5 rounded-full bg-gray-50 dark:bg-gray-800/50 mb-4 border border-gray-100 dark:border-gray-700">
                            <Heart className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-gray-400 dark:text-gray-500 font-medium">
                            {activeTab === 'received' && "No pending requests."}
                            {activeTab === 'sent' && "No active or declined requests."}
                            {activeTab === 'matches' && "No matches yet."}
                        </p>
                    </div>
                )}
            </div>

            {viewingProfile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewingProfile(null)}>
                    <div className="bg-white dark:bg-gray-900 w-full max-w-md max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 relative" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setViewingProfile(null)} className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                        <div className="overflow-y-auto custom-scrollbar">
                            <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-500 relative">
                                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                                    <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${viewingProfile.avatar_seed}&backgroundColor=${viewingProfile.gender === 'male' ? 'e0e7ff' : 'fce7f3'}&brows=variant10&lips=variant05`} className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-900 shadow-lg bg-white dark:bg-gray-800" alt="Avatar" />
                                </div>
                            </div>
                            <div className="pt-14 pb-6 px-6 text-center">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">{viewingProfile.nickname}, {viewingProfile.age}</h2>
                                <div className="flex items-center justify-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-6">
                                    <MapPin className="w-4 h-4" /> {viewingProfile.city || 'Unknown City'}
                                </div>
                                <div className="space-y-6 text-left">
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <h4 className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide mb-2">About Me</h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{viewingProfile.self_intro}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <h4 className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide mb-2">Looking For</h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{viewingProfile.looking_for}</p>
                                    </div>
                                    {viewingProfile.interests && viewingProfile.interests.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3 ml-1">Interests</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {viewingProfile.interests.map(interest => (
                                                    <span key={interest} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-xs rounded-full font-bold border border-indigo-100 dark:border-indigo-800/30">{interest}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                            <button onClick={() => setViewingProfile(null)} className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Close Profile</button>
                        </div>
                    </div>
                </div>
            )}

            {profileLoading && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg flex items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                        <span className="font-medium text-gray-700 dark:text-gray-200">Loading Profile...</span>
                    </div>
                </div>
            )}
        </div>
    );
}