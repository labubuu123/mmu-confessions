import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { BarChart3, CheckCircle, Clock, Users } from 'lucide-react';
import AnonAvatar from './AnonAvatar';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

function getAnonId() {
    let anonId = localStorage.getItem('anonId');
    if (!anonId) {
        anonId = crypto.randomUUID();
        localStorage.setItem('anonId', anonId);
    }
    return anonId;
}

export default function PollDisplay({ confessionId, poll: initialPoll, isAdminReview = false }) {
    const [poll, setPoll] = useState(initialPoll);
    const [userVote, setUserVote] = useState(null);
    const [voting, setVoting] = useState(false);
    const [voters, setVoters] = useState({});

    useEffect(() => {
        if (poll && !isAdminReview) {
            checkUserVote();
            fetchVoters();
        }
    }, [poll?.id, isAdminReview]);

    useEffect(() => {
        if (!poll?.id) return;

        const channel = supabase
            .channel(`poll-${poll.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'polls',
                filter: `id=eq.${poll.id}`
            }, (payload) => {
                console.log('Poll updated:', payload.new);
                setPoll(payload.new);
                fetchVoters();
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'poll_votes',
                filter: `poll_id=eq.${poll.id}`
            }, () => {
                console.log('Poll votes changed');
                fetchVoters();
                refetchPoll();
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [poll?.id]);

    async function refetchPoll() {
        if (!poll?.id) return;

        try {
            const { data, error } = await supabase
                .from('polls')
                .select('*')
                .eq('id', poll.id)
                .single();

            if (!error && data) {
                setPoll(data);
            }
        } catch (err) {
            console.error('Error refetching poll:', err);
        }
    }

    async function checkUserVote() {
        if (isAdminReview) return;
        const anonId = getAnonId();

        try {
            const { data, error } = await supabase.rpc('get_user_poll_vote', {
                poll_id_in: poll.id,
                voter_id_in: anonId
            });

            if (!error && data !== null) {
                setUserVote(data);
            }
        } catch (err) {
            console.error('Error checking user vote:', err);
        }
    }

    async function fetchVoters() {
        try {
            const { data, error } = await supabase
                .from('poll_votes')
                .select('voter_id, option_index')
                .eq('poll_id', poll.id);

            if (error) throw error;

            const votersByOption = {};
            data?.forEach(vote => {
                if (!votersByOption[vote.option_index]) {
                    votersByOption[vote.option_index] = [];
                }
                votersByOption[vote.option_index].push(vote.voter_id);
            });

            setVoters(votersByOption);
        } catch (err) {
            console.error('Error fetching voters:', err);
        }
    }

    async function handleVote(optionIndex) {
        if (voting || isAdminReview) return;

        const isEnded = poll.ends_at && new Date(poll.ends_at) < new Date();
        if (isEnded) {
            alert('This poll has ended');
            return;
        }

        setVoting(true);
        const anonId = getAnonId();

        try {
            const { data, error } = await supabase.rpc('vote_on_poll', {
                poll_id_in: poll.id,
                voter_id_in: anonId,
                option_index_in: optionIndex
            });

            if (error) throw error;

            console.log('Vote response:', data);

            setPoll(prev => ({
                ...prev,
                options: data.options,
                total_votes: data.total_votes
            }));

            setUserVote(optionIndex);

            await fetchVoters();
            await refetchPoll();

        } catch (err) {
            console.error('Vote error:', err);
            alert('Failed to vote: ' + err.message);
        } finally {
            setVoting(false);
        }
    }

    if (!poll) return null;

    const options = Array.isArray(poll.options) ? poll.options : [];
    const totalVotes = poll.total_votes || 0;
    const isEnded = poll.ends_at && new Date(poll.ends_at) < new Date();
    const timeRemaining = poll.ends_at ? dayjs(poll.ends_at).fromNow() : null;

    return (
        <div className="mt-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Poll</h4>
                </div>
                {isEnded && (
                    <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full font-medium">
                        Ended
                    </span>
                )}
            </div>

            <p className="text-gray-900 dark:text-gray-100 font-medium mb-4">{poll.question}</p>

            <div className="space-y-3">
                {options.map((option, index) => {
                    const votes = option.votes || 0;
                    const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : 0;
                    const isSelected = userVote === index;
                    const optionVoters = voters[index] || [];

                    return (
                        <div key={index}>
                            <button
                                onClick={() => handleVote(index)}
                                disabled={voting || isEnded || isAdminReview}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-all relative overflow-hidden ${isEnded || isAdminReview
                                    ? 'cursor-default'
                                    : 'hover:bg-white/50 dark:hover:bg-gray-800/50 cursor-pointer'
                                    } ${isSelected && !isAdminReview
                                        ? 'bg-white dark:bg-gray-800 border-2 border-indigo-500'
                                        : 'bg-white/70 dark:bg-gray-800/70 border border-gray-300 dark:border-gray-600'
                                    }`}
                            >
                                <div
                                    className="absolute inset-0 bg-indigo-100 dark:bg-indigo-900/30 transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                />

                                <div className="relative flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {isSelected && !isAdminReview && (
                                            <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                        )}
                                        <span className="font-medium text-gray-900 dark:text-gray-100">{option.text}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {votes} {votes === 1 ? 'vote' : 'votes'}
                                        </span>
                                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{percentage}%</span>
                                    </div>
                                </div>
                            </button>

                            {optionVoters.length > 0 && (
                                <div className="mt-2 ml-4 flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                        {optionVoters.slice(0, 5).map((voterId, i) => (
                                            <div key={i} style={{ zIndex: 5 - i }}>
                                                <AnonAvatar authorId={voterId} size="sm" />
                                            </div>
                                        ))}
                                    </div>
                                    {optionVoters.length > 5 && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            +{optionVoters.length - 5} more
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
                </div>
                {timeRemaining && !isEnded && (
                    <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Ends {timeRemaining}</span>
                    </div>
                )}
                {isEnded && (
                    <span className="text-gray-500 dark:text-gray-500">Poll ended</span>
                )}
            </div>

            {userVote !== null && !isEnded && !isAdminReview && (
                <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
                    💡 You can change your vote anytime before the poll ends
                </p>
            )}

            {isAdminReview && (
                <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
                    (Admin read-only view)
                </p>
            )}
        </div>
    );
}