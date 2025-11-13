import React, { useState, useEffect, createContext, useContext } from 'react';
import { Save, Trash2, FileText, X } from 'lucide-react';

const DRAFT_KEY = 'mmu_confession_drafts';

const DraftContext = createContext();

export const DraftProvider = ({ children }) => {
    const [drafts, setDrafts] = useState([]);

    useEffect(() => {
        try {
            const storedDrafts = localStorage.getItem(DRAFT_KEY);
            if (storedDrafts) {
                setDrafts(JSON.parse(storedDrafts));
            }
        } catch (e) {
            console.error("Failed to load drafts:", e);
            localStorage.removeItem(DRAFT_KEY);
        }
    }, []);

    const saveDraft = (text, media) => {
        if (!text || !text.trim()) return;

        setDrafts(prevDrafts => {
            const newDraft = {
                id: Date.now(),
                text,
                media,
                createdAt: new Date().toISOString(),
            };
            const updatedDrafts = [newDraft, ...prevDrafts].slice(0, 10);
            try {
                localStorage.setItem(DRAFT_KEY, JSON.stringify(updatedDrafts));
            } catch (e) {
                console.error("Failed to save draft:", e);
            }
            return updatedDrafts;
        });
    };

    const deleteDraft = (id) => {
        setDrafts(prevDrafts => {
            const updatedDrafts = prevDrafts.filter(d => d.id !== id);
            try {
                localStorage.setItem(DRAFT_KEY, JSON.stringify(updatedDrafts));
            } catch (e) {
                console.error("Failed to delete draft:", e);
            }
            return updatedDrafts;
        });
    };

    const clearDrafts = () => {
        setDrafts([]);
        localStorage.removeItem(DRAFT_KEY);
    };

    return (
        <DraftContext.Provider value={{ drafts, saveDraft, deleteDraft, clearDrafts }}>
            {children}
        </DraftContext.Provider>
    );
};

export const useDrafts = () => {
    const context = useContext(DraftContext);
    if (!context) {
        throw new Error('useDrafts must be used within a DraftProvider');
    }
    return context;
};

export default function DraftManager({ onLoadDraft, onClose }) {
    const { drafts, deleteDraft, clearDrafts } = useDrafts();

    return (
        <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Your Drafts
            </h2>

            {drafts.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {drafts.map(draft => (
                        <div key={draft.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center gap-3">
                            <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-800 dark:text-gray-200 truncate">
                                    {draft.text}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Saved: {new Date(draft.createdAt).toLocaleString()}
                                </p>
                            </div>
                            <button
                                onClick={() => onLoadDraft(draft)}
                                className="px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                            >
                                Load
                            </button>
                            <button
                                onClick={() => deleteDraft(draft.id)}
                                className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition"
                                title="Delete draft"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={clearDrafts}
                        className="w-full mt-4 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                        Clear All Drafts
                    </button>
                </div>
            ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    You have no saved drafts.
                </p>
            )}
        </div>
    );
}