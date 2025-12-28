import React, { useState, useRef } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, Lock, ShieldAlert, Gavel, Scale, FileWarning } from 'lucide-react';

export const ADULT_GATE_KEY = 'mmu_restricted_access_v1';
export const ADULT_GATE_VALUE = 'verified_access_grant_7x9';

export default function AdultPolicyGate({ onAgree, onDecline }) {
    const [canAgree, setCanAgree] = useState(false);
    const [showDoubleCheck, setShowDoubleCheck] = useState(false);
    const scrollRef = useRef(null);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop - clientHeight < 50) {
            setCanAgree(true);
        }
    };

    const handleInitialAgree = () => {
        if (canAgree) {
            setShowDoubleCheck(true);
        }
    };

    const handleFinalConfirmation = () => {
        localStorage.setItem(ADULT_GATE_KEY, ADULT_GATE_VALUE);
        onAgree();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">

            <div className={`relative max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] transition-all duration-500 ${showDoubleCheck ? 'scale-95 opacity-50 blur-sm pointer-events-none' : 'scale-100 opacity-100'}`}>
                <div className="p-8 pb-6 bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-800 text-center shrink-0">
                    <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-5 border-2 border-slate-800 shadow-xl shadow-black/50 relative group">
                        <Lock className="w-8 h-8 text-rose-600" />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight">RESTRICTED AREA</h1>
                    <p className="text-rose-500 text-xs font-mono tracking-widest uppercase font-bold">Strictly 18+ Only</p>
                </div>

                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="p-6 overflow-y-auto space-y-8 text-slate-400 text-sm leading-relaxed bg-slate-900 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
                >
                    <div className="bg-rose-950/30 p-4 rounded-xl border border-rose-900/50 flex gap-3">
                        <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-rose-400 font-bold text-xs uppercase mb-1">Jurisdiction Warning</p>
                            <p className="text-rose-200/70 text-xs">
                                This platform operates in strict compliance with the <strong>laws of Malaysia</strong>.
                                Your access is conditional upon your agreement to obey these regulations.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> 1. Legal Age Requirement
                        </h3>
                        <p>
                            You must be at least <strong>18 years of age</strong> to access this section.
                            Falsifying your age to access restricted content is a violation of our terms of service.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                            <Gavel className="w-4 h-4 text-slate-500" /> 2. Malaysian Penal Code Compliance
                        </h3>
                        <p>
                            While this is an adult section, <strong>explicit obscenity</strong> as defined under Section 292 of the Penal Code is prohibited.
                            <br /><br />
                            Confessions must remain textual and narrative. <strong>Pornographic visual materials, solicitation for prostitution, or soliciting sexual acts</strong> are strictly banned.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                            <Scale className="w-4 h-4 text-slate-500" /> 3. CMA 1998 (Section 233)
                        </h3>
                        <p>
                            Users are reminded of the <strong>Communications and Multimedia Act 1998</strong>. It is an offense to create or share content that is:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-slate-500 text-xs">
                            <li>Obscene, indecent, false, menacing, or offensive in character.</li>
                            <li>Intended to annoy, abuse, threaten, or harass any person.</li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                            <FileWarning className="w-4 h-4 text-slate-500" /> 4. Sensitive Topics (3R)
                        </h3>
                        <p>
                            To ensure platform safety, we strictly prohibit content touching on:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-slate-500 text-xs">
                            <li><strong>Race</strong>: No racial slurs or hate speech.</li>
                            <li><strong>Religion</strong>: No insults toward any faith or belief.</li>
                            <li><strong>Royalty</strong>: No disrespect toward the Royal Institutions.</li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> 5. Privacy & Doxxing
                        </h3>
                        <p>
                            This is a space for anonymous confessions. You may <strong>NOT</strong> reveal the real names, contact details, or identifying information of other individuals without their consent (PDPA 2010 compliance).
                        </p>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <p className="text-xs text-slate-500 text-center italic">
                            "I acknowledge that this website employs AI moderation. Content violating these Malaysian laws will be automatically removed, and my IP address may be banned."
                        </p>
                    </div>

                    {!canAgree && (
                        <div className="py-8 text-center animate-pulse">
                            <p className="text-slate-500 text-xs font-mono">↓ Scroll to the bottom to accept ↓</p>
                        </div>
                    )}
                </div>

                <div className="p-5 bg-slate-950 border-t border-slate-900 flex flex-col gap-3 shrink-0">
                    <button
                        onClick={handleInitialAgree}
                        disabled={!canAgree}
                        className={`w-full py-4 rounded-xl font-bold transition-all uppercase tracking-wider flex items-center justify-center gap-2 text-sm ${canAgree
                            ? 'bg-rose-700 hover:bg-rose-600 text-white shadow-lg shadow-rose-900/50 transform hover:-translate-y-0.5'
                            : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-70'
                            }`}
                    >
                        {canAgree ? <><CheckCircle2 className="w-5 h-5" /> I Understand & Enter</> : 'Read Full Policy to Unlock'}
                    </button>
                    <button
                        onClick={onDecline}
                        className="w-full py-3 text-slate-500 hover:text-slate-300 font-medium transition-colors text-xs uppercase tracking-widest hover:bg-slate-800 rounded-lg"
                    >
                        Decline & Return Home
                    </button>
                </div>
            </div>

            {showDoubleCheck && (
                <div className="absolute inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300 p-6">
                    <div className="bg-slate-900 border border-rose-900/50 p-8 rounded-2xl max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 duration-300 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-600 to-transparent"></div>

                        <AlertTriangle className="w-14 h-14 text-rose-600 mx-auto mb-6 animate-bounce" />

                        <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Legal Declaration</h2>
                        <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                            By clicking "Enter", you legally confirm you are <strong>18+</strong> and agree to abide by <strong>Malaysian Laws</strong> regarding online conduct.
                            <br />
                            <span className="text-rose-500 font-bold mt-2 block">False declaration is a violation of our terms.</span>
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={handleFinalConfirmation}
                                className="w-full bg-white text-slate-900 hover:bg-slate-200 py-4 rounded-xl font-bold uppercase tracking-wider shadow-lg transition-transform active:scale-95"
                            >
                                Enter (I Agree)
                            </button>
                            <button
                                onClick={() => setShowDoubleCheck(false)}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 py-3 rounded-xl font-medium text-xs uppercase tracking-wider transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}