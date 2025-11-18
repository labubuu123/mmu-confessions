import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Loader2, Check, X, AlertCircle } from 'lucide-react';

export default function ProfileReview() {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [imageUrls, setImageUrls] = useState({});
    const [rejectionReasons, setRejectionReasons] = useState({});

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

            const urls = {};
            for (const profile of data) {
                let selfieUrl = null;
                if (profile.selfie_url) {
                    const { data: selfieData } = supabase.storage
                        .from('matchmaker_selfies')
                        .getPublicUrl(profile.selfie_url);
                    selfieUrl = selfieData.publicUrl;
                }

                let studentIdUrl = null;
                if (profile.student_id_url) {
                    const { data: idData, error: idError } = await supabase.storage
                        .from('matchmaker_verification')
                        .createSignedUrl(profile.student_id_url, 3600); // 1 hour

                    if (!idError) {
                        studentIdUrl = idData.signedUrl;
                    }
                }

                urls[profile.id] = { selfie: selfieUrl, studentId: studentIdUrl };
            }
            setImageUrls(urls);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPendingProfiles();
    }, [fetchPendingProfiles]);

    const handleDecision = async (profile, approve) => {
        const reason = rejectionReasons[profile.id] || '';
        if (!approve && !reason) {
            alert("Please provide a rejection reason.");
            return;
        }

        try {
            const { error } = await supabase
                .from('matchmaker_profiles')
                .update({
                    status: approve ? 'approved' : 'rejected',
                    rejection_reason: approve ? null : reason,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', profile.id);

            if (error) throw error;

            setRejectionReasons(prev => ({ ...prev, [profile.id]: '' }));
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
                <div className="space-y-6">
                    {profiles.map((profile) => (
                        <div key={profile.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-1 space-y-4">
                                <h4 className="font-medium text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2">Verification</h4>

                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Selfie</label>
                                    {imageUrls[profile.id]?.selfie ? (
                                        <a href={imageUrls[profile.id]?.selfie} target="_blank" rel="noreferrer">
                                            <img
                                                src={imageUrls[profile.id]?.selfie}
                                                alt="Selfie"
                                                className="mt-1 rounded-lg border dark:border-gray-600 object-cover w-full h-40 hover:opacity-90 transition-opacity"
                                            />
                                        </a>
                                    ) : (
                                        <div className="mt-1 h-40 w-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                                            No Selfie Uploaded
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student ID</label>
                                    {imageUrls[profile.id]?.studentId ? (
                                        <a href={imageUrls[profile.id]?.studentId} target="_blank" rel="noreferrer">
                                            <img
                                                src={imageUrls[profile.id]?.studentId}
                                                alt="Student ID"
                                                className="mt-1 rounded-lg border dark:border-gray-600 object-cover w-full h-40 hover:opacity-90 transition-opacity"
                                            />
                                        </a>
                                    ) : (
                                        <div className="mt-1 h-40 w-full bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center text-gray-400 text-sm p-4 text-center">
                                            <AlertCircle className="w-6 h-6 mb-1" />
                                            <span>No ID Uploaded</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="md:col-span-2 flex flex-col">
                                <div className="flex-1 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-xl text-indigo-600 dark:text-indigo-400">{profile.nickname}</h3>
                                        <span className="text-xs text-gray-400">
                                            {new Date(profile.created_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                                            <span className="text-gray-500 dark:text-gray-400">Gender:</span> <span className="text-gray-900 dark:text-white font-medium">{profile.gender}</span>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                                            <span className="text-gray-500 dark:text-gray-400">Age:</span> <span className="text-gray-900 dark:text-white font-medium">{profile.age || 'N/A'}</span>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded col-span-2">
                                            <span className="text-gray-500 dark:text-gray-400">Contact:</span> <span className="text-gray-900 dark:text-white font-medium select-all">{profile.contact_info}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Interests</label>
                                        <div className="flex flex-wrap gap-1">
                                            {(profile.interests || []).map(int => (
                                                <span key={int} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs border border-indigo-100 dark:border-indigo-800">{int}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Intro</label>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">{profile.self_intro}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Looking For</label>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">{profile.looking_for}</p>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t dark:border-gray-700 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Reason for rejection (optional but recommended)"
                                        value={rejectionReasons[profile.id] || ''}
                                        onChange={(e) => setRejectionReasons(prev => ({ ...prev, [profile.id]: e.target.value }))}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleDecision(profile, true)}
                                            className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md text-sm font-bold hover:bg-green-700 shadow-sm transition-colors"
                                        >
                                            <Check className="w-5 h-5 mr-2" /> Approve
                                        </button>
                                        <button
                                            onClick={() => handleDecision(profile, false)}
                                            className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md text-sm font-bold hover:bg-red-700 shadow-sm transition-colors"
                                        >
                                            <X className="w-5 h-5 mr-2" /> Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}