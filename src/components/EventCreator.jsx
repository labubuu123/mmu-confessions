import React, { useState, useEffect } from 'react'
import { Calendar, X, MapPin, AlignLeft } from 'lucide-react'

const toDateTimeLocal = (isoDate) => {
    if (!isoDate) return ''
    const date = new Date(isoDate)
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
    return date.toISOString().slice(0, 16)
}

export default function EventCreator({ onEventData, onRemoveEvent }) {
    const [eventName, setEventName] = useState('')
    const [description, setDescription] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [location, setLocation] = useState('')

    useEffect(() => {
        const data = {
            event_name: eventName,
            description: description,
            start_time: startTime ? new Date(startTime).toISOString() : null,
            end_time: endTime ? new Date(endTime).toISOString() : null,
            location: location,
        }
        onEventData(data)
    }, [eventName, description, startTime, endTime, location, onEventData])

    return (
        <div className="p-4 my-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg relative">
            <button
                type="button"
                onClick={onRemoveEvent}
                className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
            >
                <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                Create an Event
            </h3>
            <div className="flex flex-col gap-4">
                <input
                    type="text"
                    placeholder="Event Name (Required)"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <textarea
                    placeholder="Description (Optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="2"
                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <input
                    type="text"
                    placeholder="Location (e.g., 'FOB, MMU Melaka')"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Time (Required)</label>
                        <input
                            type="datetime-local"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">End Time (Optional)</label>
                        <input
                            type="datetime-local"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            min={startTime}
                            className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}