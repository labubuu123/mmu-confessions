import React, { useState, useRef } from 'react';
import { Shield, AlertTriangle, Heart, Eye, Lock, UserX, CheckCircle2, ScrollText, Scale, Info } from 'lucide-react';

export default function MatchmakerPolicy({ onAccept, onCancel }) {
    const [canAccept, setCanAccept] = useState(false);
    const contentRef = useRef(null);

    const handleScroll = (e) => {
        const element = e.target;
        if (element.scrollHeight - element.scrollTop - element.clientHeight < 50) {
            setCanAccept(true);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-sm flex items-end md:items-center justify-center p-2 md:p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-2xl h-[92vh] md:h-[85vh] rounded-2xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 transition-all">
                <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center z-10 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                            <Heart className="w-6 h-6 fill-current" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white leading-none">MMU Matchmaker</h2>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-1">Community & Safety Pact</p>
                        </div>
                    </div>
                </div>

                <div
                    className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth"
                    onScroll={handleScroll}
                    ref={contentRef}
                >
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 flex gap-3">
                        <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed font-medium">
                            Welcome to MMU Matchmaker! This is a safe space for students to connect.
                            To ensure everyone's safety, you must read and agree to the following rules before creating a profile.
                        </p>
                    </div>

                    <PolicySection
                        icon={<Lock />}
                        title="1. Privacy & Anonymity"
                        titleCN="隐私与匿名"
                        color="text-blue-500"
                    >
                        <ul className="space-y-3 pl-2">
                            <ListItem>
                                <strong>No Public Contact Info:</strong> Do NOT put your Instagram, WhatsApp, or Telegram handle in your public Bio. Use the designated "Secret Contact" field only.
                            </ListItem>
                            <ListItem>
                                <strong>Respect Privacy:</strong> Do not share screenshots of private profiles or conversations on other social media platforms without consent.
                            </ListItem>
                        </ul>
                    </PolicySection>

                    <PolicySection
                        icon={<Shield />}
                        title="2. Authenticity & Honesty"
                        titleCN="真实与诚信"
                        color="text-green-500"
                    >
                        <ul className="space-y-3 pl-2">
                            <ListItem>
                                <strong>Real Identity:</strong> You must be a current MMU student. Impersonating others (Catfishing) will result in a permanent ban.
                            </ListItem>
                            <ListItem>
                                <strong>Accurate Details:</strong> Your Age, Gender, and Major must be accurate. Misleading potential matches is prohibited.
                            </ListItem>
                        </ul>
                    </PolicySection>

                    <PolicySection
                        icon={<UserX />}
                        title="3. Zero Tolerance for Harassment"
                        titleCN="零容忍骚扰"
                        color="text-red-500"
                    >
                        <ul className="space-y-3 pl-2">
                            <ListItem>
                                <strong>No Means No:</strong> If someone declines a match or stops replying, respect their decision. Repeated unwanted contact is harassment.
                            </ListItem>
                            <ListItem>
                                <strong>Hate Speech:</strong> Any form of racism, sexism, or discrimination in profiles or messages will be reported to administration.
                            </ListItem>
                            <ListItem>
                                <strong>Unsolicited Content:</strong> Do not send explicit images or messages. This is a dating platform, not a place for solicitation.
                            </ListItem>
                        </ul>
                    </PolicySection>

                    <PolicySection
                        icon={<Eye />}
                        title="4. Safety First"
                        titleCN="安全第一"
                        color="text-orange-500"
                    >
                        <ul className="space-y-3 pl-2">
                            <ListItem>
                                <strong>Meet in Public:</strong> If you decide to meet a match, always choose a public place on campus (e.g., Library, CLC, FOB) for the first time.
                            </ListItem>
                            <ListItem>
                                <strong>Verify:</strong> We recommend video calling or verifying social media before meeting in person.
                            </ListItem>
                            <ListItem>
                                <strong>Trust Your Instincts:</strong> If something feels off, unmatch and report the user immediately.
                            </ListItem>
                        </ul>
                    </PolicySection>

                    <div className="p-4 border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-800 dark:text-yellow-200 text-sm">
                        <strong>Disclaimer:</strong> MMU Confessions provides this platform for students to connect but is not responsible for offline interactions. Please use judgment and prioritize your safety.
                    </div>

                    <div className="h-8" />
                </div>

                <div className="p-4 md:p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 z-10 flex flex-col gap-3">
                    {!canAccept && (
                        <div className="text-center text-xs text-red-500 font-bold animate-pulse">
                            Please scroll to the bottom to accept
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 md:py-4 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-sm md:text-base"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onAccept}
                            disabled={!canAccept}
                            className={`flex-[2] flex items-center justify-center gap-2 py-3 md:py-4 rounded-xl font-bold text-sm md:text-lg transition-all duration-300 transform
                            ${canAccept
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl hover:-translate-y-1 cursor-pointer'
                                    : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed opacity-70'}`}
                        >
                            {canAccept ? (
                                <>
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span>I Agree & Continue</span>
                                </>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <ScrollText className="w-4 h-4" />
                                    Read to Accept
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PolicySection({ icon, title, titleCN, color, children }) {
    return (
        <section className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
            <div className={`flex items-center gap-3 mb-4 ${color}`}>
                <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    {React.cloneElement(icon, { className: "w-6 h-6" })}
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{title}</h3>
                    <p className="text-xs font-bold opacity-60 uppercase tracking-wider">{titleCN}</p>
                </div>
            </div>
            {children}
        </section>
    );
}

function ListItem({ children }) {
    return (
        <li className="flex gap-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mt-2 flex-shrink-0" />
            <span>{children}</span>
        </li>
    );
}