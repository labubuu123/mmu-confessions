import React from 'react';

const SkeletonBase = ({ className }) => (
    <div
        className={`bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse ${className}`}
    />
);

export function CommentSkeleton() {
    return (
        <div className="space-y-4 py-4">
            {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                    <SkeletonBase className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <SkeletonBase className="w-1/4 h-4" />
                        <SkeletonBase className="w-full h-4" />
                        <SkeletonBase className="w-3/4 h-4" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function FeedSkeleton({ count = 3 }) {
    return (
        <div className="space-y-6">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-start gap-3 mb-3">
                        <SkeletonBase className="w-10 h-10 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <SkeletonBase className="w-1/3 h-4" />
                            <SkeletonBase className="w-1/4 h-3" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <SkeletonBase className="w-full h-4" />
                        <SkeletonBase className="w-full h-4" />
                        <SkeletonBase className="w-3/4 h-4" />
                    </div>
                    <SkeletonBase className="w-full h-40 mt-4" />
                    <div className="flex justify-between mt-4 pt-3 border-t dark:border-gray-700">
                        <SkeletonBase className="w-20 h-8" />
                        <SkeletonBase className="w-20 h-8" />
                    </div>
                </div>
            ))}
        </div>
    );
}