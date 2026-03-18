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
            scrollToBottom();

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

    const formatTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="max-w-4xl mx-auto my-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col md:flex-row h-[600px]">
            <div className="w-full md:w-1/3 border-r border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <span className="text-xl">🤫</span> Whisper Rooms
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Ephemeral • Anonymous • Live
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {TRENDING_ROOMS.map((room) => (
                        <button
                            key={room}
                            onClick={() => setActiveRoom(room)}
                            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${activeRoom === room
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            {room}
                        </button>
                    ))}
                </div>

                <div className="p-4 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">You are chatting as:</p>
                        {!isEditingName && (
                            <button
                                onClick={() => {
                                    setCustomNameInput(identity.name);
                                    setIsEditingName(true);
                                }}
                                className="text-[10px] text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                            >
                                Change Name
                            </button>
                        )}
                    </div>

                    {isEditingName ? (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={customNameInput}
                                onChange={(e) => setCustomNameInput(e.target.value)}
                                maxLength={20}
                                placeholder="Enter name..."
                                className="flex-1 min-w-0 px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 dark:text-gray-100"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveName();
                                    if (e.key === 'Escape') setIsEditingName(false);
                                }}
                            />
                            <button
                                onClick={handleSaveName}
                                className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded hover:bg-blue-600 transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 font-semibold" style={{ color: identity.color }}>
                            <div
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: identity.color }}
                            ></div>
                            <span className="truncate" title={identity.name}>{identity.name}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 relative">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 shadow-sm z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center justify-between">
                        {activeRoom}
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                    </h3>
                    <p className="text-xs text-red-400">Messages disappear after 24 hours.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center text-gray-400">
                            Joining room...
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-gray-400 space-y-2">
                            <span className="text-4xl">👻</span>
                            <p>It's quiet here. Be the first to whisper!</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isMe = msg.author_name === identity.name && msg.author_color === identity.color;

                            return (
                                <div
                                    key={msg.id || index}
                                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                >
                                    {!isMe && (
                                        <span
                                            className="text-xs font-bold mb-1 ml-1"
                                            style={{ color: msg.author_color }}
                                        >
                                            {msg.author_name}
                                        </span>
                                    )}
                                    <div
                                        className={`max-w-[75%] px-4 py-2 rounded-2xl ${isMe
                                            ? 'bg-blue-500 text-white rounded-tr-none'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none'
                                            }`}
                                    >
                                        <p className="break-words text-sm md:text-base">{msg.content}</p>
                                    </div>
                                    <span className="text-[10px] text-gray-400 mt-1 mx-1">
                                        {formatTime(msg.created_at)}
                                    </span>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={`Whisper in ${activeRoom}...`}
                            maxLength={200}
                            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-900 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100 placeholder-gray-400 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-colors flex items-center justify-center shadow-md"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 -rotate-45 ml-1">
                                <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}