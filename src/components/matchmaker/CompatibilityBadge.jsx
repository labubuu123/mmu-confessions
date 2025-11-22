import React, { useMemo } from 'react';
import { calculateCompatibility } from '../../utils/compatibility';
import { Zap } from 'lucide-react';

export default function CompatibilityBadge({ myProfile, theirProfile }) {
    const result = useMemo(() => {
        if (!myProfile || !theirProfile) return null;
        return calculateCompatibility(myProfile, theirProfile);
    }, [myProfile, theirProfile]);

    if (!result) return null;

    let theme = {
        bg: "bg-gray-100 dark:bg-gray-700",
        text: "text-gray-600 dark:text-gray-300",
        border: "border-gray-200 dark:border-gray-600",
        icon: "text-gray-400"
    };

    if (result.score >= 80) {
        theme = {
            bg: "bg-green-50 dark:bg-green-900/30",
            text: "text-green-700 dark:text-green-300",
            border: "border-green-200 dark:border-green-800",
            icon: "text-green-500"
        };
    } else if (result.score >= 50) {
        theme = {
            bg: "bg-indigo-50 dark:bg-indigo-900/30",
            text: "text-indigo-700 dark:text-indigo-300",
            border: "border-indigo-200 dark:border-indigo-800",
            icon: "text-indigo-500"
        };
    } else {
        theme = {
            bg: "bg-orange-50 dark:bg-orange-900/20",
            text: "text-orange-700 dark:text-orange-300",
            border: "border-orange-200 dark:border-orange-800",
            icon: "text-orange-500"
        };
    }

    return (
        <div className={`mt-3 mb-1 p-3 rounded-xl border ${theme.border} ${theme.bg} flex items-center gap-3 transition-colors`}>
            <div className="relative flex-shrink-0">
                <svg className="w-12 h-12 transform -rotate-90">
                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-200 dark:text-gray-700" />
                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={125.6} strokeDashoffset={125.6 - (125.6 * result.score) / 100} className={theme.text} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-xs font-black ${theme.text}`}>{result.score}</span>
                </div>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <Zap className={`w-3.5 h-3.5 ${theme.icon} fill-current`} />
                    <span className={`text-sm font-bold ${theme.text}`}>{result.summary}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {result.reasons.length > 0 ? (
                        result.reasons.map((reason, idx) => (
                            <span key={idx} className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/10 truncate max-w-full">
                                {reason}
                            </span>
                        ))
                    ) : (
                        <span className="text-[10px] opacity-70">Based on profile analysis</span>
                    )}
                </div>
            </div>
        </div>
    );
}