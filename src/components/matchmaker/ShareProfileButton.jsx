import React, { useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Share2, X, Check, Download } from 'lucide-react';
import { toJpeg } from 'html-to-image';

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
        <svg viewBox="0 0 100 100" className="w-full h-full">
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

export default function ShareProfileButton({ profile }) {
    const [showModal, setShowModal] = useState(false);
    const [downloaded, setDownloaded] = useState(false);
    const cardRef = useRef(null);

    const handleOpenShareModal = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDownloaded(false);
        setShowModal(true);
    };

    const handleDownloadImage = async () => {
        if (!cardRef.current || downloaded) return;

        try {
            const dataUrl = await toJpeg(cardRef.current, {
                quality: 0.95,
                backgroundColor: '#ffffff',
                cacheBust: true,
                pixelRatio: 2,
                style: {
                    height: 'auto',
                    maxHeight: 'none',
                    overflow: 'visible'
                }
            });

            const link = document.createElement('a');
            link.download = `MMU-Matchmaker-${profile.nickname}.jpg`;
            link.href = dataUrl;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setDownloaded(true);
            setTimeout(() => setDownloaded(false), 3000);
        } catch (err) {
            console.error('Failed to download image:', err);
            alert('Could not generate image. Please try again.');
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowModal(false)}
            />

            <div
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full flex flex-col pointer-events-auto max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        Share Profile
                    </h3>
                    <button
                        onClick={() => setShowModal(false)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                    >
                        <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 pr-1 -mr-1 mb-4">
                    <div
                        ref={cardRef}
                        className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white relative overflow-hidden flex flex-col gap-4"
                    >
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-1 h-1 bg-white rounded-full"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`
                                    }}
                                />
                            ))}
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-4 pb-4 border-b border-white/20">
                                <div className="w-16 h-16 rounded-full bg-white overflow-hidden flex-shrink-0 border-2 border-white/30 shadow-sm">
                                    <AvatarGenerator nickname={profile.nickname} gender={profile.gender} />
                                </div>
                                <div>
                                    <h2 className="font-black text-2xl leading-tight drop-shadow-sm">{profile.nickname}</h2>
                                    <p className="text-sm text-indigo-100 opacity-90 font-medium flex items-center gap-2">
                                        <span className="px-2 py-0.5 bg-white/20 rounded-md text-xs capitalize">{profile.gender}</span>
                                        <span>{profile.age} years old</span>
                                    </p>
                                    <p className="text-xs text-indigo-200 mt-1 font-mono">
                                        {profile.city}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4">
                                <h4 className="text-[10px] uppercase tracking-wider font-bold text-indigo-200 mb-1">About Me</h4>
                                <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/10">
                                    <p className="leading-relaxed text-sm whitespace-pre-wrap">
                                        {profile.self_intro}
                                    </p>
                                </div>
                            </div>

                            {profile.looking_for && (
                                <div>
                                    <h4 className="text-[10px] uppercase tracking-wider font-bold text-indigo-200 mb-1">Looking For</h4>
                                    <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/10">
                                        <p className="leading-relaxed text-sm whitespace-pre-wrap">
                                            {profile.looking_for}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-2 pt-4 border-t border-white/20">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-200 mb-2 block">Interests</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {profile.interests && profile.interests.map(interest => (
                                        <span key={interest} className="bg-white/20 px-2 py-1 rounded-md text-[10px] font-medium">
                                            {interest}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 pt-2">
                    <button
                        onClick={handleDownloadImage}
                        disabled={downloaded}
                        className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-medium transition-all shadow-md hover:shadow-lg active:scale-95
                        ${downloaded ? 'bg-green-600' : 'bg-gray-900 dark:bg-indigo-600 hover:bg-gray-800 dark:hover:bg-indigo-700'}`}
                    >
                        {downloaded ? <Check className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                        <span>{downloaded ? 'Saved to Gallery' : 'Download Image'}</span>
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <button
                onClick={handleOpenShareModal}
                className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-full text-indigo-500 dark:text-indigo-400 shadow-sm hover:scale-110 transition-transform border border-gray-100 dark:border-gray-700 z-20 relative"
                title="Share Profile"
            >
                <Share2 className="w-4 h-4" />
            </button>

            {showModal && createPortal(modalContent, document.body)}
        </>
    );
}