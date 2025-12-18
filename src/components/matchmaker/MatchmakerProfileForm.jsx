import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    Check, Loader2, User, Heart, MapPin, AtSign, X, Sparkles,
    Trash2, ArrowRight, ArrowLeft, Navigation, Shield,
    Plus, Minus, AlertCircle, Siren, ShieldAlert, Palette, Smile,
    Scissors, Shirt, Dice5, Glasses
} from 'lucide-react';

const ASSET_LIBRARIES = {
    male: {
        hairStyles: {
            bald: { back: null, front: null },
            short: { back: null, front: "M20 35 Q50 25 80 35 Q80 20 50 15 Q20 20 20 35" },
            quiff: { back: null, front: "M20 40 Q30 10 50 5 Q70 10 80 40 Q80 20 50 15 Q20 20 20 40" },
            fade: { back: null, front: "M25 38 Q50 25 75 38" },
            messy: {
                back: "M15 40 Q10 30 20 20 Q50 5 80 20 Q90 30 85 40",
                front: "M20 40 Q30 25 40 35 Q50 20 60 35 Q70 20 80 40 Q80 20 50 15 Q20 20 20 40"
            },
            man_bun: {
                back: "M35 15 Q50 5 65 15 Q70 25 60 30 Q50 35 40 30 Q30 25 35 15",
                front: "M20 45 Q50 25 80 45 Q80 25 50 20 Q20 25 20 45"
            },
            curtains: {
                back: "M15 50 Q15 30 25 25 Q50 10 75 25 Q85 30 85 50",
                front: "M20 50 Q40 20 50 20 Q60 20 80 50 Q80 20 50 15 Q20 20 20 50"
            }
        },
        clothing: ['tee', 'hoodie', 'suit', 'tank', 'flannel'],
        facialHair: ['none', 'stubble', 'beard', 'goatee', 'mustache'],
        eyes: ['dots', 'oval', 'chill', 'smug', 'tired'],
        eyebrows: ['neutral', 'thick', 'angry', 'confused']
    },
    female: {
        hairStyles: {
            flowy: {
                back: "M10 40 C 0 60 10 90 20 95 C 40 100 60 100 80 95 C 90 90 100 60 90 40 C 90 20 50 10 10 40 Z",
                front: "M20 40 C 20 20 40 15 50 15 C 60 15 80 20 80 40 C 80 60 75 80 85 90 L 80 40 C 70 30 30 30 20 40 L 15 90 C 25 80 20 60 20 40"
            },
            bangs: {
                back: "M15 40 C 10 50 10 80 25 85 C 40 90 60 90 75 85 C 90 80 90 50 85 40 C 80 20 20 20 15 40",
                front: "M18 45 C 18 20 82 20 82 45 C 82 45 70 35 50 35 C 30 35 18 45 18 45 Z"
            },
            ponytail: {
                back: "M60 20 C 70 10 90 20 95 50 C 100 70 90 90 80 85 C 70 80 75 50 60 40",
                front: "M20 45 C 20 20 40 15 50 15 C 60 15 80 20 80 45 C 80 20 50 15 20 45"
            },
            buns: {
                back: "M10 25 C 0 15 10 5 25 15 C 30 20 25 30 20 30 M80 30 C 75 30 70 20 75 15 C 90 5 100 15 90 25",
                front: "M20 45 C 20 20 30 20 40 30 C 45 35 55 35 60 30 C 70 20 80 20 80 45 C 80 15 20 15 20 45"
            },
            bob: {
                back: "M15 45 C 15 20 85 20 85 45 C 85 65 75 75 65 70 L 65 45 C 50 45 50 45 35 45 L 35 70 C 25 75 15 65 15 45",
                front: "M20 45 C 20 20 80 20 80 45 C 80 45 70 30 50 30 C 30 30 20 45 20 45"
            },
            pixie: {
                back: null,
                front: "M15 50 C 15 20 40 10 50 10 C 60 10 85 20 85 50 C 85 30 60 20 50 20 C 40 20 15 30 15 50"
            }
        },
        clothing: ['blouse', 'dress', 'hoodie', 'tank', 'sweater'],
        facialHair: ['none'],
        eyes: ['pretty', 'lash', 'happy', 'anime', 'wink'],
        eyebrows: ['neutral', 'thin', 'arched', 'soft']
    },
    common: {
        skin: ['#f8d9ce', '#f3cfb3', '#eab391', '#d29a68', '#ae7648', '#8c5a34', '#593825'],
        hairColors: ['#171717', '#3f2824', '#5d3527', '#8b5134', '#c98a58', '#e8c978', '#909ba8', '#f2f2f2', '#862727', '#342345', '#243c5a', '#ff99aa'],
        clothesColors: ['#1f2937', '#dc2626', '#2563eb', '#16a34a', '#db2777', '#7c3aed', '#f59e0b', '#ffffff', '#000000', '#ffb6c1'],
        bgColors: ['#e0e7ff', '#dbeafe', '#ccfbf1', '#f3f4f6', '#fce7f3', '#ffe4e6', '#fef3c7', '#fae8ff', '#111827'],
        mouths: ['smile', 'neutral', 'laugh', 'frown', 'smirk', 'pout', 'open'],
        eyewear: ['none', 'glasses', 'shades', 'round'],
        details: ['none', 'blush', 'freckles', 'mole', 'scars'],

        faceShapes: {
            oval: "M25 50 C 25 25 75 25 75 50 C 75 80 50 90 50 90 C 50 90 25 80 25 50",
            round: "M20 50 C 20 20 80 20 80 50 C 80 85 20 85 20 50",
            square: "M22 45 C 22 20 78 20 78 45 L 78 65 C 78 80 50 85 50 85 C 50 85 22 80 22 65 Z",
            sharp: "M22 40 C 22 15 78 15 78 40 L 80 60 L 50 88 L 20 60 L 22 40"
        },
        noses: {
            button: "M46 56 Q50 54 54 56",
            straight: "M50 50 L50 56 L54 56",
            wide: "M44 56 Q50 52 56 56",
            sharp: "M50 48 L46 56 H54 Z"
        }
    }
};

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

