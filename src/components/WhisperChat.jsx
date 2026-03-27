import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const ADJECTIVES = ['Sleepy', 'Caffeinated', 'Stressed', 'Chill', 'Panicking', 'Lost', 'Sneaky', 'Bored', 'Hungry', 'Late'];
const ANIMALS = ['Capybara', 'Monyet', 'Cat', 'Dog', 'Panda', 'Raccoon', 'Labubu', 'OwaOwa', 'Hamster', 'Owl'];
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function WhisperChat() {
    const [sessionId] = useState(() => {
        let id = localStorage.getItem('whisper_session_id');
        if (!id) {
            id = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('whisper_session_id', id);
        }
        return id;
    });

    const [identity, setIdentity] = useState({ name: 'Loading...', color: '#fff' });

    const [rooms, setRooms] = useState([]);
    const [dmThreads, setDmThreads] = useState([]);
    const [activeRoom, setActiveRoom] = useState('#FinalExams');
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null);

    const [isEditingName, setIsEditingName] = useState(false);
    const [customNameInput, setCustomNameInput] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showInstructions, setShowInstructions] = useState(true);
    const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
    const [passwordModal, setPasswordModal] = useState({ isOpen: false, roomTag: '' });

    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomPassword, setNewRoomPassword] = useState('');
    const [isNewRoomPrivate, setIsNewRoomPrivate] = useState(false);
    const [enteredPassword, setEnteredPassword] = useState('');

    const [unlockedRooms, setUnlockedRooms] = useState([]);
    const [copiedShareLink, setCopiedShareLink] = useState(false);
    const messagesEndRef = useRef(null);

    const isDM = activeRoom.startsWith('dm-');
    const activeThreadId = isDM ? activeRoom.replace('dm-', '') : null;
    const activeThread = isDM ? dmThreads.find(t => t.id === activeThreadId) : null;
    const dmTargetName = activeThread ? (activeThread.user1_id === sessionId ? activeThread.user2_name : activeThread.user1_name) : 'Someone';

    useEffect(() => {
        const randomAdjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
        const randomAnimal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
        const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];

        setIdentity({
            name: `${randomAdjective} ${randomAnimal}`,
            color: randomColor
        });

        fetchRooms();
        fetchDmThreads();
        handleDeepLinks();
    }, []);

    const fetchRooms = async () => {
        const { data } = await supabase.from('whisper_rooms').select('tag, is_private, message_count, is_custom').order('message_count', { ascending: false });
        if (data) setRooms(data);
    };

    const fetchDmThreads = async () => {
        const { data } = await supabase.from('whisper_dm_threads').select('*').or(`user1_id.eq.${sessionId},user2_id.eq.${sessionId}`).order('created_at', { ascending: false });
        if (data) setDmThreads(data);
    };

    const handleDeepLinks = async () => {
        const params = new URLSearchParams(window.location.search);
        const urlRoom = params.get('room');
        const urlPwd = params.get('pwd');

        if (urlRoom) {
            const roomTag = urlRoom.startsWith('#') ? urlRoom : `#${urlRoom}`;
            if (urlPwd) {
                const { data: isValid } = await supabase.rpc('verify_room_password', { p_tag: roomTag, p_password: urlPwd });
                if (isValid) {
                    setUnlockedRooms(prev => [...prev, roomTag]);
                    setActiveRoom(roomTag);
                    return;
                }
            }
            attemptJoinRoom(roomTag);
        }
    };

    const normalizeMessage = (msg, isDmTable) => ({
        id: msg.id,
        content: msg.content,
        author_id: isDmTable ? msg.sender_id : msg.author_id,
        author_name: isDmTable ? msg.sender_name : msg.author_name,
        author_color: isDmTable ? msg.sender_color : msg.author_color,
        created_at: msg.created_at,
        reply_to_id: msg.reply_to_id,
        reply_to_author: msg.reply_to_author,
        reply_to_content: msg.reply_to_content,
        isOptimistic: msg.isOptimistic
    });

    useEffect(() => {
        let channelMessages;
        let channelRooms;
        let channelDmThreads;

        const fetchMessagesAndSubscribe = async () => {
            setIsLoading(true);
            setReplyingTo(null);

            if (isDM) {
                const { data } = await supabase.from('whisper_dm_messages').select('*').eq('thread_id', activeThreadId).order('created_at', { ascending: false }).limit(50);
                if (data) setMessages(data.reverse().map(m => normalizeMessage(m, true)));

                channelMessages = supabase.channel(`dm:${activeThreadId}`)
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whisper_dm_messages', filter: `thread_id=eq.${activeThreadId}` }, (payload) => {
                        setMessages((prev) => {
                            if (prev.some(msg => msg.id === payload.new.id)) return prev;
                            return [...prev, normalizeMessage(payload.new, true)];
                        });
                        scrollToBottom();
                    }).subscribe();
            } else {
                const { data } = await supabase.from('whisper_messages').select('*').eq('room_tag', activeRoom).order('created_at', { ascending: false }).limit(50);
                if (data) setMessages(data.reverse().map(m => normalizeMessage(m, false)));

                channelMessages = supabase.channel(`room:${activeRoom}`)
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whisper_messages', filter: `room_tag=eq.${activeRoom}` }, (payload) => {
                        setMessages((prev) => {
                            if (prev.some(msg => msg.id === payload.new.id)) return prev;
                            return [...prev, normalizeMessage(payload.new, false)];
                        });
                        scrollToBottom();
                        setRooms(prevRooms => prevRooms.map(r => r.tag === activeRoom ? { ...r, message_count: (r.message_count || 0) + 1 } : r));
                    }).subscribe();
            }
            setIsLoading(false);
        };

        channelRooms = supabase.channel('public:whisper_rooms')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whisper_rooms' }, (payload) => {
                setRooms(prev => !prev.find(r => r.tag === payload.new.tag) ? [{ tag: payload.new.tag, is_private: payload.new.is_private, message_count: 0, is_custom: payload.new.is_custom }, ...prev] : prev);
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'whisper_rooms' }, (payload) => {
                setRooms(prev => prev.filter(r => r.tag !== payload.old.tag));
                if (activeRoom === payload.old.tag) {
                    setActiveRoom('#FinalExams');
                    alert("The custom room you were in has expired and been deleted.");
                }
            }).subscribe();

        channelDmThreads = supabase.channel('public:whisper_dm_threads')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whisper_dm_threads' }, (payload) => {
                if (payload.new.user1_id === sessionId || payload.new.user2_id === sessionId) {
                    setDmThreads(prev => prev.find(t => t.id === payload.new.id) ? prev : [payload.new, ...prev]);
                }
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'whisper_dm_threads' }, (payload) => {
                setDmThreads(prev => prev.filter(t => t.id !== payload.old.id));
                if (activeRoom === `dm-${payload.old.id}`) {
                    setActiveRoom('#FinalExams');
                    alert("This private whisper has expired and been deleted.");
                }
            }).subscribe();

        fetchMessagesAndSubscribe();

        return () => {
            if (channelMessages) supabase.removeChannel(channelMessages);
            if (channelRooms) supabase.removeChannel(channelRooms);
            if (channelDmThreads) supabase.removeChannel(channelDmThreads);
        };
    }, [activeRoom]);

    const scrollToBottom = () => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    const formatTime = (isoString) => new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formatCount = (count) => !count ? '0' : (count > 999 ? (count / 1000).toFixed(1) + 'k' : count);

    const startDM = async (targetId, targetName) => {
        if (!targetId || targetId === sessionId) return;

        let thread = dmThreads.find(t => (t.user1_id === sessionId && t.user2_id === targetId) || (t.user1_id === targetId && t.user2_id === sessionId));

        if (!thread) {
            const { data } = await supabase.from('whisper_dm_threads').insert([{
                user1_id: sessionId,
                user1_name: identity.name,
                user2_id: targetId,
                user2_name: targetName
            }]).select().single();
            if (data) {
                thread = data;
                setDmThreads(prev => [thread, ...prev]);
            }
        }

        if (thread) {
            setActiveRoom(`dm-${thread.id}`);
            setIsMobileMenuOpen(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const tempId = `temp-${Date.now()}`;
        const targetTable = isDM ? 'whisper_dm_messages' : 'whisper_messages';

        const payload = isDM ? {
            thread_id: activeThreadId,
            sender_id: sessionId,
            sender_name: identity.name,
            sender_color: identity.color,
            content: newMessage.trim(),
            reply_to_id: replyingTo?.id || null,
            reply_to_author: replyingTo?.author_name || null,
            reply_to_content: replyingTo?.content || null,
        } : {
            room_tag: activeRoom,
            author_id: sessionId,
            author_name: identity.name,
            author_color: identity.color,
            content: newMessage.trim(),
            reply_to_id: replyingTo?.id || null,
            reply_to_author: replyingTo?.author_name || null,
            reply_to_content: replyingTo?.content || null,
        };

        const optimisticMessage = normalizeMessage({ ...payload, id: tempId, created_at: new Date().toISOString(), isOptimistic: true }, isDM);

        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');
        setReplyingTo(null);
        scrollToBottom();

        const { data, error } = await supabase.from(targetTable).insert([payload]).select().single();

        if (error) {
            console.error('Error:', error);
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
            alert('Failed to send message.');
        } else {
            setMessages(prev => prev.map(msg => msg.id === tempId ? normalizeMessage(data, isDM) : msg));
        }
    };

    const handleSaveName = () => {
        if (customNameInput.trim()) setIdentity(prev => ({ ...prev, name: customNameInput.trim() }));
        setIsEditingName(false);
    };

    const attemptJoinRoom = (roomTag) => {
        const room = rooms.find(r => r.tag === roomTag);
        if (room?.is_private && !unlockedRooms.includes(roomTag)) {
            setPasswordModal({ isOpen: true, roomTag });
            setEnteredPassword('');
        } else {
            setActiveRoom(roomTag);
            setIsMobileMenuOpen(false);
        }
    };

    const submitPassword = async () => {
        const { data: isValid } = await supabase.rpc('verify_room_password', { p_tag: passwordModal.roomTag, p_password: enteredPassword });
        if (isValid) {
            setUnlockedRooms(prev => [...prev, passwordModal.roomTag]);
            setActiveRoom(passwordModal.roomTag);
            setPasswordModal({ isOpen: false, roomTag: '' });
            setIsMobileMenuOpen(false);
        } else alert('Incorrect password!');
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        let formattedName = newRoomName.trim().replace(/\s+/g, '');
        if (!formattedName.startsWith('#')) formattedName = `#${formattedName}`;
        if (formattedName.length < 2) return alert("Room name too short.");

        const { error } = await supabase.from('whisper_rooms').insert([{
            tag: formattedName,
            is_private: isNewRoomPrivate,
            password: isNewRoomPrivate ? newRoomPassword : null,
            message_count: 0,
            is_custom: true
        }]);

        if (error && error.code === '23505') alert('This room already exists!');
        else if (error) alert('Failed to create room.');
        else {
            if (isNewRoomPrivate) setUnlockedRooms(prev => [...prev, formattedName]);
            setIsCreateRoomOpen(false);
            setNewRoomName(''); setNewRoomPassword(''); setIsNewRoomPrivate(false);
            fetchRooms();
            setActiveRoom(formattedName);
            setIsMobileMenuOpen(false);
        }
    };

    const shareRoom = async () => {
        if (isDM) return alert("You cannot share a link to a private Whisper!");
        const baseUrl = window.location.origin + window.location.pathname;
        let url = `${baseUrl}?room=${encodeURIComponent(activeRoom)}`;

        const roomInfo = rooms.find(r => r.tag === activeRoom);
        if (roomInfo?.is_private) {
            if (window.confirm("This is a private room. Include the password in the share link so your friends can auto-join?")) {
                const p = prompt("Enter the room password to attach it to the link:");
                if (p) url += `&pwd=${encodeURIComponent(p)}`;
            }
        }

        try {
            await navigator.clipboard.writeText(url);
            setCopiedShareLink(true);
            setTimeout(() => setCopiedShareLink(false), 2000);
        } catch { alert("Failed to copy link."); }
    };

    return (
        <div className="flex flex-row h-[calc(100dvh-2rem)] md:h-[700px] max-w-6xl mx-3 my-4 md:mx-auto md:my-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 relative">
            {showInstructions && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-300 max-h-[90dvh] overflow-y-auto">
                        <div className="text-center">
                            <div className="text-4xl mb-4">🤫</div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Whisper!</h3>
                            
                            <div className="text-gray-600 dark:text-gray-400 space-y-4 mb-6 text-sm md:text-base text-left bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                                <div>
                                    <p className="mb-2">Whisper is an anonymous campus chat. Share your thoughts, ask questions, or just hang out.</p>
                                    <ul className="list-disc list-inside space-y-1 font-medium text-sm">
                                        <li>Join official rooms or create your own custom spaces.</li>
                                        <li>Lock private rooms with a password to chat with friends.</li>
                                        <li>Reply to specific messages to keep conversations organized.</li>
                                        <li>Click a user's name in chat to start a Private Whisper 💬.</li>
                                        <li><span className="text-red-500 font-bold">Note:</span> Custom rooms automatically expire after 24 hours!</li>
                                    </ul>
                                </div>

                                <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

                                <div>
                                    <p className="mb-2">Whisper 是一个匿名的校园聊天室。在这里分享你的想法、提出问题，或者随便聊聊。</p>
                                    <ul className="list-disc list-inside space-y-1 font-medium text-sm">
                                        <li>加入官方房间或创建你自己的专属空间。</li>
                                        <li>为私密房间设置密码，与好友专属畅聊。</li>
                                        <li>回复特定消息，让对话保持井然有序。</li>
                                        <li>在聊天中点击用户昵称，发起私人密语 💬。</li>
                                        <li><span className="text-red-500 font-bold">注意：</span>自定义房间将在24小时后自动过期并消失！</li>
                                    </ul>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowInstructions(false)}
                                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 flex flex-col items-center justify-center leading-tight gap-1"
                            >
                                <span>Got it, let's chat!</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {passwordModal.isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">🔒 Room is locked</h3>
                        <p className="text-sm text-gray-500 mb-4">Enter password for {passwordModal.roomTag}</p>
                        <input type="password" autoFocus value={enteredPassword} onChange={(e) => setEnteredPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitPassword()} className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-none rounded-xl mb-4 text-black dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="Password" />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setPasswordModal({ isOpen: false, roomTag: '' })} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">Cancel</button>
                            <button onClick={submitPassword} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md">Unlock</button>
                        </div>
                    </div>
                </div>
            )}

            {isCreateRoomOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Create Custom Room</h3>
                        <p className="text-xs text-gray-500 mb-4 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">⏱️ This room will automatically expire 24 hours after creation.</p>
                        <form onSubmit={handleCreateRoom} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Room Name</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold">#</span>
                                    <input required value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} className="w-full pl-7 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black dark:text-white" placeholder="SecretBase" />
                                </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={isNewRoomPrivate} onChange={(e) => setIsNewRoomPrivate(e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Require Password (Private)</span>
                            </label>
                            {isNewRoomPrivate && <input required type="text" value={newRoomPassword} onChange={(e) => setNewRoomPassword(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black dark:text-white" placeholder="Room Password" />}
                            <div className="flex gap-2 justify-end pt-2">
                                <button type="button" onClick={() => setIsCreateRoomOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md">Create Room</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className={`md:hidden absolute inset-0 bg-black/60 z-30 transition-opacity ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)} />

            <div className={`absolute md:relative z-40 w-[75%] max-w-[300px] md:w-1/4 md:max-w-none h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="p-5 md:p-6 pb-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-800 md:border-none">
                    <h2 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2"><span className="animate-pulse">🤫</span> Whisper</h2>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {dmThreads.length > 0 && (
                        <div className="mb-4">
                            <div className="px-4 py-2"><p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Private Whispers</p></div>
                            <div className="px-3 space-y-1">
                                {dmThreads.map(thread => {
                                    const targetName = thread.user1_id === sessionId ? thread.user2_name : thread.user1_name;
                                    const dmId = `dm-${thread.id}`;
                                    return (
                                        <button key={thread.id} onClick={() => { setActiveRoom(dmId); setIsMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-xl font-bold transition-all duration-200 text-sm md:text-base flex items-center justify-between group ${activeRoom === dmId ? 'bg-pink-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'}`}>
                                            <div className="flex items-center gap-2 truncate">
                                                <span className="text-lg opacity-50">👻</span>
                                                <span className="truncate">{targetName}</span>
                                                <span title="Expires in 24h" className="text-[10px]">⏱️</span>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center px-4 py-2">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Chat Rooms</p>
                        <button onClick={() => setIsCreateRoomOpen(true)} className="text-[10px] bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded font-bold uppercase flex items-center gap-1 transition-colors"><span>+</span> Custom</button>
                    </div>
                    <div className="px-3 space-y-1 pb-4">
                        {rooms.map((room) => {
                            const isUnlocked = unlockedRooms.includes(room.tag);
                            return (
                                <button key={room.tag} onClick={() => attemptJoinRoom(room.tag)} className={`w-full text-left px-3 py-2.5 rounded-xl font-bold transition-all duration-200 text-sm md:text-base flex items-center justify-between group ${activeRoom === room.tag ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'}`}>
                                    <div className="flex items-center gap-2 truncate">
                                        <span className={`text-lg ${activeRoom === room.tag ? 'opacity-100 text-white' : 'opacity-50'}`}>#</span>
                                        <span className="truncate">{room.tag.replace('#', '')}</span>
                                        {room.is_private && <span title="Private Room"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-3.5 h-3.5 ${activeRoom === room.tag ? 'text-blue-200' : (isUnlocked ? 'text-green-500' : 'text-gray-400')}`}>{isUnlocked ? <path fillRule="evenodd" d="M14.5 9a2.5 2.5 0 00-5 0v1h5V9zM7.5 10V9a4.5 4.5 0 119 0v1h1a2 2 0 012 2v5a2 2 0 01-2 2h-13a2 2 0 01-2-2v-5a2 2 0 012-2h1zm4.5 4a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /> : <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />}</svg></span>}
                                        {room.is_custom && <span title="Expires in 24h" className="text-[10px]">⏱️</span>}
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${activeRoom === room.tag ? 'bg-blue-500/50 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:bg-gray-300 dark:group-hover:bg-gray-600'}`}>{formatCount(room.message_count)}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="hidden md:block mt-auto p-4 bg-gray-100 dark:bg-gray-900/80 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Your Alias</span>
                            <button onClick={() => { setCustomNameInput(identity.name); setIsEditingName(true); }} className="text-[10px] text-blue-500 font-bold hover:underline">EDIT</button>
                        </div>
                        {isEditingName ? (
                            <div className="flex gap-1 animate-in fade-in duration-200">
                                <input className="w-full text-sm p-1.5 rounded border border-gray-300 dark:bg-gray-800 dark:border-gray-600 text-black dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={customNameInput} onChange={(e) => setCustomNameInput(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSaveName()} />
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
                        <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg></button>
                        <div>
                            <h3 className="font-black text-gray-800 dark:text-white text-lg md:text-xl tracking-tight flex items-center gap-2">
                                {isDM ? (
                                    <>
                                        <span className="opacity-60 text-pink-500">👻 Whispering with</span> {dmTargetName}
                                    </>
                                ) : (
                                    <>
                                        {activeRoom}
                                        <button onClick={shareRoom} title="Share Link" className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors text-blue-500">
                                            {copiedShareLink ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-green-500"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>}
                                        </button>
                                    </>
                                )}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="relative flex h-2 w-2"><span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isDM ? 'bg-pink-400' : 'bg-green-400'}`}></span><span className={`relative inline-flex rounded-full h-2 w-2 ${isDM ? 'bg-pink-500' : 'bg-green-500'}`}></span></span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{isDM ? 'Private' : 'Live'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <div className="hidden md:flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: identity.color }} />
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 max-w-[150px] truncate block">{identity.name}</span>
                        </div>
                        <div className="md:hidden flex flex-col items-end">
                            {isEditingName ? (
                                <div className="flex gap-1 animate-in fade-in duration-200">
                                    <input className="w-28 text-xs p-1.5 rounded border border-gray-300 dark:bg-gray-800 dark:border-gray-600 text-black dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={customNameInput} onChange={(e) => setCustomNameInput(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSaveName()} />
                                    <button onClick={handleSaveName} className="bg-green-500 text-white px-2.5 rounded text-xs font-bold transition-colors">✓</button>
                                </div>
                            ) : (
                                <div onClick={() => { setCustomNameInput(identity.name); setIsEditingName(true); }} className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 cursor-pointer">
                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: identity.color }} />
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 max-w-[90px] truncate block">{identity.name}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full"><div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDM ? 'border-pink-500' : 'border-blue-500'}`}></div></div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3 opacity-60">
                            <span className="text-5xl">👻</span>
                            <p className="text-sm font-medium">It's quiet in here... be the first!</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isMe = msg.author_id === sessionId || (!msg.author_id && msg.author_name === identity.name);
                            const canDM = !isDM && msg.author_id && msg.author_id !== sessionId;

                            return (
                                <div key={msg.id || index} className={`group flex flex-col animate-in fade-in duration-300 ${isMe ? 'items-end' : 'items-start'} ${msg.isOptimistic ? 'opacity-70' : 'opacity-100'}`}>
                                    <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <span
                                            onClick={() => canDM ? startDM(msg.author_id, msg.author_name) : null}
                                            className={`font-black text-xs md:text-sm tracking-tight ${canDM ? 'cursor-pointer hover:underline' : ''}`}
                                            style={{ color: msg.author_color }}
                                            title={canDM ? `Click to send a Private Whisper to ${msg.author_name}` : ''}
                                        >
                                            {msg.author_name} {canDM && <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">💬</span>}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-medium">{formatTime(msg.created_at)}</span>
                                        <button onClick={() => setReplyingTo(msg)} className={`text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'mr-2' : 'ml-2'} ${isDM ? 'text-pink-500 hover:text-pink-600' : 'text-blue-500 hover:text-blue-600'} cursor-pointer`}>REPLY</button>
                                    </div>

                                    <div className={`p-3 md:p-4 rounded-xl inline-flex flex-col max-w-[85%] md:max-w-[70%] shadow-sm ${isMe ? (isDM ? 'bg-pink-600' : 'bg-blue-600') + ' text-white rounded-tr-none' : 'bg-gray-100 dark:bg-gray-700/60 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-200 dark:border-gray-700'}`}>
                                        {msg.reply_to_content && (
                                            <div className={`mb-2 p-2 rounded border-l-4 text-xs ${isMe ? 'bg-black/10 border-white/30' : 'bg-black/5 dark:bg-white/5 border-gray-300 dark:border-gray-500'}`}>
                                                <span className="font-bold opacity-70 block mb-0.5">{msg.reply_to_author}</span>
                                                <p className="opacity-80 line-clamp-2">{msg.reply_to_content}</p>
                                            </div>
                                        )}
                                        <p className="text-sm md:text-base leading-relaxed break-words">{msg.content}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} className="h-1" />
                </div>

                <div className="p-3 md:p-4 border-t border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md pb-safe">
                    <div className="bg-gray-100 dark:bg-gray-900 rounded-xl shadow-inner ring-1 ring-gray-200 dark:ring-gray-700 focus-within:ring-2 focus-within:ring-blue-500 transition-all flex flex-col overflow-hidden">
                        {replyingTo && (
                            <div className="px-3 pt-2 pb-1 flex justify-between items-start border-b border-gray-200 dark:border-gray-700 bg-black/5 dark:bg-white/5">
                                <div className={`flex flex-col min-w-0 pr-2 border-l-2 pl-2 ${isDM ? 'border-pink-500' : 'border-blue-500'}`}>
                                    <span className={`text-[10px] font-bold ${isDM ? 'text-pink-500' : 'text-blue-500'}`}>Replying to {replyingTo.author_name}</span>
                                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-full">{replyingTo.content}</span>
                                </div>
                                <button type="button" onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        )}
                        <form onSubmit={handleSendMessage} className="flex gap-2 items-center p-1.5 md:p-2">
                            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={isDM ? `Whisper to ${dmTargetName}...` : `Message ${activeRoom}...`} maxLength={200} className="flex-1 px-4 py-2 bg-transparent border-none focus:outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 text-sm md:text-base w-full" />
                            <button type="submit" disabled={!newMessage.trim()} className={`p-2.5 md:p-3 text-white rounded-xl transition-all shadow-md active:scale-95 flex-shrink-0 disabled:bg-gray-300 dark:disabled:bg-gray-700 ${isDM ? 'bg-pink-600 hover:bg-pink-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 md:w-6 md:h-6 -rotate-45 ml-0.5 mb-0.5"><path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 2.304 2.304 0 00.063.012l17.456-5.682a.75.75 0 000-1.396L3.541 2.392a.75.75 0 00-.063.012zm.112 16.112l1.395-4.518H12a.75.75 0 010-1.5H4.985L3.59 17.518l11.41-3.715a.75.75 0 010 1.5l-11.41 3.715z" /></svg>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}