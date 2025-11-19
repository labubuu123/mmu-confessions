import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Sparkles, Loader2, HeartHandshake, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MatchmakerWelcome({ onAuthSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [policyAccepted, setPolicyAccepted] = useState(false);

    const handleEnter = async () => {
        if (!policyAccepted) {
            setError("Please agree to the Community Guidelines to start.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error: authError } = await supabase.auth.signInAnonymously();

            if (authError) throw authError;
            if (onAuthSuccess) onAuthSuccess();

        } catch (err) {
            console.error("Anonymous auth failed:", err);

            if (err.message.includes("Anonymous sign-ins are disabled")) {
                setError("System Error: Enable 'Anonymous Sign-ins' in Supabase Dashboard.");
            } else {
                setError(err.message || "Could not start session. Please retry.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-72 h-72 bg-purple-400/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-indigo-400/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-20%] left-[20%] w-72 h-72 bg-pink-400/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative w-full max-w-md bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 shadow-2xl rounded-3xl px-6 py-8 md:p-10 overflow-hidden animate-in zoom-in-95 fade-in duration-500">
                <div className="text-center space-y-4 mb-6">
                    <div className="relative inline-block group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                        <div className="relative p-4 bg-white dark:bg-gray-800 rounded-full shadow-lg ring-1 ring-gray-900/5">
                            <HeartHandshake className="w-12 h-12 md:w-14 md:h-14 text-indigo-600 dark:text-indigo-400 transform group-hover:scale-110 transition-transform duration-300" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tracking-tight">
                            MMU Matchmaker
                        </h1>
                        <p className="text-base text-gray-500 dark:text-gray-400 font-medium">
                            Connect with peers, find your duo, <br className="hidden md:block" /> or meet your soulmate anonymously.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50/80 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-300 text-sm font-medium animate-in slide-in-from-top-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="space-y-6">
                    <div
                        className={`group flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer
                        ${policyAccepted
                                ? 'bg-indigo-50/50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800'
                                : 'bg-gray-50/50 border-gray-100 dark:bg-gray-800/50 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        onClick={() => {
                            setPolicyAccepted(!policyAccepted);
                            if (!policyAccepted) setError(null);
                        }}
                    >
                        <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                            ${policyAccepted
                                ? 'bg-indigo-600 border-indigo-600'
                                : 'border-gray-300 dark:border-gray-500 group-hover:border-indigo-400'}`}>
                            {policyAccepted && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 select-none">
                            I agree to be kind, respectful, and follow the{' '}
                            <Link
                                to="/policy"
                                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline decoration-2 underline-offset-2 relative z-10"
                                onClick={(e) => e.stopPropagation()}
                                target="_blank"
                            >
                                Community Guidelines
                            </Link>.
                        </div>
                    </div>

                    <button
                        onClick={handleEnter}
                        disabled={loading || !policyAccepted}
                        className="w-full group relative flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right text-white text-lg font-bold rounded-2xl shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Creating Identity...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5 fill-white/20 group-hover:rotate-12 transition-transform" />
                                <span>Start Matching</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}