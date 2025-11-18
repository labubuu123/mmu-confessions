import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Loader2, Inbox, MessageSquare } from 'lucide-react';
import MatchmakerAvatar from './MatchmakerAvatar';
import { useNavigate } from 'react-router-dom';

export default function MatchmakerMatches({ user }) {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMatches = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const { data, error: rpcError } = await supabase.rpc(
                    'get_user_matches',
                    { user_id_in: user.id }
                );

                if (rpcError) throw rpcError;
                setMatches(data);
            } catch (error) {
                console.error('Error fetching matches:', error.message);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMatches();
    }, [user]);

    const truncate = (text, length) => {
        if (!text) return 'No messages yet...';
        return text.length > length ? text.substring(0, length) + '...' : text;
    };

    const timeAgo = (date) => {
        if (!date) return '';
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m";
        return Math.floor(seconds) + "s";
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center p-10">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (error) {
        return <div className="text-center p-10 text-red-500">Error: {error}</div>;
    }

    if (matches.length === 0) {
        return (
            <div className="text-center p-10 text-gray-500 dark:text-gray-400">
                <Inbox className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-xl font-semibold">No Matches Yet</h3>
                <p>Keep swiping! When you and another user both "Want to Meet," they'll appear here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {matches.map((match) => (
                <button
                    key={match.match_id}
                    onClick={() => navigate(`/matchmaker/chat/${match.match_id}`)}
                    className="w-full flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                    <MatchmakerAvatar gender={match.gender} className="w-12 h-12" />
                    <div className="flex-1 text-left overflow-hidden">
                        <div className="flex justify-between items-baseline">
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                                {match.nickname}
                            </h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {timeAgo(match.last_message_time || match.matched_at)}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                            {truncate(match.last_message, 50)}
                        </p>
                    </div>
                </button>
            ))}
        </div>
    );
}