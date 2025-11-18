import React from 'react';
import { User, UserCog, HelpCircle } from 'lucide-react';

/**
 * Renders a static avatar based on gender.
 * @param {object} props
 * @param {'male' | 'female' | 'undisclosed'} props.gender
 * @param {string} [props.className]
 */
export default function MatchmakerAvatar({ gender, className = 'w-16 h-16' }) {
    const commonClasses = `flex items-center justify-center rounded-full ${className}`;

    switch (gender) {
        case 'male':
            return (
                <div
                    className={`${commonClasses} bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300`}
                >
                    <User className="w-2/3 h-2/3" />
                </div>
            );
        case 'female':
            return (
                <div
                    className={`${commonClasses} bg-pink-100 text-pink-600 dark:bg-pink-800 dark:text-pink-300`}
                >
                    <UserCog className="w-2/3 h-2/3" />
                </div>
            );
        case 'undisclosed':
        default:
            return (
                <div
                    className={`${commonClasses} bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300`}
                >
                    <HelpCircle className="w-2/3 h-2/3" />
                </div>
            );
    }
}