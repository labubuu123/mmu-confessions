import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import imageCompression from 'browser-image-compression';
import { extractTags, extractHashtagsForPreview } from '../utils/hashtags';
import { Image, Film, Mic, Send, X, Volume2, Sparkles, Tag, BarChart3, CalendarPlus, Settings2, Ghost, Zap, StopCircle, Upload, Disc, Wand2, ChevronDown, Loader2, RotateCcw, Save, Search, Lock, Palette, TrendingUp, Quote, User, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GoogleGenerativeAI } from "@google/generative-ai";
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import PollCreator from './PollCreator';
import EventCreator from './EventCreator';
import SeriesManager from './SeriesManager';
import MoodSelector from './MoodSelector';
import CampusSelector from './CampusSelector';
import LostFoundCreator from './LostFoundCreator';
import ImageGalleryModal from './ImageGalleryModal';
import { useNotifications } from './NotificationSystem';

const MAX_VIDEO_SIZE_MB = 25;
const MAX_IMAGES = 3;
const MAX_AUDIO_SIZE_MB = 10;
const MAX_TEXT_LENGTH = 5000;
const DRAFT_STORAGE_KEY = 'mmu_confession_draft_v1';

const MEME_TEMPLATES = [
    { id: 'fine', name: 'This is Fine' },
    { id: 'drake', name: 'Drake Hotline Bling' },
    { id: 'disastergirl', name: 'Disaster Girl' },
    { id: 'success', name: 'Success Kid' },
    { id: 'mw', name: 'Mind Blown' },
    { id: 'wonka', name: 'Condescending Wonka' },
    { id: 'pooh', name: 'Tuxedo Pooh' },
    { id: 'pigeon', name: 'Is this a pigeon?' },
    { id: 'mocking', name: 'Mocking Spongebob' },
    { id: 'toy', name: 'Toy Story Everywhere' }
];

function getAnonId() {
    let anonId = localStorage.getItem('anonId');
    if (!anonId) {
        anonId = crypto.randomUUID();
        localStorage.setItem('anonId', anonId);
    }
    return anonId;
}

async function getDeviceFingerprint() {
    try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        return result.visitorId;
    } catch (error) {
        console.error("Fingerprint error:", error);
        return null;
    }
}

const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
};

const floatTo16BitPCM = (output, offset, input) => {
    for (let i = 0; i < input.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
};

const encodeWAV = (samples, sampleRate) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);

    floatTo16BitPCM(view, 44, samples);

    return new Blob([view], { type: 'audio/wav' });
};

