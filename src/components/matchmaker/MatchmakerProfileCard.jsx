import React from 'react';
import MatchmakerAvatar from './MatchmakerAvatar';
import { Heart, Check } from 'lucide-react';

export default function MatchmakerProfileCard({
    profile,
    onView,
    onLike,
    isLiked,
}) {
    const truncate = (text, length) => {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-lg">
            <div className="p-5">
                <div className="flex items-center space-x-4 mb-4">
                    <MatchmakerAvatar gender={profile.gender} className="w-16 h-16" />
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {profile.nickname}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {profile.age ? `${profile.age}, ` : ''}
                            {profile.city || 'Location not specified'}
                        </p>
                    </div>
                </div>

                <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 h-10">
                    {truncate(profile.self_intro, 80)}
                </p>

                {profile.interests && profile.interests.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-5">
                        {profile.interests.slice(0, 3).map((interest) => (
                            <span
                                key={interest}
                                className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                            >
                                {interest}
                            </span>
                        ))}
                        {profile.interests.length > 3 && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                +{profile.interests.length - 3} more
                            </span>
                        )}
                    </div>
                )}

                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => onView(profile)}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        View More
                    </button>
                    <button
                        onClick={() => onLike(profile.author_id)}
                        disabled={isLiked}
                        className={`flex-1 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium
                ${isLiked
                                ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70`}
                    >
                        {isLiked ? (
                            <>
                                <Check className="w-5 h-5 mr-1.5" /> Liked
                            </>
                        ) : (
                            <>
                                <Heart className="w-5 h-5 mr-1.5" /> Want to Meet
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}