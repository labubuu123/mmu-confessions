import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { MessageCircle, MapPin, Send, Loader2, Hand, Megaphone, Heart, Check, X, Trash2 } from 'lucide-react';

export default function MatchmakerFeed({ user, userProfile }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showPostModal, setShowPostModal] = useState(false);
    const [newPost, setNewPost] = useState({ content: '', location_tag: '' });
    const [submitting, setSubmitting] = useState(false);

    const [messageTarget, setMessageTarget] = useState(null);
    const [connectMessage, setConnectMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [myConnections, setMyConnections] = useState(new Set());

    const fetchData = async () => {
        setLoading(true);

        const { data: feedData } = await supabase
            .from('matchmaker_feed')
            .select('*')
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(50);

        const { data: connectionData } = await supabase.rpc('get_my_connections', { viewer_id: user.id });

        if (feedData) setPosts(feedData);

        if (connectionData) {
            const connectedIds = new Set(connectionData.map(c => c.other_user_id));
            setMyConnections(connectedIds);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchData();

        const channel = supabase.channel('public:matchmaker_feed_realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matchmaker_feed', filter: "status=eq.approved" },
                (payload) => {
                    setPosts(prev => {
                        if (prev.find(p => p.id === payload.new.id)) return prev;
                        return [payload.new, ...prev];
                    });
                })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'matchmaker_feed' },
                (payload) => setPosts(prev => prev.filter(p => p.id !== payload.old.id)))
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user.id]);

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        if (!newPost.content.trim()) return;
        setSubmitting(true);

        try {
            const { data, error } = await supabase.from('matchmaker_feed').insert({
                author_id: user.id,
                content: newPost.content,
                location_tag: newPost.location_tag || 'Campus',
                gender: userProfile.gender,
                status: 'approved'
            }).select().single();

            if (error) throw error;

            setShowPostModal(false);
            setNewPost({ content: '', location_tag: '' });
            setPosts(prev => [data, ...prev]);

        } catch (err) {
            alert("Failed to post: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (postId) => {
        if (!confirm("Are you sure you want to delete this shoutout?")) return;

        setPosts(prev => prev.filter(p => p.id !== postId));

        try {
            const { error } = await supabase.from('matchmaker_feed').delete().eq('id', postId);
            if (error) throw error;
        } catch (err) {
            alert("Failed to delete: " + err.message);
            fetchData();
        }
    };

    const handleConnectClick = (post) => {
        if (post.author_id === user.id) return;
        setConnectMessage(`Hi! I saw your shoutout about "${post.location_tag}".`);
        setMessageTarget(post);
    };

    const sendLove = async () => {
        if (!messageTarget || isSending) return;
        setIsSending(true);

        try {
            const { error } = await supabase.rpc('handle_love_action', {
                target_user_id: messageTarget.author_id,
                action_type: 'love',
                message_in: connectMessage.trim() || null
            });

            if (error) throw error;

            setMyConnections(prev => new Set(prev).add(messageTarget.author_id));
            setMessageTarget(null);
            setConnectMessage('');

        } catch (err) {
            alert("Failed to send request. " + err.message);
        } finally {
            setIsSending(false);
        }
    };

    const PostCard = ({ post }) => {
        const isMale = post.gender === 'male';
        const isMine = post.author_id === user.id;
        const hasConnected = myConnections.has(post.author_id);

        return (
            <div className={`p-4 rounded-2xl border shadow-sm relative overflow-hidden transition-all hover:shadow-md animate-in slide-in-from-bottom-2 flex flex-col
                ${isMale ? 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-800' : 'bg-pink-50/50 border-pink-100 dark:bg-pink-900/10 dark:border-pink-800'}`}>

                <MessageCircle className={`absolute -right-4 -bottom-4 w-24 h-24 opacity-5 
                    ${isMale ? 'text-indigo-600' : 'text-pink-600'}`} />

                <div className="relative z-10 flex-1">
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider
                            ${isMale ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300'}`}>
                            {post.location_tag || 'Campus'}
                        </span>

                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400">
                                {new Date(post.created_at).toLocaleDateString()}
                            </span>
                            {isMine && (
                                <button
                                    onClick={() => handleDelete(post.id)}
                                    className="p-1 -mr-1 text-gray-400 hover:text-red-500 transition-colors z-20"
                                    title="Delete your post"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <p className="text-gray-800 dark:text-gray-200 font-medium text-sm mb-4 leading-relaxed whitespace-pre-wrap break-words">
                        "{post.content}"
                    </p>
                </div>

                <div className="relative z-10 flex items-center justify-between mt-auto pt-2">
                    <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${isMale ? 'bg-indigo-400' : 'bg-pink-400'}`}></div>
                        <span className="text-xs text-gray-500 font-medium">
                            {isMine ? 'You' : isMale ? 'Anonymous Boy' : 'Anonymous Girl'}
                        </span>
                    </div>

                    {!isMine && (
                        <button
                            onClick={() => handleConnectClick(post)}
                            disabled={hasConnected}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95
                            ${hasConnected
                                    ? 'bg-green-50 text-green-600 cursor-default'
                                    : 'bg-violet-600 hover:bg-violet-700 text-white'}`}
                        >
                            {hasConnected ? (
                                <><Check className="w-3.5 h-3.5" /> Sent</>
                            ) : (
                                <><Heart className="w-3.5 h-3.5 fill-current" /> Connect</>
                            )}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="pb-24 min-h-screen">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <button
                    onClick={() => setShowPostModal(true)}
                    className="flex-1 text-left text-sm text-gray-400 bg-gray-50 dark:bg-gray-900 py-3 px-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                >
                    Missed a connection? Shout it out here...
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                    <span className="text-xs text-gray-500">Loading feed...</span>
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-16 text-gray-400 flex flex-col items-center">
                    <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
                    <p className="font-medium">No shoutouts yet.</p>
                </div>
            ) : (
                <div className="grid gap-3 md:grid-cols-2">
                    {posts.map(post => <PostCard key={post.id} post={post} />)}
                </div>
            )}

            {showPostModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowPostModal(false)}>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Post a Shoutout</h3>
                            <button onClick={() => setShowPostModal(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-5 h-5 text-gray-400" /></button>
                        </div>

                        <form onSubmit={handlePostSubmit} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Message</label>
                                <textarea
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white resize-none"
                                    rows={3}
                                    placeholder="e.g. the girl I saw in Ixora Block D lift, wearing a white shirt…"
                                    value={newPost.content}
                                    onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                                    maxLength={150}
                                    autoFocus
                                    required
                                />
                                <div className="text-right text-[10px] text-gray-400 mt-1">{newPost.content.length}/150</div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Location</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        className="w-full pl-9 p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                                        placeholder="e.g. Library, Ixora Lift, CLC, CDP"
                                        value={newPost.location_tag}
                                        onChange={e => setNewPost({ ...newPost, location_tag: e.target.value })}
                                        maxLength={20}
                                    />
                                </div>
                            </div>
                            <button type="submit" disabled={submitting} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50">
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Post
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {messageTarget && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => { if (!isSending) setMessageTarget(null); }}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${messageTarget.gender === 'male' ? 'bg-indigo-100 text-indigo-600' : 'bg-pink-100 text-pink-600'}`}>
                                <Megaphone className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Connect with User</h3>
                                <p className="text-xs text-gray-500">Replying to their shoutout</p>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl mb-4 border border-gray-100 dark:border-gray-700">
                            <p className="text-xs text-gray-600 dark:text-gray-300 italic line-clamp-2">"{messageTarget.content}"</p>
                        </div>

                        <textarea
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl mb-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition text-sm"
                            rows={4}
                            placeholder="Write a message..."
                            value={connectMessage}
                            onChange={e => setConnectMessage(e.target.value)}
                            maxLength={200}
                            disabled={isSending}
                        />
                        <div className="text-right text-xs text-gray-400 mb-4">{connectMessage.length}/200</div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => { if (!isSending) setMessageTarget(null); }}
                                disabled={isSending}
                                className="flex-1 py-2.5 bg-gray-200 dark:bg-gray-700 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={sendLove}
                                disabled={isSending}
                                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center transition shadow-lg shadow-indigo-500/20"
                            >
                                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4 fill-current mr-2" />}
                                Send Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}