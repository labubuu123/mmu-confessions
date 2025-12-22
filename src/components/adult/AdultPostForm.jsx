import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { checkContentSafety } from '../../utils/geminiModeration';
import { Shield, Flame, Sparkles, UserCircle2, Send, Lock } from 'lucide-react';

const IDENTITIES = [
    { id: 'M', label: 'Boy', icon: '♂️' },
    { id: 'F', label: 'Girl', icon: '♀️' },
    { id: 'Couple', label: 'Couple', icon: '💞' },
    { id: 'LGBTQ+', label: 'Rainbow', icon: '🏳️‍🌈' },
    { id: 'Secret', label: 'Secret', icon: '🎭' }
];

const MOODS = [
    { id: 'Confession', label: 'Confession', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { id: 'Horny', label: 'Thirsty', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
    { id: 'Curious', label: 'Curious', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    { id: 'Rant', label: 'Rant', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
    { id: 'Story', label: 'Story time', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
];

export default function AdultPostForm({ onSuccess }) {
    const [content, setContent] = useState("");
    const [selectedIdentity, setSelectedIdentity] = useState(IDENTITIES[4]);
    const [selectedMood, setSelectedMood] = useState(MOODS[0]);
    const [submitting, setSubmitting] = useState(false);
    const [aiStatus, setAiStatus] = useState("idle");
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        setSubmitting(true);
        setAiStatus("analyzing");

        try {
            const safetyResult = await checkContentSafety(content);

            if (!safetyResult.safe) {
                setAiStatus("blocked");
                setSubmitting(false);
                alert(`⚠️ Post Blocked by AI Safety:\n\n${safetyResult.reason}\n\nWe strictly prohibit illegal content, CSAM, and non-consensual material.`);
                return;
            }

            const anonId = localStorage.getItem('anonId') || 'anon_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('anonId', anonId);

            const tags = [
                '18+',
                `ID:${selectedIdentity.id}`,
                `Mood:${selectedMood.id}`
            ];

            const { error } = await supabase.from('adult_confessions').insert({
                content: content,
                author_id: anonId,
                author_alias: selectedIdentity.label,
                ai_flagged: false,
                ai_score: 0,
                tags: tags
            });

            if (error) throw error;

            setContent("");
            setAiStatus("idle");
            if (onSuccess) onSuccess();

        } catch (error) {
            console.error(error);
            alert("Failed to post. Please try again.");
            setSubmitting(false);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className={`bg-zinc-950 border transition-all duration-300 rounded-2xl p-5 mb-8 relative group overflow-hidden ${isFocused ? 'border-red-900 shadow-[0_0_30px_rgba(127,29,29,0.2)]' : 'border-zinc-900'}`}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    setIsFocused(false);
                }
            }}
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-900/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity"></div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-red-950/30 flex items-center justify-center border border-red-900/50 text-red-500">
                            <Lock className="w-4 h-4" />
                        </div>
                        <h2 className="text-zinc-200 font-bold text-sm tracking-wide">POST SECRET <span className="text-red-600 text-[10px] ml-1 border border-red-900 px-1 rounded bg-red-950/50">18+</span></h2>
                    </div>
                    <div className="text-[10px] text-zinc-600 font-mono flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        AI MODERATED
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="What keeps you awake at night? (Anonymous)"
                            className="w-full h-32 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-red-900/50 focus:bg-zinc-900 focus:ring-1 focus:ring-red-900/30 resize-none transition-all text-sm font-serif leading-relaxed"
                        />
                        <div className="absolute bottom-3 right-3 text-[10px] text-zinc-600 font-mono">
                            {content.length} chars
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 sm:items-end justify-between border-t border-zinc-900 pt-4">
                        <div className="space-y-3 flex-1">
                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                {IDENTITIES.map(id => (
                                    <button
                                        key={id.id}
                                        type="button"
                                        onClick={() => setSelectedIdentity(id)}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all whitespace-nowrap ${selectedIdentity.id === id.id
                                            ? 'bg-zinc-100 text-black border-white font-bold shadow-md shadow-white/5'
                                            : 'bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
                                            }`}
                                    >
                                        <span>{id.icon}</span>
                                        <span>{id.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {MOODS.map(m => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => setSelectedMood(m)}
                                        className={`px-2 py-1 rounded-md border text-[10px] uppercase tracking-wider transition-all ${selectedMood.id === m.id
                                            ? `${m.color} border-current font-bold ring-1 ring-current bg-opacity-20`
                                            : 'bg-zinc-900/50 text-zinc-600 border-zinc-800 hover:bg-zinc-800'
                                            }`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || !content.trim()}
                            className="bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 active:scale-95 shrink-0"
                        >
                            {submitting ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>CONFESS</span>
                                    <Send className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>

                    {aiStatus !== 'idle' && (
                        <div className="text-center text-xs animate-in fade-in">
                            {aiStatus === 'analyzing' && <span className="text-zinc-500">Encrypting & Analyzing...</span>}
                            {aiStatus === 'blocked' && <span className="text-red-500 font-bold">🚫 Blocked by Safety Policy</span>}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}