import React from 'react'

export function PostCardSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-5 mb-4 animate-pulse">
            <div className="flex items-start gap-3 mb-4">
                {/* Avatar skeleton */}
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full" />
                <div className="flex-1">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24 mb-2" />
                    <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-32" />
                </div>
            </div>

            {/* Content skeleton */}
            <div className="space-y-2 mb-4">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full" />
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6" />
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-4/6" />
            </div>

            {/* Image skeleton */}
            <div className="h-48 bg-gray-300 dark:bg-gray-700 rounded-xl mb-4" />

            {/* Actions skeleton */}
            <div className="flex items-center gap-4">
                <div className="h-9 bg-gray-300 dark:bg-gray-700 rounded-lg w-24" />
                <div className="h-9 bg-gray-300 dark:bg-gray-700 rounded-lg w-24" />
            </div>
        </div>
    )
}

export function FeedSkeleton({ count = 3 }) {
    return (
        <div className="space-y-6">
            {Array.from({ length: count }).map((_, i) => (
                <PostCardSkeleton key={i} />
            ))}
        </div>
    )
}

export function CommentSkeleton() {
    return (
        <div className="flex items-start gap-3 animate-pulse">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-3">
                    <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-20 mb-2" />
                    <div className="space-y-1">
                        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full" />
                        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export function ShimmerEffect() {
    return (
        <div className="relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
    )
}

// Add to your CSS/Tailwind config:
// @keyframes shimmer {
//   100% {
//     transform: translateX(100%);
//   }
// }
//
// .animate-shimmer {
//   animation: shimmer 2s infinite;
// }