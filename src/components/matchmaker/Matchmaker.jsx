import React, { useState, useEffect } from 'react';
import { useMatchmakerAuth } from '../../hooks/useMatchmakerAuth';
import { supabase } from '../../lib/supabaseClient';
import MatchmakerWelcome from './MatchmakerWelcome';
import MatchmakerProfileForm from './MatchmakerProfileForm';
import MatchmakerBrowse from './MatchmakerBrowse';
import MatchmakerConnections from './MatchmakerConnections';
import MatchmakerAdmin from './admin/MatchmakerAdmin';
import { Loader2, User, Shield, Sparkles, LogOut } from 'lucide-react';

export default function Matchmaker() {
    const { session, user, profile, loading, refreshProfile } = useMatchmakerAuth();
    const [view, setView] = useState('browse');
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (user?.email === 'admin@mmu.edu.my') setIsAdmin(true);
    }, [user]);

    const handleResetIdentity = async () => {
        if (confirm("This will wipe your current profile and identity from this device. You cannot recover it. Are you sure?")) {
            await supabase.auth.signOut();
            window.location.reload();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-2" />
                    <p className="text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">Loading Matchmaker...</p>
                </div>
            </div>
        );
    }

    if (!session || !user) {
        return <MatchmakerWelcome onAuthSuccess={refreshProfile} />;
    }

    if (profile?.status === 'banned') {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center">
                <div className="max-w-lg w-full p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-center shadow-xl">
                    <h2 className="text-3xl font-black text-red-700 dark:text-red-400 mb-2">Access Denied</h2>
                    <p className="text-lg text-red-600 dark:text-red-300 font-bold mb-1">Your account has been suspended.</p>
                    <p className="text-sm text-red-500 dark:text-red-400 mb-8 italic">
                        " {profile.rejection_reason || 'Violation of community standards'} "
                    </p>
                    <button onClick={handleResetIdentity} className="px-6 py-3 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-xl font-bold transition-colors">
                        Start Over (New Identity)
                    </button>
                </div>
            </div>
        );
    }

    if (!profile || (profile.status !== 'approved' && view !== 'admin')) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 transition-colors">
                <div className="flex justify-end max-w-2xl mx-auto mb-4">
                    <button onClick={handleResetIdentity} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                        <LogOut className="w-3 h-3" /> New Identity
                    </button>
                </div>
                <MatchmakerProfileForm profile={profile} user={user} onSave={refreshProfile} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 transition-colors duration-300">
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 shadow-sm transition-colors">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                            <Sparkles className="fill-indigo-600 dark:fill-indigo-400 w-6 h-6" />
                            <span className="hidden md:inline">Matchmaker</span>
                        </h1>

                        <div className="flex items-center gap-2">
                            {isAdmin && (
                                <button onClick={() => setView('admin')}
                                    className={`p-2 rounded-xl transition-all ${view === 'admin' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                    <Shield className="w-5 h-5" />
                                </button>
                            )}
                            <button onClick={() => setView('profile')}
                                className={`p-2 rounded-xl transition-all ${view === 'profile' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                <User className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex space-x-6">
                        <button
                            onClick={() => setView('browse')}
                            className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors ${view === 'browse' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-indigo-400'}`}
                        >
                            Find Love
                        </button>
                        <button
                            onClick={() => setView('connections')}
                            className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors ${view === 'connections' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-indigo-400'}`}
                        >
                            Connections
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-6">
                {view === 'browse' && <MatchmakerBrowse user={user} />}
                {view === 'connections' && <MatchmakerConnections user={user} />}
                {view === 'profile' && (
                    <MatchmakerProfileForm profile={profile} user={user} onSave={() => { refreshProfile(); setView('browse'); }} />
                )}
                {view === 'admin' && isAdmin && <MatchmakerAdmin />}
            </div>
        </div>
    );
}