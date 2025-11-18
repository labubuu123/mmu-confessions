import React, { useState } from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function MatchmakerPending({ profile, onEdit }) {
    const [deleting, setDeleting] = useState(false);

    const handleWithdraw = async () => {
        if (!confirm("Are you sure you want to withdraw your request? This will delete your profile data.")) {
            return;
        }

        setDeleting(true);
        try {
            const { error } = await supabase
                .from('matchmaker_profiles')
                .delete()
                .eq('id', profile.id);

            if (error) throw error;

            window.location.reload();
        } catch (err) {
            console.error("Error withdrawing:", err);
            alert("Failed to withdraw request: " + err.message);
            setDeleting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 text-center">
            <Clock className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Profile Under Review
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
                Your profile is currently being reviewed by our admins. You'll be able to see
                the matchmaker wall once it's approved.
            </p>
            {profile?.status === 'rejected' && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-md">
                    <h3 className="font-semibold text-red-800 dark:text-red-200">
                        Submission Rejected
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        <strong>Reason:</strong> {profile.rejection_reason || 'No reason provided.'}
                    </p>
                </div>
            )}

            <div className="space-y-3">
                <button
                    onClick={onEdit}
                    className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    {profile?.status === 'rejected' ? 'Edit and Resubmit' : 'Edit Profile'}
                </button>

                <button
                    onClick={handleWithdraw}
                    disabled={deleting}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center justify-center gap-2"
                >
                    <Trash2 className="w-4 h-4" />
                    {deleting ? 'Withdrawing...' : 'Withdraw Request'}
                </button>
            </div>
        </div>
    );
}