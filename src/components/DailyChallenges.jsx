import React, { useState, useEffect, useCallback } from 'react';
import { Target, CheckCircle, Calendar, Zap } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useNotifications } from './NotificationSystem';

const DAILY_CHALLENGES = [
    {
        id: 'post_positive',
        name: 'Share Positivity',
        icon: '😊',
        description: 'Post a positive confession today',
        points: 10,
        type: 'post'
    },
    {
        id: 'help_others',
        name: 'Be Supportive',
        icon: '🤗',
        description: 'Leave 3 helpful comments',
        points: 15,
        type: 'comment',
        target: 3
    },
    {
        id: 'react_to_posts',
        name: 'Spread Love',
        icon: '💖',
        description: 'React to 5 confessions',
        points: 5,
        type: 'reaction',
        target: 5
    },
    {
        id: 'use_poll',
        name: 'Poll Master',
        icon: '📊',
        description: 'Create a poll today',
        points: 10,
        type: 'poll'
    },
    {
        id: 'evening_post',
        name: 'Night Owl',
        icon: '🦉',
        description: 'Post between 10 PM - 2 AM',
        points: 8,
        type: 'time_post'
    },
    {
        id: 'morning_post',
        name: 'Early Bird',
        icon: '🌅',
        description: 'Post between 6 AM - 9 AM',
        points: 8,
        type: 'time_post'
    },
    {
        id: 'read_stories',
        name: 'Story Reader',
        icon: '📖',
        description: 'Read 10 confessions',
        points: 5,
        type: 'read',
        target: 10
    },
];

function getAnonId() {
    let anonId = localStorage.getItem('anonId');
    if (!anonId) {
        anonId = crypto.randomUUID();
        localStorage.setItem('anonId', anonId);
    }
    return anonId;
}

export default function DailyChallenges() {
    const [challenges, setChallenges] = useState([]);
    const [completedToday, setCompletedToday] = useState([]);
    const [progress, setProgress] = useState({});
    const [totalPoints, setTotalPoints] = useState(0);
    const { success } = useNotifications();

    const completeChallenge = useCallback((challengeId) => {
        setCompletedToday(prevCompleted => {
            if (prevCompleted.includes(challengeId)) {
                return prevCompleted;
            }

            const fullChallenge = DAILY_CHALLENGES.find(c => c.id === challengeId);
            if (!fullChallenge) return prevCompleted;

            success(`🎉 ${fullChallenge.name} Completed! +${fullChallenge.points} points`);

            setTotalPoints(prevTotal => {
                const newTotal = prevTotal + fullChallenge.points;
                localStorage.setItem('totalChallengePoints', newTotal.toString());
                return newTotal;
            });

            const newCompleted = [...prevCompleted, challengeId];
            localStorage.setItem('completedChallenges', JSON.stringify(newCompleted));
            return newCompleted;
        });
    }, [success]);

    function initializeChallenges() {
        const today = new Date().toDateString();
        const savedDate = localStorage.getItem('challengeDate');

        let activeChallenges = [];
        if (savedDate !== today) {
            localStorage.setItem('challengeDate', today);
            localStorage.removeItem('completedChallenges');
            localStorage.removeItem('challengeProgress');

            const shuffled = [...DAILY_CHALLENGES].sort(() => 0.5 - Math.random());
            activeChallenges = shuffled.slice(0, 3);
            localStorage.setItem('todayChallenges', JSON.stringify(activeChallenges));

            setChallenges(activeChallenges);
            setCompletedToday([]);
            setProgress({});
        } else {
            const saved = localStorage.getItem('todayChallenges');
            if (saved) {
                activeChallenges = JSON.parse(saved);
                setChallenges(activeChallenges);
            }
            const completed = localStorage.getItem('completedChallenges');
            if (completed) {
                setCompletedToday(JSON.parse(completed));
            }
        }
        return activeChallenges;
    }

    const loadProgress = useCallback(() => {
        const saved = localStorage.getItem('challengeProgress');
        if (saved) {
            setProgress(JSON.parse(saved));
        }
        const points = localStorage.getItem('totalChallengePoints');
        if (points) {
            setTotalPoints(parseInt(points));
        }
    }, []);

    useEffect(() => {
        initializeChallenges();
        loadProgress();
    }, [loadProgress]);

    useEffect(() => {
        function handleUpdate() {
            loadProgress();
        }
        window.addEventListener('challengeUpdate', handleUpdate);
        return () => {
            window.removeEventListener('challengeUpdate', handleUpdate);
        };
    }, [loadProgress]);

    useEffect(() => {
        if (challenges.length === 0) return;

        function checkCompletions() {
            for (const challenge of challenges) {
                if (completedToday.includes(challenge.id)) {
                    continue;
                }

                const fullChallenge = DAILY_CHALLENGES.find(c => c.id === challenge.id);
                if (!fullChallenge) continue;

                const currentProgress = progress[challenge.id] || 0;
                const target = fullChallenge.target || 1;

                if (currentProgress >= target) {
                    completeChallenge(challenge.id);
                }
            }
        }
        checkCompletions();
    }, [challenges, progress, completedToday, completeChallenge]);


    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl sm:rounded-2xl shadow-xl border border-purple-200 dark:border-purple-800 p-4 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <h3 className="font-bold text-gray-900 dark:text-gray-100">Daily Challenges</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs px-2 py-1 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded-full">
                            {completedToday.length}/{challenges.length}
                        </span>
                        <span className="text-xs px-2 py-1 bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded-full flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {totalPoints}
                        </span>
                    </div>
                </div>

                <div className="space-y-3">
                    {challenges.map((challenge) => {
                        const isCompleted = completedToday.includes(challenge.id);
                        const currentProgress = progress[challenge.id] || 0;

                        const fullChallenge = DAILY_CHALLENGES.find(c => c.id === challenge.id) || {};
                        const target = fullChallenge.target;

                        const progressPercent = target
                            ? Math.min((currentProgress / target) * 100, 100)
                            : 0;

                        return (
                            <div
                                key={challenge.id}
                                className={`p-3 rounded-lg border-2 transition ${isCompleted
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-400'
                                    : 'bg-white dark:bg-gray-800 border-purple-200 dark:border-purple-700'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl flex-shrink-0">{challenge.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                                {challenge.name}
                                            </h4>
                                            {isCompleted && <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />}
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                            {challenge.description}
                                        </p>

                                        {target && !isCompleted && (
                                            <div className="mb-2">
                                                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                    <span>Progress</span>
                                                    <span>{currentProgress}/{target}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                    <div
                                                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${progressPercent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                                +{challenge.points} points
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700 text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        Complete challenges to earn points and unlock rewards! 🎁
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                        New challenges reset daily at midnight
                    </p>
                </div>
            </div>
        </div>
    );
}

export function trackChallengeProgress(action) {
    const event = new CustomEvent('challengeProgress', { detail: action });
    window.dispatchEvent(event);
}