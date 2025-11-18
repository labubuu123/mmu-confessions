import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useMatchmakerAuth } from '../../hooks/useMatchmakerAuth';
import MatchmakerAuth from './MatchmakerAuth';
import MatchmakerProfileForm from './MatchmakerProfileForm';
import MatchmakerPending from './MatchmakerPending';
import MatchmakerWall from './MatchmakerWall';
import MatchmakerMatches from './MatchmakerMatches';
import { Loader2, User, Heart, MessageSquare } from 'lucide-react';

export default function Matchmaker() {
    const { session, user, profile, loading, refreshProfile } = useMatchmakerAuth();
    const [view, setView] = useState('wall');
    const [showForm, setShowForm] = useState(false);
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from('matchmaker_settings').select('*');
            if (data) {
                const s = data.reduce((acc, setting) => {
                    acc[setting.setting_key] = setting.setting_value;
                    return acc;
                }, {});
                setSettings(s);
            }
        };
        fetchSettings();
    }, []);

    const handleProfileSave = () => {
        refreshProfile();
        setShowForm(false);
    };

    const renderContent = () => {
        if (loading || !settings) {
            return (
                <div className="flex justify-center items-center p-10">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                </div>
            );
        }

        if (!session || !user) {
            return <MatchmakerAuth onAuthSuccess={refreshProfile} />;
        }

        if (showForm) {
            return (
                <MatchmakerProfileForm
                    profile={profile}
                    user={user}
                    onSave={handleProfileSave}
                />
            );
        }

        if (!profile) {
            return (
                <MatchmakerProfileForm
                    profile={null}
                    user={user}
                    onSave={handleProfileSave}
                />
            );
        }

        if (profile.status === 'pending' || profile.status === 'rejected') {
            return <MatchmakerPending profile={profile} onEdit={() => setShowForm(true)} />;
        }

        if (profile.status === 'banned') {
            return (
                <div className="max-w-md mx-auto p-6 bg-red-100 dark:bg-red-900 rounded-lg shadow-xl border border-red-300 dark:border-red-700 text-center">
                    <h2 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">
                        Account Banned
                    </h2>
                    <p className="text-red-700 dark:text-red-300">
                        Your account has been banned from the matchmaker feature due to policy violations.
                    </p>
                </div>
            );
        }

        return (
            <div>
                <div className="mb-6 flex items-center justify-between border-b dark:border-gray-700">
                    <div className="flex space-x-1">
                        <button
                            onClick={() => setView('wall')}
                            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2
                ${view === 'wall'
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            <Heart className="w-5 h-5" /> Find Matches
                        </button>
                        <button
                            onClick={() => setView('matches')}
                            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2
                ${view === 'matches'
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            <MessageSquare className="w-5 h-5" /> My Matches
                        </button>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                        <User className="w-4 h-4" /> My Profile
                    </button>
                </div>

                {view === 'wall' && <MatchmakerWall user={user} settings={settings} />}
                {view === 'matches' && <MatchmakerMatches user={user} />}
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {renderContent()}
        </div>
    );
}