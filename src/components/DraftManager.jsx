import React, { useState, useEffect } from 'react'
import { Save, Trash2, Clock, FileText } from 'lucide-react'

const DRAFTS_KEY = 'confession_drafts'

export function useDrafts() {
    const [drafts, setDrafts] = useState([])

    useEffect(() => {
        loadDrafts()
    }, [])

    function loadDrafts() {
        try {
            const saved = JSON.parse(localStorage.getItem(DRAFTS_KEY) || '[]')
            setDrafts(saved)
        } catch (e) {
            setDrafts([])
        }
    }

    function saveDraft(text, media = null) {
        const draft = {
            id: Date.now(),
            text,
            media,
            savedAt: new Date().toISOString()
        }
        const updated = [draft, ...drafts].slice(0, 3)
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(updated))
        setDrafts(updated)
        return draft
    }

    function deleteDraft(id) {
        const updated = drafts.filter(d => d.id !== id)
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(updated))
        setDrafts(updated)
    }

    function clearAllDrafts() {
        localStorage.removeItem(DRAFTS_KEY)
        setDrafts([])
    }

    return { drafts, saveDraft, deleteDraft, clearAllDrafts, loadDrafts }
}

export default function DraftManager({ onLoadDraft, onClose }) {
    const { drafts, deleteDraft, clearAllDrafts } = useDrafts()

    if (drafts.length === 0) {
        return (
            <div className="p-8 text-center">
                <FileText className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No drafts saved</p>
            </div>
        )
    }

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Saved Drafts ({drafts.length})
                </h3>
                <button
                    onClick={clearAllDrafts}
                    className="text-xs text-red-500 hover:text-red-600"
                >
                    Clear All
                </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
                {drafts.map(draft => (
                    <div
                        key={draft.id}
                        className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-500 transition"
                    >
                        <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2 mb-2">
                            {draft.text || 'Empty draft'}
                        </p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                {new Date(draft.savedAt).toLocaleString()}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        onLoadDraft(draft)
                                        onClose()
                                    }}
                                    className="px-3 py-1 bg-indigo-600 text-white rounded-md text-xs hover:bg-indigo-700"
                                >
                                    Load
                                </button>
                                <button
                                    onClick={() => deleteDraft(draft.id)}
                                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                                >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}