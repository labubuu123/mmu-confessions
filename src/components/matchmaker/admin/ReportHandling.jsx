import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Loader2, UserX, ShieldCheck, Trash } from 'lucide-react';

export default function ReportHandling() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchReports = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('matchmaker_reports')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: true });

        if (error) console.error("Error fetching reports:", error);
        else setReports(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleResolve = async (reportId) => {
        await supabase
            .from('matchmaker_reports')
            .update({ status: 'resolved' })
            .eq('id', reportId);
        fetchReports();
    };

    const handleBan = async (reportId, userId) => {
        if (window.confirm(`Are you sure you want to BAN user ${userId}? This will update their status to 'banned'.`)) {
            await supabase
                .from('matchmaker_profiles')
                .update({ status: 'banned' })
                .eq('author_id', userId);
            await handleResolve(reportId);
        }
    };

    if (loading) return <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />;

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Pending Reports ({reports.length})
            </h2>
            {reports.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No pending reports.</p>
            ) : (
                <div className="space-y-4">
                    {reports.map((report) => (
                        <div key={report.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
                            <h4 className="font-semibold text-gray-900 dark:text-white">Report #{report.id} - Type: {report.report_type}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Reporter: {report.reporter_id}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Reported: {report.reported_id}</p>
                            <p className="mt-2 text-gray-700 dark:text-gray-300"><strong>Reason:</strong> {report.reason}</p>
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => handleBan(report.id, report.reported_id)}
                                    className="flex items-center px-3 py-1 bg-red-600 text-white rounded-md text-sm"
                                >
                                    <UserX className="w-4 h-4 mr-1" /> Ban User
                                </button>
                                <button
                                    onClick={() => handleResolve(report.id)}
                                    className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md text-sm"
                                >
                                    <ShieldCheck className="w-4 h-4 mr-1" /> Mark Resolved
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}