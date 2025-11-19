import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
// Added ShieldAlert to imports for the rejection UI
import { Check, Loader2, User, Heart, MapPin, AtSign, X, Sparkles, Trash2, AlertCircle, Info, ShieldAlert } from 'lucide-react';

const INTEREST_OPTIONS = [
    'Movies', 'Music', 'Reading', 'Gaming', 'Traveling', 'Cooking',
    'Sports', 'Hiking', 'Art', 'Photography', 'Coding', 'Fitness',
    'Anime', 'Volunteering', 'Yoga', 'Writing', 'Cafe Hopping', 'Pets'
];

const AvatarGenerator = ({ nickname, gender }) => {
    const seed = useMemo(() => {
        const str = (nickname || 'User') + gender;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash);
    }, [nickname, gender]);

    const pick = (options, offset = 0) => options[(seed + offset) % options.length];
    const skinColors = ['#f3d2c1', '#f5e0d7', '#e6c3b3', '#ffdfc4', '#dbb298'];
    const bgColors = gender === 'male' ? ['#e0e7ff', '#dbeafe', '#ccfbf1', '#f3f4f6'] : ['#fce7f3', '#ffe4e6', '#fef3c7', '#fae8ff'];
    const skin = pick(skinColors);
    const bg = pick(bgColors, 1);
    const eyesVariant = seed % 3;
    const mouthVariant = (seed >> 1) % 3;

    return (
        <svg viewBox="0 0 100 100" className="w-full h-full rounded-full transition-all duration-500 group-hover:scale-105">
            <rect width="100" height="100" fill={bg} />
            <path d="M20 100 Q50 80 80 100" fill={gender === 'male' ? '#6366f1' : '#ec4899'} opacity="0.8" />
            <circle cx="50" cy="50" r="35" fill={skin} />
            <g fill="#1f2937">
                {eyesVariant === 0 && (<><circle cx="38" cy="48" r="4" /><circle cx="62" cy="48" r="4" /></>)}
                {eyesVariant === 1 && (<><path d="M34 50 Q38 42 42 50" stroke="#1f2937" strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M58 50 Q62 42 66 50" stroke="#1f2937" strokeWidth="3" fill="none" strokeLinecap="round" /></>)}
                {eyesVariant === 2 && (<><circle cx="38" cy="48" r="4" /><path d="M58 48 L66 48" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" /></>)}
            </g>
            <g stroke="#1f2937" strokeWidth="3" fill="none" strokeLinecap="round">
                {mouthVariant === 0 && (<path d="M42 65 Q50 70 58 65" />)}
                {mouthVariant === 1 && (<path d="M38 62 Q50 75 62 62" />)}
                {mouthVariant === 2 && (<circle cx="50" cy="66" r="4" fill="#1f2937" stroke="none" />)}
            </g>
            {gender === 'male' ? (<path d="M25 40 Q50 15 75 40" fill="#1f2937" opacity="0.1" />) : (<path d="M20 45 Q50 10 80 45" fill="#1f2937" opacity="0.1" />)}
        </svg>
    );
};

export default function MatchmakerProfileForm({ profile, user, onSave }) {
    const [formData, setFormData] = useState({
        nickname: '',
        gender: 'male',
        age: 18,
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
            let cleanContact = profile.contact_info || '';
            if (cleanContact.startsWith('@')) cleanContact = cleanContact.substring(1);

            setFormData({
                nickname: profile.nickname || '',
                gender: profile.gender || 'male',
                age: profile.age || 18,
                city: profile.city || '',
                interests: profile.interests || [],
                self_intro: profile.self_intro || '',
                looking_for: profile.looking_for || '',
                contact_info: cleanContact,
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
        window.scrollTo({ top: 0, behavior: 'smooth' });

        try {
            let finalContact = formData.contact_info.trim();
            if (finalContact && !finalContact.startsWith('@') && isNaN(finalContact.charAt(0))) {
                finalContact = '@' + finalContact;
            }

            const profileData = {
                ...formData,
                contact_info: finalContact,
                author_id: user.id,
                age: formData.age ? parseInt(formData.age, 10) : null,
                status: 'pending', // Resets status to pending on update
                rejection_reason: null, // Clear previous rejection reason
                updated_at: new Date().toISOString(),
                avatar_seed: `${formData.nickname}-${formData.gender}`,
            };

            const query = profile
                ? supabase.from('matchmaker_profiles').update(profileData).eq('author_id', user.id)
                : supabase.from('matchmaker_profiles').insert(profileData);

            const { error: dbError } = await query;
            if (dbError) throw dbError;

            setSuccess(true);

            setTimeout(() => {
                if (onSave) onSave();
                setLoading(false);
            }, 1500);

        } catch (err) {
            console.error('Submission error:', err);
            setError(err.message || "An unexpected error occurred.");
            setLoading(false);
        }
    };

    const handleWithdraw = async () => {
        if (!window.confirm("Are you sure you want to withdraw your profile? You will be removed from the queue.")) return;

        setLoading(true);
        try {
            const { error } = await supabase.from('matchmaker_profiles').delete().eq('author_id', user.id);
            if (error) throw error;
            
            setTimeout(() => {
                 if (onSave) onSave();
                 setLoading(false);
            }, 500);

        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const inputStyle = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium placeholder-gray-400";
    const labelStyle = "block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2";
    const cardStyle = "bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8 transition-colors";

    return (
        <>
            {loading && (
                <div className="fixed top-0 left-0 w-full h-1.5 z-[100] bg-indigo-100 dark:bg-indigo-900">
                    <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-[shimmer_1s_infinite] w-full origin-left" style={{ backgroundSize: '200% 100%' }}></div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto pb-20 pt-4">
                <div className="text-center mb-10">
                    <div className="inline-block relative mb-6 group">
                        <div className="w-40 h-40 md:w-48 md:h-48 rounded-full p-1.5 bg-white dark:bg-gray-800 border-2 border-dashed border-indigo-200 dark:border-indigo-900 shadow-xl">
                            <div className="w-full h-full rounded-full overflow-hidden bg-gray-50 dark:bg-gray-900">
                                <AvatarGenerator nickname={formData.nickname} gender={formData.gender} />
                            </div>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-indigo-600 text-white p-2 rounded-full shadow-lg border-2 border-white dark:border-gray-800">
                            <Sparkles className="w-4 h-4" />
                        </div>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
                        {profile ? 'Edit Your Profile' : 'Create Your Profile'}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-sm leading-relaxed">
                        Your avatar is generated automatically.
                        <br className="hidden md:block" />
                        Fill out the details below to find your perfect match.
                    </p>
                </div>

                {/* INFO BOX */}
                <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-start gap-3 text-blue-800 dark:text-blue-300 animate-in fade-in slide-in-from-top-2">
                    <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium leading-relaxed">
                        Please fill out every piece of information honestly.
                        <br className="hidden md:block" />
                        Any unreliable information will be rejected by the admin.
                    </p>
                </div>

                {/* REJECTED ALERT BLOCK */}
                {profile?.status === 'rejected' && (
                    <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4 shadow-sm">
                        <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-bold text-red-800 dark:text-red-300">Action Required: Profile Rejected</h4>
                            <p className="text-sm text-red-700 dark:text-red-300 mt-1 leading-relaxed">
                                Reason: <span className="font-semibold italic">"{profile.rejection_reason || 'Violation of guidelines'}"</span>
                            </p>
                            <p className="text-xs text-red-600 dark:text-red-400 mt-3 font-medium bg-red-100 dark:bg-red-900/40 p-2 rounded-lg inline-block">
                                Please modify your profile below to comply with the rules and submit again.
                            </p>
                        </div>
                    </div>
                )}

                {/* PENDING ALERT BLOCK */}
                {profile?.status === 'pending' && (
                    <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
                        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-bold text-yellow-800 dark:text-yellow-300">Waiting for Approval</h4>
                            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1 leading-relaxed">
                                Your profile is currently <strong>pending</strong> admin review.
                                <br />
                                You can still edit your details or withdraw your application.
                            </p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-8 max-w-2xl mx-auto p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3 text-red-700 dark:text-red-300 animate-shake">
                        <X className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span className="text-sm font-bold">{error}</span>
                    </div>
                )}
                {success && (
                    <div className="mb-8 max-w-2xl mx-auto p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl flex items-center gap-3 text-green-700 dark:text-green-300 animate-pulse">
                        <Check className="w-5 h-5" />
                        <span className="text-sm font-bold">Profile saved! Submitting to admin...</span>
                    </div>
                )}

                <div className="space-y-8">
                    <div className={cardStyle}>
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                <User className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Who are you?</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className={labelStyle}>Nickname</label>
                                <input type="text" name="nickname" value={formData.nickname} onChange={handleChange} required maxLength={20} placeholder="e.g. Jason" className={inputStyle} />
                            </div>
                            <div>
                                <label className={labelStyle}>Gender</label>
                                <div className="relative">
                                    <select name="gender" value={formData.gender} onChange={handleChange} required className={`${inputStyle} appearance-none cursor-pointer`}>
                                        <option value="male">Boy 👦</option>
                                        <option value="female">Girl 👧</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className={labelStyle}>Age</label>
                                <input type="number" name="age" min="18" max="99" value={formData.age} onChange={handleChange} placeholder="18+" className={inputStyle} />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelStyle}>City / Campus</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="e.g. Melaka or Cyberjaya" className={`${inputStyle} pl-12`} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={cardStyle}>
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                            <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-pink-600 dark:text-pink-400">
                                <Heart className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Personality & Vibe</h3>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className={labelStyle}>About You</label>
                                    <span className="text-[10px] font-mono text-gray-400">{formData.self_intro.length}/500</span>
                                </div>
                                <textarea name="self_intro" rows={4} value={formData.self_intro} onChange={handleChange} required maxLength={500} placeholder="Describe yourself..." className={`${inputStyle} resize-none`}></textarea>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className={labelStyle}>Looking For</label>
                                    <span className="text-[10px] font-mono text-gray-400">{formData.looking_for.length}/300</span>
                                </div>
                                <textarea name="looking_for" rows={3} value={formData.looking_for} onChange={handleChange} required maxLength={300} placeholder="What kind of connection?" className={`${inputStyle} resize-none`}></textarea>
                            </div>
                            <div>
                                <label className={labelStyle}>Interests</label>
                                <div className="flex flex-wrap gap-2.5">
                                    {INTEREST_OPTIONS.map((interest) => {
                                        const isSelected = formData.interests.includes(interest);
                                        return (
                                            <button type="button" key={interest} onClick={() => handleInterestToggle(interest)} className={`px-4 py-2 rounded-full text-sm font-bold transition-all transform active:scale-95 border flex items-center gap-2 ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-700'}`}>
                                                {isSelected && <Check className="w-3 h-3" />} {interest}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-3xl border border-indigo-100 dark:border-indigo-900 shadow-sm">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-900"></div>
                        <div className="relative p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-4 text-indigo-700 dark:text-indigo-400">
                                <div className="p-2 bg-white dark:bg-indigo-900/50 rounded-lg shadow-sm"><AtSign className="w-5 h-5" /></div>
                                <h3 className="text-lg font-bold">Secret Contact Info</h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed max-w-2xl">
                                Encrypted and hidden. Only revealed if you both match.
                            </p>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-semibold drop-shadow select-none pointer-events-none">@</span>
                                <input type="text" name="contact_info" value={formData.contact_info} onChange={handleChange} required maxLength={100} className={`${inputStyle} pl-9`} placeholder="Instagram username" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse md:flex-row justify-center gap-4 pt-4">
                        {profile?.status === 'pending' && (
                            <button type="button" onClick={handleWithdraw} disabled={loading} className="w-full md:w-auto px-6 py-4 text-red-600 dark:text-red-400 font-bold rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-100 dark:hover:border-red-800 transition-all flex items-center justify-center gap-2">
                                <Trash2 className="w-5 h-5" /> <span>Withdraw</span>
                            </button>
                        )}
                        <button type="submit" disabled={loading} className="w-full md:w-auto md:min-w-[300px] flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-lg font-bold rounded-2xl shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none">
                            {loading ? <><Loader2 className="w-6 h-6 animate-spin" /><span>Submitting...</span></> : <span>{profile && profile.status !== 'rejected' ? 'Update Profile' : 'Submit Profile'}</span>}
                        </button>
                    </div>
                </div>
            </form>
        </>
    );
}