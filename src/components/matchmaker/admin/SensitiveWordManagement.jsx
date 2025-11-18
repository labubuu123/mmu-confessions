import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Loader2, Plus, Trash } from 'lucide-react';

export default function SensitiveWordManagement() {
    const [words, setWords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newWord, setNewWord] = useState('');
    const [newCategory, setNewCategory] = useState('contact');

    const fetchWords = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('matchmaker_sensitive_words')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) console.error("Error fetching words:", error);
        else setWords(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchWords();
    }, [fetchWords]);

    const handleAddWord = async (e) => {
        e.preventDefault();
        if (!newWord.trim() || !newCategory.trim()) return;

        await supabase
            .from('matchmaker_sensitive_words')
            .insert({ word: newWord.trim().toLowerCase(), category: newCategory.trim() });

        setNewWord('');
        fetchWords();
    };

    const handleDeleteWord = async (wordId) => {
        await supabase.from('matchmaker_sensitive_words').delete().eq('id', wordId);
        fetchWords();
    };

    if (loading) return <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />;

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Sensitive Words</h2>
            <form onSubmit={handleAddWord} className="flex gap-3 mb-6">
                <input
                    type="text"
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    placeholder="New sensitive word"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Category (e.g., contact)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <button
                    type="submit"
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm"
                >
                    <Plus className="w-4 h-4 mr-1" /> Add
                </button>
            </form>

            <div className="space-y-2">
                {words.map((word) => (
                    <div key={word.id} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-md shadow border dark:border-gray-700">
                        <div>
                            <span className="font-medium text-gray-900 dark:text-white">{word.word}</span>
                            <span className="ml-3 px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{word.category}</span>
                        </div>
                        <button
                            onClick={() => handleDeleteWord(word.id)}
                            className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded-full"
                        >
                            <Trash className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}