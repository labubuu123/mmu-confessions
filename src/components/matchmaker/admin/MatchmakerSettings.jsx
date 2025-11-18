import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Loader2, Save } from 'lucide-react';

export default function MatchmakerSettings() {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('matchmaker_settings').select('*');
        if (error) console.error("Error fetching settings:", error);
        else {
            const s = data.reduce((acc, setting) => {
                acc[setting.setting_key] = setting.setting_value;
                return acc;
            }, {});
            setSettings(s);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 'true' : 'false') : value,
        }));
    };

    const handleSave = async (key) => {
        setLoading(true);
        const { error } = await supabase
            .from('matchmaker_settings')
            .update({ setting_value: settings[key] })
            .eq('setting_key', key);

        if (error) {
            alert("Error saving setting: " + error.message);
        } else {
            alert("Setting saved!");
        }
        fetchSettings();
    };

    if (loading) return <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />;

    const settingsMeta = [
        { key: 'daily_like_limit', label: 'Daily Like Limit', type: 'number' },
        { key: 'allow_links_in_chat', label: 'Allow Links in Chat', type: 'boolean' },
        { key: 'allow_undisclosed_gender', label: 'Allow "Undisclosed" Gender', type: 'boolean' },
        { key: 'new_user_cooldown_minutes', label: 'New User Cooldown (Minutes)', type: 'number' },
    ];

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Settings</h2>
            <div className="space-y-4 max-w-lg">
                {settingsMeta.map(s => (
                    <div key={s.key} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{s.label}</label>
                        <div className="flex gap-3">
                            {s.type === 'boolean' ? (
                                <input
                                    type="checkbox"
                                    name={s.key}
                                    checked={settings[s.key] === 'true'}
                                    onChange={handleChange}
                                    className="h-6 w-6 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-indigo-600"
                                />
                            ) : (
                                <input
                                    type={s.type}
                                    name={s.key}
                                    value={settings[s.key] || ''}
                                    onChange={handleChange}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            )}
                            <button
                                onClick={() => handleSave(s.key)}
                                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm"
                            >
                                <Save className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}