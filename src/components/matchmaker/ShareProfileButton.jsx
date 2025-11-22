import React, { useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Share2, X, Check, Download, MapPin, Heart, Flag, Hash, Search, User } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import QRCode from "react-qr-code";

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
                backgroundColor: '#1f2937',
                cacheBust: true,
                pixelRatio: 2,
                style: {
                    height: 'auto',
                    maxHeight: 'none',
                    overflow: 'visible'
                }
            });

            const link = document.createElement('a');
            link.download = `MMU Matchmaker-${profile.nickname}.jpg`;
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
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 md:p-6 max-w-md w-[95%] md:w-full flex flex-col pointer-events-auto max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        Share Profile
                    </h3>
                    <button
                        onClick={() => setShowModal(false)}
                        className="p-2 md:p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                    >
                        <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 pr-1 -mr-1 mb-4 no-scrollbar">
                    <div
                        ref={cardRef}
                        className="bg-gray-800 rounded-3xl overflow-hidden shadow-lg w-full relative flex flex-col border border-gray-700"
                        style={{ minWidth: '300px' }}
                    >
                        <div className={`p-6 md:p-8 text-center relative bg-gradient-to-br ${profile.gender === 'male' ? 'from-indigo-600 to-blue-600' : 'from-pink-600 to-rose-600'}`}>
                            <div className="w-24 h-24 md:w-32 md:h-32 mx-auto bg-gray-200 rounded-full border-4 border-white/10 mb-4 overflow-hidden shadow-xl">
                                <AvatarGenerator nickname={profile.nickname} gender={profile.gender} />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-gray-100 leading-tight break-words drop-shadow-sm">
                                {profile.nickname}, {profile.age}
                            </h2>
                            <div className="flex justify-center items-center gap-2 text-indigo-100 font-medium text-sm mt-1">
                                <MapPin className="w-4 h-4" /> {profile.city || 'Unknown City'}
                            </div>
                        </div>

                        <div className="p-5 md:p-6 space-y-4 md:space-y-5 text-gray-200">
                            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                                {profile.zodiac && (
                                    <span className="px-3 py-1.5 bg-purple-900/40 text-purple-200 text-xs font-bold rounded-xl border border-purple-700/50 shadow-sm">
                                        {profile.zodiac}
                                    </span>
                                )}
                                {profile.mbti && (
                                    <span className="px-3 py-1.5 bg-blue-900/40 text-blue-200 text-xs font-bold rounded-xl border border-blue-700/50 shadow-sm">
                                        {profile.mbti}
                                    </span>
                                )}
                            </div>

                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <User className="w-4 h-4" /> About Me
                                </h3>
                                <div className="bg-gray-700/40 p-4 rounded-2xl border border-gray-600 text-left shadow-sm">
                                    <p className="text-sm text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
                                        {profile.self_intro || "No intro provided."}
                                    </p>
                                </div>
                            </div>

                            {profile.looking_for && (
                                <div>
                                    <h3 className="text-xs font-black text-pink-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Search className="w-4 h-4" /> Looking For
                                    </h3>
                                    <div className="bg-pink-900/10 p-4 rounded-2xl border border-pink-900/30 text-left shadow-sm">
                                        <p className="text-sm text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
                                            {profile.looking_for}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {profile.interests && profile.interests.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Hash className="w-4 h-4" /> Interests
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.interests.map(tag => (
                                            <span key={tag} className="px-3 py-1.5 bg-gray-700 text-gray-300 text-xs font-bold rounded-lg border border-gray-600 shadow-sm">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {profile.red_flags && profile.red_flags.length > 0 && (
                                <div className="bg-red-900/10 p-4 rounded-2xl border border-red-900/30 text-left">
                                    <h3 className="text-xs font-black text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Flag className="w-4 h-4" /> Red Flags
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.red_flags.map((flag, idx) => (
                                            <span key={idx} className="px-3 py-1.5 bg-red-900/20 text-red-300 text-xs font-bold rounded-lg border border-red-800/50 shadow-sm">
                                                {flag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 pt-6 border-t border-gray-700 flex justify-between items-center">
                                <div className="flex flex-col justify-center">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Scan to Match</span>
                                    <div className="flex items-center gap-1.5 text-pink-500 font-bold text-xs">
                                        <Heart className="w-3.5 h-3.5 fill-current" />
                                        <span>MMU Matchmaker</span>
                                    </div>
                                    <span className="text-[9px] text-gray-500 mt-1">mmuconfessions.fun</span>
                                </div>

                                <div className="bg-gray-300 p-2 rounded-xl border border-gray-400 shadow-sm">
                                    <QRCode
                                        value="https://mmuconfessions.fun/matchmaker"
                                        size={48}
                                        fgColor="#111827"
                                        bgColor="transparent"
                                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                        viewBox={`0 0 256 256`}
                                    />
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
    ${downloaded ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
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