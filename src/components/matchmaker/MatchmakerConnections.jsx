import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Heart, X, MessageCircle, Loader2, Send, Instagram } from 'lucide-react';

export default function MatchmakerConnections({ user }) {
    const [activeTab, setActiveTab] = useState('received');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchConnections = async () => {
        setLoading(true);
        const { data } = await supabase.rpc('get_my_connections', { viewer_id: user.id });
        setItems(data || []);
        setLoading(false);
    };

    useEffect(() => { fetchConnections(); }, []);

    const handleAction = async (targetId, type) => {
        setItems(prev => prev.filter(i => i.other_user_id !== targetId || type === 'accept'));
        await supabase.rpc('handle_love_action', { target_user_id: targetId, action_type: type });
        fetchConnections();
    };

    const filteredItems = items.filter(i => {
        if (activeTab === 'received') return i.status === 'pending_received';
        if (activeTab === 'sent') return i.status === 'pending_sent';
        if (activeTab === 'matches') return i.status === 'matched';
        return false;
    });

    const TabButton = ({ id, label, count, activeColor }) => {
        const isActive = activeTab === id;
        return (
            <button onClick={() => setActiveTab(id)}
                className={`flex-1 py-3 px-2 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2
                ${isActive
                        ? `bg-${activeColor}-600 text-white shadow-lg shadow-${activeColor}-500/30 transform scale-105`
                        : 'bg-white/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'}`}
            >
                {label}
                {count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black
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
            {/* Background Effects */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute bottom-[-10%] left-[-5%] w-64 h-64 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
                <div className="absolute top-[30%] right-[-10%] w-64 h-64 bg-pink-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
            </div>

            {/* Navigation Pills */}
            <div className="flex gap-2 p-1 bg-gray-100/50 dark:bg-gray-900/30 backdrop-blur-md rounded-2xl mb-6 border border-white/20 dark:border-gray-700/30">
                <TabButton id="received" label="Requests" count={items.filter(i => i.status === 'pending_received').length} activeColor="pink" />
                <TabButton id="sent" label="Sent" count={items.filter(i => i.status === 'pending_sent').length} activeColor="indigo" />
                <TabButton id="matches" label="Chats" count={items.filter(i => i.status === 'matched').length} activeColor="green" />
            </div>

            <div className="space-y-4 pb-20">
                {filteredItems.map(item => (
                    <div key={item.id} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-5 rounded-2xl border border-white/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-2">
                        
                        <div className="flex items-start gap-4">
                            <img
                                src={`https://api.dicebear.com/9.x/notionists/svg?seed=${item.avatar_seed}&backgroundColor=${item.gender === 'male' ? 'e0e7ff' : 'fce7f3'}&brows=variant10&lips=variant05`}
                                className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-800 border-2 border-white dark:border-gray-600 shadow-sm flex-shrink-0"
                                alt="Avatar"
                            />

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-black text-lg text-gray-900 dark:text-white truncate">{item.nickname}</h3>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                                            {activeTab === 'sent' && 'Waiting for response...'}
                                            {activeTab === 'received' && 'Sent you a Like!'}
                                            {activeTab === 'matches' && 'You are connected!'}
                                        </p>
                                    </div>
                                    {activeTab === 'received' && (
                                        <span className="text-xs font-bold bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300 px-2 py-1 rounded-lg">
                                            New
                                        </span>
                                    )}
                                </div>

                                {/* MATCH STATE: Explicit Instagram Username */}
                                {activeTab === 'matches' && (
                                    <div className="mt-3 bg-green-50/80 dark:bg-green-900/20 p-3 rounded-xl border border-green-100 dark:border-green-800/50">
                                        <div className="flex items-center gap-2 mb-1">
                                            {/* Changed from MessageCircle to Instagram icon */}
                                            <Instagram className="w-3 h-3 text-green-600 dark:text-green-400" />
                                            <span className="text-[10px] font-black uppercase tracking-wider text-green-600/70 dark:text-green-400/70">
                                                Instagram Username
                                            </span>
                                        </div>
                                        <div className="text-base font-bold text-green-800 dark:text-green-200 select-all">
                                            {item.contact_info}
                                        </div>
                                        <p className="text-[10px] text-green-600/60 dark:text-green-400/50 mt-1 italic">
                                            Find them on Instagram to start chatting!
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons Area */}
                        <div className="mt-4 flex gap-3">
                            {activeTab === 'received' && (
                                <>
                                    <button onClick={() => handleAction(item.other_user_id, 'reject')}
                                        className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors flex items-center justify-center gap-2">
                                        <X className="w-4 h-4" /> Decline
                                    </button>
                                    <button onClick={() => handleAction(item.other_user_id, 'accept')}
                                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-sm shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all flex items-center justify-center gap-2">
                                        <Heart className="w-4 h-4 fill-white" /> Accept
                                    </button>
                                </>
                            )}
                            {activeTab === 'sent' && (
                                <button onClick={() => handleAction(item.other_user_id, 'withdraw')}
                                    className="w-full py-2.5 rounded-xl border-2 border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-wide hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    Withdraw Request
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {filteredItems.length === 0 && (
                    <div className="text-center py-16 px-6">
                        <div className="inline-block p-5 rounded-full bg-gray-50 dark:bg-gray-800/50 mb-4 border border-gray-100 dark:border-gray-700">
                            {activeTab === 'matches' ? (
                                <MessageCircle className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                            ) : (
                                <Heart className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                            )}
                        </div>
                        <p className="text-gray-400 dark:text-gray-500 font-medium">
                            {activeTab === 'received' && "No pending requests."}
                            {activeTab === 'sent' && "You haven't sent any likes yet."}
                            {activeTab === 'matches' && "No matches yet. Keep browsing!"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}