import React from 'react'
import { Calendar, MapPin, AlignLeft } from 'lucide-react'

function formatEventTime(start, end) {
    const startDate = new Date(start)
    const options = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    }

    if (end) {
        const endDate = new Date(end)
        if (startDate.toDateString() === endDate.toDateString()) {
            return `${startDate.toLocaleString('en-US', options)} - ${endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;
        }
    }
    return startDate.toLocaleString('en-US', options);
}

export default function EventDisplay({
    eventName,
    description,
    startTime,
    endTime,
    location,
}) {
    if (!eventName || !startTime) {
        return null;
    }

    return (
        <div className="my-4 p-4 border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <h3 className="text-lg font-bold text-indigo-800 dark:text-indigo-200 mb-2">
                {eventName}
            </h3>

            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium">{formatEventTime(startTime, endTime)}</span>
                </div>

                {location && (
                    <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">{location}</span>
                    </div>
                )}

                {description && (
                    <div className="flex items-start gap-2 text-gray-700 dark:text-gray-400 mt-2 pt-2 border-t border-indigo-200 dark:border-indigo-700">
                        <AlignLeft className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <p className="text-sm">{description}</p>
                    </div>
                )}
            </div>
        </div>
    )
}