const CustomAvatar = ({ config, gender }) => {
    const {
        skin, hairColor, hairStyle, eyes, mouth, eyebrows, facialHair,
        clothing, clothingColor, eyewear, detail, bg, faceShape, nose
    } = config;

    const library = ASSET_LIBRARIES[gender] || ASSET_LIBRARIES.male;
    const styleData = library.hairStyles[hairStyle] || library.hairStyles[Object.keys(library.hairStyles)[0]];
    const facePath = ASSET_LIBRARIES.common.faceShapes[faceShape] || ASSET_LIBRARIES.common.faceShapes.oval;
    const nosePath = ASSET_LIBRARIES.common.noses[nose] || ASSET_LIBRARIES.common.noses.button;

    return (
        <svg viewBox="0 0 100 100" className="w-full h-full transition-all duration-300 drop-shadow-sm">
            <rect width="100" height="100" fill={bg} />
            {styleData.back && (
                <path d={styleData.back} fill={hairColor} stroke={hairColor} strokeWidth="1" strokeLinejoin="round" />
            )}

            <g transform="translate(0, 75)">
                {clothing === 'tee' && <path d="M15 0 Q50 -10 85 0 L85 25 H15 Z" fill={clothingColor} />}
                {clothing === 'hoodie' && <path d="M10 0 Q50 -15 90 0 L90 25 H10 Z" fill={clothingColor} />}
                {clothing === 'suit' && (
                    <>
                        <path d="M15 0 Q50 -5 85 0 L85 25 H15 Z" fill={clothingColor} />
                        <path d="M50 0 L50 25" stroke="rgba(0,0,0,0.2)" />
                        <path d="M50 5 L40 0 M50 5 L60 0" stroke="white" strokeWidth="3" />
                        <path d="M50 15 L45 5 L55 5 Z" fill="#b91c1c" />
                    </>
                )}
                {clothing === 'tank' && <path d="M25 0 Q50 10 75 0 L75 25 H25 Z" fill={clothingColor} />}
                {clothing === 'flannel' && (
                    <g>
                        <path d="M15 0 Q50 -5 85 0 L85 25 H15 Z" fill={clothingColor} />
                        <path d="M30 0 V25 M50 0 V25 M70 0 V25 M15 10 H85" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
                    </g>
                )}

                {clothing === 'blouse' && (
                    <>
                        <path d="M15 0 Q50 -5 85 0 L85 25 H15 Z" fill={clothingColor} />
                        <path d="M50 0 Q50 15 85 5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                        <circle cx="50" cy="12" r="2" fill="rgba(0,0,0,0.2)" />
                    </>
                )}
                {clothing === 'dress' && (
                    <>
                        <path d="M20 0 Q50 15 80 0 L85 25 H15 Z" fill={clothingColor} />
                        <path d="M20 0 Q50 15 80 0" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
                    </>
                )}
                {clothing === 'sweater' && <path d="M12 0 Q50 -8 88 0 L88 25 H12 Z" fill={clothingColor} />}
            </g>

            <rect x="38" y="60" width="24" height="20" fill={skin} />
            <path d={facePath} fill={skin} />

            {detail === 'blush' && (
                <g fill="#ffb6c1" opacity="0.5">
                    <circle cx="30" cy="58" r="4" />
                    <circle cx="70" cy="58" r="4" />
                </g>
            )}
            {detail === 'freckles' && (
                <g fill="#8d5524" opacity="0.4">
                    <circle cx="30" cy="56" r="0.8" /><circle cx="34" cy="54" r="0.8" /><circle cx="26" cy="55" r="0.8" />
                    <circle cx="70" cy="56" r="0.8" /><circle cx="66" cy="54" r="0.8" /><circle cx="74" cy="55" r="0.8" />
                </g>
            )}
            {detail === 'mole' && (
                <circle cx="68" cy="62" r="1.2" fill="#5d3527" opacity="0.8" />
            )}
            {detail === 'scars' && (
                <path d="M28 50 L32 58" stroke="#5d3527" strokeWidth="1" opacity="0.4" />
            )}

            {gender === 'male' && facialHair !== 'none' && (
                <g fill={hairColor} opacity="0.9">
                    {facialHair === 'beard' && <path d="M25 50 Q50 90 75 50 Q75 60 72 70 Q50 95 28 70 Q25 60 25 50" />}
                    {facialHair === 'stubble' && <path d="M25 50 Q50 90 75 50 Q75 60 72 70 Q50 95 28 70 Q25 60 25 50" opacity="0.3" />}
                    {facialHair === 'goatee' && <path d="M40 70 Q50 90 60 70" />}
                </g>
            )}

            <g fill="#1f2937" className="transition-all">
                <g transform="translate(0, 2)">
                    {eyes === 'dots' && <><circle cx="36" cy="46" r="3" /><circle cx="64" cy="46" r="3" /></>}
                    {eyes === 'oval' && <><ellipse cx="36" cy="46" rx="3" ry="4" /><ellipse cx="64" cy="46" rx="3" ry="4" /></>}
                    {eyes === 'chill' && <><rect x="32" y="45" width="8" height="2" rx="1" /><rect x="60" y="45" width="8" height="2" rx="1" /></>}
                    {eyes === 'tired' && <><path d="M32 46 L40 46" stroke="#1f2937" strokeWidth="2" /><path d="M60 46 L68 46" stroke="#1f2937" strokeWidth="2" /><path d="M32 48 Q36 50 40 48" stroke="#1f2937" strokeWidth="1" opacity="0.5" /><path d="M60 48 Q64 50 68 48" stroke="#1f2937" strokeWidth="1" opacity="0.5" /></>}
                    {eyes === 'smug' && <><path d="M32 46 H40" stroke="#1f2937" strokeWidth="2" /><circle cx="64" cy="46" r="3" /></>}

                    {eyes === 'pretty' && <><path d="M32 46 Q36 42 40 46" fill="none" stroke="#1f2937" strokeWidth="2.5" /><path d="M60 46 Q64 42 68 46" fill="none" stroke="#1f2937" strokeWidth="2.5" /><path d="M29 44 L32 46 M71 44 L68 46" stroke="#1f2937" strokeWidth="1.5" /></>}
                    {eyes === 'lash' && <><circle cx="36" cy="46" r="3.5" /><circle cx="64" cy="46" r="3.5" /><path d="M31 43 L33 45 M69 43 L67 45" stroke="#1f2937" strokeWidth="1.5" /></>}
                    {eyes === 'anime' && <><circle cx="36" cy="46" r="4.5" /><circle cx="37" cy="45" r="1.5" fill="white" /><circle cx="64" cy="46" r="4.5" /><circle cx="65" cy="45" r="1.5" fill="white" /></>}
                    {eyes === 'happy' && <><path d="M32 46 Q36 42 40 46" fill="none" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" /><path d="M60 46 Q64 42 68 46" fill="none" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" /></>}
                    {eyes === 'wink' && <><circle cx="36" cy="46" r="3.5" /><path d="M60 46 Q64 42 68 46" fill="none" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" /></>}
                </g>

                <g transform="translate(0, -2)" stroke={hairColor} strokeWidth="2.5" strokeLinecap="round" fill="none">
                    {eyebrows === 'neutral' && <><path d="M32 40 Q36 38 40 40" /><path d="M60 40 Q64 38 68 40" /></>}
                    {eyebrows === 'thick' && <><path d="M32 40 Q36 38 40 40" strokeWidth="4" /><path d="M60 40 Q64 38 68 40" strokeWidth="4" /></>}
                    {eyebrows === 'thin' && <><path d="M32 40 Q36 38 40 40" strokeWidth="1.5" /><path d="M60 40 Q64 38 68 40" strokeWidth="1.5" /></>}
                    {eyebrows === 'angry' && <><path d="M32 38 L42 41" /><path d="M68 38 L58 41" /></>}
                    {eyebrows === 'confused' && <><path d="M32 40 L42 38" /><path d="M60 38 Q64 36 68 38" /></>}
                    {eyebrows === 'arched' && <><path d="M32 40 Q36 36 40 40" strokeWidth="1.5" /><path d="M60 40 Q64 36 68 40" strokeWidth="1.5" /></>}
                    {eyebrows === 'soft' && <><path d="M32 40 Q36 39 40 40" strokeWidth="1.5" opacity="0.6" /><path d="M60 40 Q64 39 68 40" strokeWidth="1.5" opacity="0.6" /></>}
                </g>

                <path d={nosePath} fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" opacity="0.4" />

                <g stroke="#1f2937" strokeWidth="2.5" fill="none" strokeLinecap="round" transform="translate(0, 2)">
                    {mouth === 'smile' && <path d="M40 65 Q50 72 60 65" />}
                    {mouth === 'neutral' && <path d="M42 68 L58 68" />}
                    {mouth === 'laugh' && <path d="M38 65 Q50 80 62 65" fill="#5c3a3a" stroke="none" />}
                    {mouth === 'frown' && <path d="M40 70 Q50 62 60 70" />}
                    {mouth === 'smirk' && <path d="M40 66 Q50 66 56 62" />}
                    {mouth === 'pout' && <path d="M42 68 Q50 65 58 68" />}
                    {mouth === 'open' && <circle cx="50" cy="68" r="3" fill="#374151" stroke="none" />}
                </g>

                {gender === 'male' && facialHair === 'mustache' && <path d="M38 62 Q50 58 62 62" stroke={hairColor} strokeWidth="3" strokeLinecap="round" transform="translate(0,2)" />}
            </g>

            <g transform="translate(0, 2)">
                {eyewear === 'glasses' && (
                    <g stroke="#111" strokeWidth="2" fill="rgba(255,255,255,0.2)">
                        <circle cx="36" cy="46" r="7" />
                        <circle cx="64" cy="46" r="7" />
                        <line x1="43" y1="46" x2="57" y2="46" />
                    </g>
                )}
                {eyewear === 'round' && (
                    <g stroke="#d4af37" strokeWidth="2" fill="none">
                        <circle cx="36" cy="46" r="8" />
                        <circle cx="64" cy="46" r="8" />
                        <path d="M44 46 Q50 42 56 46" />
                    </g>
                )}
                {eyewear === 'shades' && (
                    <g fill="#111">
                        <path d="M28 42 H44 L42 52 H30 Z" />
                        <path d="M56 42 H72 L70 52 H58 Z" />
                        <line x1="44" y1="44" x2="56" y2="44" stroke="#111" strokeWidth="2" />
                    </g>
                )}
            </g>

            {styleData.front && (
                hairStyle === 'fade'
                    ? <path d={styleData.front} stroke={hairColor} strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.8" />
                    : <path d={styleData.front} fill={hairColor} />
            )}
        </svg>
    );
};

const AvatarEditor = ({ config, onChange, gender }) => {
    const [tab, setTab] = useState('hair');

    const assets = ASSET_LIBRARIES[gender] || ASSET_LIBRARIES.male;
    const common = ASSET_LIBRARIES.common;

    const randomize = () => {
        const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const randObj = (obj) => {
            const keys = Object.keys(obj);
            return keys[Math.floor(Math.random() * keys.length)];
        };

        onChange('skin', rand(common.skin));
        onChange('bg', rand(common.bgColors));
        onChange('hairStyle', randObj(assets.hairStyles));
        onChange('hairColor', rand(common.hairColors));
        onChange('faceShape', randObj(common.faceShapes));
        onChange('eyes', rand(assets.eyes));
        onChange('nose', randObj(common.noses));
        onChange('mouth', rand(common.mouths));
        onChange('eyebrows', rand(assets.eyebrows));
        onChange('clothing', rand(assets.clothing));
        onChange('clothingColor', rand(common.clothesColors));
        onChange('eyewear', Math.random() > 0.7 ? rand(common.eyewear) : 'none');
        onChange('detail', Math.random() > 0.8 ? rand(common.details) : 'none');

        if (gender === 'male') {
            onChange('facialHair', Math.random() > 0.6 ? rand(assets.facialHair) : 'none');
        }
    };

    const TabButton = ({ id, icon: Icon, label }) => (
        <button
            type="button"
            onClick={() => setTab(id)}
            className={`flex-shrink-0 px-4 py-3 flex flex-col items-center gap-1.5 transition-all border-b-2 ${tab === id ? 'border-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
        >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase">{label}</span>
        </button>
    );

    const ColorPicker = ({ colors, selected, onSelect, label }) => (
        <div className="mb-4">
            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">{label}</label>
            <div className="flex flex-wrap gap-2">
                {colors.map(c => (
                    <button
                        key={c}
                        type="button"
                        onClick={() => onSelect(c)}
                        className={`w-8 h-8 rounded-full shadow-sm transition-transform ${selected === c ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110' : 'hover:scale-105'}`}
                        style={{ backgroundColor: c, border: c === '#ffffff' ? '1px solid #e5e7eb' : 'none' }}
                    />
                ))}
            </div>
        </div>
    );

    const OptionGrid = ({ options, selected, onSelect, label }) => (
        <div className="mb-4">
            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">{label}</label>
            <div className="grid grid-cols-3 gap-2">
                {options.map(opt => (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => onSelect(opt)}
                        className={`py-2 px-1 rounded-lg text-[11px] font-bold capitalize border transition-all ${selected === opt ? 'bg-indigo-100 dark:bg-indigo-900 border-indigo-400 text-indigo-700 dark:text-indigo-300' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'}`}
                    >
                        {opt.replace('_', ' ')}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-6 duration-500">
            <div className="w-full md:w-1/3 bg-gray-100 dark:bg-gray-950 flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 relative">
                <button
                    type="button"
                    onClick={randomize}
                    className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md text-indigo-600 hover:scale-110 transition-transform z-10"
                    title="Randomize Avatar"
                >
                    <Dice5 className="w-5 h-5" />
                </button>

                <div className="w-48 h-48 rounded-full border-8 border-white dark:border-gray-800 shadow-xl overflow-hidden bg-white">
                    <CustomAvatar config={config} gender={gender} />
                </div>
                <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {gender === 'male' ? 'Boy' : 'Girl'} Style
                </p>
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
                    {tab === 'skin' && (
                        <>
                            <OptionGrid options={Object.keys(common.faceShapes)} selected={config.faceShape} onSelect={(s) => onChange('faceShape', s)} label="Face Shape" />
                            <ColorPicker colors={common.skin} selected={config.skin} onSelect={(c) => onChange('skin', c)} label="Skin Tone" />
                            <ColorPicker colors={common.bgColors} selected={config.bg} onSelect={(c) => onChange('bg', c)} label="Background" />
                        </>
                    )}

                    {tab === 'hair' && (
                        <>
                            <OptionGrid options={Object.keys(assets.hairStyles)} selected={config.hairStyle} onSelect={(s) => onChange('hairStyle', s)} label="Hairstyle" />
                            <ColorPicker colors={common.hairColors} selected={config.hairColor} onSelect={(c) => onChange('hairColor', c)} label="Hair Color" />
                            {gender === 'male' && (
                                <OptionGrid options={assets.facialHair} selected={config.facialHair} onSelect={(s) => onChange('facialHair', s)} label="Facial Hair" />
                            )}
                        </>
                    )}

                    {tab === 'face' && (
                        <>
                            <OptionGrid options={assets.eyes} selected={config.eyes} onSelect={(s) => onChange('eyes', s)} label="Eyes" />
                            <OptionGrid options={Object.keys(common.noses)} selected={config.nose} onSelect={(s) => onChange('nose', s)} label="Nose" />
                            <OptionGrid options={assets.eyebrows} selected={config.eyebrows} onSelect={(s) => onChange('eyebrows', s)} label="Eyebrows" />
                            <OptionGrid options={common.mouths} selected={config.mouth} onSelect={(s) => onChange('mouth', s)} label="Mouth" />
                        </>
                    )}

                    {tab === 'clothes' && (
                        <>
                            <OptionGrid options={assets.clothing} selected={config.clothing} onSelect={(s) => onChange('clothing', s)} label="Outfit" />
                            <ColorPicker colors={common.clothesColors} selected={config.clothingColor} onSelect={(c) => onChange('clothingColor', c)} label="Fabric Color" />
                        </>
                    )}

                    {tab === 'extra' && (
                        <>
                            <OptionGrid options={common.eyewear} selected={config.eyewear} onSelect={(s) => onChange('eyewear', s)} label="Glasses" />
                            <OptionGrid options={common.details} selected={config.detail} onSelect={(s) => onChange('detail', s)} label="Facial Details" />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function MatchmakerProfileForm({ profile, user, onSave }) {
    const [step, setStep] = useState(1);
    const totalSteps = 4;

    const [customInterest, setCustomInterest] = useState("");
    const [customRedFlag, setCustomRedFlag] = useState("");
    const [isEditingAvatar, setIsEditingAvatar] = useState(false);

    const defaultAvatar = {
        skin: '#f3cfb3',
        hairColor: '#3f2824',
        hairStyle: 'messy',
        eyes: 'chill',
        eyebrows: 'neutral',
        mouth: 'smile',
        nose: 'button',
        faceShape: 'oval',
        facialHair: 'none',
        clothing: 'hoodie',
        clothingColor: '#1f2937',
        eyewear: 'none',
        detail: 'none',
        bg: '#e0e7ff'
    };

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
        avatar_config: defaultAvatar,
    });

    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (profile) {
            let cleanContact = profile.contact_info || '';
            if (cleanContact.startsWith('@')) cleanContact = cleanContact.substring(1);

            let loadedAvatar = defaultAvatar;
            if (profile.avatar_config) {
                loadedAvatar = typeof profile.avatar_config === 'string'
                    ? JSON.parse(profile.avatar_config)
                    : profile.avatar_config;
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
            });
        }
    }, [profile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const setGender = (newGender) => {
        if (newGender === formData.gender) return;

        const library = ASSET_LIBRARIES[newGender];
        const defaultHair = Object.keys(library.hairStyles)[0];
        const defaultCloth = library.clothing[0];

        setFormData(prev => ({
            ...prev,
            gender: newGender,
            avatar_config: {
                ...prev.avatar_config,
                hairStyle: defaultHair,
                clothing: defaultCloth,
                facialHair: 'none',
                eyebrows: 'neutral'
            }
        }));
    };

    const handleAvatarChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            avatar_config: {
                ...prev.avatar_config,
                [key]: value
            }
        }));
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
                avatar_config: formData.avatar_config
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

                            {isEditingAvatar ? (
                                <div className="fixed inset-0 z-[150] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
                                    <div className="max-w-3xl w-full">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-white font-black text-xl">
                                                Designing: <span className="text-indigo-400">{formData.gender === 'male' ? 'Boy' : 'Girl'}</span>
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingAvatar(false)}
                                                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors"
                                            >
                                                Save & Close
                                            </button>
                                        </div>
                                        <AvatarEditor config={formData.avatar_config} onChange={handleAvatarChange} gender={formData.gender} />
                                    </div>
                                </div>
                            ) : null}

                            <div className="flex flex-col items-center">
                                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-700 shadow-xl overflow-hidden bg-gray-50 dark:bg-gray-900 mb-4 relative group">
                                    <CustomAvatar config={formData.avatar_config} gender={formData.gender} />
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingAvatar(true)}
                                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    >
                                        <Palette className="text-white w-8 h-8 drop-shadow-lg" />
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsEditingAvatar(true)}
                                    className="mb-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-full flex items-center gap-2 mx-auto hover:shadow-lg hover:scale-105 transition-all"
                                >
                                    <Palette className="w-3 h-3" /> Customize Look
                                </button>
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
                                        <button type="button" onClick={() => setGender('male')} className={`py-2 rounded-lg text-sm font-bold transition-all ${formData.gender === 'male' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Boy</button>
                                        <button type="button" onClick={() => setGender('female')} className={`py-2 rounded-lg text-sm font-bold transition-all ${formData.gender === 'female' ? 'bg-white dark:bg-gray-700 text-pink-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Girl</button>
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