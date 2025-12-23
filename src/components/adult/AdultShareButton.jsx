import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Share2,
    X,
    Copy,
    Check,
    Facebook,
    MessageCircle,
    Mail,
    Download,
    Smartphone,
    Layout,
    Flame,
    Lock
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { QRCodeCanvas } from 'qrcode.react';
import { supabase } from '../../lib/supabaseClient';

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

export default function AdultShareButton({ post }) {
    const [showModal, setShowModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [downloaded, setDownloaded] = useState(false);
    const [format, setFormat] = useState('card');
    const [comments, setComments] = useState([]);

    const cardRef = useRef(null);

    const shareUrl = `${window.location.origin}/adult/${post.id}`;
    const shareText = `Read this secret on 18+ Confessions: ${post.content.slice(0, 100)}${post.content.length > 100 ? '...' : ''}`;

    const CARD_TEXT_LIMIT = 150;
    const STORY_TEXT_LIMIT = 350;

    const displayText = getTruncatedText(
        post.content,
        format === 'story' ? STORY_TEXT_LIMIT : CARD_TEXT_LIMIT
    );

    useEffect(() => {
        if (showModal) {
            document.body.style.overflow = 'hidden';
            if (comments.length === 0) {
                fetchComments();
            }
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showModal]);

    const fetchComments = async () => {
        const { data, error } = await supabase
            .from('adult_comments')
            .select('text')
            .eq('post_id', post.id)
            .order('created_at', { ascending: true })
            .limit(2);

        if (!error && data) {
            setComments(data);
        }
    };

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
                url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
                break;
            case 'email':
                url = `mailto:?subject=${encodeURIComponent('Secret Confession')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
                break;
        }

        if (url) {
            window.open(url, '_blank', 'width=600,height=400');
        }
    };

    const handleOpenShareModal = (e) => {
        e.stopPropagation();
        setDownloaded(false);
        setCopied(false);
        setFormat('card');
        setShowModal(true);
    };

    const handleCloseModal = (e) => {
        if (e) {
            e.stopPropagation();
        }
        setShowModal(false);
    };

    const handleDownloadImage = async () => {
        if (!cardRef.current || downloaded) {
            return;
        }

        try {
            const dataUrl = await toPng(cardRef.current, {
                cacheBust: true,
                pixelRatio: 2,
                backgroundColor: '#020617'
            });

            const link = document.createElement('a');
            link.download = `Secret-${post.id}-${format}.png`;
            link.href = dataUrl;
            link.click();

            setDownloaded(true);
            setTimeout(() => setDownloaded(false), 3000);

        } catch (err) {
            console.error('Failed to download image:', err);
        }
    };

    const modalContent = showModal ? (
        <>
            <div
                className="fixed inset-0 bg-black/90 backdrop-blur-md transition-opacity"
                style={{ zIndex: 10000 }}
                onClick={handleCloseModal}
            />
            <div
                className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
                style={{ zIndex: 10001 }}
            >
                <div
                    className="bg-slate-950 rounded-2xl shadow-2xl shadow-rose-900/20 border border-slate-800 p-4 sm:p-6 max-w-md w-full pointer-events-auto max-h-[90vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-4 shrink-0">
                        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                            Share Secret <span className="text-[10px] bg-rose-600 text-white px-1.5 rounded">18+</span>
                        </h3>
                        <button
                            onClick={handleCloseModal}
                            className="p-2 hover:bg-slate-800 rounded-full transition text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex bg-slate-900 p-1 rounded-xl mb-4 shrink-0 border border-slate-800">
                        <button
                            onClick={() => setFormat('card')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${format === 'card'
                                ? 'bg-slate-800 shadow-sm text-rose-400 border border-slate-700'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <Layout className="w-4 h-4" /> Card
                        </button>
                        <button
                            onClick={() => setFormat('story')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${format === 'story'
                                ? 'bg-slate-800 shadow-sm text-rose-400 border border-slate-700'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <Smartphone className="w-4 h-4" /> Story
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-0 mb-4 flex justify-center bg-slate-900/50 rounded-xl p-4 border border-slate-800/50">
                        <div
                            ref={cardRef}
                            className={`
                                relative overflow-hidden bg-slate-950 text-slate-200 shadow-2xl transition-all duration-300 flex flex-col border border-rose-900/30
                                ${format === 'story'
                                    ? 'w-[280px] h-[498px] sm:w-[300px] sm:h-[533px] p-6 justify-between'
                                    : 'w-full h-auto p-6 rounded-xl'
                                }
                            `}
                        >
                            <div className="absolute inset-0 opacity-100 pointer-events-none">
                                <div className="absolute -top-20 -right-20 w-64 h-64 bg-rose-900/20 rounded-full blur-3xl"></div>
                                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-slate-800/20 rounded-full blur-3xl"></div>
                            </div>

                            <div className="relative z-10 flex items-center gap-3 shrink-0">
                                <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800 shadow-inner">
                                    <Lock className="w-5 h-5 text-rose-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-base leading-tight text-slate-100">POST SECRET</p>
                                    <p className="text-[10px] text-rose-500 uppercase tracking-widest font-bold">18+ Confessions</p>
                                </div>
                            </div>

                            <div className={`relative z-10 flex-1 flex flex-col justify-center gap-3 ${format === 'story' ? 'py-4' : 'py-4'}`}>
                                <div className="relative">
                                    <p className={`font-serif leading-relaxed text-slate-300 ${format === 'story' ? 'text-lg text-center' : 'text-sm'}`}>
                                        {displayText}
                                    </p>
                                    <div className="flex justify-end mt-3">
                                        <span className="text-[10px] text-slate-600 font-mono">#{post.id} • {new Date(post.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {comments.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-slate-900">
                                        <div className="flex items-center gap-2 mb-2 opacity-60">
                                            <div className="h-[1px] flex-1 bg-slate-800"></div>
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Whispers</span>
                                            <div className="h-[1px] flex-1 bg-slate-800"></div>
                                        </div>

                                        <div className="space-y-2">
                                            {comments.map((comment, idx) => (
                                                <div
                                                    key={idx}
                                                    className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-[10px] sm:text-xs text-slate-400 leading-snug flex gap-2"
                                                >
                                                    <div className="w-0.5 h-full bg-rose-900/50 shrink-0"></div>
                                                    <p>{getTruncatedText(comment.text, 60)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="relative z-10 flex items-end justify-between shrink-0 mt-auto pt-4">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Scan to read full secret</p>
                                    <div className="flex items-center gap-1.5">
                                        <Flame className="w-3 h-3 text-rose-600 fill-rose-900" />
                                        <span className="text-xs font-bold tracking-wide text-slate-300">mmuconfessions.fun/secrets</span>
                                    </div>
                                </div>
                                <div className="bg-white p-1 rounded-lg shadow-lg">
                                    <QRCodeCanvas
                                        value={shareUrl}
                                        size={format === 'story' ? 60 : 50}
                                        bgColor={"#ffffff"}
                                        fgColor={"#000000"}
                                        level={"M"}
                                        includeMargin={false}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-3 shrink-0">
                        <SharePlatformButton
                            icon={<Facebook className="w-5 h-5" />}
                            label="Facebook"
                            color="bg-[#1877F2] hover:bg-[#166fe5]"
                            onClick={() => handleShare('facebook')}
                        />
                        <SharePlatformButton
                            icon={<MessageCircle className="w-5 h-5" />}
                            label="WhatsApp"
                            color="bg-[#25D366] hover:bg-[#20bd5a]"
                            onClick={() => handleShare('whatsapp')}
                        />
                        <SharePlatformButton
                            icon={<Mail className="w-5 h-5" />}
                            label="Email"
                            color="bg-slate-700 hover:bg-slate-600"
                            onClick={() => handleShare('email')}
                        />
                        <SharePlatformButton
                            icon={copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            label={copied ? 'Copied' : 'Copy Link'}
                            color={copied ? 'bg-emerald-600' : 'bg-slate-800 hover:bg-slate-700'}
                            onClick={handleCopyLink}
                        />
                    </div>

                    <button
                        onClick={handleDownloadImage}
                        disabled={downloaded}
                        className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-bold transition-all shadow-lg active:scale-95 shrink-0
                        ${downloaded
                                ? 'bg-emerald-600 shadow-emerald-900/20'
                                : 'bg-rose-700 hover:bg-rose-600 shadow-rose-900/20'
                            }`}
                    >
                        {downloaded ? (
                            <Check className="w-5 h-5" />
                        ) : (
                            <Download className="w-5 h-5" />
                        )}
                        <span>
                            {downloaded ? 'Saved to Gallery!' : `Download for ${format === 'story' ? 'Stories' : 'Socials'}`}
                        </span>
                    </button>
                </div>
            </div>
        </>
    ) : null;

    return (
        <>
            <button
                onClick={handleOpenShareModal}
                className="text-slate-600 hover:text-slate-300 transition-colors p-2 rounded-full hover:bg-slate-800"
                title="Share Secret"
            >
                <Share2 className="w-5 h-5" />
            </button>

            {showModal && createPortal(modalContent, document.body)}
        </>
    );
}

function SharePlatformButton({ icon, label, color, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl text-white transition-all ${color} shadow-sm hover:shadow-md active:scale-95`}
            title={label}
        >
            {icon}
            <span className="text-[10px] font-bold">{label}</span>
        </button>
    );
}