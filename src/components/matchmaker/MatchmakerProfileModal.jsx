import React from 'react';
import MatchmakerAvatar from './MatchmakerAvatar';
import { X, MapPin, Heart, Search } from 'lucide-react';

export default function MatchmakerProfileModal({ profile, onClose }) {
    if (!profile) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full m-4 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start sm:space-x-6 mb-6">
                        <MatchmakerAvatar gender={profile.gender} className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0" />
                        <div className="mt-4 sm:mt-0 text-center sm:text-left">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                {profile.nickname}
                            </h2>
                            <div className="flex items-center justify-center sm:justify-start gap-x-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                <span>{profile.gender}</span>
                                {profile.age && <span>• {profile.age} years old</span>}
                                {profile.city && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" /> {profile.city}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {profile.interests && profile.interests.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Interests</h4>
                            <div className="flex flex-wrap gap-2">
                                {profile.interests.map((interest) => (
                                    <span
                                        key={interest}
                                        className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200"
                                    >
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        <div>
                            <h4 className="flex items-center text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                <Heart className="w-4 h-4 mr-2" />
                                About Me
                            </h4>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {profile.self_intro}
                            </p>
                        </div>
                        <div>
                            <h4 className="flex items-center text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                <Search className="w-4 h-4 mr-2" />
                                Looking For
                            </h4>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {profile.looking_for}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}