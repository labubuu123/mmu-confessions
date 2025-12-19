import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import MatchmakerAvatar from './MatchmakerAvatar';
import {
    Check, Loader2, User, Heart, MapPin, AtSign, X, Sparkles,
    Trash2, ArrowRight, ArrowLeft, Navigation, Shield,
    Plus, Minus, AlertCircle, Siren, ShieldAlert, Palette, Smile,
    Scissors, Shirt, Dice5, Glasses, Clock, CheckCircle2, AlertTriangle
} from 'lucide-react';

const ASSET_KEYS = {
    male: {
        hairStyles: ['bald', 'short', 'quiff', 'fade', 'messy', 'man_bun', 'curtains'],
        facialHair: ['none', 'stubble', 'beard', 'goatee', 'mustache'],
        clothing: ['tee', 'hoodie', 'suit', 'tank', 'flannel']
    },
    female: {
        hairStyles: ['flowy', 'bangs', 'ponytail', 'buns', 'bob', 'pixie'],
        facialHair: ['none'],
        clothing: ['blouse', 'dress', 'hoodie', 'tank', 'sweater']
    },
    common: {
        skin: ['#f8d9ce', '#f3cfb3', '#eab391', '#d29a68', '#ae7648', '#8c5a34', '#593825'],
        hairColors: ['#171717', '#3f2824', '#5d3527', '#8b5134', '#c98a58', '#e8c978', '#909ba8', '#f2f2f2', '#862727', '#342345', '#243c5a', '#ff99aa'],
        clothesColors: ['#1f2937', '#dc2626', '#2563eb', '#16a34a', '#db2777', '#7c3aed', '#f59e0b', '#ffffff', '#000000', '#ffb6c1'],
        bgColors: ['#e0e7ff', '#dbeafe', '#ccfbf1', '#f3f4f6', '#fce7f3', '#ffe4e6', '#fef3c7', '#fae8ff', '#111827'],
        faceShapes: ['oval', 'round', 'square', 'sharp'],
        eyes: ['dots', 'oval', 'chill', 'smug', 'tired', 'pretty', 'lash', 'anime', 'happy', 'wink'],
        noses: ['button', 'straight', 'wide', 'sharp'],
        eyebrows: ['neutral', 'thick', 'angry', 'confused', 'thin', 'arched', 'soft'],
        mouths: ['smile', 'neutral', 'laugh', 'frown', 'smirk', 'pout', 'open'],
        eyewear: ['none', 'glasses', 'shades', 'round'],
        details: ['none', 'blush', 'freckles', 'mole', 'scars']
    }
};

const ZODIAC_SIGNS = [
    "Aries ♈ 白羊座", "Taurus ♉ 金牛座", "Gemini ♊ 双子座", "Cancer ♋ 巨蟹座",
    "Leo ♌ 狮子座", "Virgo ♍ 处女座", "Libra ♎ 天秤座", "Scorpio ♏ 天蝎座",
    "Sagittarius ♐ 射手座", "Capricorn ♑ 摩羯座", "Aquarius ♒ 水瓶座", "Pisces ♓ 双鱼座"
];

const MBTI_TYPES = [
    "INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP",
    "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"
];

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