export default function PostForm({ onPosted, replyingTo, onCancelReply }) {
    const [text, setText] = useState('');
    const [customName, setCustomName] = useState('');
    const [images, setImages] = useState([]);
    const [video, setVideo] = useState(null);
    const [audio, setAudio] = useState(null);
    const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
    const [originalAudio, setOriginalAudio] = useState(null);
    const [voiceEffect, setVoiceEffect] = useState('normal');
    const [isProcessingAudio, setIsProcessingAudio] = useState(false);
    const [showAudioOptions, setShowAudioOptions] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const [previews, setPreviews] = useState([]);
    const [videoPreview, setVideoPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [policyAccepted, setPolicyAccepted] = useState(false);
    const detectedTags = extractHashtagsForPreview(text);
    const [showPollCreator, setShowPollCreator] = useState(false);
    const [pollData, setPollData] = useState(null);
    const [showEventCreator, setShowEventCreator] = useState(false);
    const [eventData, setEventData] = useState(null);
    const [showSeriesManager, setShowSeriesManager] = useState(false);
    const [seriesData, setSeriesData] = useState(null);
    const [showLostFoundCreator, setShowLostFoundCreator] = useState(false);
    const [lostFoundData, setLostFoundData] = useState(null);
    const { success, error, warning, info } = useNotifications();
    const [selectedMood, setSelectedMood] = useState(null);
    const [selectedCampus, setSelectedCampus] = useState(null);
    const [existingSeries, setExistingSeries] = useState([]);
    const [loadingSeries, setLoadingSeries] = useState(false);
    const [isRewriting, setIsRewriting] = useState(false);
    const [showRewriteOptions, setShowRewriteOptions] = useState(false);
    const [history, setHistory] = useState([]);
    const [draftLoaded, setDraftLoaded] = useState(false);
    const [isGeneratingMeme, setIsGeneratingMeme] = useState(false);
    const [viralData, setViralData] = useState(null);
    const [isCheckingViral, setIsCheckingViral] = useState(false);
    const [zoomedIndex, setZoomedIndex] = useState(null);
    const [placeholderText, setPlaceholderText] = useState('Display Name (Optional, defaults to Anonymous)');
    const [isDebate, setIsDebate] = useState(false);
    const textAreaRef = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) {
                setPlaceholderText('Display Name (Default: Anonymous)');
            } else {
                setPlaceholderText('Display Name (Optional, defaults to Anonymous)');
            }
        };

        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (replyingTo && textAreaRef.current) {
            textAreaRef.current.focus();
        }
    }, [replyingTo]);

    useEffect(() => {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);

                if (draft.text) setText(draft.text);
                if (draft.customName) setCustomName(draft.customName);
                if (draft.mood) setSelectedMood(draft.mood);
                if (draft.campus) setSelectedCampus(draft.campus);
                if (draft.policyAccepted) setPolicyAccepted(true);
                if (draft.isDebate) setIsDebate(draft.isDebate);

                if (draft.pollData) {
                    setPollData(draft.pollData);
                    setShowPollCreator(true);
                }

                if (draft.eventData) {
                    setEventData(draft.eventData);
                    setShowEventCreator(true);
                }

                if (draft.seriesData) {
                    setSeriesData(draft.seriesData);
                    setShowSeriesManager(true);
                }

                if (draft.lostFoundData) {
                    setLostFoundData(draft.lostFoundData);
                    setShowLostFoundCreator(true);
                }

            } catch (err) {
                console.error("Failed to restore draft:", err);
                localStorage.removeItem(DRAFT_STORAGE_KEY);
            }
        }
        setDraftLoaded(true);
    }, []);

    useEffect(() => {
        if (!draftLoaded) return;

        const hasContent = text.trim().length > 0 || customName.trim().length > 0 || selectedMood || selectedCampus || pollData || eventData || seriesData || lostFoundData || isDebate;

        if (hasContent) {
            const draftState = {
                text,
                customName,
                mood: selectedMood,
                campus: selectedCampus,
                pollData,
                eventData,
                seriesData,
                lostFoundData,
                policyAccepted,
                isDebate,
                lastSaved: Date.now()
            };
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftState));
        } else {
            localStorage.removeItem(DRAFT_STORAGE_KEY);
        }

        if (viralData && Math.abs(text.length - (viralData.textLength || 0)) > 20) {
            setViralData(null);
        }
    }, [text, customName, selectedMood, selectedCampus, pollData, eventData, seriesData, lostFoundData, policyAccepted, draftLoaded, isDebate]);

    useEffect(() => {
        if (audio) {
            const url = URL.createObjectURL(audio);
            setAudioPreviewUrl(url);
            return () => {
                URL.revokeObjectURL(url);
            };
        } else {
            setAudioPreviewUrl(null);
        }
    }, [audio]);

    const handleMemeify = async () => {
        if (!text.trim()) {
            warning('Write a confession to meme-ify!');
            return;
        }

        if (images.length > 0 || video || audio) {
            if (!window.confirm("This will replace your current media. Continue?")) return;
        }

        setIsGeneratingMeme(true);
        info("Cooking up a meme... 🍳");

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) throw new Error("Missing API Key");

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const templateIds = MEME_TEMPLATES.map(t => t.id).join(', ');
            const prompt = `
                Analyze this confession: "${text}".
                Choose the best meme template ID from this list: [${templateIds}].
                Generate a short, funny TOP text and BOTTOM text for the meme based on the confession.
                Output ONLY JSON: { "template_id": "string", "top": "string", "bottom": "string" }
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const data = JSON.parse(response.text().trim().replace(/```json|```/g, ''));

            const clean = (str) => {
                if (!str) return '_';
                return encodeURIComponent(
                    str.replace(/_/g, '__')
                        .replace(/-/g, '--')
                        .replace(/\n/g, '~n')
                        .replace(/\?/g, '~q')
                        .replace(/%/g, '~p')
                        .replace(/#/g, '~h')
                        .replace(/\//g, '~s')
                        .replace(/"/g, "''")
                );
            };

            const memeUrl = `https://api.memegen.link/images/${data.template_id}/${clean(data.top)}/${clean(data.bottom)}.png`;

            const res = await fetch(memeUrl);
            const blob = await res.blob();
            const file = new File([blob], `meme_${Date.now()}.png`, { type: "image/png" });

            setVideo(null);
            setVideoPreview(null);
            setAudio(null);
            setOriginalAudio(null);
            setImages([file]);

            const reader = new FileReader();
            reader.onloadend = () => setPreviews([reader.result]);
            reader.readAsDataURL(file);

            success("Meme generated! 😂");

        } catch (err) {
            console.error("Meme error:", err);
            error("Failed to generate meme. Try again.");
        } finally {
            setIsGeneratingMeme(false);
        }
    };

    const handleViralCheck = async () => {
        if (!text.trim()) {
            warning('Write something first to analyze!');
            return;
        }

        setIsCheckingViral(true);

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) throw new Error("Missing API Key");

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const prompt = `
                Analyze this confession text intended for a university student page: "${text.substring(0, 1000)}"
                Predict its "Virality Score" from 0 to 100 based on humor, relatability, drama, or shock value.
                Provide 3 short, punchy tips to make it spicier or get more engagement.
                Output ONLY JSON: { "score": number, "tips": ["string", "string", "string"] }
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const data = JSON.parse(response.text().trim().replace(/```json|```/g, ''));

            setViralData({
                ...data,
                textLength: text.length
            });
            success('Analysis complete!');

        } catch (err) {
            console.error("Viral check error:", err);
            error('Failed to analyze. Try again later.');
        } finally {
            setIsCheckingViral(false);
        }
    };

    const analyzeContentWithAI = async (content) => {
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) return { toxic: false, sentiment: 'neutral' };

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const prompt = `
                Analyze the following text for toxicity (hate speech, severe harassment, dangerous threats) and sentiment. 
                Output ONLY a JSON object with this structure: 
                { "toxic": boolean, "sentiment": "positive" | "neutral" | "negative", "reason": "short explanation if toxic" }
                
                Text: "${content.substring(0, 1000)}"
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const textResponse = response.text().trim().replace(/```json|```/g, '');
            return JSON.parse(textResponse);
        } catch (error) {
            console.error("AI Analysis failed:", error);
            return { toxic: false, sentiment: 'neutral' };
        }
    };

    const handleSmartRewrite = async (mode) => {
        if (!text.trim()) {
            warning('Please write something first!');
            return;
        }

        setHistory(prev => [...prev, text]);

        setIsRewriting(true);
        setShowRewriteOptions(false);

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

            if (!apiKey) {
                throw new Error("Missing API Key");
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            let prompt = "";
            switch (mode) {
                case 'polish':
                    prompt = `Fix grammar, spelling, and punctuation for the following text. Keep the tone natural and casual (like a confession). Output ONLY the rewritten text: "${text}"`;
                    break;
                case 'funny':
                    prompt = `Rewrite the following text to be humorous, witty, and fun. Output ONLY the rewritten text: "${text}"`;
                    break;
                case 'dramatic':
                    prompt = `Rewrite the following text to be dramatic, intense, and soap-opera style. Output ONLY the rewritten text: "${text}"`;
                    break;
                case 'poetic':
                    prompt = `Rewrite the following text in a beautiful, poetic style. Output ONLY the rewritten text: "${text}"`;
                    break;
                case 'anonymize':
                    prompt = `Rewrite the following text to strictly remove any identifying writing styles, slang, or unique idioms to protect the author's anonymity, while preserving the exact meaning. Output ONLY the rewritten text: "${text}"`;
                    break;
                default:
                    prompt = `Polish this text: "${text}"`;
            }

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let newText = response.text().trim();

            newText = newText.replace(/^"|"$/g, '')
                .replace(/^Here is the rewritten text:\s*/i, '');

            setText(newText);
            success('Magic rewrite complete!');
        } catch (err) {
            console.error("Rewrite error:", err);
            setHistory(prev => prev.slice(0, -1));

            let msg = 'Failed to rewrite.';
            if (err.message.includes('404') || err.message.includes('not found')) {
                msg = 'AI Model unavailable. Check API configuration.';
            } else if (err.message.includes('Missing API Key')) {
                msg = 'API Key missing in environment variables.';
            }
            error(msg);
        } finally {
            setIsRewriting(false);
        }
    };

    const handleUndo = () => {
        if (history.length === 0) return;

        const previousText = history[history.length - 1];
        setText(previousText);
        setHistory(prev => prev.slice(0, -1));
        info('Undid last change');
    };

    async function handleSubmit(e) {
        e.preventDefault();

        const forbiddenNames = ['admin', 'administrator', 'moderator', 'staff', 'support', 'mmu'];
        if (customName.trim() && forbiddenNames.includes(customName.trim().toLowerCase())) {
            error('This display name is reserved and cannot be used.');
            return;
        }

        if (showEventCreator && (!eventData || !eventData.event_name || !eventData.start_time)) {
            error('Please fill in all required event fields (Event Name and Start Time).');
            return;
        }

        if (showSeriesManager && (!seriesData || !seriesData.series_name)) {
            error('Please provide a series name.');
            return;
        }

        if (showLostFoundCreator && (!lostFoundData || !lostFoundData.itemName || !lostFoundData.location)) {
            error('Please fill in Item Name and Location for Lost & Found.');
            return;
        }

        if (!text.trim() && images.length === 0 && !video && !audio && !eventData && !lostFoundData) {
            warning('Write something or attach media');
            return;
        }

        if (text.length > MAX_TEXT_LENGTH) {
            error(`Text is too long. Maximum ${MAX_TEXT_LENGTH} characters allowed.`);
            return;
        }

        if (!policyAccepted) {
            warning('You must accept the policy to post.');
            return;
        }

        if (isProcessingAudio) {
            warning('Please wait for audio processing to finish.');
            return;
        }

        if (isRecording) {
            warning('Please stop recording before posting.');
            return;
        }

        setLoading(true);
        setUploadProgress(0);
        const { data: { session } } = await supabase.auth.getSession();
        const isAdmin = session?.user?.email === 'admin@mmu.edu';
        const anonId = getAnonId();

        try {
            const deviceId = await getDeviceFingerprint();

            info('Checking cooldown...');
            const { error: cooldownError } = await supabase.rpc('check_post_cooldown', {
                author_id_in: anonId
            });

            if (cooldownError) {
                throw new Error(cooldownError.message);
            }

            let aiAnalysis = { toxic: false, sentiment: 'neutral' };
            if (text.trim()) {
                info('Analyzing content...');
                aiAnalysis = await analyzeContentWithAI(text);

                if (aiAnalysis.toxic) {
                    warning('Your post has been flagged by AI for potential toxicity and submitted for manual review.');
                }
            }

            let media_urls = [];
            let media_type = null;
            let single_media_url = null;

            if (images.length > 0) {
                info('Uploading images...');
                for (let i = 0; i < images.length; i++) {
                    const img = images[i];
                    const compressed = await imageCompression(img, {
                        maxSizeMB: 1,
                        maxWidthOrHeight: 1600
                    });

                    const ext = (compressed.name || 'image.jpg').split('.').pop();
                    const path = `public/${Date.now()}-${anonId.substring(0, 8)}-${i}.${ext}`;

                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('confessions')
                        .upload(path, compressed);

                    if (uploadError) throw uploadError;

                    const { data: publicUrlData } = supabase.storage
                        .from('confessions')
                        .getPublicUrl(uploadData.path);

                    media_urls.push(publicUrlData.publicUrl);
                    setUploadProgress(((i + 1) / images.length) * 100);
                }
                media_type = 'images';
                single_media_url = media_urls[0];
            }

            if (video) {
                info('Uploading video...');
                const ext = (video.name || 'video.mp4').split('.').pop();
                const path = `public/${Date.now()}-${anonId.substring(0, 8)}.${ext}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('confessions')
                    .upload(path, video);

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('confessions')
                    .getPublicUrl(uploadData.path);

                media_urls = [publicUrlData.publicUrl];
                single_media_url = publicUrlData.publicUrl;
                media_type = 'video';
            }

            if (audio) {
                info('Uploading audio...');
                const ext = (audio.name || 'audio.wav').split('.').pop();
                const path = `public/${Date.now()}-${anonId.substring(0, 8)}.${ext}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('confessions')
                    .upload(path, audio);

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('confessions')
                    .getPublicUrl(uploadData.path);

                media_urls = [publicUrlData.publicUrl];
                single_media_url = publicUrlData.publicUrl;
                media_type = 'audio';
            }

            info('Posting...');
            let finalTags = extractTags(text);

            if (lostFoundData) {
                if (lostFoundData.type === 'lost') {
                    if (!finalTags.includes('lost')) finalTags.push('lost');
                } else {
                    if (!finalTags.includes('found')) finalTags.push('found');
                }
                if (!finalTags.includes('lost&found')) finalTags.push('lost&found');
            }

            if (isDebate) {
                if (!finalTags.includes('debate')) finalTags.push('debate');
            }

            let moodData = null;
            if (selectedMood || (voiceEffect && voiceEffect !== 'normal') || aiAnalysis.sentiment) {
                moodData = {
                    ...(selectedMood || {}),
                    voice_effect: voiceEffect !== 'normal' ? voiceEffect : null,
                    ai_sentiment: aiAnalysis.sentiment,
                    toxicity_flag: aiAnalysis.toxic
                };
            }

            const finalAuthorName = isAdmin ? 'Admin' : (customName.trim() || 'Anonymous');

            const { data, error: insertError } = await supabase.from('confessions')
                .insert([{
                    text: text.trim(),
                    author_id: anonId,
                    author_name: finalAuthorName,
                    media_url: single_media_url,
                    media_urls: media_urls.length > 0 ? media_urls : null,
                    media_type,
                    tags: finalTags,
                    approved: aiAnalysis.toxic ? false : true,
                    reported: aiAnalysis.toxic ? true : false,
                    likes_count: 0,
                    comments_count: 0,
                    mood: moodData ? JSON.stringify(moodData) : null,
                    campus: selectedCampus ? selectedCampus.label : null,
                    series_id: seriesData?.series_id || null,
                    series_name: seriesData?.series_name || null,
                    series_part: seriesData?.series_part || null,
                    series_total: seriesData?.series_total || null,
                    reply_to_id: replyingTo?.id || null,
                    is_debate: isDebate,
                    device_id: deviceId
                }])
                .select();

            if (insertError) {
                console.error('Insert error:', insertError);
                throw insertError;
            }

            const postId = data[0].id;

            const myPosts = JSON.parse(localStorage.getItem('my_posts') || '[]');
            if (!myPosts.includes(postId)) {
                myPosts.push(postId);
                localStorage.setItem('my_posts', JSON.stringify(myPosts));
            }

            if (pollData && pollData.question && pollData.options.length >= 2) {
                info('Creating poll...');

                const endsAt = pollData.duration > 0
                    ? new Date(Date.now() + pollData.duration * 24 * 60 * 60 * 1000).toISOString()
                    : null;

                const { error: pollError } = await supabase
                    .from('polls')
                    .insert([{
                        confession_id: postId,
                        question: pollData.question,
                        options: pollData.options,
                        ends_at: endsAt,
                        total_votes: 0
                    }]);

                if (pollError) {
                    console.error('Poll creation error:', pollError);
                }
            }

            if (eventData && eventData.event_name && eventData.start_time) {
                info('Creating event...');

                const { error: eventError } = await supabase
                    .from('events')
                    .insert([{
                        confession_id: postId,
                        event_name: eventData.event_name,
                        description: eventData.description || null,
                        start_time: eventData.start_time,
                        end_time: eventData.end_time || null,
                        location: eventData.location || null
                    }]);

                if (eventError) {
                    console.error('Event creation error:', eventError);
                    error('Post created, but event failed to save: ' + eventError.message);
                }
            }

            if (lostFoundData && lostFoundData.itemName && lostFoundData.location) {
                info('Saving lost & found details...');
                const { error: lfError } = await supabase.from('lost_and_found').insert([{
                    confession_id: postId,
                    type: lostFoundData.type,
                    item_name: lostFoundData.itemName,
                    location: lostFoundData.location,
                    contact_info: lostFoundData.contact || null,
                    is_resolved: false
                }]);

                if (lfError) {
                    console.error('L&F creation error:', lfError);
                    error('Post created, but L&F details failed: ' + lfError.message);
                }
            }

            if (onPosted && data && data.length > 0) {

                if (!aiAnalysis.toxic) {
                    onPosted(data[0]);
                } else {
                    onPosted(null);
                }

                window.dispatchEvent(new CustomEvent('challengeProgress', {
                    detail: { type: 'post' }
                }));

                if (pollData) {
                    window.dispatchEvent(new CustomEvent('challengeProgress', {
                        detail: { type: 'poll' }
                    }));
                }
            }

            if (onCancelReply) onCancelReply();

            localStorage.removeItem(DRAFT_STORAGE_KEY);

            setText('');
            setCustomName('');
            setImages([]);
            setVideo(null);
            setAudio(null);
            setOriginalAudio(null);
            setVoiceEffect('normal');
            setPreviews([]);
            setVideoPreview(null);
            setPolicyAccepted(false);
            setPollData(null);
            setShowPollCreator(false);
            setEventData(null);
            setShowEventCreator(false);
            setSeriesData(null);
            setShowSeriesManager(false);
            setLostFoundData(null);
            setShowLostFoundCreator(false);
            setSelectedMood(null);
            setSelectedCampus(null);
            setUploadProgress(0);
            setShowAudioOptions(false);
            setHistory([]);
            setViralData(null);
            setIsDebate(false);

            if (!aiAnalysis.toxic) {
                success('Posted successfully!');
            }

        } catch (err) {
            console.error('Post error:', err);
            error('Failed to post: ' + (err.message || err));
        } finally {
            setLoading(false);
        }
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                const audioFile = new File([audioBlob], `recording_${Date.now()}.wav`, { type: 'audio/wav' });

                if (audioFile.size > MAX_AUDIO_SIZE_MB * 1024 * 1024) {
                    error(`Recording too large (>${MAX_AUDIO_SIZE_MB}MB)`);
                    return;
                }

                setImages([]);
                setPreviews([]);
                setVideo(null);
                setVideoPreview(null);

                setAudio(audioFile);
                setOriginalAudio(audioFile);
                setVoiceEffect('normal');

                stream.getTracks().forEach(track => track.stop());
                setIsRecording(false);
                setRecordingDuration(0);
                setShowAudioOptions(false);

                applyVoiceEffect('deep', audioFile);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);

            timerRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error('Error accessing microphone:', err);
            error('Could not access microphone. Check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            clearInterval(timerRef.current);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    function handleImageChange(e) {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (files.length > MAX_IMAGES) {
            warning(`Maximum ${MAX_IMAGES} images allowed`);
            return;
        }

        setVideo(null);
        setVideoPreview(null);
        setAudio(null);
        setOriginalAudio(null);
        setVoiceEffect('normal');
        setShowAudioOptions(false);

        setImages(files);

        const newPreviews = [];
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                newPreviews.push(reader.result);
                if (newPreviews.length === files.length) {
                    setPreviews(newPreviews);
                }
            };
            reader.readAsDataURL(file);
        });
    }

    function handleVideoChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
            error(`Video must be under ${MAX_VIDEO_SIZE_MB}MB`);
            e.target.value = null;
            return;
        }

        setImages([]);
        setPreviews([]);
        setAudio(null);
        setOriginalAudio(null);
        setVoiceEffect('normal');
        setShowAudioOptions(false);

        setVideo(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setVideoPreview(reader.result);
        };
        reader.readAsDataURL(file);
    }

    function handleAudioChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > MAX_AUDIO_SIZE_MB * 1024 * 1024) {
            error(`Audio must be under ${MAX_AUDIO_SIZE_MB}MB`);
            e.target.value = null;
            return;
        }

        const audioEl = new Audio(URL.createObjectURL(file));
        audioEl.onloadedmetadata = () => {
            if (audioEl.duration > MAX_RECORDING_DURATION + 1) {
                error(`Audio too long! Max ${MAX_RECORDING_DURATION} seconds allowed.`);
                URL.revokeObjectURL(audioEl.src);
                e.target.value = null;
                return;
            }

            setImages([]);
            setPreviews([]);
            setVideo(null);
            setVideoPreview(null);
            setShowAudioOptions(false);

            setAudio(file);
            setOriginalAudio(file);

            applyVoiceEffect('deep', file);
        };
    }

    async function applyVoiceEffect(type, fileToProcess = originalAudio) {
        if (!fileToProcess) return;
        setVoiceEffect(type);

        if (type === 'normal') {
            setAudio(fileToProcess);
            return;
        }

        setIsProcessingAudio(true);
        info('Applying voice effect...');

        try {
            const arrayBuffer = await fileToProcess.arrayBuffer();
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            let rate = 1.0;
            if (type === 'chipmunk') rate = 1.5;
            else if (type === 'deep') rate = 0.75;

            const newLength = Math.ceil(audioBuffer.length / rate);
            const offlineCtx = new OfflineAudioContext(1, newLength, audioBuffer.sampleRate);

            const source = offlineCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.playbackRate.value = rate;
            source.connect(offlineCtx.destination);
            source.start();

            const renderedBuffer = await offlineCtx.startRendering();

            const wavBlob = encodeWAV(renderedBuffer.getChannelData(0), renderedBuffer.sampleRate);

            const newFile = new File([wavBlob], `processed_${fileToProcess.name.replace(/\.[^/.]+$/, "")}.wav`, { type: 'audio/wav' });

            setAudio(newFile);
            success('Voice effect applied!');
        } catch (err) {
            console.error('Audio processing error:', err);
            error('Failed to apply voice effect. Try a different file.');
            setVoiceEffect('normal');
            setAudio(fileToProcess);
        } finally {
            setIsProcessingAudio(false);
        }
    }

    function removeImage(index) {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
        if (zoomedIndex === index) setZoomedIndex(null);
    }

    function removeVideo() {
        setVideo(null);
        setVideoPreview(null);
    }

    function removeAudio() {
        setAudio(null);
        setOriginalAudio(null);
        setVoiceEffect('normal');
    }

    async function fetchExistingSeries() {
        setLoadingSeries(true);
        const anonId = getAnonId();
        const { data, error: rpcError } = await supabase.rpc('get_my_series', {
            author_id_in: anonId
        });

        if (data) {
            setExistingSeries(data);
        } else if (rpcError) {
            console.error("Error fetching series:", rpcError);
            error('Could not load your existing series.');
        }
        setLoadingSeries(false);
    }

    async function handleToggleSeries() {
        if (!showSeriesManager) {
            info('Loading your series...');
            await fetchExistingSeries();
            setShowSeriesManager(true);
            setIsDebate(false);
        } else {
            setShowSeriesManager(false);
        }

        setShowPollCreator(false);
        setShowEventCreator(false);
        setShowLostFoundCreator(false);

        if (showSeriesManager) {
            setSeriesData(null);
        }
    }

    const charCount = text.length;
    const isNearLimit = charCount > MAX_TEXT_LENGTH * 0.9;

    return (
        <>
            <div className={`bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg border p-4 sm:p-6 mb-4 sm:mb-6 transition-colors ${isDebate ? 'border-orange-500 dark:border-orange-500 shadow-orange-100 dark:shadow-orange-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-2">
                        {isDebate ? (
                            <>
                                <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-500" />
                                <h2 className="text-base sm:text-lg font-bold text-orange-600 dark:text-orange-500">
                                    Start a Debate 🔥
                                </h2>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
                                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Share Your Confession
                                </h2>
                            </>
                        )}
                    </div>
                    {(text || customName || selectedMood || selectedCampus || pollData || eventData || seriesData || lostFoundData || isDebate) && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 animate-in fade-in duration-300">
                            <Save className="w-3 h-3" />
                            <span>Draft Saved</span>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="flex gap-2 sm:gap-3 mb-1">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm sm:text-base">
                            {customName && customName.trim() ? customName.trim()[0].toUpperCase() : 'A'}
                        </div>
                        <div className="flex-1">

                            <div className="mb-2 relative">
                                <div className="absolute inset-y-0 left-0 pl-0 flex items-center pointer-events-none">
                                    <User className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    placeholder={placeholderText}
                                    className="w-full pl-6 pr-3 py-2 text-base sm:text-sm border-b border-gray-200 dark:border-gray-700 bg-transparent focus:border-indigo-500 focus:ring-0 outline-none transition-colors text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500"
                                    maxLength={30}
                                />
                            </div>

                            {replyingTo && (
                                <div className="mb-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border-l-4 border-indigo-500 flex justify-between items-start animate-in fade-in slide-in-from-top-1 shadow-sm">
                                    <div className="flex-1 min-w-0 mr-2">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <Quote className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
                                                Replying to a Confession
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 italic font-medium">
                                            "{replyingTo.text}"
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onCancelReply}
                                        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Cancel Quote Reply"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            <textarea
                                ref={textAreaRef}
                                value={text}
                                onChange={e => setText(e.target.value)}
                                placeholder={isDebate ? "State your hot take! (e.g., 'Pineapple belongs on pizza')" : (replyingTo ? "Share your thoughts on this..." : "What's on your mind? Share anonymously... (Use #hashtags to categorize)")}
                                className={`w-full p-3 sm:p-4 border-0 rounded-lg sm:rounded-xl resize-none bg-gray-50 dark:bg-gray-900 outline-none transition-all text-sm sm:text-base text-gray-900 dark:text-gray-100 ${isDebate ? 'ring-2 ring-orange-500/50' : 'focus:ring-2 focus:ring-indigo-500'}`}
                                rows="4"
                                maxLength={MAX_TEXT_LENGTH}
                                disabled={isRewriting}
                            />

                            {viralData && (
                                <div className="mt-2 mb-2 p-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30 animate-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-orange-500" />
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Viral Potential</span>
                                        </div>
                                        <div className={`px-2 py-0.5 rounded-full text-xs font-black ${viralData.score >= 80 ? 'bg-green-100 text-green-700' : viralData.score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                            {viralData.score}/100
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        {viralData.tips.map((tip, idx) => (
                                            <div key={idx} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                                                <span className="text-orange-400">•</span>
                                                <span>{tip}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center mt-2 mb-2 relative px-1">
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowRewriteOptions(!showRewriteOptions)}
                                            disabled={isRewriting}
                                            className={`group flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-bold transition-all shadow-sm border
                                                ${showRewriteOptions
                                                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow-indigo-200 dark:shadow-none ring-2 ring-indigo-100 dark:ring-indigo-900'
                                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:shadow-md'}`}
                                        >
                                            {isRewriting ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Wand2 className={`w-3.5 h-3.5 ${showRewriteOptions ? 'text-white' : 'text-violet-500 group-hover:rotate-12 transition-transform'}`} />
                                            )}
                                            <span className="leading-none sm:hidden">AI Rewrite</span>
                                            <span className="leading-none hidden sm:inline">Magic Rewrite</span>
                                            <ChevronDown className={`w-3 h-3 transition-transform ${showRewriteOptions ? 'rotate-180' : ''}`} />
                                        </button>

                                        {showRewriteOptions && (
                                            <div className="absolute top-full mt-2 left-0 w-48 sm:w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-[100] ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2">
                                                <div className="p-1.5 space-y-0.5">
                                                    <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider px-3 py-2">Select Tone</div>
                                                    {[
                                                        { id: 'polish', label: '✨ Fix Grammar', desc: 'Standard polish' },
                                                        { id: 'funny', label: '😂 Make it Funny', desc: 'Add humor' },
                                                        { id: 'dramatic', label: '🎭 Dramatic', desc: 'Add intensity' },
                                                        { id: 'poetic', label: '📜 Poetic', desc: 'Lyrical style' },
                                                        { id: 'anonymize', label: '🕵️ Anonymize', desc: 'Remove style' },
                                                    ].map((mode) => (
                                                        <button
                                                            key={mode.id}
                                                            type="button"
                                                            onClick={() => handleSmartRewrite(mode.id)}
                                                            className="w-full text-left px-3 py-2.5 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-xl group transition-all flex flex-col"
                                                        >
                                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200 group-hover:text-violet-700 dark:group-hover:text-violet-400">
                                                                {mode.label}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 group-hover:text-violet-500/80 dark:group-hover:text-violet-400/70">
                                                                {mode.desc}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleMemeify}
                                        disabled={isGeneratingMeme || !text.trim()}
                                        className={`group flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-bold bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600 dark:hover:text-pink-400 transition-all shadow-sm ${isGeneratingMeme ? 'opacity-70 cursor-wait' : ''}`}
                                    >
                                        {isGeneratingMeme ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Palette className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                                        )}
                                        <span className="leading-none hidden sm:inline">Memeify</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleViralCheck}
                                        disabled={isCheckingViral || !text.trim()}
                                        className={`group flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-bold bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400 transition-all shadow-sm ${isCheckingViral ? 'opacity-70 cursor-wait' : ''}`}
                                    >
                                        {isCheckingViral ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <TrendingUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
                                        )}
                                        <span className="leading-none hidden sm:inline">Viral Check</span>
                                    </button>

                                    {history.length > 0 && !isRewriting && (
                                        <button
                                            type="button"
                                            onClick={handleUndo}
                                            className="group flex items-center gap-1.5 px-3 py-1.5 sm:px-3 sm:py-2 rounded-full text-xs font-bold bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm"
                                            title="Undo last change"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-180 transition-transform duration-500" />
                                            <span className="leading-none hidden sm:inline">Undo</span>
                                        </button>
                                    )}

                                    {isRewriting && (
                                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 rounded-full border border-violet-100 dark:border-violet-800 animate-pulse">
                                            <Loader2 className="w-3 h-3 text-violet-600 dark:text-violet-400 animate-spin" />
                                            <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 leading-none">Rewriting...</span>
                                        </div>
                                    )}
                                </div>

                                <div className={`text-[10px] font-bold px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-full border leading-none ${isNearLimit
                                    ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                                    : 'bg-gray-50 text-gray-500 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'}`}>
                                    {charCount}/{MAX_TEXT_LENGTH}
                                </div>
                            </div>
                        </div>
                    </div>

                    {detectedTags.length > 0 && (
                        <div className="mb-3 sm:mb-4 ml-10 sm:ml-14 mt-2 p-2 sm:p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border dark:border-gray-700">
                            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Tag className="w-3 h-3 sm:w-4 sm:h-4" />
                                Detected Tags
                            </div>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                {detectedTags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] sm:text-xs font-bold rounded-full"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {previews.length > 0 && (
                        <div className="my-3 sm:my-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                            {previews.map((preview, idx) => (
                                <div key={idx} className="relative group">
                                    <img
                                        src={preview}
                                        alt={`Preview ${idx + 1}`}
                                        className="w-full h-24 sm:h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
                                        onClick={() => setZoomedIndex(idx)}
                                    />
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeImage(idx);
                                        }}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm z-10"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {videoPreview && (
                        <div className="my-3 sm:my-4 relative">
                            <video src={videoPreview} className="w-full max-h-64 sm:max-h-96 rounded-xl" controls />
                            <button
                                type="button"
                                onClick={removeVideo}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-red-600 transition"
                            >
                                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    )}

                    {audio && (
                        <div className="my-3 sm:my-4 space-y-3">
                            <div className="p-3 sm:p-4 bg-gray-100 dark:bg-gray-900 rounded-xl relative">
                                <div className="flex items-center gap-3 mb-2">
                                    <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                            {audio.name}
                                        </p>
                                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                                            {(audio.size / 1024 / 1024).toFixed(2)} MB {voiceEffect !== 'normal' && <span className="text-indigo-500 font-bold">• {voiceEffect.toUpperCase()} Effect</span>}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={removeAudio}
                                        className="text-red-500 hover:text-red-600"
                                    >
                                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                </div>
                                {audioPreviewUrl && (
                                    <audio controls src={audioPreviewUrl} className="w-full h-8 mt-2" />
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    disabled={isProcessingAudio}
                                    onClick={() => applyVoiceEffect('normal')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition ${voiceEffect === 'normal'
                                        ? 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Volume2 className="w-4 h-4" /> Normal
                                </button>
                                <button
                                    type="button"
                                    disabled={isProcessingAudio}
                                    onClick={() => applyVoiceEffect('chipmunk')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition ${voiceEffect === 'chipmunk'
                                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {isProcessingAudio && voiceEffect === 'chipmunk' ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
                                    Chipmunk
                                </button>
                                <button
                                    type="button"
                                    disabled={isProcessingAudio}
                                    onClick={() => applyVoiceEffect('deep')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition ${voiceEffect === 'deep'
                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {isProcessingAudio && voiceEffect === 'deep' ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Ghost className="w-4 h-4" />}
                                    Deep
                                </button>
                            </div>
                        </div>
                    )}

                    {isRecording && (
                        <div className="my-3 sm:my-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800 flex items-center justify-between animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                                <span className="text-red-600 dark:text-red-400 font-bold font-mono">{formatTime(recordingDuration)}</span>
                                <span className="text-xs text-red-500">Recording...</span>
                            </div>
                            <button
                                type="button"
                                onClick={stopRecording}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition"
                            >
                                <StopCircle className="w-4 h-4" /> Stop
                            </button>
                        </div>
                    )}

                    {showAudioOptions && !audio && !isRecording && (
                        <div className="my-3 sm:my-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-3 animate-in slide-in-from-top-2">
                            <label className="cursor-pointer flex flex-col items-center justify-center gap-2 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition group">
                                <Upload className="w-6 h-6 text-gray-400 group-hover:text-indigo-500" />
                                <span className="text-xs font-bold text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Upload File</span>
                                <input type="file" accept="audio/*" onChange={handleAudioChange} className="hidden" />
                            </label>
                            <button
                                type="button"
                                onClick={startRecording}
                                className="flex flex-col items-center justify-center gap-2 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition group"
                            >
                                <Disc className="w-6 h-6 text-gray-400 group-hover:text-red-500" />
                                <span className="text-xs font-bold text-gray-600 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400">Record Voice</span>
                            </button>
                        </div>
                    )}

                    {showPollCreator && (
                        <div className="my-3 sm:my-4">
                            <PollCreator
                                onPollData={setPollData}
                                onRemovePoll={() => {
                                    setShowPollCreator(false);
                                    setPollData(null);
                                }}
                            />
                        </div>
                    )}

                    {showEventCreator && (
                        <div className="my-3 sm:my-4">
                            <EventCreator
                                onEventData={setEventData}
                                onRemoveEvent={() => {
                                    setShowEventCreator(false);
                                    setEventData(null);
                                }}
                            />
                        </div>
                    )}

                    {showLostFoundCreator && (
                        <div className="my-3 sm:my-4">
                            <LostFoundCreator
                                onData={setLostFoundData}
                                onRemove={() => { setShowLostFoundCreator(false); setLostFoundData(null); }}
                            />
                        </div>
                    )}

                    {showSeriesManager && (
                        <div className="my-3 sm:my-4">
                            <SeriesManager
                                existingSeries={existingSeries}
                                loadingSeries={loadingSeries}
                                onSeriesData={setSeriesData}
                                onRemoveSeries={() => {
                                    setShowSeriesManager(false);
                                    setSeriesData(null);
                                }}
                            />
                        </div>
                    )}


                    {loading && uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="my-3 sm:my-4">
                            <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
                                <span>Uploading...</span>
                                <span>{Math.round(uploadProgress)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="mb-3 sm:mb-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={policyAccepted}
                                onChange={(e) => setPolicyAccepted(e.target.checked)}
                                className="w-4 h-4 sm:w-5 sm:h-5 rounded text-indigo-600 focus:ring-indigo-500 mt-0.5 flex-shrink-0"
                            />
                            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                                I have read and agree to the{' '}
                                <Link
                                    to="/policy"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                    Community Guidelines
                                </Link>
                                .
                            </span>
                        </label>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-1">
                            <label className="cursor-pointer flex items-center gap-1 sm:gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                <Image className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                                    Photos
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageChange}
                                    className="hidden"
                                    disabled={loading || !!video || !!audio}
                                />
                            </label>

                            <label className="cursor-pointer flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                <Film className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                                    Video
                                </span>
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={handleVideoChange}
                                    className="hidden"
                                    disabled={loading || images.length > 0 || !!audio}
                                />
                            </label>

                            <button
                                type="button"
                                onClick={() => {
                                    if (!audio && !isRecording) setShowAudioOptions(!showAudioOptions);
                                }}
                                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition ${(audio || isRecording || showAudioOptions)
                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                disabled={loading || images.length > 0 || !!video}
                            >
                                <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                                    Audio
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsDebate(!isDebate);
                                    setShowPollCreator(false);
                                    setShowEventCreator(false);
                                    setShowLostFoundCreator(false);
                                    setShowSeriesManager(false);
                                }}
                                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition ${isDebate
                                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                disabled={loading || showPollCreator || showEventCreator || showSeriesManager || showLostFoundCreator}
                            >
                                <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                                    Debate
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowPollCreator(!showPollCreator);
                                    setShowEventCreator(false);
                                    setShowLostFoundCreator(false);
                                    setShowSeriesManager(false);
                                    setIsDebate(false);
                                }}
                                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition ${showPollCreator
                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                disabled={loading || showEventCreator || showSeriesManager || showLostFoundCreator || isDebate}
                            >
                                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
                                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                                    Poll
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowEventCreator(!showEventCreator);
                                    setShowPollCreator(false);
                                    setShowLostFoundCreator(false);
                                    setShowSeriesManager(false);
                                    setIsDebate(false);
                                }}
                                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition ${showEventCreator
                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                disabled={loading || showPollCreator || showSeriesManager || showLostFoundCreator || isDebate}
                            >
                                <CalendarPlus className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                                    Event
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowLostFoundCreator(!showLostFoundCreator);
                                    setShowEventCreator(false);
                                    setShowPollCreator(false);
                                    setShowSeriesManager(false);
                                    setIsDebate(false);
                                }}
                                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition ${showLostFoundCreator
                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                disabled={loading || showPollCreator || showEventCreator || showSeriesManager || isDebate}
                            >
                                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
                                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                                    Lost & Found
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={handleToggleSeries}
                                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition ${showSeriesManager
                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                disabled={loading || showPollCreator || showEventCreator || showLostFoundCreator || isDebate}
                            >
                                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                                    Series
                                </span>
                            </button>

                            <CampusSelector
                                selectedCampus={selectedCampus}
                                onSelectCampus={setSelectedCampus}
                            />

                            <MoodSelector
                                selectedMood={selectedMood}
                                onSelectMood={setSelectedMood}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || isProcessingAudio || isRecording || (!text.trim() && images.length === 0 && !video && !audio && !eventData && !pollData && !lostFoundData) || charCount > MAX_TEXT_LENGTH || !policyAccepted}
                            className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg text-sm sm:text-base flex-shrink-0 ${isDebate ? 'bg-orange-600 hover:bg-orange-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span className="hidden sm:inline">Posting...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    <span className="hidden sm:inline">Post</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {zoomedIndex !== null && (
                <ImageGalleryModal
                    images={previews}
                    initialIndex={zoomedIndex}
                    onClose={() => setZoomedIndex(null)}
                />
            )}
        </>
    );
}