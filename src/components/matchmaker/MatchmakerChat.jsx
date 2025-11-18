import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Loader2, Send, ArrowLeft, Shield, Check, X, Hand, Info } from 'lucide-react';
import MatchmakerAvatar from './MatchmakerAvatar';
import { useMatchmakerAuth } from '../../hooks/useMatchmakerAuth';

export default function MatchmakerChat() {
    const { match_id } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useMatchmakerAuth();
    const [matchInfo, setMatchInfo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [otherUser, setOtherUser] = useState(null);
    const [settings, setSettings] = useState({ allow_links_in_chat: 'false' });
    const [contactRequest, setContactRequest] = useState(null);
    const [showContact, setShowContact] = useState(false);
    const messagesEndRef = useRef(null);

    const sensitiveWordCheck = useCallback(async (text) => {
        try {
            const { data, error } = await supabase.rpc('check_sensitive_words', { text_in: text });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error in sensitive word check:", error);
            return false;
        }
    }, []);

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from('matchmaker_settings').select('*');
            if (data) {
                const s = data.reduce((acc, setting) => {
                    acc[setting.setting_key] = setting.setting_value;
                    return acc;
                }, {});
                setSettings(s);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        if (authLoading || !user) return;

        const fetchMatchData = async () => {
            setLoading(true);
            try {
                const { data: matchData, error: matchError } = await supabase
                    .from('matchmaker_matches')
                    .select('*')
                    .eq('id', match_id)
                    .single();

                if (matchError) throw matchError;

                if (matchData.user1_id !== user.id && matchData.user2_id !== user.id) {
                    throw new Error('Access Denied: You are not part of this match.');
                }
                setMatchInfo(matchData);
                setShowContact(matchData.contact_exchanged);

                const otherUserId = matchData.user1_id === user.id ? matchData.user2_id : matchData.user1_id;
                const { data: profileData, error: profileError } = await supabase
                    .from('matchmaker_profiles')
                    .select('nickname, gender, contact_info')
                    .eq('author_id', otherUserId)
                    .single();

                if (profileError) throw profileError;
                setOtherUser(profileData);

                const { data: messagesData, error: messagesError } = await supabase
                    .from('matchmaker_messages')
                    .select('*')
                    .eq('match_id', match_id)
                    .order('created_at', { ascending: true });

                if (messagesError) throw messagesError;
                setMessages(messagesData);

                const { data: requestData, error: requestError } = await supabase
                    .from('matchmaker_contact_requests')
                    .select('*')
                    .eq('match_id', match_id)
                    .or(`requester_id.eq.${user.id},status.eq.pending`)
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (requestData && requestData.length > 0) {
                    setContactRequest(requestData[0]);
                }

            } catch (error) {
                console.error(error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMatchData();

        const messageSubscription = supabase
            .channel(`matchmaker_messages_${match_id}`)
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'matchmaker_messages', filter: `match_id=eq.${match_id}` },
                (payload) => {
                    setMessages((currentMessages) => [...currentMessages, payload.new]);
                }
            )
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'matchmaker_contact_requests', filter: `match_id=eq.${match_id}` },
                (payload) => {
                    setContactRequest(payload.new);
                }
            )
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'matchmaker_contact_requests', filter: `match_id=eq.${match_id}` },
                (payload) => {
                    setContactRequest(payload.new);
                    if (payload.new.status === 'approved') {
                        setShowContact(true);
                    }
                }
            )
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'matchmaker_matches', filter: `id=eq.${match_id}` },
                (payload) => {
                    setMatchInfo(payload.new);
                    if (payload.new.contact_exchanged) {
                        setShowContact(true);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(messageSubscription);
        };
    }, [match_id, user, authLoading]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        if (settings.allow_links_in_chat === 'false') {
            const hasLink = /https?:\/\/[^\s]+/.test(newMessage);
            if (hasLink) {
                alert("Links are not allowed in this chat.");
                return;
            }
        }

        if (await sensitiveWordCheck(newMessage)) {
            alert("Your message contains sensitive words (like contact info) and cannot be sent. Use the 'Exchange Contact' feature.");
            return;
        }

        const messageData = {
            match_id: match_id,
            sender_id: user.id,
            message: newMessage.trim(),
        };

        setNewMessage('');
        const { error: insertError } = await supabase
            .from('matchmaker_messages')
            .insert(messageData);

        if (insertError) {
            console.error("Error sending message:", insertError);
            alert("Failed to send message: " + insertError.message);
            setNewMessage(newMessage);
        }
    };

    const handleRequestContact = async () => {
        if (window.confirm("Are you sure you want to request to exchange contact info?")) {
            const { error } = await supabase
                .from('matchmaker_contact_requests')
                .insert({ match_id: match_id, requester_id: user.id, status: 'pending' });
            if (error) alert("Failed to send request: " + error.message);
        }
    };

    const handleRespondContact = async (approve) => {
        const status = approve ? 'approved' : 'rejected';
        const { error } = await supabase
            .from('matchmaker_contact_requests')
            .update({ status: status, responded_at: new Date().toISOString() })
            .eq('id', contactRequest.id);

        if (error) {
            alert("Failed to respond: " + error.message);
        } else if (approve) {
            await supabase
                .from('matchmaker_matches')
                .update({ contact_exchanged: true })
                .eq('id', match_id);
        }
    };

    const handleBlock = async () => {
        if (window.confirm(`Are you sure you want to block ${otherUser.nickname}? This is permanent and will end the chat.`)) {
            setLoading(true);
            try {
                await supabase
                    .from('matchmaker_blocks')
                    .insert({ blocker_id: user.id, blocked_id: otherUser.author_id });

                await supabase
                    .from('matchmaker_matches')
                    .update({ is_active: false })
                    .eq('id', match_id);

                navigate('/matchmaker');
            } catch (error) {
                alert("Failed to block user: " + error.message);
                setLoading(false);
            }
        }
    }

    if (loading || authLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center p-4">
                <div className="text-center text-red-500">
                    <h2 className="text-xl font-bold mb-4">Error</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate('/matchmaker')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!matchInfo || !otherUser) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>Match not found.</p>
            </div>
        );
    }

    if (!matchInfo.is_active) {
        return (
            <div className="flex h-screen items-center justify-center p-4">
                <div className="text-center text-gray-500 dark:text-gray-400">
                    <h2 className="text-xl font-bold mb-4">Chat Ended</h2>
                    <p>This chat is no longer active.</p>
                    <button onClick={() => navigate('/matchmaker')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const renderContactBanner = () => {
        if (showContact) {
            return (
                <div className="p-3 bg-green-100 dark:bg-green-900 border-b border-green-300 dark:border-green-700">
                    <p className="text-sm text-green-800 dark:text-green-200 text-center font-semibold">
                        Contact info shared! {otherUser.nickname}'s info: {otherUser.contact_info}
                    </p>
                </div>
            );
        }

        if (contactRequest) {
            if (contactRequest.status === 'pending') {
                if (contactRequest.requester_id === user.id) {
                    return (
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900 border-b border-yellow-300 dark:border-yellow-700">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center font-semibold">
                                <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                                Contact request sent. Waiting for {otherUser.nickname} to respond...
                            </p>
                        </div>
                    );
                } else {
                    return (
                        <div className="p-3 bg-blue-100 dark:bg-blue-900 border-b border-blue-300 dark:border-blue-700 text-center">
                            <p className="text-sm text-blue-800 dark:text-blue-200 font-semibold mb-2">
                                {otherUser.nickname} wants to exchange contact info!
                            </p>
                            <div className="flex justify-center gap-3">
                                <button
                                    onClick={() => handleRespondContact(true)}
                                    className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md text-sm"
                                >
                                    <Check className="w-4 h-4 mr-1" /> Accept
                                </button>
                                <button
                                    onClick={() => handleRespondContact(false)}
                                    className="flex items-center px-3 py-1 bg-red-600 text-white rounded-md text-sm"
                                >
                                    <X className="w-4 h-4 mr-1" /> Decline
                                </button>
                            </div>
                        </div>
                    );
                }
            }
            if (contactRequest.status === 'rejected') {
                return (
                    <div className="p-3 bg-red-100 dark:bg-red-900 border-b border-red-300 dark:border-red-700">
                        <p className="text-sm text-red-800 dark:text-red-200 text-center font-semibold">
                            Contact request was declined.
                        </p>
                    </div>
                );
            }
        }

        return (
            <div className="p-3 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex items-center justify-center">
                <button
                    onClick={handleRequestContact}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                    <Info className="w-4 h-4 mr-2" />
                    Request to Exchange Contact Info
                </button>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen max-w-2xl mx-auto bg-white dark:bg-gray-900 shadow-2xl">
            <header className="flex-shrink-0 flex items-center justify-between p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
                <button onClick={() => navigate('/matchmaker')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </button>
                <div className="flex items-center space-x-3">
                    <MatchmakerAvatar gender={otherUser.gender} className="w-10 h-10" />
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        {otherUser.nickname}
                    </h2>
                </div>
                <button
                    onClick={handleBlock}
                    title={`Block ${otherUser.nickname}`}
                    className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900 text-red-500"
                >
                    <Hand className="w-6 h-6" />
                </button>
            </header>

            {renderContactBanner()}

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-xs md:max-w-md p-3 rounded-lg
                ${msg.sender_id === user.id
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                }`}
                        >
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form
                onSubmit={handleSendMessage}
                className="flex-shrink-0 p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800"
            >
                <div className="flex items-center space-x-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <button
                        type="submit"
                        className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-indigo-600 text-white rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
    );
}