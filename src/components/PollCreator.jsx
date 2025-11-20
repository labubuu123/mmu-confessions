import React, { useState } from 'react'
import { PlusCircle, X, BarChart3, Clock } from 'lucide-react'

export default function PollCreator({ onPollData, onRemovePoll }) {
    const [question, setQuestion] = useState('')
    const [options, setOptions] = useState(['', ''])
    const [duration, setDuration] = useState('7')

    function handleAddOption() {
        if (options.length < 6) {
            setOptions([...options, ''])
        }
    }

    function handleRemoveOption(index) {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index))
        }
    }

    function handleOptionChange(index, value) {
        const newOptions = [...options]
        newOptions[index] = value
        setOptions(newOptions)
    }

    React.useEffect(() => {
        const validOptions = options.filter(opt => opt.trim())
        if (question.trim() && validOptions.length >= 2) {
            onPollData({
                question: question.trim(),
                options: validOptions.map(opt => ({ text: opt.trim(), votes: 0 })),
                duration: parseInt(duration)
            })
        } else {
            onPollData(null)
        }
    }, [question, options, duration])

    return (
        <div className="border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-4 bg-indigo-50/50 dark:bg-indigo-900/10">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        Add a Poll
                    </h3>
                </div>
                <button
                    type="button"
                    onClick={onRemovePoll}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full text-red-500 transition"
                    title="Remove poll"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Poll Question
                    </label>
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="e.g., Should I confess to my crush?"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none transition text-gray-900 dark:text-gray-100"
                        maxLength={200}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Options (min 2, max 6)
                    </label>
                    <div className="space-y-2">
                        {options.map((option, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                    placeholder={`Option ${index + 1}`}
                                    className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none transition text-gray-900 dark:text-gray-100"
                                    maxLength={100}
                                />
                                {options.length > 2 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveOption(index)}
                                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {options.length < 6 && (
                        <button
                            type="button"
                            onClick={handleAddOption}
                            className="mt-2 flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            <PlusCircle className="w-4 h-4" />
                            Add Option
                        </button>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Poll Duration
                    </label>
                    <select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none transition text-gray-900 dark:text-gray-100"
                    >
                        <option value="1">1 Day</option>
                        <option value="3">3 Days</option>
                        <option value="7">7 Days</option>
                        <option value="14">14 Days</option>
                    </select>
                </div>

                <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-lg">💡</span>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        Polls are anonymous. Users can change their vote at any time before the poll ends.
                    </p>
                </div>
            </div>
        </div>
    )
}