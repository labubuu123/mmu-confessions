import React from 'react';

export default function ReactionTooltip({ reactions }) {
    if (!reactions || Object.keys(reactions).length === 0) {
        return null;
    }

    const validReactions = Object.entries(reactions)
        .filter(([, count]) => Number(count) > 0);

    if (validReactions.length === 0) {
        return null;
    }

    const sortedReactions = validReactions
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 5);

    const totalReactions = validReactions.reduce((sum, [, count]) => sum + Number(count), 0);

    return (
        <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
                {sortedReactions.map(([emoji, count], i) => (
                    <span
                        key={emoji}
                        className="text-base bg-white dark:bg-gray-800 rounded-full border-2 border-white dark:border-gray-800 w-8 h-8 flex items-center justify-center shadow-sm"
                        style={{ zIndex: 5 - i }}
                        title={`${emoji} ${count}`}
                    >
                        {emoji}
                    </span>
                ))}
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {totalReactions} {totalReactions === 1 ? 'reaction' : 'reactions'}
            </span>
        </div>
    );
}