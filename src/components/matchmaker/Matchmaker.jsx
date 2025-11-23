import React, { useState, useEffect } from 'react';
import { useMatchmakerAuth } from '../../hooks/useMatchmakerAuth';
import { supabase } from '../../lib/supabaseClient';
import MatchmakerWelcome from './MatchmakerWelcome';
import MatchmakerProfileForm from './MatchmakerProfileForm';
import MatchmakerBrowse from './MatchmakerBrowse';
import MatchmakerConnections from './MatchmakerConnections';
import MatchmakerAdmin from './admin/MatchmakerAdmin';
import { Loader2, User, Shield, Sparkles, LogOut, AlertTriangle, Check } from 'lucide-react';

export default function Matchmaker() {
    const { session, user, profile, loading, refreshProfile } = useMatchmakerAuth();
    const [view, setView] = useState('browse');
    const [isAdmin, setIsAdmin] = useState(false);
    const [connectionCounts, setConnectionCounts] = useState({ received: 0, sent: 0, matches: 0, rejected: 0 });
    const [showWarning, setShowWarning] = useState(false);
    const [agreedToGuidelines, setAgreedToGuidelines] = useState(false);

    const totalConnectionsCount = connectionCounts.received + connectionCounts.sent + connectionCounts.matches + connectionCounts.rejected;

    useEffect(() => {
        if (user?.email === 'admin@mmu.edu') setIsAdmin(true);
    }, [user]);

    useEffect(() => {
        if (!user?.id) return;

        const fetchAllCounts = async () => {
            try {
                const { data, error } = await supabase.rpc('get_my_connections', { viewer_id: user.id });
                if (error) throw error;

                const counts = (data || []).reduce((acc, item) => {
                    if (item.status === 'pending_received') acc.received += 1;
                    else if (item.status === 'pending_sent') acc.sent += 1;
                    else if (item.status === 'matched') acc.matches += 1;
                    else if (item.status === 'rejected') acc.rejected += 1;
                    return acc;
                }, { received: 0, sent: 0, matches: 0, rejected: 0 });

                setConnectionCounts(counts);

            } catch (err) {
                console.error("Failed to fetch connection counts", err);
            }
        };

        const handleRealtimeUpdate = () => {
            fetchAllCounts();
        };

        fetchAllCounts();

        const profileChannel = supabase.channel('public:matchmaker_profiles')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'matchmaker_profiles',
                filter: `author_id=eq.${user.id}`
            }, async () => {
                await refreshProfile();
            })
            .subscribe();

        const lovesChannel = supabase.channel('connections_realtime_count')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'matchmaker_loves' }, handleRealtimeUpdate)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'matchmaker_matches' }, handleRealtimeUpdate)
            .subscribe();

        return () => {
            supabase.removeChannel(profileChannel);
            supabase.removeChannel(lovesChannel);
        };
    }, [user?.id]);

    useEffect(() => {
        if (profile && user) {
            const storageKey = `mm_warnings_${user.id}`;
            const lastAck = parseInt(localStorage.getItem(storageKey) || '0');
            const currentWarnings = profile.warning_count || 0;

            if (currentWarnings > lastAck) {
                setShowWarning(true);
                setAgreedToGuidelines(false);
            }
        }
    }, [profile, user]);

    const handleAcknowledgeWarning = () => {
        if (!agreedToGuidelines) return;
        const storageKey = `mm_warnings_${user.id}`;
        localStorage.setItem(storageKey, profile.warning_count.toString());
        setShowWarning(false);
    };

    const handleResetIdentity = async () => {
        if (confirm("This will wipe your current profile and identity from this device. You cannot recover it. Are you sure?")) {
            const { error } = await supabase.from('matchmaker_profiles').delete().eq('author_id', user.id);
            if (error) {
                alert("Failed to delete profile. Please try again.");
                return;
            }
            await supabase.auth.signOut();
            window.location.reload();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-indigo-500 mx-auto mb-2" />
                    <p className="text-sm sm:text-base text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">Loading Matchmaker...</p>
                </div>
            </div>
        );
    }

    if (!session || !user) {
        return <MatchmakerWelcome onAuthSuccess={refreshProfile} />;
    }

    if (profile?.status === 'banned') {
        return (
            <div className="min-h-[60vh] bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 flex items-center justify-center">
                <div className="max-w-lg w-full p-6 sm:p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-center shadow-xl">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                        <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-red-700 dark:text-red-400 mb-2">Access Denied</h2>
                    <p className="text-base sm:text-lg text-red-600 dark:text-red-300 font-bold mb-4">Your account has been suspended.</p>
                    <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl border border-red-100 dark:border-red-900/30 mb-4 sm:mb-6">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold mb-1">Reason</p>
                        <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 italic">"{profile.rejection_reason || 'Violation of community standards'}"</p>
                    </div>
                    <button onClick={handleResetIdentity} className="px-6 py-3 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-xl font-bold w-full text-sm sm:text-base">
                        Create New Identity
                    </button>
                </div>
            </div>
        );
    }

    if (showWarning) {
        return (
            <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
                <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl border-l-8 border-yellow-500 overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-4 sm:p-6">
                        <div className="flex items-start gap-3 sm:gap-4 mb-4">
                            <div className="p-2 sm:p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex-shrink-0">
                                <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 dark:text-yellow-500" />
                            </div>
                            <div>
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Community Warning</h3>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Your account has received a warning from the admin. Please review our guidelines.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer" onClick={() => setAgreedToGuidelines(!agreedToGuidelines)}>
                            <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${agreedToGuidelines ? 'bg-indigo-600 border-indigo-600' : 'border-gray-400 bg-white dark:bg-gray-700'}`}>
                                {agreedToGuidelines && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 select-none">
                                I have read and agree to follow the Community Guidelines.
                            </span>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-3 sm:p-4 flex justify-end">
                        <button onClick={handleAcknowledgeWarning} disabled={!agreedToGuidelines} className="px-4 sm:px-6 py-2 bg-indigo-600 text-white text-sm sm:text-base font-bold rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            Resume Matchmaker
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!profile || (profile.status !== 'approved' && view !== 'admin')) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8 px-3 sm:px-4">
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
            <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 shadow-sm transition-colors">
                <div className="max-w-5xl mx-auto px-3 sm:px-4">
                    <div className="flex justify-between items-center h-14 sm:h-16">
                        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 cursor-pointer" onClick={() => setView('browse')}>
                            <Sparkles className="fill-indigo-600 dark:fill-indigo-400 w-5 h-5 sm:w-6 sm:h-6" />
                            <span className="hidden xs:inline">MMU Matchmaker</span>
                            <span className="xs:hidden">MMU Matchmaker</span>
                        </h1>

                        <div className="flex items-center gap-1 sm:gap-2">
                            {isAdmin && (
                                <button onClick={() => setView('admin')}
                                    className={`p-2 rounded-xl transition-all ${view === 'admin' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                    <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                            )}
                            <button onClick={() => setView('profile')}
                                className={`p-2 rounded-xl transition-all ${view === 'profile' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                <User className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex space-x-4 sm:space-x-6 overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
                        <button
                            onClick={() => setView('browse')}
                            className={`pb-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition-colors relative whitespace-nowrap ${view === 'browse' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-indigo-400'}`}
                        >
                            Find Love
                        </button>
                        <button
                            onClick={() => setView('connections')}
                            className={`pb-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${view === 'connections' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-indigo-400'}`}
                        >
                            Connections
                            {totalConnectionsCount > 0 && (
                                <span className="bg-red-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] sm:min-w-[20px] h-4 sm:h-5 flex items-center justify-center animate-pulse leading-none shadow-sm">
                                    {totalConnectionsCount > 99 ? '99+' : totalConnectionsCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-2 sm:px-4 py-3 sm:py-4 md:py-6">
                {view === 'browse' && <MatchmakerBrowse user={user} userProfile={profile} />}
                {view === 'connections' && <MatchmakerConnections user={user} userProfile={profile} connectionCounts={connectionCounts} setConnectionCounts={setConnectionCounts} />}
                {view === 'profile' && (
                    <MatchmakerProfileForm profile={profile} user={user} onSave={() => { refreshProfile(); setView('browse'); }} />
                )}
                {view === 'admin' && isAdmin && <MatchmakerAdmin />}
            </div>
        </div>
    );
}