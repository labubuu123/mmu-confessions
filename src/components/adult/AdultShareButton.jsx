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
    if (text.length <= limit) return text;
    const lastSpace = text.lastIndexOf(' ', limit);
    return (lastSpace === -1 ? text.slice(0, limit) : text.slice(0, lastSpace)) + '...';
}

export default function AdultShareButton({ post }) {
    const [showModal, setShowModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [downloaded, setDownloaded] = useState(false);
    const [format, setFormat] = useState('card');
    const [comments, setComments] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const cardRef = useRef(null);

    const shareUrl = `${window.location.origin}/adult/${post.id}`;
    const shareText = `Secret Confession #${post.id}: ${post.content.slice(0, 50)}... Read more here:`;

    const CARD_TEXT_LIMIT = 180;
    const STORY_TEXT_LIMIT = 400;

    const displayText = getTruncatedText(
        post.content,
        format === 'story' ? STORY_TEXT_LIMIT : CARD_TEXT_LIMIT
    );

    useEffect(() => {
        if (showModal) {
            document.body.style.overflow = 'hidden';
            if (comments.length === 0) fetchComments();
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [showModal]);

    const fetchComments = async () => {
        const { data } = await supabase
            .from('adult_comments')
            .select('text')
            .eq('post_id', post.id)
            .order('created_at', { ascending: true })
            .limit(2);
        if (data) setComments(data);
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) { console.error(err); }
    };

    const handleShare = (platform) => {
        let url = '';
        switch (platform) {
            case 'facebook':
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
                break;
            case 'whatsapp':
                url = `https://wa.me/?text=${encodeURIComponent(`*Secret #${post.id}* 🤫\n${post.content.slice(0, 100)}...\n\nRead full: ${shareUrl}`)}`;
                break;
            case 'email':
                url = `mailto:?subject=${encodeURIComponent(`Secret Confession #${post.id}`)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
                break;
            default: break;
        }
        if (url) window.open(url, '_blank', 'width=600,height=400');
    };

    const handleDownloadImage = async () => {
        if (!cardRef.current || downloaded || isGenerating) return;

        setIsGenerating(true);
        try {
            await new Promise(r => setTimeout(r, 100));

            const dataUrl = await toPng(cardRef.current, {
                cacheBust: true,
                pixelRatio: 3,
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
        } finally {
            setIsGenerating(false);
        }
    };

    const renderPreview = () => (
        <div
            ref={cardRef}
            className={`
                relative overflow-hidden bg-slate-950 text-slate-200 shadow-2xl flex flex-col transition-all duration-300
                border border-slate-800
                ${format === 'story'
                    ? 'w-[320px] h-[568px] aspect-[9/16]'
                    : 'w-full aspect-[4/3] min-h-[300px]'
                }
            `}
        >
            <div className="absolute inset-0 opacity-100 pointer-events-none bg-slate-950">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-rose-900/20 via-slate-950/0 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full h-2/3 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950/0 to-transparent"></div>
            </div>

            <div className="relative z-10 flex flex-col h-full p-6 md:p-8 justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900/50 backdrop-blur-sm border border-rose-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(225,29,72,0.1)]">
                        <Lock className="w-5 h-5 text-rose-500" />
                    </div>
                    <div>
                        <h4 className="font-black text-base text-slate-100 tracking-tight">POST SECRET</h4>
                        <p className="text-[9px] font-bold text-rose-500 uppercase tracking-[0.2em]">Anonymous Confessions</p>
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center py-6">
                    <div className="relative">
                        <span className="absolute -top-6 -left-2 text-6xl text-rose-800/20 font-serif">“</span>
                        <p className={`font-serif leading-relaxed text-slate-200 ${format === 'story' ? 'text-xl md:text-2xl text-center font-medium' : 'text-lg md:text-xl'}`}>
                            {displayText}
                        </p>
                        <span className="absolute -bottom-10 -right-2 text-6xl text-rose-800/20 font-serif rotate-180">“</span>
                    </div>

                    <div className={`flex items-center gap-2 mt-6 ${format === 'story' ? 'justify-center' : 'justify-end'}`}>
                        <span className="px-2 py-1 rounded bg-slate-900/50 border border-slate-800 text-[10px] text-slate-400 font-mono">
                            #{post.id}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono uppercase">
                            {new Date(post.created_at).toLocaleDateString()}
                        </span>
                    </div>

                    {comments.length > 0 && format === 'story' && (
                        <div className="mt-8 pt-6 border-t border-slate-800/50">
                            <div className="flex flex-col gap-2">
                                {comments.map((comment, idx) => (
                                    <div key={idx} className="bg-slate-900/40 backdrop-blur-sm p-3 rounded-lg border border-slate-800/50 flex gap-3">
                                        <div className="w-0.5 h-full bg-rose-500/30 rounded-full shrink-0"></div>
                                        <p className="text-xs text-slate-400 italic leading-snug">"{getTruncatedText(comment.text, 50)}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-end justify-between pt-4 mt-auto">
                    <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Read Full Secret</p>
                        <div className="flex items-center gap-1.5 text-rose-400">
                            <Flame className="w-3.5 h-3.5 fill-rose-500/20" />
                            <span className="text-xs font-bold tracking-wide text-slate-200">mmuconfessions.fun</span>
                        </div>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg shadow-xl shadow-black/50">
                        <QRCodeCanvas
                            value={shareUrl}
                            size={format === 'story' ? 65 : 55}
                            bgColor={"#ffffff"}
                            fgColor={"#0f172a"}
                            level={"M"}
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const modalContent = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)} />

            <div className="relative w-full max-w-md bg-slate-950 rounded-2xl shadow-2xl shadow-black border border-slate-800 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950 rounded-t-2xl z-20">
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        Share Secret <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded shadow shadow-rose-900/50">18+</span>
                    </h3>
                    <button
                        onClick={() => setShowModal(false)}
                        className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 pb-0 z-20">
                    <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                        {['card', 'story'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFormat(f)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${format === f
                                    ? 'bg-slate-800 text-rose-400 shadow-sm ring-1 ring-slate-700'
                                    : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {f === 'card' ? <Layout className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6 bg-slate-950/50">
                    <div className="flex justify-center items-start min-h-full">
                        {renderPreview()}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-950 rounded-b-2xl z-20 space-y-3">
                    <div className="grid grid-cols-4 gap-2">
                        <ShareButton
                            icon={<Facebook className="w-4 h-4 md:w-5 md:h-5" />}
                            label="Facebook"
                            className="bg-[#1877F2] hover:bg-[#166fe5]"
                            onClick={() => handleShare('facebook')}
                        />
                        <ShareButton
                            icon={<MessageCircle className="w-4 h-4 md:w-5 md:h-5" />}
                            label="WhatsApp"
                            className="bg-[#25D366] hover:bg-[#20bd5a]"
                            onClick={() => handleShare('whatsapp')}
                        />
                        <ShareButton
                            icon={<Mail className="w-4 h-4 md:w-5 md:h-5" />}
                            label="Email"
                            className="bg-slate-700 hover:bg-slate-600"
                            onClick={() => handleShare('email')}
                        />
                        <ShareButton
                            icon={copied ? <Check className="w-4 h-4 md:w-5 md:h-5" /> : <Copy className="w-4 h-4 md:w-5 md:h-5" />}
                            label={copied ? 'Copied' : 'Copy'}
                            className={copied ? 'bg-emerald-600' : 'bg-slate-800 hover:bg-slate-700'}
                            onClick={handleCopyLink}
                        />
                    </div>

                    <button
                        onClick={handleDownloadImage}
                        disabled={downloaded || isGenerating}
                        className={`
                            w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm md:text-base transition-all shadow-lg active:scale-[0.98]
                            ${downloaded
                                ? 'bg-emerald-600 text-white shadow-emerald-900/20'
                                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                            }
                        `}
                    >
                        {downloaded ? <Check className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                        <span>
                            {isGenerating ? 'Generating...' : downloaded ? 'Saved to Gallery' : `Download ${format === 'story' ? 'Story' : 'Card'}`}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <button
                onClick={(e) => { e.preventDefault(); setShowModal(true); }}
                className="text-slate-500 hover:text-rose-400 transition-colors p-2 rounded-full hover:bg-slate-800 active:scale-95"
                title="Share Secret"
            >
                <Share2 className="w-5 h-5" />
            </button>
            {showModal && createPortal(modalContent, document.body)}
        </>
    );
}

function ShareButton({ icon, label, className, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-1.5 p-2 md:p-3 rounded-xl text-white transition-all shadow-sm hover:shadow-md active:scale-95 ${className}`}
        >
            {icon}
            <span className="text-[10px] font-bold tracking-wide">{label}</span>
        </button>
    );
}