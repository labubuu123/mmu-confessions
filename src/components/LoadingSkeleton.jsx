import React from 'react'

export function PostSkeleton({ showMedia = true }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4 animate-pulse">
            <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                </div>
                <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700/50" />
            </div>

            <div className="space-y-2.5 mb-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
            </div>

            {showMedia && (
                <div className="w-full aspect-video sm:h-80 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4" />
            )}

            <div className="flex justify-between items-center pt-2">
                <div className="flex gap-3">
                    <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                </div>
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
        </div>
    )
}

export function FeedSkeleton({ count = 3 }) {
    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            {Array(count).fill(0).map((_, i) => (
                <PostSkeleton key={i} showMedia={i % 2 === 0} />
            ))}
        </div>
    )
}

export function ProfileSkeleton() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="flex flex-col items-center pt-8 pb-4">
                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mb-4" />
                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            </div>

            <div className="space-y-4">
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            </div>
        </div>
    )
}

export function CommentSkeleton() {
    return (
        <div className="flex gap-3 animate-pulse mb-4">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
        </div>
    )
}