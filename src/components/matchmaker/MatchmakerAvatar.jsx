import React, { useMemo } from 'react';

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

const DEFAULT_AVATAR = {
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

export default function MatchmakerAvatar({ config, gender, className }) {
    const finalConfig = useMemo(() => {
        let parsed = config;
        if (typeof config === 'string') {
            try { parsed = JSON.parse(config); } catch (e) { parsed = {}; }
        }
        return { ...DEFAULT_AVATAR, ...(parsed || {}) };
    }, [config]);

    const finalGender = gender || 'male';
    const library = ASSET_LIBRARIES[finalGender] || ASSET_LIBRARIES.male;
    const common = ASSET_LIBRARIES.common;
    const { skin, hairColor, hairStyle, eyes, mouth, eyebrows, facialHair, clothing, clothingColor, eyewear, detail, bg, faceShape, nose } = finalConfig;

    const styleData = library.hairStyles[hairStyle] || library.hairStyles[Object.keys(library.hairStyles)[0]];
    const facePath = common.faceShapes[faceShape] || common.faceShapes.oval;
    const nosePath = common.noses[nose] || common.noses.button;

    return (
        <svg viewBox="0 0 100 100" className={className || "w-full h-full"}>
            <rect width="100" height="100" fill={bg} />
            {styleData.back && <path d={styleData.back} fill={hairColor} stroke={hairColor} strokeWidth="1" strokeLinejoin="round" />}
            <g transform="translate(0, 75)">
                {clothing === 'tee' && <path d="M15 0 Q50 -10 85 0 L85 25 H15 Z" fill={clothingColor} />}
                {clothing === 'hoodie' && <path d="M10 0 Q50 -15 90 0 L90 25 H10 Z" fill={clothingColor} />}
                {clothing === 'suit' && <><path d="M15 0 Q50 -5 85 0 L85 25 H15 Z" fill={clothingColor} /><path d="M50 0 L50 25" stroke="rgba(0,0,0,0.2)" /><path d="M50 5 L40 0 M50 5 L60 0" stroke="white" strokeWidth="3" /><path d="M50 15 L45 5 L55 5 Z" fill="#b91c1c" /></>}
                {clothing === 'tank' && <path d="M25 0 Q50 10 75 0 L75 25 H25 Z" fill={clothingColor} />}
                {clothing === 'flannel' && <g><path d="M15 0 Q50 -5 85 0 L85 25 H15 Z" fill={clothingColor} /><path d="M30 0 V25 M50 0 V25 M70 0 V25 M15 10 H85" stroke="rgba(0,0,0,0.2)" strokeWidth="1" /></g>}
                {clothing === 'blouse' && <><path d="M15 0 Q50 -5 85 0 L85 25 H15 Z" fill={clothingColor} /><path d="M50 0 Q50 15 85 5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" /><circle cx="50" cy="12" r="2" fill="rgba(0,0,0,0.2)" /></>}
                {clothing === 'dress' && <><path d="M20 0 Q50 15 80 0 L85 25 H15 Z" fill={clothingColor} /><path d="M20 0 Q50 15 80 0" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="2" /></>}
                {clothing === 'sweater' && <path d="M12 0 Q50 -8 88 0 L88 25 H12 Z" fill={clothingColor} />}
            </g>
            <rect x="38" y="60" width="24" height="20" fill={skin} />
            <path d={facePath} fill={skin} />
            {detail === 'blush' && <g fill="#ffb6c1" opacity="0.5"><circle cx="30" cy="58" r="4" /><circle cx="70" cy="58" r="4" /></g>}
            {detail === 'freckles' && <g fill="#8d5524" opacity="0.4"><circle cx="30" cy="56" r="0.8" /><circle cx="34" cy="54" r="0.8" /><circle cx="26" cy="55" r="0.8" /><circle cx="70" cy="56" r="0.8" /><circle cx="66" cy="54" r="0.8" /><circle cx="74" cy="55" r="0.8" /></g>}
            {detail === 'mole' && <circle cx="68" cy="62" r="1.2" fill="#5d3527" opacity="0.8" />}
            {detail === 'scars' && <path d="M28 50 L32 58" stroke="#5d3527" strokeWidth="1" opacity="0.4" />}
            {finalGender === 'male' && facialHair !== 'none' && <g fill={hairColor} opacity="0.9">{facialHair === 'beard' && <path d="M25 50 Q50 90 75 50 Q75 60 72 70 Q50 95 28 70 Q25 60 25 50" />}{facialHair === 'stubble' && <path d="M25 50 Q50 90 75 50 Q75 60 72 70 Q50 95 28 70 Q25 60 25 50" opacity="0.3" />}{facialHair === 'goatee' && <path d="M40 70 Q50 90 60 70" />}</g>}
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
                {finalGender === 'male' && facialHair === 'mustache' && <path d="M38 62 Q50 58 62 62" stroke={hairColor} strokeWidth="3" strokeLinecap="round" transform="translate(0,2)" />}
            </g>
            <g transform="translate(0, 2)">
                {eyewear === 'glasses' && <g stroke="#111" strokeWidth="2" fill="rgba(255,255,255,0.2)"><circle cx="36" cy="46" r="7" /><circle cx="64" cy="46" r="7" /><line x1="43" y1="46" x2="57" y2="46" /></g>}
                {eyewear === 'round' && <g stroke="#d4af37" strokeWidth="2" fill="none"><circle cx="36" cy="46" r="8" /><circle cx="64" cy="46" r="8" /><path d="M44 46 Q50 42 56 46" /></g>}
                {eyewear === 'shades' && <g fill="#111"><path d="M28 42 H44 L42 52 H30 Z" /><path d="M56 42 H72 L70 52 H58 Z" /><line x1="44" y1="44" x2="56" y2="44" stroke="#111" strokeWidth="2" /></g>}
            </g>
            {styleData.front && (hairStyle === 'fade' ? <path d={styleData.front} stroke={hairColor} strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.8" /> : <path d={styleData.front} fill={hairColor} />)}
        </svg>
    );
}