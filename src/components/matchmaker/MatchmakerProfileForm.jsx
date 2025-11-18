import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Check, Loader2 } from 'lucide-react';

const INTEREST_OPTIONS = [
    'Movies', 'Music', 'Reading', 'Gaming', 'Traveling', 'Cooking',
    'Sports', 'Hiking', 'Art', 'Photography', 'Coding', 'Fitness',
    'Anime', 'Volunteering', 'Yoga', 'Writing',
];

export default function MatchmakerProfileForm({ profile, user, onSave }) {
    const [formData, setFormData] = useState({
        nickname: '',
        gender: 'undisclosed',
        age: '',
        age_range: '18-22',
        city: '',
        interests: [],
        self_intro: '',
        looking_for: '',
        contact_info: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (profile) {
            setFormData({
                nickname: profile.nickname || '',
                gender: profile.gender || 'undisclosed',
                age: profile.age || '',
                age_range: profile.age_range || '18-22',
                city: profile.city || '',
                interests: profile.interests || [],
                self_intro: profile.self_intro || '',
                looking_for: profile.looking_for || '',
                contact_info: profile.contact_info || '',
            });
        }
    }, [profile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleInterestToggle = (interest) => {
        setFormData((prev) => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter((i) => i !== interest)
                : [...prev.interests, interest],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const profileData = {
                ...formData,
                author_id: user.id,
                age: formData.age ? parseInt(formData.age, 10) : null,
                status: 'pending',
                updated_at: new Date().toISOString(),
            };

            const sensitiveCheck = await supabase.rpc('check_sensitive_words', {
                text_in: `${profileData.self_intro} ${profileData.looking_for} ${profileData.contact_info} ${profileData.nickname}`
            });

            if (sensitiveCheck.data) {
                throw new Error("Profile contains sensitive words (like contact info) in introduction or looking for fields. Please remove them. Your actual contact info should only be in the 'Contact Info' field.");
            }

            let query;
            if (profile) {
                query = supabase
                    .from('matchmaker_profiles')
                    .update(profileData)
                    .eq('author_id', user.id);
            } else {
                query = supabase.from('matchmaker_profiles').insert(profileData);
            }

            const { error: dbError } = await query;
            if (dbError) throw dbError;

            setSuccess(true);
            if (onSave) onSave();
        } catch (error) {
            console.error('Error saving profile:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6 max-w-lg mx-auto p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700"
        >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile ? 'Edit Your Profile' : 'Create Your Profile'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
                Your profile will be submitted for review after saving. Please avoid sharing contact information
                except in the "Contact Info" field.
            </p>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nickname</label>
                <input
                    type="text"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleChange}
                    required
                    maxLength={25}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    <option value="undisclosed">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Age (Optional)</label>
                <input
                    type="number"
                    name="age"
                    min="18"
                    max="99"
                    value={formData.age}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="e.g., 21"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">City / Region (Optional)</label>
                <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="e.g., Cyberjaya"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Interests (Select a few)</label>
                <div className="mt-2 flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map((interest) => (
                        <button
                            type="button"
                            key={interest}
                            onClick={() => handleInterestToggle(interest)}
                            className={`px-3 py-1 rounded-full text-sm font-medium border
                ${formData.interests.includes(interest)
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                                }`}
                        >
                            {interest}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Self Introduction</label>
                <textarea
                    name="self_intro"
                    rows={4}
                    value={formData.self_intro}
                    onChange={handleChange}
                    required
                    maxLength={500}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Tell us about yourself (no contact info here!)"
                ></textarea>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Looking For</label>
                <textarea
                    name="looking_for"
                    rows={3}
                    value={formData.looking_for}
                    onChange={handleChange}
                    required
                    maxLength={300}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Describe who you'd like to meet (no contact info here!)"
                ></textarea>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Info (Hidden)</label>
                <input
                    type="text"
                    name="contact_info"
                    value={formData.contact_info}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="e.g., Your Telegram/IG @ or phone (only shared if you both agree)"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    This will ONLY be revealed to a match after you both consent to exchange info.
                </p>
            </div>

            {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}
            {success && (
                <div className="text-sm text-green-600 dark:text-green-400">
                    Profile submitted for review!
                </div>
            )}

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : success ? (
                        <Check className="w-5 h-5" />
                    ) : (
                        'Save & Submit for Review'
                    )}
                </button>
            </div>
        </form>
    );
}