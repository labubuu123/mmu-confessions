import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    Check, Loader2, User, Heart, MapPin, AtSign, X, Sparkles,
    Trash2, ArrowRight, ArrowLeft, Flag, Navigation, Shield,
    Plus, Minus, AlertCircle, Siren, ShieldAlert
} from 'lucide-react';

const INTEREST_OPTIONS = [
    'Movies', 'Music', 'Reading', 'Gaming', 'Traveling', 'Cooking',
    'Sports', 'Hiking', 'Art', 'Photography', 'Coding', 'Fitness',
    'Anime', 'Volunteering', 'Yoga', 'Writing', 'Cafe Hopping', 'Pets'
];

const RED_FLAG_OPTIONS = [
    "Bad Texter", "Coffee Addict", "Gamer Rage", "Sleeps at 4AM",
    "Always Late", "Picky Eater", "Oversharer", "Workaholic",
    "Ghoster", "Sarcastic", "Clingy", "Shopaholic"
];

const ZODIAC_SIGNS = [
    "Aries ♈ 白羊座", "Taurus ♉ 金牛座", "Gemini ♊ 双子座", "Cancer ♋ 巨蟹座",
    "Leo ♌ 狮子座", "Virgo ♍ 处女座", "Libra ♎ 天秤座", "Scorpio ♏ 天蝎座",
    "Sagittarius ♐ 射手座", "Capricorn ♑ 摩羯座", "Aquarius ♒ 水瓶座", "Pisces ♓ 双鱼座"
];

