import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const ADJECTIVES = ['Sleepy', 'Caffeinated', 'Stressed', 'Chill', 'Panicking', 'Lost', 'Sneaky', 'Bored', 'Hungry', 'Late'];
const ANIMALS = ['Capybara', 'Monyet', 'Cat', 'Dog', 'Panda', 'Raccoon', 'Labubu', 'OwaOwa', 'Hamster', 'Owl'];
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

const TRENDING_ROOMS = ['#FinalExams', '#FOB', '#FET', '#FCI', '#FIST', '#FCM', '#FOM', '#FOL', '#FAC', '#FCA', '#FAIE', '#CyberjayaLife', '#MelakaCampus', '#Dating'];

export default function WhisperChat() {
    const [activeRoom, setActiveRoom] = useState(TRENDING_ROOMS[0]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [identity, setIdentity] = useState({ name: 'Loading...', color: '#fff' });
    const [isLoading, setIsLoading] = useState(true);
    const [isEditingName, setIsEditingName] = useState(false);
    const [customNameInput, setCustomNameInput] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showInstructions, setShowInstructions] = useState(true);

    const messagesEndRef = useRef(null);

    useEffect(() => {
        const randomAdjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
        const randomAnimal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
        const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];

        setIdentity({
            name: `${randomAdjective} ${randomAnimal}`,
            color: randomColor
        });
    }, []);

    useEffect(() => {
        let channel;

        const fetchMessagesAndSubscribe = async () => {
            setIsLoading(true);

            const { data, error } = await supabase
                .from('whisper_messages')
                .select('*')
                .eq('room_tag', activeRoom)
                .order('created_at', { ascending: false })
                .limit(50);

            if (!error && data) {
                setMessages(data.reverse());
            }
            setIsLoading(false);

            channel = supabase
                .channel(`room:${activeRoom}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'whisper_messages',
                        filter: `room_tag=eq.${activeRoom}`
                    },
                    (payload) => {
                        setMessages((prevMessages) => [...prevMessages, payload.new]);
                        scrollToBottom();
                    }
                )
                .subscribe();
        };

        fetchMessagesAndSubscribe();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [activeRoom]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const messageData = {
            room_tag: activeRoom,
            content: newMessage.trim(),
            author_name: identity.name,
            author_color: identity.color,
        };

        setNewMessage('');

        const { error } = await supabase
            .from('whisper_messages')
            .insert([messageData]);

        if (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        } else {
            scrollToBottom();
        }
    };

    const handleSaveName = () => {
        if (customNameInput.trim()) {
            setIdentity(prev => ({
                ...prev,
                name: customNameInput.trim()
            }));
        }
        setIsEditingName(false);
    };

    const handleRoomSelect = (room) => {
        setActiveRoom(room);
        setIsMobileMenuOpen(false);
    };

    const formatTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-row h-[100dvh] md:h-[700px] max-w-6xl mx-auto md:my-6 bg-white dark:bg-gray-800 md:rounded-xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 relative">
            {showInstructions && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-300">
                        <div className="text-center">
                            <div className="text-4xl mb-4">🤫</div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Whisper!</h3>
                            <div className="text-gray-600 dark:text-gray-400 space-y-4 mb-8 text-sm md:text-base text-left bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                                <p>Whisper is an anonymous campus chat. Share your thoughts, ask questions, or just hang out.</p>
                                <ul className="list-disc list-inside space-y-2 font-medium">
                                    <li>Pick a room from the sidebar.</li>
                                    <li>Your identity is randomized (but you can edit it!).</li>
                                    <li>Messages are public and real-time.</li>
                                </ul>
                                <p className="font-bold text-blue-500 text-center pt-2">Be kind and keep it campus-friendly!</p>
                            </div>
                            <button
                                onClick={() => setShowInstructions(false)}
                                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 active:scale-95"
                            >
                                Got it, let's chat!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div
                className={`md:hidden absolute inset-0 bg-black/60 z-30 transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            <div className={`absolute md:relative z-40 w-[75%] max-w-[300px] md:w-1/4 md:max-w-none h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} md:translate-x-0`}>
                <div className="p-5 md:p-6 pb-4 md:pb-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-800 md:border-none">
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                            <span className="animate-pulse">🤫</span> Whisper
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest font-semibold">
                            Campus Chat
                        </p>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="md:hidden p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
                    <p className="px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Trending Rooms</p>
                    {TRENDING_ROOMS.map((room) => (
                        <button
                            key={room}
                            onClick={() => handleRoomSelect(room)}
                            className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all duration-200 text-sm md:text-base flex items-center gap-3 ${activeRoom === room
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                                }`}
                        >
                            <span className={`text-lg ${activeRoom === room ? 'opacity-100' : 'opacity-50'}`}>#</span>
                            {room.replace('#', '')}
                        </button>
                    ))}
                </div>

                <div className="hidden md:block mt-auto p-4 bg-gray-100 dark:bg-gray-900/80 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Your Alias</span>
                            <button
                                onClick={() => { setCustomNameInput(identity.name); setIsEditingName(true); }}
                                className="text-[10px] text-blue-500 font-bold hover:underline"
                            >
                                EDIT
                            </button>
                        </div>
                        {isEditingName ? (
                            <div className="flex gap-1 animate-in fade-in duration-200">
                                <input
                                    className="w-full text-sm p-1.5 rounded border border-gray-300 dark:bg-gray-800 dark:border-gray-600 text-black dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={customNameInput}
                                    onChange={(e) => setCustomNameInput(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                />
                                <button onClick={handleSaveName} className="bg-green-500 hover:bg-green-600 text-white px-3 rounded text-sm font-bold transition-colors">✓</button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: identity.color }} />
                                <span className="font-bold text-sm text-gray-700 dark:text-gray-200 truncate">{identity.name}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0 h-full bg-white dark:bg-gray-800">
                <div className="px-3 md:px-6 py-3 md:py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-2 -ml-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        </button>

                        <div>
                            <h3 className="font-black text-gray-800 dark:text-white text-lg md:text-xl tracking-tight">{activeRoom}</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Live</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <div className="hidden md:flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: identity.color }} />
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 max-w-[150px] truncate block">
                                {identity.name}
                            </span>
                        </div>

                        <div className="md:hidden flex flex-col items-end">
                            {isEditingName ? (
                                <div className="flex gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
                                    <input
                                        className="w-28 text-xs p-1.5 rounded border border-gray-300 dark:bg-gray-800 dark:border-gray-600 text-black dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={customNameInput}
                                        onChange={(e) => setCustomNameInput(e.target.value)}
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                    />
                                    <button onClick={handleSaveName} className="bg-green-500 hover:bg-green-600 text-white px-2.5 rounded text-xs font-bold transition-colors">✓</button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => { setCustomNameInput(identity.name); setIsEditingName(true); }}
                                    className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: identity.color }} />
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 max-w-[90px] truncate block">
                                        {identity.name}
                                    </span>
                                    <span className="text-gray-400 text-[10px] ml-0.5">✎</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3 opacity-60">
                            <span className="text-5xl">👻</span>
                            <p className="text-sm font-medium">It's quiet in here... be the first!</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isMe = msg.author_name === identity.name;
                            return (
                                <div key={msg.id || index} className={`flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300 ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <span className="font-black text-xs md:text-sm tracking-tight" style={{ color: msg.author_color }}>
                                            {msg.author_name}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-medium">
                                            {formatTime(msg.created_at)}
                                        </span>
                                    </div>
                                    <div className={`p-3 md:p-4 rounded-2xl inline-block max-w-[85%] md:max-w-[70%] shadow-sm ${isMe
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-gray-100 dark:bg-gray-700/60 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-200 dark:border-gray-700'
                                        }`}>
                                        <p className="text-sm md:text-base leading-relaxed break-words">{msg.content}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} className="h-1" />
                </div>

                <div className="p-3 md:p-4 border-t border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md pb-safe">
                    <form onSubmit={handleSendMessage} className="flex gap-2 items-center bg-gray-100 dark:bg-gray-900 p-1.5 md:p-2 rounded-full ring-1 ring-gray-200 dark:ring-gray-700 focus-within:ring-2 focus-within:ring-blue-500 transition-all shadow-inner">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={`Message ${activeRoom}...`}
                            maxLength={200}
                            className="flex-1 px-4 py-2 bg-transparent border-none focus:outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 text-sm md:text-base w-full"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="p-2.5 md:p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-full transition-all shadow-md active:scale-95 flex-shrink-0"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 md:w-6 md:h-6 -rotate-45 ml-0.5 mb-0.5">
                                <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 2.304 2.304 0 00.063.012l17.456-5.682a.75.75 0 000-1.396L3.541 2.392a.75.75 0 00-.063.012zm.112 16.112l1.395-4.518H12a.75.75 0 010-1.5H4.985L3.59 17.518l11.41-3.715a.75.75 0 010 1.5l-11.41 3.715z" />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}