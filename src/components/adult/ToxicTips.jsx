import React, { useState } from 'react';
import { Sparkles, MessageSquareWarning, X } from 'lucide-react';

const TOXIC_ADVICE = [
    "Text your ex. They definitely changed.",
    "Double text? No, triple text to show dominance.",
    "If they ignore you, sleep with their dad.",
    "Gaslight them until they apologize for your mistake.",
    "Stalking? It's called 'investigative journalism'.",
    "Post a thirst trap. That'll fix everything.",
    "It's not cheating if it's in a different area code.",
    "Go through their phone while they sleep. Trust is earned.",
    "Create a fake account to test their loyalty.",
    "Key their car. It's a love language.",
    "Tell them you're pregnant/dying just to see their reaction.",
    "Reply with 'k' to a paragraph. Watch the world burn.",
    "Date their best friend to keep them close.",
    "Ghosting is just 'protecting your energy'.",
    "Start an argument just to feel something."
];

export default function ToxicTips() {
    const [advice, setAdvice] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    const getToxicAdvice = () => {
        const random = TOXIC_ADVICE[Math.floor(Math.random() * TOXIC_ADVICE.length)];
        setAdvice(random);
        setIsVisible(true);
    };

    if (!isVisible) {
        return (
            <button
                onClick={getToxicAdvice}
                className="group flex items-center gap-1.5 text-[10px] text-slate-600 hover:text-rose-400 transition-colors mt-2 opacity-60 hover:opacity-100"
            >
                <MessageSquareWarning className="w-3 h-3 group-hover:animate-bounce" />
                <span>Need toxic advice?</span>
            </button>
        );
    }

    return (
        <div className="relative bg-gradient-to-r from-slate-900 to-rose-950/20 border border-slate-800 rounded-lg p-3 mt-3 animate-in slide-in-from-left-2 fade-in duration-300">
            <button
                onClick={() => setIsVisible(false)}
                className="absolute top-1.5 right-1.5 text-slate-600 hover:text-slate-400"
            >
                <X className="w-3 h-3" />
            </button>
            <div className="flex gap-2">
                <div className="mt-0.5 min-w-[16px]">
                    <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
                </div>
                <div>
                    <p className="text-xs text-slate-300 font-medium italic">"{advice}"</p>
                    <p className="text-[9px] text-rose-500/50 mt-1 uppercase font-bold tracking-widest">⚠️ Bad Advice Bot</p>
                </div>
            </div>
        </div>
    );
}