const MBTI_TYPES = [
    "INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP",
    "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"
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
        <svg viewBox="0 0 100 100" className="w-full h-full transition-all duration-500">
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
    const [step, setStep] = useState(1);
    const totalSteps = 4;

    const [customInterest, setCustomInterest] = useState("");
    const [customRedFlag, setCustomRedFlag] = useState("");

    const [formData, setFormData] = useState({
        nickname: '',
        gender: 'male',
        age: 18,
        city: '',
        interests: [],
        red_flags: [],
        mbti: '',
        zodiac: '',
        self_intro: '',
        looking_for: '',
        contact_info: '',
        lat: null,
        long: null,
    });

    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
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
                red_flags: profile.red_flags || [],
                mbti: profile.mbti || '',
                zodiac: profile.zodiac || '',
                self_intro: profile.self_intro || '',
                looking_for: profile.looking_for || '',
                contact_info: cleanContact,
                lat: profile.lat || null,
                long: profile.long || null,
            });
        }
    }, [profile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleToggle = (field, item, max = null) => {
        setFormData((prev) => {
            const current = prev[field] || [];
            if (current.includes(item)) {
                return { ...prev, [field]: current.filter(i => i !== item) };
            } else {
                if (max && current.length >= max) return prev;
                return { ...prev, [field]: [...current, item] };
            }
        });
    };

    const handleAddCustomInterest = (e) => {
        if (e) e.preventDefault();
        const trimmed = customInterest.trim();
        if (trimmed && !formData.interests.includes(trimmed)) {
            handleToggle('interests', trimmed);
            setCustomInterest("");
        }
    };

    const handleAddCustomRedFlag = (e) => {
        if (e) e.preventDefault();
        const trimmed = customRedFlag.trim();
        if (trimmed && !formData.red_flags.includes(trimmed)) {
            if (formData.red_flags.length < 3) {
                handleToggle('red_flags', trimmed, 3);
                setCustomRedFlag("");
            } else {
                alert("Max 3 Red Flags allowed!");
            }
        }
    };

    const handleKeyDown = (e, action) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            action();
        }
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported.");
            return;
        }
        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setFormData(prev => ({ ...prev, lat: latitude, long: longitude }));

                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=12`);
                    const data = await response.json();
                    if (data && data.address) {
                        const addr = data.address;
                        const placeName = addr.city || addr.town || addr.village || addr.suburb || addr.district || addr.state || "Unknown Location";
                        setFormData(prev => ({ ...prev, city: placeName }));
                    }
                } catch (err) {
                    console.error("Geocoding error:", err);
                } finally {
                    setLocationLoading(false);
                }
            },
            (error) => {
                alert("Please allow location access.");
                setLocationLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

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
                status: 'pending',
                updated_at: new Date().toISOString(),
                avatar_seed: `${formData.nickname}-${formData.gender}`,
            };

            const query = profile
                ? supabase.from('matchmaker_profiles').update(profileData).eq('author_id', user.id)
                : supabase.from('matchmaker_profiles').insert(profileData);

            const { error: dbError } = await query;
            if (dbError) throw dbError;

            setSuccess(true);
            setTimeout(() => { if (onSave) onSave(); setLoading(false); }, 1500);

        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleWithdraw = async () => {
        if (!window.confirm("Delete your Identity? This cannot be undone.")) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('matchmaker_profiles').delete().eq('author_id', user.id);
            if (error) throw error;
            await supabase.auth.signOut();
            window.location.reload();
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const nextStep = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setStep(s => Math.min(s + 1, totalSteps));
    };
    const prevStep = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setStep(s => Math.max(s - 1, 1));
    };

    const cardStyle = "bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 md:p-8 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500";
    const labelStyle = "block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1";
    const inputStyle = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium";
    const isWarning = profile?.rejection_reason?.toLowerCase().includes('warning');

    const adjustAge = (delta) => {
        setFormData(prev => {
            const currentAge = parseInt(prev.age) || 18;
            const newAge = Math.min(99, Math.max(18, currentAge + delta));
            return { ...prev, age: newAge };
        });
    };

    return (
        <div className="max-w-2xl mx-auto pb-0 pt-4 px-3 md:px-4">
            {loading && (
                <div className="fixed top-0 left-0 w-full h-1.5 z-[100] bg-indigo-100 dark:bg-indigo-900">
                    <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-[shimmer_1s_infinite] w-full origin-left" style={{ backgroundSize: '200% 100%' }}></div>
                </div>
            )}

            {profile?.status === 'rejected' && (
                <div className={`mb-6 p-4 rounded-2xl flex flex-col md:flex-row items-start gap-4 shadow-md border-l-8 
                    ${isWarning ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' : 'bg-red-50 dark:bg-red-900/20 border-red-500'}`}>
                    <div className={`p-2 rounded-full flex-shrink-0 ${isWarning ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600' : 'bg-red-100 dark:bg-red-900/40 text-red-600'}`}>
                        {isWarning ? <Siren className="w-6 h-6 animate-pulse" /> : <ShieldAlert className="w-6 h-6" />}
                    </div>
                    <div className="flex-1">
                        <h4 className={`text-lg font-black uppercase tracking-wide mb-1 ${isWarning ? 'text-yellow-800 dark:text-yellow-300' : 'text-red-800 dark:text-red-300'}`}>
                            {isWarning ? 'Community Guideline Warning' : 'Profile Rejected'}
                        </h4>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 mb-2">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Admin Message:</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100 italic">"{profile.rejection_reason || 'Violation of guidelines'}"</p>
                        </div>
                        <p className={`text-xs font-bold ${isWarning ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-700 dark:text-red-400'}`}>
                            {isWarning ? 'Access suspended. Please correct your profile.' : 'Please fix your profile and resubmit.'}
                        </p>
                    </div>
                </div>
            )}

            {profile?.status === 'pending' && (
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="font-bold text-yellow-800 dark:text-yellow-300">Waiting for Approval</h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">Your profile is pending review. You can still edit it.</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3 text-red-700 dark:text-red-300 animate-shake">
                    <X className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-bold">{error}</span>
                </div>
            )}

            <div className="mb-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-3 md:p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex justify-between text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    <span>Identity</span>
                    <span>Vibe</span>
                    <span>Details</span>
                    <span>Contact</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out rounded-full"
                        style={{ width: `${(step / totalSteps) * 100}%` }}
                    ></div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>

                {step === 1 && (
                    <div className={cardStyle}>
                        <div className="text-center mb-6 md:mb-8">
                            <div className="w-28 h-28 md:w-32 md:h-32 mx-auto rounded-full border-4 border-white dark:border-gray-700 shadow-xl overflow-hidden bg-gray-50 dark:bg-gray-900 mb-4">
                                <AvatarGenerator nickname={formData.nickname} gender={formData.gender} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Let's Create Your Persona</h2>
                            <p className="text-sm text-gray-500">This is what others will see first.</p>
                        </div>

                        <div className="space-y-5 md:space-y-6">
                            <div>
                                <label className={labelStyle}>Nickname</label>
                                <input type="text" name="nickname" value={formData.nickname} onChange={handleChange} placeholder="e.g. Jason" className={inputStyle} maxLength={20} autoFocus />
                            </div>

                            <div className="grid grid-cols-2 gap-3 md:gap-4">
                                <div>
                                    <label className={labelStyle}>Gender</label>
                                    <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <button type="button" onClick={() => setFormData(p => ({ ...p, gender: 'male' }))} className={`py-2 rounded-lg text-sm font-bold transition-all ${formData.gender === 'male' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Boy</button>
                                        <button type="button" onClick={() => setFormData(p => ({ ...p, gender: 'female' }))} className={`py-2 rounded-lg text-sm font-bold transition-all ${formData.gender === 'female' ? 'bg-white dark:bg-gray-700 text-pink-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Girl</button>
                                    </div>
                                </div>

                                <div>
                                    <label className={labelStyle}>Age</label>
                                    <div className="flex items-center">
                                        <button
                                            type="button"
                                            onClick={() => adjustAge(-1)}
                                            className="w-12 h-[46px] flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-l-xl border-y border-l border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 transition-colors"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <input
                                            type="number"
                                            name="age"
                                            value={formData.age}
                                            onChange={handleChange}
                                            className="flex-1 h-[46px] text-center border-y border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-base text-gray-900 dark:text-white focus:outline-none font-bold"
                                            min="18"
                                            max="99"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => adjustAge(1)}
                                            className="w-12 h-[46px] flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-r-xl border-y border-r border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className={labelStyle}>Location</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                        <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City or Campus" className={`${inputStyle} pl-12`} />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleGetLocation}
                                        disabled={locationLoading}
                                        className="px-3 md:px-4 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-200 transition-colors flex items-center gap-2 whitespace-nowrap"
                                    >
                                        {locationLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
                                        <span className="text-xs font-bold hidden md:inline">Set GPS</span>
                                        <span className="text-xs font-bold md:hidden">GPS</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className={cardStyle}>
                        <div className="flex items-center gap-3 mb-6 text-purple-600 dark:text-purple-400">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl"><Sparkles className="w-6 h-6" /></div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">What's your vibe?</h3>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <label className={labelStyle}>Zodiac Sign</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    {ZODIAC_SIGNS.map(sign => {
                                        const isActive = formData.zodiac === sign;
                                        const parts = sign.split(' ');
                                        return (
                                            <button
                                                key={sign}
                                                type="button"
                                                onClick={() => setFormData(p => ({ ...p, zodiac: sign }))}
                                                className={`p-2 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${isActive
                                                    ? 'bg-purple-600 text-white border-purple-600 shadow-md transform scale-105'
                                                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-purple-300'}`}
                                            >
                                                <span className="text-xl leading-none">{parts[1]}</span>
                                                <span className="text-[10px] font-bold leading-none">{parts[0]}</span>
                                                <span className="text-[10px] opacity-80 leading-none">{parts[2]}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className={labelStyle}>MBTI Type</label>
                                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                                    {MBTI_TYPES.map(mbti => (
                                        <button
                                            key={mbti}
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, mbti: mbti }))}
                                            className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${formData.mbti === mbti
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-blue-300'}`}
                                        >
                                            {mbti}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className={labelStyle} style={{ color: '#ef4444' }}>My Red Flags (Max 3)</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {RED_FLAG_OPTIONS.map(flag => {
                                        const isActive = formData.red_flags.includes(flag);
                                        return (
                                            <button
                                                key={flag}
                                                type="button"
                                                onClick={() => handleToggle('red_flags', flag, 3)}
                                                className={`px-3 py-2 md:py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${isActive
                                                    ? 'bg-red-50 dark:bg-red-900/30 border-red-200 text-red-600'
                                                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100'}`}
                                            >
                                                {flag} {isActive && <Check className="w-3 h-3" />}
                                            </button>
                                        );
                                    })}
                                    {formData.red_flags.filter(f => !RED_FLAG_OPTIONS.includes(f)).map(flag => (
                                        <button
                                            key={flag}
                                            type="button"
                                            onClick={() => handleToggle('red_flags', flag, 3)}
                                            className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 bg-red-50 dark:bg-red-900/30 border-red-200 text-red-600"
                                        >
                                            {flag} <Check className="w-3 h-3" />
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={customRedFlag}
                                        onChange={(e) => setCustomRedFlag(e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, handleAddCustomRedFlag)}
                                        placeholder="Add custom red flag..."
                                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-base md:text-sm bg-gray-50 dark:bg-gray-900 focus:outline-none focus:border-red-400"
                                    />
                                    <button type="button" onClick={handleAddCustomRedFlag} className="px-3 py-2 bg-red-100 dark:bg-red-900/40 text-red-600 rounded-lg font-bold text-xs hover:bg-red-200">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className={cardStyle}>
                        <div className="flex items-center gap-3 mb-6 text-pink-600 dark:text-pink-400">
                            <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-2xl"><Heart className="w-6 h-6" /></div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">The Deep Stuff</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className={labelStyle}>About Me</label>
                                <textarea name="self_intro" rows={4} value={formData.self_intro} onChange={handleChange} className={inputStyle} placeholder="What makes you tick?" maxLength={500} />
                                <p className="text-right text-[10px] text-gray-400 mt-1">{formData.self_intro.length}/500</p>
                            </div>

                            <div>
                                <label className={labelStyle}>Looking For</label>
                                <textarea name="looking_for" rows={3} value={formData.looking_for} onChange={handleChange} className={inputStyle} placeholder="Study buddy? Gym partner? Soulmate?" maxLength={300} />
                            </div>

                            <div>
                                <label className={labelStyle}>Interests</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {INTEREST_OPTIONS.map(interest => {
                                        const isActive = formData.interests.includes(interest);
                                        return (
                                            <button
                                                key={interest}
                                                type="button"
                                                onClick={() => handleToggle('interests', interest)}
                                                className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${isActive
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20'
                                                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-indigo-300'}`}
                                            >
                                                {interest}
                                            </button>
                                        );
                                    })}
                                    {formData.interests.filter(i => !INTEREST_OPTIONS.includes(i)).map(interest => (
                                        <button
                                            key={interest}
                                            type="button"
                                            onClick={() => handleToggle('interests', interest)}
                                            className="px-4 py-2 rounded-full text-sm font-bold border transition-all bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20"
                                        >
                                            {interest}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={customInterest}
                                        onChange={(e) => setCustomInterest(e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, handleAddCustomInterest)}
                                        placeholder="Add custom interest..."
                                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-base md:text-sm bg-gray-50 dark:bg-gray-900 focus:outline-none focus:border-indigo-400"
                                    />
                                    <button type="button" onClick={handleAddCustomInterest} className="px-3 py-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 rounded-lg font-bold text-xs hover:bg-indigo-200">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className={cardStyle}>
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-green-500/30 mb-4">
                                <AtSign className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white">Final Step!</h3>
                            <p className="text-gray-500">How should matches reach you?</p>
                        </div>

                        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-6 rounded-2xl mb-6">
                            <div className="flex gap-3 mb-2">
                                <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                                <p className="text-sm font-bold text-indigo-800 dark:text-indigo-300">Privacy Guarantee</p>
                            </div>
                            <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed">
                                This info is <strong>encrypted</strong> and hidden. It is ONLY revealed to a person if you BOTH match with each other.
                            </p>
                        </div>

                        <div className="relative group mb-8">
                            <div className="absolute left-4 top-3.5 text-gray-400 font-bold select-none">IG @</div>
                            <input type="text" name="contact_info" value={formData.contact_info} onChange={handleChange} className={`${inputStyle} pl-14 font-mono`} placeholder="username" required />
                        </div>

                        <button
                            type="submit"
                            disabled={!formData.contact_info}
                            className="w-full md:w-auto md:min-w-[300px] flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-lg font-bold rounded-2xl shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mx-auto block"
                        >
                            {profile ? 'Update Profile' : 'Submit Profile'}
                        </button>

                        {profile && (
                            <button type="button" onClick={handleWithdraw} disabled={loading} className="mt-4 w-full text-red-600 dark:text-red-400 font-bold text-sm hover:underline flex items-center justify-center gap-2">
                                <Trash2 className="w-4 h-4" />
                                {profile.status === 'pending' ? 'Withdraw Request' : 'Delete Identity'}
                            </button>
                        )}
                    </div>
                )}

                <div className="flex justify-between items-center mt-6 md:mt-8 px-2">
                    {step > 1 ? (
                        <button type="button" onClick={prevStep} className="flex items-center gap-2 text-gray-500 font-bold hover:text-gray-800 dark:hover:text-white transition-colors px-4 py-3 md:py-2">
                            <ArrowLeft className="w-5 h-5" /> Back
                        </button>
                    ) : (
                        <div></div>
                    )}

                    {step < totalSteps && (
                        <button
                            type="button"
                            onClick={nextStep}
                            disabled={step === 1 && !formData.nickname}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next Step <ArrowRight className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}