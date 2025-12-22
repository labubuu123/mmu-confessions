import React, { useState, useRef } from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export default function AdultPolicyGate({ onAgree, onDecline }) {
    const [canAgree, setCanAgree] = useState(false);
    const [showDoubleCheck, setShowDoubleCheck] = useState(false);
    const scrollRef = useRef(null);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop - clientHeight < 10) {
            setCanAgree(true);
        }
    };

    const handleInitialAgree = () => {
        if (canAgree) {
            setShowDoubleCheck(true);
        }
    };

    const handleFinalConfirmation = () => {
        onAgree();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
            <div className={`max-w-md w-full bg-zinc-900 border border-red-900/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh] transition-all duration-300 ${showDoubleCheck ? 'scale-95 opacity-50 blur-sm pointer-events-none' : 'scale-100 opacity-100'}`}>
                <div className="p-6 bg-gradient-to-b from-red-950/50 to-zinc-900 border-b border-red-900/30 text-center shrink-0">
                    <div className="w-16 h-16 bg-red-950 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-800 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                        <span className="text-2xl font-black text-red-500">18+</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-1">Restricted Zone</h1>
                    <p className="text-zinc-400 text-sm">Strict Moderation & Adult Themes</p>
                </div>

                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="p-6 overflow-y-auto space-y-4 text-zinc-300 text-sm leading-relaxed border-b border-zinc-800 bg-zinc-900/50"
                >
                    <div className="bg-red-950/30 p-3 rounded-lg border border-red-900/30 flex gap-3 mb-4">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                        <p className="text-red-200 font-bold text-xs">WARNING: This section contains user-generated content intended for mature audiences only.</p>
                    </div>

                    <h3 className="font-bold text-white uppercase tracking-wider text-xs">1. Age Requirement</h3>
                    <p>By entering, you confirm you are at least 18 years old. Access by minors is strictly prohibited.</p>

                    <h3 className="font-bold text-white uppercase tracking-wider text-xs">2. Prohibited Content</h3>
                    <p>No illegal acts, CSAM, non-consensual content, doxxing, or solicitation. Zero tolerance policy.</p>

                    <h3 className="font-bold text-white uppercase tracking-wider text-xs">3. AI Moderation</h3>
                    <p>All posts are analyzed by Gemini AI. Unsafe content is automatically blocked.</p>

                    <p className="pt-4 text-center text-zinc-500 italic text-xs">
                        (Please scroll to the bottom to agree)
                    </p>
                </div>

                <div className="p-4 bg-zinc-900 flex flex-col gap-3 shrink-0">
                    <button
                        onClick={handleInitialAgree}
                        disabled={!canAgree}
                        className={`w-full py-4 rounded-xl font-bold transition-all uppercase tracking-wider flex items-center justify-center gap-2 ${canAgree
                            ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            }`}
                    >
                        {canAgree ? <><CheckCircle2 className="w-5 h-5" /> I Understand & Agree</> : 'Scroll to Read Full Policy'}
                    </button>
                    <button
                        onClick={onDecline}
                        className="w-full py-3 text-zinc-500 hover:text-white font-medium transition-colors text-sm"
                    >
                        Decline & Exit
                    </button>
                </div>
            </div>

            {showDoubleCheck && (
                <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
                    <div className="bg-zinc-950 border-2 border-red-600 p-8 rounded-2xl max-w-sm w-full shadow-[0_0_50px_rgba(220,38,38,0.4)] text-center animate-in zoom-in-95 duration-200">
                        <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4 animate-bounce" />

                        <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Final Confirmation</h2>
                        <p className="text-zinc-400 mb-6 leading-relaxed">
                            Are you strictly over the age of 18?
                            <br />
                            <span className="text-red-500 text-xs font-bold uppercase mt-2 block">Lying about age is a violation of our terms.</span>
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={handleFinalConfirmation}
                                className="w-full bg-red-600 hover:bg-red-500 text-white py-3.5 rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-red-900/30 transition-transform active:scale-95"
                            >
                                Yes, I am 18+
                            </button>
                            <button
                                onClick={() => setShowDoubleCheck(false)}
                                className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 py-3 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                <XCircle className="w-4 h-4" /> Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}