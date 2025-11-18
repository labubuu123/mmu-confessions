import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Loader2, Check, X, Eye } from 'lucide-react';
import MatchmakerProfileModal from '../MatchmakerProfileModal';

export default function ProfileReview() {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchPendingProfiles = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error: dbError } = await supabase
                .from('matchmaker_profiles')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: true });

            if (dbError) throw dbError;
            setProfiles(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPendingProfiles();
    }, [fetchPendingProfiles]);

    const handleDecision = async (profileId, approve) => {
        if (!approve && !rejectionReason) {
            alert("Please provide a rejection reason.");
            return;
        }

        try {
            const { error } = await supabase
                .from('matchmaker_profiles')
                .update({
                    status: approve ? 'approved' : 'rejected',
                    rejection_reason: approve ? null : rejectionReason,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', profileId);

            if (error) throw error;
            setRejectionReason('');
            fetchPendingProfiles();
        } catch (err) {
            alert("Failed to update profile: " + err.message);
        }
    };

    if (loading) return <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />;
    if (error) return <div className="text-red-500">Error: {error}</div>;

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Pending Profiles ({profiles.length})
            </h2>
            {profiles.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No pending profiles.</p>
            ) : (
                <div className="space-y-4">
                    {profiles.map((profile) => (
                        <div key={profile.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{profile.nickname}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{profile.gender}, {profile.age || 'N/A'}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedProfile(profile)}
                                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <Eye className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                </button>
                            </div>
                            <div className="mt-4 pt-4 border-t dark:border-gray-700">
                                <input
                                    type="text"
                                    placeholder="Rejection Reason (if rejecting)"
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-2"
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleDecision(profile.id, true)}
                                        className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                                    >
                                        <Check className="w-4 h-4 mr-1.5" /> Approve
                                    </button>
                                    <button
                                        onClick={() => handleDecision(profile.id, false)}
                                        className="flex-1 flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                                    >
                                        <X className="w-4 h-4 mr-1.5" /> Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedProfile && (
                <MatchmakerProfileModal
                    profile={selectedProfile}
                    onClose={() => setSelectedProfile(null)}
                />
            )}
        </div>
    );
}