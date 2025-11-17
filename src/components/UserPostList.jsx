import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
    Loader2, MessageSquare, AlertTriangle, CheckCircle, BarChart3, Calendar, Pin
} from 'lucide-react'
import AnonAvatar from './AnonAvatar'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import PollDisplay from './PollDisplay'
import EventDisplay from './EventDisplay'

dayjs.extend(relativeTime)

export default function UserPostList({ authorId, user }) {
    const [posts, setPosts] = useState([])
    const [polls, setPolls] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!authorId) return

        async function fetchUserPosts() {
            setLoading(true)
            setError(null)
            try {
                const { data: postData, error: postError } = await supabase
                    .from('confessions')
                    .select('*, events(*)')
                    .eq('author_id', authorId)
                    .order('created_at', { ascending: false })

                if (postError) throw postError

                setPosts(postData || [])

                if (postData && postData.length > 0) {
                    const postIds = postData.map(p => p.id)
                    const { data: pollData, error: pollError } = await supabase
                        .from('polls')
                        .select('*')
                        .in('confession_id', postIds)

                    if (pollError) throw pollError

                    if (pollData) {
                        const pollMap = {}
                        pollData.forEach(p => {
                            pollMap[p.confession_id] = p
                        })
                        setPolls(pollMap)
                    }
                }
            } catch (err) {
                console.error('Error fetching user posts:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchUserPosts()
    }, [authorId])

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="mt-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                    <strong>Error:</strong> {error}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <AnonAvatar authorId={user.author_id} size="md" />
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        Viewing Posts for User
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 break-all">
                        {user.author_id}
                    </p>
                </div>
            </div>

            {posts.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <MessageSquare className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        This user has not made any posts.
                    </p>
                </div>
            )}

            {posts.map(p => {
                const poll = polls[p.id]
                const hasEvent = p.events && p.events.length > 0
                const event = hasEvent ? p.events[0] : null

                return (
                    <div
                        key={p.id}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-5"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(p.created_at).toLocaleString()} • Post ID: {p.id}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
                                {poll && (
                                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs rounded flex items-center gap-1">
                                        <BarChart3 className="w-3 h-3" /> Poll
                                    </span>
                                )}
                                {hasEvent && (
                                    <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs rounded flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> Event
                                    </span>
                                )}
                                {p.pinned && (
                                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded flex items-center gap-1">
                                        <Pin className="w-3 h-3" /> Pinned
                                    </span>
                                )}
                                {p.approved ? (
                                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" /> Approved
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-xs rounded flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> Pending
                                    </span>
                                )}
                                {p.reported && (
                                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> Reported ({p.report_count || 0})
                                    </span>
                                )}
                            </div>
                        </div>

                        <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap mb-3">
                            {p.text}
                        </p>

                        {poll && (
                            <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                                <PollDisplay poll={poll} confessionId={p.id} isAdminReview={true} />
                            </div>
                        )}

                        {event && (
                            <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                                <EventDisplay
                                    eventName={event.event_name}
                                    description={event.description}
                                    startTime={event.start_time}
                                    endTime={event.end_time}
                                    location={event.location}
                                />
                            </div>
                        )}

                        {p.media_url && (
                            <div className="mb-3">
                                {p.media_type === 'images' ? (
                                    <img
                                        src={p.media_url}
                                        className="max-h-96 w-auto rounded-lg"
                                        alt="media"
                                    />
                                ) : p.media_type === 'video' ? (
                                    <video controls className="max-h-96 w-full rounded-lg">
                                        <source src={p.media_url} />
                                    </video>
                                ) : p.media_type === 'audio' ? (
                                    <audio controls className="w-full">
                                        <source src={p.media_url} />
                                    </audio>
                                ) : null}
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-medium">Author Name:</span> {p.author_name || 'Anonymous'}
                            <br />
                            <span className="font-medium">Mood:</span> {p.mood ? JSON.stringify(p.mood) : 'N/A'}
                            <br />
                            <span className="font-medium">Series:</span> {p.series_name ? `${p.series_name} (Part ${p.series_part})` : 'N/A'}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}