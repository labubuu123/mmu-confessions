import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { checkContentSafety } from '../../utils/geminiModeration';
import { Shield, Lock, Send, Sparkles, BarChart2, X, AlertCircle, Loader2 } from 'lucide-react';
import AdultNotification from './AdultNotification';

const IDENTITIES = [
    { id: 'M', label: 'Boy', icon: '♂️', color: 'from-cyan-900 to-blue-950 border-cyan-700 text-cyan-400' },
    { id: 'F', label: 'Girl', icon: '♀️', color: 'from-pink-900 to-rose-950 border-pink-700 text-pink-400' }
];

const MOODS = [
    { id: 'Confession', label: 'Confession', color: 'text-sky-400 bg-sky-950/30 border-sky-900' },
    { id: 'Horny', label: 'Thirsty', color: 'text-rose-400 bg-rose-950/30 border-rose-900' },
    { id: 'Curious', label: 'Curious', color: 'text-violet-400 bg-violet-950/30 border-violet-900' },
    { id: 'Rant', label: 'Rant', color: 'text-amber-400 bg-amber-950/30 border-amber-900' },
    { id: 'Story', label: 'Story', color: 'text-emerald-400 bg-emerald-950/30 border-emerald-900' }
];

export default function AdultPostForm({ onSuccess, onCancel }) {
    const [content, setContent] = useState("");
    const [selectedIdentity, setSelectedIdentity] = useState(null);
    const [selectedMood, setSelectedMood] = useState(MOODS[0]);

    const [showPoll, setShowPoll] = useState(false);
    const [pollOptions, setPollOptions] = useState({ a: "", b: "" });

    const [status, setStatus] = useState("idle");
    const [notificationMsg, setNotificationMsg] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        if (!selectedIdentity) {
            setStatus("error");
            setNotificationMsg("Please select your gender (Boy/Girl) before posting.");
            return;
        }

        setStatus("analyzing");
        setNotificationMsg("AI is reviewing your confession for safety...");

        try {
            const safetyResult = await checkContentSafety(content);

            if (!safetyResult.safe) {
                setStatus("blocked");
                setNotificationMsg(safetyResult.reason || "Your content violates our safety policies and cannot be posted.");
                return;
            }

            setStatus("posting");

            const anonId = localStorage.getItem('anonId') || 'anon_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('anonId', anonId);

            const tags = ['18+', `ID:${selectedIdentity.id}`, `Mood:${selectedMood.id}`];

            let pollData = null;
            let hasPoll = false;

            if (showPoll && pollOptions.a && pollOptions.b) {
                hasPoll = true;
                pollData = [
                    { id: 0, text: pollOptions.a, votes: 0 },
                    { id: 1, text: pollOptions.b, votes: 0 }
                ];
            }

            const { error } = await supabase.from('adult_confessions').insert({
                content: content,
                author_id: anonId,
                author_alias: selectedIdentity.label,
                ai_flagged: false,
                ai_score: 0,
                tags: tags,
                is_approved: true,
                has_poll: hasPoll,
                poll_options: pollData
            });

            if (error) throw error;

            setStatus("success");
            setNotificationMsg("Your secret has been posted successfully.");

            setContent("");
            setPollOptions({ a: "", b: "" });
            setShowPoll(false);
            setSelectedIdentity(null);

            setTimeout(() => {
                setStatus("idle");
                if (onSuccess) onSuccess();
            }, 2000);

        } catch (error) {
            console.error(error);
            setStatus("error");
            setNotificationMsg("Connection error. Please check your internet and try again.");
        }
    };

    return (
        <>
            <AdultNotification
                status={status === 'posting' ? 'analyzing' : status}
                message={notificationMsg}
                onClose={() => setStatus('idle')}
            />

            <div
                className={`bg-slate-900 border transition-all duration-300 rounded-2xl p-0.5 md:p-1 mb-8 relative group ${isFocused ? 'border-rose-900/50 shadow-[0_0_30px_rgba(225,29,72,0.1)]' : 'border-slate-800'}`}
                onFocus={() => setIsFocused(true)}
                onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) setIsFocused(false);
                }}
            >
                {/* Mobile: p-4, Desktop: p-5 */}
                <div className="bg-slate-900 rounded-xl p-4 md:p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-rose-900/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity"></div>

                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center border border-slate-800 text-rose-500 shadow-inner">
                                <Lock className="w-3.5 h-3.5" />
                            </div>
                            <h2 className="text-slate-200 font-bold text-sm tracking-wide">POST SECRET</h2>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 border border-slate-800 bg-slate-950/50 px-2 py-1 rounded-full">
                            <Shield className="w-3 h-3" />
                            AI MODERATED
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                        <div className="relative">
                            {/* Mobile: text-base to prevent iOS zoom, Desktop: text-sm */}
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="What keeps you awake at night? (Anonymous)"
                                className="w-full h-32 md:h-32 bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-900/50 focus:bg-slate-950 focus:ring-1 focus:ring-rose-900/30 resize-none transition-all text-base md:text-sm font-serif leading-relaxed"
                                maxLength={1000}
                            />
                            <div className="absolute bottom-3 right-3 text-[10px] text-slate-600 font-mono">
                                {content.length}/1000
                            </div>
                        </div>

                        {showPoll ? (
                            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 animate-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                                        <BarChart2 className="w-3 h-3" /> Add Poll
                                    </span>
                                    <button type="button" onClick={() => setShowPoll(false)} className="text-slate-500 hover:text-slate-300">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {/* Inputs: text-sm on mobile, text-xs on desktop */}
                                    <input
                                        type="text"
                                        placeholder="Option 1 (e.g., Do it)"
                                        value={pollOptions.a}
                                        onChange={(e) => setPollOptions({ ...pollOptions, a: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 md:py-2 text-sm md:text-xs text-slate-200 focus:border-rose-900 focus:ring-1 focus:ring-rose-900/50 outline-none"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Option 2 (e.g., Don't do it)"
                                        value={pollOptions.b}
                                        onChange={(e) => setPollOptions({ ...pollOptions, b: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 md:py-2 text-sm md:text-xs text-slate-200 focus:border-rose-900 focus:ring-1 focus:ring-rose-900/50 outline-none"
                                    />
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowPoll(true)}
                                className="text-xs flex items-center gap-1.5 text-slate-500 hover:text-rose-400 transition-colors px-1"
                            >
                                <BarChart2 className="w-3.5 h-3.5" />
                                <span>Add a Poll</span>
                            </button>
                        )}

                        <div className="border-t border-slate-800 my-2"></div>

                        <div className="flex flex-col gap-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider ml-1">
                                        Who are you? <span className="text-rose-500">*</span>
                                    </label>
                                    {!selectedIdentity && <span className="text-[10px] text-rose-500 animate-pulse">Required</span>}
                                </div>

                                <div className="grid grid-cols-2 gap-2 md:gap-3">
                                    {IDENTITIES.map(id => (
                                        <button
                                            key={id.id}
                                            type="button"
                                            onClick={() => setSelectedIdentity(id)}
                                            className={`flex items-center justify-center gap-2 px-2 py-3.5 md:px-3 md:py-3 rounded-xl border text-sm transition-all relative overflow-hidden ${selectedIdentity?.id === id.id
                                                ? `bg-gradient-to-br ${id.color} shadow-lg scale-[1.02]`
                                                : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-600 hover:text-slate-300'
                                                }`}
                                        >
                                            <span className="text-lg">{id.icon}</span>
                                            <span className="font-bold">{id.label}</span>
                                            {selectedIdentity?.id === id.id && (
                                                <div className="absolute inset-0 bg-white/5 animate-pulse"></div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider ml-1">Mood</label>
                                <div className="flex flex-wrap gap-2">
                                    {MOODS.map(m => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => setSelectedMood(m)}
                                            className={`px-3 py-2 md:py-1.5 rounded-md border text-[10px] uppercase tracking-wider transition-all ${selectedMood.id === m.id
                                                ? `${m.color} font-bold ring-1 ring-inset ring-current shadow-[0_0_10px_rgba(0,0,0,0.2)] bg-opacity-20`
                                                : 'bg-slate-950 text-slate-600 border-slate-800 hover:bg-slate-900 hover:text-slate-400'
                                                }`}
                                        >
                                            {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Mobile: Stacked full-width buttons. Desktop: Inline right-aligned */}
                            <div className="pt-2">
                                <div className="flex flex-col-reverse md:flex-row gap-3 md:items-center md:justify-end">
                                    {onCancel && (
                                        <button
                                            type="button"
                                            onClick={onCancel}
                                            className="text-slate-500 text-sm font-medium hover:text-slate-300 px-3 py-3 md:py-0 w-full md:w-auto text-center"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={status === 'analyzing' || status === 'posting' || !content.trim()}
                                        className={`bg-rose-700 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 md:py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20 active:scale-95 w-full md:w-auto md:min-w-[120px] ${!selectedIdentity && 'opacity-50 grayscale'}`}
                                    >
                                        {status === 'analyzing' || status === 'posting' ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Send className="w-3.5 h-3.5" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}