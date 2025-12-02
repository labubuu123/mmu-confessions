import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Heart, Sparkles, X, Send, ShieldCheck, Activity, Wrench, ShoppingBag } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import LiveActivityPanel from './LiveActivityPanel';

export default function FloatingActionMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isActivityOpen, setIsActivityOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [identityId, setIdentityId] = useState(null);
    const [isGuest, setIsGuest] = useState(false);
    const navigate = useNavigate();
    const chatEndRef = useRef(null);

    useEffect(() => {
        const initializeIdentity = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                setIdentityId(session.user.id);
                setIsGuest(false);
            } else {
                let guestId = localStorage.getItem('zyora_guest_id');
                if (!guestId) {
                    guestId = crypto.randomUUID();
                    localStorage.setItem('zyora_guest_id', guestId);
                }
                setIdentityId(guestId);
                setIsGuest(true);
            }
        };

        initializeIdentity();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                setIdentityId(session.user.id);
                setIsGuest(false);
            } else {
                const guestId = localStorage.getItem('zyora_guest_id') || crypto.randomUUID();
                setIdentityId(guestId);
                setIsGuest(true);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (isChatOpen && identityId) {
            fetchMessages();

            const channel = supabase
                .channel('public:support_messages')
                .on('postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'support_messages',
                        filter: `user_id=eq.${identityId}`
                    },
                    (payload) => {
                        if (payload.new.sender_role === 'admin') {
                            setChatHistory(prev => {
                                if (prev.some(msg => msg.id === payload.new.id)) return prev;
                                return [...prev, payload.new];
                            });
                            scrollToBottom();
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [isChatOpen, identityId]);

    const scrollToBottom = () => {
        setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const fetchMessages = async () => {
        if (!identityId) return;
        const { data } = await supabase
            .from('support_messages')
            .select('*')
            .eq('user_id', identityId)
            .order('created_at', { ascending: true });

        if (data) {
            setChatHistory(data);
            scrollToBottom();
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim() || !identityId) return;

        const text = message.trim();
        setMessage('');

        const optimisticMessage = {
            id: Date.now(),
            user_id: identityId,
            sender_role: 'user',
            content: text,
            created_at: new Date().toISOString()
        };

        setChatHistory(prev => [...prev, optimisticMessage]);
        scrollToBottom();

        try {
            const { error } = await supabase.from('support_messages').insert({
                user_id: identityId,
                sender_role: 'user',
                content: text
            });
            if (error) throw error;
        } catch (err) {
            console.error("Error sending:", err);
        }
    };

    const handleMarketplaceClick = () => {
        setIsOpen(false);
        navigate('/marketplace');
    };

    const handleMatchmakerClick = () => {
        setIsOpen(false);
        navigate('/matchmaker');
    };

    const handleContactAdminClick = () => {
        setIsOpen(false);
        setIsChatOpen(true);
        setIsActivityOpen(false);
    };

    const handleLiveActivityClick = () => {
        setIsOpen(false);
        setIsActivityOpen(true);
        setIsChatOpen(false);
    };

    const handleToolsClick = () => {
        setIsOpen(false);
        navigate('/tools');
    };

    const MenuButton = ({ icon: Icon, label, onClick, colorClass, bgClass }) => (
        <button
            onClick={onClick}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all active:scale-95 group"
        >
            <div className={`w-10 h-10 ${bgClass} rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200`}>
                <Icon className={`w-5 h-5 ${colorClass}`} />
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</span>
        </button>
    );

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {isOpen && (
                <div className="fixed z-50 bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-6 duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 p-4 overflow-hidden">

                        <div className="flex items-center justify-between mb-4 px-1">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quick Menu</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <MenuButton
                                icon={ShoppingBag}
                                label="Marketplace"
                                onClick={handleMarketplaceClick}
                                bgClass="bg-emerald-100 dark:bg-emerald-900/40"
                                colorClass="text-emerald-600 dark:text-emerald-400"
                            />
                            <MenuButton
                                icon={Heart}
                                label="Matchmaker"
                                onClick={handleMatchmakerClick}
                                bgClass="bg-pink-100 dark:bg-pink-900/40"
                                colorClass="text-pink-600 dark:text-pink-400"
                            />
                            <MenuButton
                                icon={Wrench}
                                label="Tools"
                                onClick={handleToolsClick}
                                bgClass="bg-cyan-100 dark:bg-cyan-900/40"
                                colorClass="text-cyan-600 dark:text-cyan-400"
                            />
                            <MenuButton
                                icon={Activity}
                                label="Live Comments"
                                onClick={handleLiveActivityClick}
                                bgClass="bg-orange-100 dark:bg-orange-900/40"
                                colorClass="text-orange-600 dark:text-orange-400"
                            />
                        </div>

                        <button
                            onClick={handleContactAdminClick}
                            className="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-xl transition-colors text-sm font-medium"
                        >
                            <MessageSquare className="w-4 h-4" />
                            <span>Contact Admin Support</span>
                        </button>
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 w-14 h-14 flex items-center justify-center text-white rounded-full shadow-lg shadow-indigo-500/30 dark:shadow-none transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-900 active:scale-90 ${isOpen ? 'bg-gray-700 rotate-90' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                aria-label="Open menu"
            >
                {isOpen ? <X className="w-7 h-7" /> : <Sparkles className="w-7 h-7" />}
            </button>

            {isActivityOpen && (
                <LiveActivityPanel onClose={() => setIsActivityOpen(false)} />
            )}

            {isChatOpen && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:justify-end sm:p-6 pointer-events-none">
                    <div className="pointer-events-auto w-full sm:w-96 h-[85vh] sm:h-[600px] bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
                        <div className="p-4 bg-indigo-600 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2 text-white">
                                <ShieldCheck className="w-5 h-5" />
                                <div>
                                    <h3 className="font-bold text-sm">Admin Support</h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${isGuest ? 'bg-yellow-400' : 'bg-green-400'}`} />
                                        <p className="text-xs text-indigo-100">
                                            {isGuest ? 'Guest Mode' : 'User Mode'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsChatOpen(false)} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950 scroll-smooth">
                            {chatHistory.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 space-y-2">
                                    <MessageSquare className="w-12 h-12 opacity-20" />
                                    <p className="text-sm">
                                        {isGuest ? "Anonymous Chat (Saved to browser)" : "How can we help you today?"}
                                    </p>
                                </div>
                            )}
                            {chatHistory.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.sender_role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${msg.sender_role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-none'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        <form onSubmit={sendMessage} className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex gap-2 shrink-0 safe-pb">
                            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                            <button type="submit" disabled={!message.trim()} className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-transform active:scale-95">
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}