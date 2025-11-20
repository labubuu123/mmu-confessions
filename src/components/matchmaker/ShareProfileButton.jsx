import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Share2, X, Copy, Check, Facebook, MessageCircle, Mail, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import { QRCodeCanvas } from 'qrcode.react';

function getTruncatedText(text, limit) {
    if (!text) return "";
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

    const shareUrl = `${window.location.origin}/#/matchmaker/profile/${profile.author_id}`;
    const shareText = `Check out ${profile.nickname} on MMU Matchmaker! ${profile.age} from ${profile.city}`;

    const CARD_TEXT_LIMIT = 100;
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
        e.preventDefault();
        e.stopPropagation();
        setDownloaded(false);
        setShowModal(true);
    };

    const handleDownloadImage = async () => {
        if (!cardRef.current || downloaded) return;

        try {
            const dataUrl = await toPng(cardRef.current, {
                cacheBust: true,
                pixelRatio: 2,
                useCORS: true
            });

            const link = document.createElement('a');
            link.download = `MMU-Matchmaker-${profile.nickname}.png`;
            link.href = dataUrl;
            link.click();

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
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-sm w-full overflow-hidden flex flex-col pointer-events-auto"
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
                        <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                <div
                    ref={cardRef}
                    className="mb-4 p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white relative overflow-hidden"
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
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-1 bg-white/20 backdrop-blur-sm rounded-full flex-shrink-0">
                                <img
                                    src={`https://api.dicebear.com/9.x/notionists/svg?seed=${profile.avatar_seed}&backgroundColor=transparent&brows=variant10&lips=variant05`}
                                    className="w-12 h-12 rounded-full bg-white"
                                    alt="Avatar"
                                    crossOrigin="anonymous"
                                />
                            </div>
                            <div>
                                <h2 className="font-black text-lg leading-tight drop-shadow-sm">{profile.nickname}</h2>
                                <p className="text-xs text-indigo-100 opacity-90 font-medium">
                                    {profile.age} • {profile.city}
                                </p>
                            </div>
                        </div>

                        {cardIntro && (
                            <div className="text-sm mb-4 bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/10">
                                <p className="leading-relaxed italic text-xs">
                                    "{cardIntro}"
                                </p>
                            </div>
                        )}

                        <div className="flex items-end justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-200 mb-1">Interests</span>
                                <div className="flex flex-wrap gap-1 max-w-[140px]">
                                    {profile.interests && profile.interests.slice(0, 3).map(interest => (
                                        <span key={interest} className="bg-white/20 px-1.5 py-0.5 rounded text-[9px] font-medium">
                                            {interest}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="bg-white p-1.5 rounded-lg shadow-lg">
                                    <QRCodeCanvas
                                        value={shareUrl}
                                        size={64}
                                        bgColor={"#ffffff"}
                                        fgColor={"#000000"}
                                        level={"L"}
                                        includeMargin={false}
                                    />
                                </div>
                                <span className="text-[9px] font-medium text-indigo-100 mt-1 opacity-90">
                                    Scan to connect
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
                        color={copied ? "bg-green-600" : "bg-indigo-600 hover:bg-indigo-700"}
                        onClick={handleCopyLink}
                    />
                </div>

                <button
                    onClick={handleDownloadImage}
                    disabled={downloaded}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-medium transition-all shadow-md hover:shadow-lg active:scale-95 mb-2
                    ${downloaded ? 'bg-green-600' : 'bg-gray-900 dark:bg-indigo-600 hover:bg-gray-800 dark:hover:bg-indigo-700'}`}
                >
                    {downloaded ? <Check className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                    <span>{downloaded ? 'Saved to Gallery' : 'Save Image'}</span>
                </button>
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

function SharePlatformButton({ icon, label, color, onClick }) {
    return (
        <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-white transition-all shadow-md hover:shadow-lg active:scale-95 ${color}`}>
            {icon}
            <span className="text-[10px] font-medium">{label}</span>
        </button>
    );
}