import React, { useState, useRef } from 'react';
import { Share2, X, Copy, Check, Facebook, MessageCircle, Mail, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import { QRCodeCanvas } from 'qrcode.react';

function getTruncatedText(text, limit) {
    if (text.length <= limit) {
        return text;
    }
    const lastSpace = text.lastIndexOf(' ', limit);
    if (lastSpace === -1) {
        return text.slice(0, limit) + '...';
    } else {
        return text.slice(0, lastSpace) + '...';
    }
}

export default function ShareProfileButton({ profile }) {
    const [showModal, setShowModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [downloaded, setDownloaded] = useState(false);
    const cardRef = useRef(null);

    const shareUrl = `${window.location.origin}${window.location.pathname}#/matchmaker/profile/${profile.author_id}`;
    const shareText = `Check out ${profile.nickname} on MMU Matchmaker! ${profile.age} from ${profile.city}`;

    const CARD_TEXT_LIMIT = 120;
    const cardIntro = getTruncatedText(profile.self_intro, CARD_TEXT_LIMIT);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleShare = (platform) => {
        let url = '';

        switch (platform) {
            case 'facebook':
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
                break;
            case 'whatsapp':
                url = `https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
                break;
            case 'email':
                url = `mailto:?subject=${encodeURIComponent('MMU Matchmaker Profile')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
                break;
        }

        if (url) {
            window.open(url, '_blank', 'width=600,height=400');
        }
    };

    const handleOpenShareModal = (e) => {
        e.stopPropagation();
        setDownloaded(false);
        setShowModal(true);
    };

    const handleDownloadImage = async () => {
        if (!cardRef.current || downloaded) {
            return;
        }

        try {
            const dataUrl = await toPng(cardRef.current, {
                cacheBust: true,
                pixelRatio: 2
            });

            const link = document.createElement('a');
            link.download = `MMU-Matchmaker-${profile.nickname}.png`;
            link.href = dataUrl;
            link.click();

            setDownloaded(true);
            setTimeout(() => setDownloaded(false), 3000);

        } catch (err) {
            console.error('Failed to download image:', err);
        }
    };

    return (
        <>
            <button
                onClick={handleOpenShareModal}
                className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-full text-indigo-500 dark:text-indigo-400 shadow-sm hover:scale-110 transition-transform border border-gray-100 dark:border-gray-700"
                title="Share Profile"
            >
                <Share2 className="w-4 h-4" />
            </button>

            {showModal && (
                <>
                    <div
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowModal(false);
                        }}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <div
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                    Share Profile
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div
                                ref={cardRef}
                                className="mb-4 w-full bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white font-sans relative overflow-hidden rounded-xl"
                            >
                                <div className="absolute inset-0 opacity-10"
                                    style={{
                                        backgroundImage: 'radial-gradient(circle, #ffffff 2px, transparent 2.5px)',
                                        backgroundSize: '20px 20px'
                                    }}>
                                </div>

                                <div className="relative z-10 text-center flex flex-col items-center">
                                    <div className="p-2 bg-white/20 rounded-full mb-4 backdrop-blur-sm inline-block">
                                        <img
                                            src={`https://api.dicebear.com/9.x/notionists/svg?seed=${profile.avatar_seed}&backgroundColor=transparent&brows=variant10&lips=variant05`}
                                            className="w-32 h-32 rounded-full bg-white"
                                            alt="Avatar"
                                        />
                                    </div>

                                    <h2 className="text-3xl font-bold mb-1 drop-shadow-md">{profile.nickname}</h2>
                                    <p className="text-indigo-100 mb-6 text-lg font-medium opacity-90">{profile.age} • {profile.city}</p>

                                    <div className="bg-white/15 backdrop-blur-md rounded-2xl p-5 mb-6 text-left shadow-lg border border-white/20 w-full">
                                        <p className="italic text-base leading-relaxed text-white text-center">
                                            "{cardIntro}"
                                        </p>
                                    </div>

                                    <div className="flex justify-between items-end w-full text-xs">
                                        <div>
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {profile.interests && profile.interests.slice(0, 3).map(interest => (
                                                    <span key={interest} className="bg-white/20 px-2 py-1 rounded-full text-[10px] font-medium">
                                                        {interest}
                                                    </span>
                                                ))}
                                            </div>
                                            <span className="bg-white text-indigo-700 px-2 py-1 rounded-full font-medium">
                                                MMU Matchmaker
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="bg-white p-1.5 rounded-md">
                                                <QRCodeCanvas
                                                    value={shareUrl}
                                                    size={60}
                                                    bgColor={"#ffffff"}
                                                    fgColor={"#000000"}
                                                    level={"L"}
                                                    includeMargin={false}
                                                />
                                            </div>
                                            <span className="text-white opacity-80 mt-1 text-[10px]">
                                                Scan me
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <SharePlatformButton
                                    icon={<Facebook className="w-5 h-5" />}
                                    label="Facebook"
                                    color="bg-blue-600 hover:bg-blue-700"
                                    onClick={() => handleShare('facebook')}
                                />
                                <SharePlatformButton
                                    icon={<MessageCircle className="w-5 h-5" />}
                                    label="WhatsApp"
                                    color="bg-green-600 hover:bg-green-700"
                                    onClick={() => handleShare('whatsapp')}
                                />
                                <SharePlatformButton
                                    icon={<Mail className="w-5 h-5" />}
                                    label="Email"
                                    color="bg-gray-600 hover:bg-gray-700"
                                    onClick={() => handleShare('email')}
                                />
                                <SharePlatformButton
                                    icon={copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                    label={copied ? 'Copied!' : 'Copy Link'}
                                    color={copied ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}
                                    onClick={handleCopyLink}
                                />
                            </div>

                            <button
                                onClick={handleDownloadImage}
                                disabled={downloaded}
                                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-medium transition-all shadow-md hover:shadow-lg active:scale-95 mb-4
                                ${downloaded
                                        ? 'bg-green-600'
                                        : 'bg-purple-600 hover:bg-purple-700'
                                    }`}
                            >
                                {downloaded ? (
                                    <Check className="w-5 h-5" />
                                ) : (
                                    <Download className="w-5 h-5" />
                                )}
                                <span>
                                    {downloaded ? 'Downloaded!' : 'Download as Image'}
                                </span>
                            </button>

                            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                                Share this profile and help them find their match! 💕
                            </p>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

function SharePlatformButton({ icon, label, color, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl text-white transition-all ${color} shadow-md hover:shadow-lg active:scale-95`}
        >
            {icon}
            <span className="text-[10px] font-medium">{label}</span>
        </button>
    );
}