const AvatarEditor = ({ config, onChange, gender }) => {
    const [tab, setTab] = useState('hair');
    const genderKeys = ASSET_KEYS[gender] || ASSET_KEYS.male;
    const common = ASSET_KEYS.common;

    const randomize = () => {
        const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
        onChange('skin', rand(common.skin));
        onChange('bg', rand(common.bgColors));
        onChange('hairStyle', rand(genderKeys.hairStyles));
        onChange('hairColor', rand(common.hairColors));
        onChange('faceShape', rand(common.faceShapes));
        onChange('eyes', rand(common.eyes));
        onChange('nose', rand(common.noses));
        onChange('mouth', rand(common.mouths));
        onChange('eyebrows', rand(common.eyebrows));
        onChange('clothing', rand(genderKeys.clothing));
        onChange('clothingColor', rand(common.clothesColors));
        onChange('eyewear', Math.random() > 0.7 ? rand(common.eyewear) : 'none');
        onChange('detail', Math.random() > 0.8 ? rand(common.details) : 'none');
        if (gender === 'male') onChange('facialHair', Math.random() > 0.6 ? rand(genderKeys.facialHair) : 'none');
    };

    const TabButton = ({ id, icon: Icon, label }) => (
        <button type="button" onClick={() => setTab(id)} className={`flex-shrink-0 px-4 py-3 flex flex-col items-center gap-1.5 transition-all border-b-2 ${tab === id ? 'border-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase">{label}</span>
        </button>
    );

    const ColorPicker = ({ colors, selected, onSelect, label }) => (
        <div className="mb-4">
            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">{label}</label>
            <div className="flex flex-wrap gap-2">
                {colors.map(c => (
                    <button key={c} type="button" onClick={() => onSelect(c)} className={`w-8 h-8 rounded-full shadow-sm transition-transform ${selected === c ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110' : 'hover:scale-105'}`} style={{ backgroundColor: c, border: c === '#ffffff' ? '1px solid #e5e7eb' : 'none' }} />
                ))}
            </div>
        </div>
    );

    const OptionGrid = ({ options, selected, onSelect, label }) => (
        <div className="mb-4">
            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">{label}</label>
            <div className="grid grid-cols-3 gap-2">
                {options.map(opt => (
                    <button key={opt} type="button" onClick={() => onSelect(opt)} className={`py-2 px-1 rounded-lg text-[11px] font-bold capitalize border transition-all ${selected === opt ? 'bg-indigo-100 dark:bg-indigo-900 border-indigo-400 text-indigo-700 dark:text-indigo-300' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'}`}>
                        {opt.replace(/_/g, ' ')}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-6 duration-500">
            <div className="w-full md:w-1/3 bg-gray-100 dark:bg-gray-950 flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 relative">
                <button type="button" onClick={randomize} className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md text-indigo-600 hover:scale-110 transition-transform z-10" title="Randomize">
                    <Dice5 className="w-5 h-5" />
                </button>
                <div className="w-48 h-48 rounded-3xl border-8 border-white dark:border-gray-800 shadow-xl overflow-hidden bg-white">
                    <MatchmakerAvatar config={config} gender={gender} />
                </div>
                <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{gender === 'male' ? 'Boy' : 'Girl'} Style</p>
            </div>
            <div className="w-full md:w-2/3 flex flex-col h-[400px]">
                <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-800 scrollbar-hide">
                    <TabButton id="skin" icon={User} label="Base" />
                    <TabButton id="hair" icon={Scissors} label="Hair" />
                    <TabButton id="face" icon={Smile} label="Features" />
                    <TabButton id="clothes" icon={Shirt} label="Style" />
                    <TabButton id="extra" icon={Glasses} label="Details" />
                </div>
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                    {tab === 'skin' && <><OptionGrid options={common.faceShapes} selected={config.faceShape} onSelect={(s) => onChange('faceShape', s)} label="Face Shape" /><ColorPicker colors={common.skin} selected={config.skin} onSelect={(c) => onChange('skin', c)} label="Skin Tone" /><ColorPicker colors={common.bgColors} selected={config.bg} onSelect={(c) => onChange('bg', c)} label="Background" /></>}
                    {tab === 'hair' && <><OptionGrid options={genderKeys.hairStyles} selected={config.hairStyle} onSelect={(s) => onChange('hairStyle', s)} label="Hairstyle" /><ColorPicker colors={common.hairColors} selected={config.hairColor} onSelect={(c) => onChange('hairColor', c)} label="Hair Color" />{gender === 'male' && <OptionGrid options={genderKeys.facialHair} selected={config.facialHair} onSelect={(s) => onChange('facialHair', s)} label="Facial Hair" />}</>}
                    {tab === 'face' && <><OptionGrid options={common.eyes} selected={config.eyes} onSelect={(s) => onChange('eyes', s)} label="Eyes" /><OptionGrid options={common.noses} selected={config.nose} onSelect={(s) => onChange('nose', s)} label="Nose" /><OptionGrid options={common.eyebrows} selected={config.eyebrows} onSelect={(s) => onChange('eyebrows', s)} label="Eyebrows" /><OptionGrid options={common.mouths} selected={config.mouth} onSelect={(s) => onChange('mouth', s)} label="Mouth" /></>}
                    {tab === 'clothes' && <><OptionGrid options={genderKeys.clothing} selected={config.clothing} onSelect={(s) => onChange('clothing', s)} label="Outfit" /><ColorPicker colors={common.clothesColors} selected={config.clothingColor} onSelect={(c) => onChange('clothingColor', c)} label="Fabric Color" /></>}
                    {tab === 'extra' && <><OptionGrid options={common.eyewear} selected={config.eyewear} onSelect={(s) => onChange('eyewear', s)} label="Glasses" /><OptionGrid options={common.details} selected={config.detail} onSelect={(s) => onChange('detail', s)} label="Facial Details" /></>}
                </div>
            </div>
        </div>
    );
};

export default function MatchmakerProfileForm({ profile, user, onSave }) {
    const [step, setStep] = useState(1);
    const totalSteps = 4;
    const [customInterest, setCustomInterest] = useState("");
    const [isEditingAvatar, setIsEditingAvatar] = useState(false);

    const defaultAvatar = { skin: '#f3cfb3', hairColor: '#3f2824', hairStyle: 'messy', eyes: 'chill', eyebrows: 'neutral', mouth: 'smile', nose: 'button', faceShape: 'oval', facialHair: 'none', clothing: 'hoodie', clothingColor: '#1f2937', eyewear: 'none', detail: 'none', bg: '#e0e7ff' };

    const [formData, setFormData] = useState({
        nickname: '', gender: 'male', age: 18, city: '', interests: [], red_flags: [], mbti: '', zodiac: '', self_intro: '', looking_for: '', contact_info: '', lat: null, long: null, avatar_config: defaultAvatar, status: 'none', rejection_reason: ''
    });

    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    useEffect(() => {
        if (profile) {
            let cleanContact = profile.contact_info || '';
            if (cleanContact.startsWith('@')) cleanContact = cleanContact.substring(1);
            let loadedAvatar = defaultAvatar;
            if (profile.avatar_config) {
                loadedAvatar = typeof profile.avatar_config === 'string' ? JSON.parse(profile.avatar_config) : profile.avatar_config;
            }
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
                avatar_config: loadedAvatar,
                status: profile.status || 'pending',
                rejection_reason: profile.rejection_reason || ''
            });
        }
    }, [profile]);

    const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleAvatarChange = (key, value) => setFormData(p => ({ ...p, avatar_config: { ...p.avatar_config, [key]: value } }));

    const nextStep = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setStep(s => Math.min(s + 1, totalSteps));
    };
    const prevStep = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setStep(s => Math.max(s - 1, 1));
    };

    const setGender = (newGender) => {
        if (newGender === formData.gender) return;
        const library = ASSET_KEYS[newGender] || ASSET_KEYS.male;
        setFormData(p => ({ ...p, gender: newGender, avatar_config: { ...p.avatar_config, hairStyle: library.hairStyles[0], clothing: library.clothing[0], facialHair: 'none', eyebrows: 'neutral' } }));
    };

    const handleToggle = (field, item, max) => setFormData(p => {
        const c = p[field] || [];
        if (c.includes(item)) return { ...p, [field]: c.filter(i => i !== item) };
        if (max && c.length >= max) return p;
        return { ...p, [field]: [...c, item] };
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            let finalContact = formData.contact_info.trim();
            if (finalContact && !finalContact.startsWith('@') && isNaN(finalContact.charAt(0))) finalContact = '@' + finalContact;

            const profileData = {
                ...formData,
                contact_info: finalContact,
                author_id: user.id,
                age: parseInt(formData.age, 10),
                status: 'pending',
                rejection_reason: null,
                updated_at: new Date().toISOString(),
                avatar_config: formData.avatar_config
            };

            const query = profile
                ? supabase.from('matchmaker_profiles').update(profileData).eq('author_id', user.id)
                : supabase.from('matchmaker_profiles').insert(profileData);

            const { error: dbError } = await query;
            if (dbError) throw dbError;

            setShowSuccessToast(true);
            setFormData(p => ({ ...p, status: 'pending', rejection_reason: '' }));

            setTimeout(() => {
                setShowSuccessToast(false);
                if (onSave) onSave();
                setLoading(false);
            }, 2000);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleWithdraw = async () => {
        if (!confirm("Delete Identity? This cannot be undone.")) return;
        setLoading(true);
        try {
            await supabase.from('matchmaker_profiles').delete().eq('author_id', user.id);
            await supabase.auth.signOut();
            location.reload();
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) return alert("Geo not supported");
        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            setFormData(p => ({ ...p, lat: latitude, long: longitude }));
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=12`);
                const d = await res.json();
                if (d?.address) setFormData(p => ({ ...p, city: d.address.city || d.address.town || "Unknown" }));
            } catch (e) { } finally { setLocationLoading(false); }
        }, () => { alert("Allow loc access"); setLocationLoading(false); });
    };

    const cardStyle = "bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 md:p-8 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500";
    const labelStyle = "block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1";
    const inputStyle = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium";

    return (
        <div className="max-w-2xl mx-auto pb-10 pt-4 px-3 md:px-4 relative">
            {loading && <div className="fixed top-0 left-0 w-full h-1.5 z-[100] bg-indigo-100"><div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-[shimmer_1s_infinite] w-full" style={{ backgroundSize: '200% 100%' }}></div></div>}

            {showSuccessToast && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-green-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-bold">Profile updated & sent for review!</span>
                </div>
            )}

            {profile && (
                <div className="mb-6 space-y-3">
                    {formData.status === 'pending' && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4">
                            <Clock className="w-6 h-6 text-amber-600" />
                            <div>
                                <h4 className="text-amber-800 dark:text-amber-300 font-bold text-sm">Review in Progress</h4>
                                <p className="text-amber-700 dark:text-amber-400/80 text-xs">An admin is currently checking your profile.</p>
                            </div>
                        </div>
                    )}

                    {formData.status === 'rejected' && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                            <div>
                                <h4 className="text-red-800 dark:text-red-300 font-bold text-sm">Profile Rejected</h4>
                                <p className="text-red-700 dark:text-red-400/80 text-xs">Reason: <span className="font-bold">{formData.rejection_reason || 'Inappropriate content'}</span></p>
                                <p className="mt-1 text-red-600 dark:text-red-400 font-bold text-[10px] uppercase">Please edit and resubmit</p>
                            </div>
                        </div>
                    )}

                    {formData.status === 'approved' && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                            <div>
                                <h4 className="text-green-800 dark:text-green-300 font-bold text-sm">Verified Profile</h4>
                                <p className="text-green-700 dark:text-green-400/80 text-xs">Your profile is live and visible to other matchmakers!</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl flex gap-3"><X className="w-5 h-5 mt-0.5" /><span>{error}</span></div>}

            <div className="mb-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-3 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm sticky top-4 z-40">
                <div className="flex justify-between text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    <span className={step >= 1 ? "text-indigo-600" : ""}>Identity</span>
                    <span className={step >= 2 ? "text-indigo-600" : ""}>Vibe</span>
                    <span className={step >= 3 ? "text-indigo-600" : ""}>Details</span>
                    <span className={step >= 4 ? "text-indigo-600" : ""}>Contact</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-500" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {step === 1 && (
                    <div className={cardStyle}>
                        <div className="text-center mb-6">
                            {isEditingAvatar && (
                                <div className="fixed inset-0 z-[150] bg-gray-900 flex items-center justify-center p-4 animate-in fade-in duration-300">
                                    <div className="max-w-3xl w-full">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-white font-black text-xl">Design {formData.gender === 'male' ? 'Boy' : 'Girl'}</h3>
                                            <button type="button" onClick={() => setIsEditingAvatar(false)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-bold text-sm">Save & Close</button>
                                        </div>
                                        <AvatarEditor config={formData.avatar_config} onChange={handleAvatarChange} gender={formData.gender} />
                                    </div>
                                </div>
                            )}
                            <div className="flex flex-col items-center">
                                <div className="w-32 h-32 rounded-3xl border-4 border-white dark:border-gray-700 shadow-xl overflow-hidden bg-gray-50 dark:bg-gray-900 mb-4 relative group">
                                    <MatchmakerAvatar config={formData.avatar_config} gender={formData.gender} />
                                    <button type="button" onClick={() => setIsEditingAvatar(true)} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Palette className="text-white w-8 h-8 drop-shadow-lg" /></button>
                                </div>
                                <button type="button" onClick={() => setIsEditingAvatar(true)} className="mb-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-full flex items-center gap-2 mx-auto shadow-lg hover:scale-105 transition-all"><Palette className="w-3 h-3" /> Customize Look</button>
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Create Your Persona</h2>
                        </div>
                        <div className="space-y-5">
                            <div><label className={labelStyle}>Nickname</label><input type="text" name="nickname" value={formData.nickname} onChange={handleChange} className={inputStyle} maxLength={20} required /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className={labelStyle}>Gender</label><div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-700"><button type="button" onClick={() => setGender('male')} className={`py-2 rounded-lg text-sm font-bold ${formData.gender === 'male' ? 'bg-white text-indigo-600 shadow' : 'text-gray-400'}`}>Boy</button><button type="button" onClick={() => setGender('female')} className={`py-2 rounded-lg text-sm font-bold ${formData.gender === 'female' ? 'bg-white text-pink-600 shadow' : 'text-gray-400'}`}>Girl</button></div></div>
                                <div><label className={labelStyle}>Age</label><div className="flex items-center"><button type="button" onClick={() => setFormData(p => ({ ...p, age: Math.max(18, parseInt(p.age) - 1) }))} className="w-12 h-[46px] bg-gray-50 dark:bg-gray-900 rounded-l-xl border-y border-l border-gray-200 dark:border-gray-700"><Minus className="w-4 h-4 mx-auto" /></button><input type="number" name="age" value={formData.age} readOnly className="flex-1 h-[46px] text-center border-y border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 font-bold" /><button type="button" onClick={() => setFormData(p => ({ ...p, age: Math.min(99, parseInt(p.age) + 1) }))} className="w-12 h-[46px] bg-gray-50 dark:bg-gray-900 rounded-r-xl border-y border-r border-gray-200 dark:border-gray-700"><Plus className="w-4 h-4 mx-auto" /></button></div></div>
                            </div>
                            <div><label className={labelStyle}>Location</label><div className="flex gap-2"><div className="relative flex-1"><MapPin className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" /><input type="text" name="city" value={formData.city} onChange={handleChange} className={`${inputStyle} pl-12`} placeholder="City/Town" /></div><button type="button" onClick={handleGetLocation} disabled={locationLoading} className="px-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-xs flex items-center gap-2">{locationLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />} GPS</button></div></div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className={cardStyle}>
                        <h3 className="text-xl font-bold text-purple-600 mb-6 flex gap-2"><Sparkles className="w-6 h-6" /> What's your vibe?</h3>
                        <div className="space-y-8">
                            <div>
                                <label className={labelStyle}>Zodiac</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {ZODIAC_SIGNS.map(s => {
                                        const parts = s.split(' ');
                                        const icon = parts[1];
                                        const eng = parts[0];
                                        const chi = parts[2];
                                        const isSelected = formData.zodiac === s;
                                        return (
                                            <button key={s} type="button" onClick={() => setFormData(p => ({ ...p, zodiac: s }))} className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${isSelected ? 'bg-purple-600 border-purple-600 text-white' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                                <span className="text-lg mb-1">{icon}</span>
                                                <span className="text-[10px] font-bold leading-tight">{eng}</span>
                                                <span className="text-[10px] leading-tight opacity-80">{chi}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <label className={labelStyle}>MBTI</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {MBTI_TYPES.map(m => (
                                        <button key={m} type="button" onClick={() => setFormData(p => ({ ...p, mbti: m }))} className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${formData.mbti === m ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className={labelStyle} style={{ color: '#ef4444' }}>Red Flags</label>
                                <div className="flex flex-wrap gap-2">
                                    {RED_FLAG_OPTIONS.map(f => (
                                        <button key={f} type="button" onClick={() => handleToggle('red_flags', f, 3)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${formData.red_flags.includes(f) ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className={cardStyle}>
                        <h3 className="text-xl font-bold text-pink-600 mb-6 flex gap-2"><Heart className="w-6 h-6" /> The Deep Stuff</h3>
                        <div className="space-y-6">
                            <div><label className={labelStyle}>About Me</label><textarea name="self_intro" rows={4} value={formData.self_intro} onChange={handleChange} className={inputStyle} placeholder="Describe yourself..." maxLength={500} /><p className="text-right text-[10px] text-gray-400">{formData.self_intro.length}/500</p></div>
                            <div><label className={labelStyle}>Looking For</label><textarea name="looking_for" rows={3} value={formData.looking_for} onChange={handleChange} className={inputStyle} placeholder="What kind of person are you looking for?" maxLength={300} /></div>
                            <div>
                                <label className={labelStyle}>Interests</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {INTEREST_OPTIONS.map(i => (
                                        <button key={i} type="button" onClick={() => handleToggle('interests', i)} className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${formData.interests.includes(i) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                            {i}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input type="text" value={customInterest} onChange={e => setCustomInterest(e.target.value)} placeholder="Add custom..." className="flex-1 px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                                    <button type="button" onClick={() => { if (customInterest) { handleToggle('interests', customInterest); setCustomInterest(""); } }} className="px-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg border border-transparent dark:border-indigo-900"><Plus className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className={cardStyle}>
                        <div className="text-center mb-8"><div className="w-20 h-20 mx-auto bg-green-500 rounded-3xl flex items-center justify-center text-white shadow-lg mb-4"><AtSign className="w-10 h-10" /></div><h3 className="text-2xl font-black">{profile ? 'Update Information' : 'Final Step!'}</h3></div>
                        <div className="bg-indigo-50 dark:bg-gray-900 border border-transparent dark:border-indigo-900/30 p-6 rounded-2xl mb-6">
                            <div className="flex gap-3 mb-2"><Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /><p className="text-sm font-bold text-indigo-800 dark:text-indigo-300">Privacy Guarantee</p></div>
                            <p className="text-xs text-indigo-700 dark:text-indigo-400/80">This info is <strong>encrypted</strong> and only revealed if matched.</p>
                        </div>
                        <div className="relative group mb-8">
                            <div className="absolute left-4 top-3.5 text-gray-400 font-bold">IG @</div>
                            <input type="text" name="contact_info" value={formData.contact_info} onChange={handleChange} className={`${inputStyle} pl-14 font-mono`} placeholder="username" required />
                        </div>

                        <button type="submit" disabled={!formData.contact_info || loading} className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white text-lg font-bold rounded-2xl shadow-xl transition-all">
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (profile ? 'Resubmit for Review' : 'Submit Profile')}
                        </button>

                        {profile && (
                            <button type="button" onClick={handleWithdraw} className="mt-6 w-full text-red-500 font-bold text-sm hover:underline flex items-center justify-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                                <Trash2 className="w-4 h-4" /> Delete Identity
                            </button>
                        )}
                    </div>
                )}

                <div className="flex justify-between items-center mt-6 px-2">
                    {step > 1 ? (
                        <button type="button" onClick={prevStep} className="flex items-center gap-2 text-gray-500 font-bold hover:text-gray-700 transition-colors">
                            <ArrowLeft className="w-5 h-5" /> Back
                        </button>
                    ) : <div />}

                    {step < totalSteps && (
                        <button type="button" onClick={nextStep} disabled={step === 1 && !formData.nickname} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95">
                            Next <ArrowRight className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}