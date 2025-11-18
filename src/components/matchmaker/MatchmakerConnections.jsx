import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Heart, X, MessageCircle, Loader2 } from 'lucide-react';

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

    const TabButton = ({ id, label, count, activeColor }) => (
        <button onClick={() => setActiveTab(id)}
            className={`flex-1 py-4 font-bold text-sm border-b-2 transition-all
            ${activeTab === id
                    ? `border-${activeColor}-500 text-${activeColor}-600 dark:text-${activeColor}-400`
                    : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}>
            {label}
            {count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs
                ${activeTab === id
                        ? `bg-${activeColor}-100 dark:bg-${activeColor}-900/30 text-${activeColor}-700 dark:text-${activeColor}-300`
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                    {count}
                </span>
            )}
        </button>
    );

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

    return (
        <div>
            <div className="flex bg-white dark:bg-gray-800 rounded-t-2xl border border-gray-200 dark:border-gray-700 mb-6 shadow-sm overflow-hidden">
                <TabButton id="received" label="Requests" count={items.filter(i => i.status === 'pending_received').length} activeColor="pink" />
                <TabButton id="sent" label="Sent" count={items.filter(i => i.status === 'pending_sent').length} activeColor="indigo" />
                <TabButton id="matches" label="Matches" count={items.filter(i => i.status === 'matched').length} activeColor="green" />
            </div>

            <div className="space-y-4">
                {filteredItems.map(item => (
                    <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                        <img
                            src={`https://api.dicebear.com/9.x/notionists/svg?seed=${item.avatar_seed}&backgroundColor=${item.gender === 'male' ? 'e0e7ff' : 'fce7f3'}&brows=variant10&lips=variant05`}
                            className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600"
                            alt="Avatar"
                        />

                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{item.nickname}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {activeTab === 'sent' && 'Waiting for them to accept...'}
                                {activeTab === 'received' && 'They sent you Love!'}
                                {activeTab === 'matches' && 'Matched! Contact info revealed below.'}
                            </p>
                            {activeTab === 'matches' && (
                                <div className="mt-2 p-2.5 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800 inline-flex items-center max-w-full">
                                    <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400 mr-2 flex-shrink-0" />
                                    <span className="text-sm font-bold text-green-700 dark:text-green-300 truncate select-all">
                                        {item.contact_info}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                            {activeTab === 'received' && (
                                <>
                                    <button onClick={() => handleAction(item.other_user_id, 'reject')}
                                        className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleAction(item.other_user_id, 'accept')}
                                        className="p-3 rounded-full bg-pink-100 dark:bg-pink-900/30 hover:bg-pink-200 dark:hover:bg-pink-900/50 text-pink-600 dark:text-pink-400 transition-colors">
                                        <Heart className="w-5 h-5 fill-pink-600 dark:fill-pink-400" />
                                    </button>
                                </>
                            )}
                            {activeTab === 'sent' && (
                                <button onClick={() => handleAction(item.other_user_id, 'withdraw')}
                                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    Withdraw
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {filteredItems.length === 0 && (
                    <div className="text-center py-12">
                        <div className="inline-block p-4 rounded-full bg-gray-50 dark:bg-gray-800 mb-3 border border-gray-100 dark:border-gray-700">
                            <Heart className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-gray-400 dark:text-gray-500">No connections in this list yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}