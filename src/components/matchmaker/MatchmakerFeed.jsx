import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { MessageCircle, MapPin, Send, Loader2, Hand, Megaphone } from 'lucide-react';

export default function MatchmakerFeed({ user, userProfile }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newPost, setNewPost] = useState({ content: '', location_tag: '' });
    const [submitting, setSubmitting] = useState(false);
    const [claimingId, setClaimingId] = useState(null);

    const fetchFeed = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('matchmaker_feed')
            .select('*')
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(50);

        if (!error) setPosts(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchFeed();
        const channel = supabase.channel('public:matchmaker_feed')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matchmaker_feed', filter: "status=eq.approved" },
                (payload) => setPosts(prev => [payload.new, ...prev]))
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newPost.content.trim()) return;
        setSubmitting(true);

        try {
            const { error } = await supabase.from('matchmaker_feed').insert({
                author_id: user.id,
                content: newPost.content,
                location_tag: newPost.location_tag || 'Campus',
                gender: userProfile.gender,
                status: 'approved'
            });

            if (error) throw error;
            setShowModal(false);
            setNewPost({ content: '', location_tag: '' });
            fetchFeed();
        } catch (err) {
            alert("Failed to post: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClaim = async (post) => {
        if (post.author_id === user.id) return alert("You can't claim your own post!");
        if (!confirm("Is this really you? Clicking 'Yes' will send a connection request to the poster.")) return;

        setClaimingId(post.id);
        try {
            const { data: existing } = await supabase.rpc('get_my_connections', { viewer_id: user.id });
            const alreadyConnected = existing?.some(c => c.other_user_id === post.author_id);

            if (alreadyConnected) {
                alert("You are already connected (or pending) with this person!");
                return;
            }

            const { error } = await supabase.rpc('handle_love_action', {
                target_user_id: post.author_id,
                action_type: 'love',
                message_in: `👋 I replied to your shoutout: "${post.content.substring(0, 30)}..."`
            });

            if (error) throw error;
            alert("Request sent! Check your 'Connections' tab.");

        } catch (err) {
            alert("Error sending request. Please try again.");
            console.error(err);
        } finally {
            setClaimingId(null);
        }
    };

    const PostCard = ({ post }) => {
        const isMale = post.gender === 'male';
        const isMine = post.author_id === user.id;

        return (
            <div className={`p-4 rounded-2xl border shadow-sm relative overflow-hidden transition-all hover:shadow-md animate-in slide-in-from-bottom-2
                ${isMale ? 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-800' : 'bg-pink-50/50 border-pink-100 dark:bg-pink-900/10 dark:border-pink-800'}`}>

                <MessageCircle className={`absolute -right-4 -bottom-4 w-24 h-24 opacity-5 
                    ${isMale ? 'text-indigo-600' : 'text-pink-600'}`} />

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider
                            ${isMale ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300'}`}>
                            {post.location_tag || 'Campus'}
                        </span>
                        <span className="text-[10px] text-gray-400">
                            {new Date(post.created_at).toLocaleDateString()}
                        </span>
                    </div>

                    <p className="text-gray-800 dark:text-gray-200 font-medium text-sm mb-4 leading-relaxed whitespace-pre-wrap break-words">
                        "{post.content}"
                    </p>

                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${isMale ? 'bg-indigo-400' : 'bg-pink-400'}`}></div>
                            <span className="text-xs text-gray-500 font-medium">
                                {isMine ? 'You posted this' : isMale ? 'Anonymous Boy' : 'Anonymous Girl'}
                            </span>
                        </div>

                        {!isMine && (
                            <button
                                onClick={() => handleClaim(post)}
                                disabled={claimingId === post.id}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95
                                ${isMale
                                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                                        : 'bg-pink-500 hover:bg-pink-600 text-white shadow-pink-200'} shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {claimingId === post.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Hand className="w-3.5 h-3.5" />}
                                That's Me!
                            </button>
                        )}
                    </div>
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
                    onClick={() => setShowModal(true)}
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
                    <p className="text-xs mt-1">Be the first to post!</p>
                </div>
            ) : (
                <div className="grid gap-3 md:grid-cols-2">
                    {posts.map(post => <PostCard key={post.id} post={post} />)}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Post a Shoutout</h3>
                        <p className="text-xs text-gray-500 mb-5">Spotted someone? Describe them politely.</p>

                        <form onSubmit={handleSubmit} className="space-y-4">
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

                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition">Cancel</button>
                                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50">
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Post
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}