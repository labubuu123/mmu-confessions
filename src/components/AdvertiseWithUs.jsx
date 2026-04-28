import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    Image as ImageIcon,
    Link as LinkIcon,
    MessageSquare,
    CheckCircle,
    CreditCard,
    AlertCircle,
    Megaphone,
    Eye,
    Palette,
    X,
    ArrowUp,
    Trash2,
    Zap
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import imageCompression from 'browser-image-compression';

const PACKAGES = [
    {
        id: 'feed_3days',
        title: 'Pinned Feed Post',
        price: 5,
        period: '3 days',
        description: 'Quick visibility boost. Pinned to the top of the feed for 3 days.',
        features: ['Top of the feed', 'Highlighted border', 'Direct WhatsApp button']
    },
    {
        id: 'feed_1week',
        title: 'Pinned Feed Post',
        price: 10,
        period: '1 week',
        description: 'Standard reach. Pinned to the top of the confession feed for 7 days.',
        features: ['Top of the feed', 'Highlighted border', 'Direct WhatsApp button']
    },
    {
        id: 'feed_2weeks',
        title: 'Pinned Feed Post',
        price: 18,
        period: '2 weeks',
        description: 'Maximum value and reach. Pinned to the top of the feed for 14 days.',
        features: ['Top of the feed', 'Highlighted border', 'Direct WhatsApp button']
    }
];

export default function AdvertiseWithUs() {
    const [formData, setFormData] = useState({
        packageId: 'feed_1week',
        brandName: '',
        color: '#3B82F6',
        link: '',
        whatsapp: '',
        caption: '',
        images: [],
        imagePreviews: [],
    });

    const [status, setStatus] = useState('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [hasPaid, setHasPaid] = useState(false);

    const selectedPackage = PACKAGES.find(p => p.id === formData.packageId);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (formData.images.length + files.length > 5) {
            setErrorMessage('You can only upload up to 5 images.');
            return;
        }

        setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
        setErrorMessage('');

        const newPreviews = [];
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                newPreviews.push(reader.result);
                if (newPreviews.length === files.length) {
                    setFormData(prev => ({
                        ...prev,
                        imagePreviews: [...prev.imagePreviews, ...newPreviews]
                    }));
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
            imagePreviews: prev.imagePreviews.filter((_, i) => i !== index)
        }));
    };

    const setHeroImage = (index) => {
        if (index === 0) return;
        setFormData(prev => {
            const newImages = [...prev.images];
            const newPreviews = [...prev.imagePreviews];

            [newImages[0], newImages[index]] = [newImages[index], newImages[0]];
            [newPreviews[0], newPreviews[index]] = [newPreviews[index], newPreviews[0]];

            return { ...prev, images: newImages, imagePreviews: newPreviews };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.images.length === 0) {
            setErrorMessage('Please upload at least one visual asset (poster/image).');
            return;
        }
        if (!formData.brandName) {
            setErrorMessage('Please provide your Brand Name.');
            return;
        }
        if (!formData.caption) {
            setErrorMessage('Please provide an ad copy (caption).');
            return;
        }

        setStatus('processing');
        setErrorMessage('');

        try {
            let media_urls = [];

            for (let i = 0; i < formData.images.length; i++) {
                const img = formData.images[i];
                const compressed = await imageCompression(img, { maxSizeMB: 1, maxWidthOrHeight: 1600 });
                const ext = (compressed.name || 'image.jpg').split('.').pop();
                const fileName = `ad_${Date.now()}_${Math.random().toString(36).substring(7)}_${i}.${ext}`;
                const filePath = `posters/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('ads')
                    .upload(filePath, compressed);

                if (uploadError) throw new Error('Failed to upload images. Check your storage bucket setup.');

                const { data: publicUrlData } = supabase.storage.from('ads').getPublicUrl(filePath);
                media_urls.push(publicUrlData.publicUrl);
            }

            const { error: dbError } = await supabase
                .from('advertisements')
                .insert([
                    {
                        package_type: formData.packageId,
                        brand_name: formData.brandName,
                        color: formData.color,
                        caption: formData.caption,
                        website_link: formData.link,
                        whatsapp_link: formData.whatsapp,
                        poster_url: media_urls[0] || '',
                        media_urls: media_urls,
                        status: 'pending_approval',
                        amount_paid: selectedPackage.price
                    }
                ]);

            if (dbError) throw dbError;

            setStatus('success');
        } catch (err) {
            console.error(err);
            setStatus('error');
            setErrorMessage(err.message || 'Something went wrong. Please try again.');
        }
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl text-center border border-gray-100 dark:border-gray-700"
                >
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Payment Received!</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                        Thank you for advertising with us. Your submission is currently <strong className="text-blue-600 dark:text-blue-400">Pending Approval</strong>. Our admins will verify the payment and activate your campaign within 24 hours.
                    </p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors duration-200 shadow-lg shadow-blue-500/30"
                    >
                        Return to Home
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-5 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">

            <div className="max-w-7xl mx-auto mb-12 text-center">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6">
                    Grow Your Business on Campus
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Skip the hassle. Set up your customized advertisement in minutes, pay securely via DuitNow, and get your brand in front of the entire student body.
                </p>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                <div className="lg:col-span-7 space-y-8">

                    <section className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                            <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">1</span>
                            Select Package
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {PACKAGES.map((pkg) => (
                                <div
                                    key={pkg.id}
                                    onClick={() => setFormData({ ...formData, packageId: pkg.id })}
                                    className={`cursor-pointer rounded-2xl p-5 border-2 transition-all duration-200 relative overflow-hidden ${formData.packageId === pkg.id
                                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 shadow-md'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                                        }`}
                                >
                                    {formData.packageId === pkg.id && (
                                        <div className="absolute top-4 right-4 text-blue-600">
                                            <CheckCircle className="w-5 h-5" />
                                        </div>
                                    )}
                                    <h3 className="text-md font-bold text-gray-900 dark:text-white mb-1 pr-6">{pkg.title}</h3>
                                    <div className="flex items-baseline text-blue-600 dark:text-blue-400 mb-2">
                                        <span className="text-2xl font-extrabold">RM{pkg.price}</span>
                                        <span className="ml-1 text-xs font-medium">/{pkg.period}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{pkg.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                            <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">2</span>
                            Brand Details & Creative
                        </h2>

                        <div className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Brand Name
                                    </label>
                                    <input
                                        type="text"
                                        name="brandName"
                                        value={formData.brandName}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Cyberia Printing"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                        <Palette className="w-4 h-4 mr-2" />
                                        Brand Theme Color
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            name="color"
                                            value={formData.color}
                                            onChange={handleInputChange}
                                            className="w-14 h-12 rounded cursor-pointer border-0 p-0"
                                        />
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Post highlights & buttons will use this color</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border dark:border-gray-700">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                        <LinkIcon className="w-4 h-4 mr-2 text-gray-400" />
                                        Website Link (Optional)
                                    </label>
                                    <input
                                        type="url"
                                        name="link"
                                        value={formData.link}
                                        onChange={handleInputChange}
                                        placeholder="https://yourstore.com"
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                        <MessageSquare className="w-4 h-4 mr-2 text-gray-400" />
                                        WhatsApp Link (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        name="whatsapp"
                                        value={formData.whatsapp}
                                        onChange={handleInputChange}
                                        placeholder="https://wa.me/60123456789"
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Ad Copy / Caption
                                </label>
                                <textarea
                                    name="caption"
                                    rows={4}
                                    value={formData.caption}
                                    onChange={handleInputChange}
                                    placeholder="E.g., Get 20% off all printing services this week at Cyberia! Show your student ID to claim."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex justify-between">
                                    <span>Visual Assets (Posters/Images)</span>
                                    <span className="text-xs font-normal lowercase opacity-75">
                                        {formData.images.length > 0 ? `${formData.images.length} files selected` : 'Max 5 images'}
                                    </span>
                                </label>

                                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition relative group cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        <Upload className="w-10 h-10" />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {formData.images.length > 0 ? 'Upload More Images' : 'Click or drag images to upload'}
                                        </span>
                                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB each</p>
                                    </div>
                                </div>

                                {formData.imagePreviews.length > 0 && (
                                    <div className="mt-4 space-y-2 animate-in fade-in duration-300">
                                        <div className="relative rounded-xl overflow-hidden h-56 w-full border border-gray-200 dark:border-gray-700 shadow-sm group/preview">
                                            <img src={formData.imagePreviews[0]} alt="Hero Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/preview:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                                                <span className="text-xs font-bold uppercase tracking-widest border border-white text-white px-2 py-1 rounded">Main Display</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeImage(0)}
                                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition z-20 shadow-md"
                                                title="Remove Hero"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 text-white text-[10px] font-bold rounded backdrop-blur-sm pointer-events-none">
                                                HERO IMAGE
                                            </div>
                                        </div>

                                        {formData.imagePreviews.length > 1 && (
                                            <div className="grid grid-cols-4 gap-2">
                                                {formData.imagePreviews.slice(1).map((src, idx) => {
                                                    const realIndex = idx + 1;
                                                    return (
                                                        <div key={realIndex} className="relative h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group/thumb">
                                                            <img src={src} alt={`Gallery ${realIndex}`} className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setHeroImage(realIndex)}
                                                                    className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                                                    title="Make Hero"
                                                                >
                                                                    <ArrowUp className="w-3 h-3" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeImage(realIndex)}
                                                                    className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition"
                                                                    title="Remove"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>

                <div className="lg:col-span-5 space-y-8">
                    <section className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 sticky top-24">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                            <Eye className="w-4 h-4 mr-2" />
                            Live Ad Preview
                        </h3>

                        <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm transition-colors duration-300">

                            <div className="p-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-lg shadow-sm"
                                        style={{ backgroundColor: formData.color }}
                                    >
                                        {formData.brandName ? formData.brandName.charAt(0).toUpperCase() : 'B'}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
                                            {formData.brandName || 'Your Brand Name'}
                                        </span>
                                        <span className="text-[10px] text-gray-500 font-medium">Sponsored</span>
                                    </div>
                                </div>
                                <div
                                    className="w-2 h-2 rounded-full animate-pulse"
                                    style={{ backgroundColor: formData.color }}
                                />
                            </div>

                            {formData.imagePreviews.length > 0 ? (
                                <div className="relative">
                                    <img src={formData.imagePreviews[0]} alt="Ad poster" className="w-full h-auto max-h-64 object-cover border-b border-gray-100 dark:border-gray-800" />
                                    {formData.imagePreviews.length > 1 && (
                                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded">
                                            1 / {formData.imagePreviews.length}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center border-b border-gray-100 dark:border-gray-800 text-gray-400">
                                    <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                                    <span className="text-xs font-medium">Image Preview</span>
                                </div>
                            )}

                            <div className="p-4">
                                <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap mb-5 leading-relaxed">
                                    {formData.caption || 'Your catchy promotional caption will appear right here...'}
                                </p>

                                <div className="flex flex-col gap-2">
                                    <button
                                        disabled
                                        className="w-full py-2.5 text-white rounded-xl text-sm font-bold flex justify-center items-center opacity-90 transition-all hover:opacity-100"
                                        style={{ backgroundColor: formData.color }}
                                    >
                                        <LinkIcon className="w-4 h-4 mr-2" />
                                        {formData.link ? 'Visit Website' : 'Learn More'}
                                    </button>

                                    {formData.whatsapp && (
                                        <button
                                            disabled
                                            className="w-full py-2.5 bg-[#25D366] text-white rounded-xl text-sm font-bold flex justify-center items-center opacity-90"
                                        >
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Contact via WhatsApp
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                <span className="bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs mr-3">3</span>
                                Checkout
                            </h2>

                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 mb-6 flex justify-between items-center border border-blue-100 dark:border-blue-900/30">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Total Amount:</span>
                                <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">RM {selectedPackage.price}.00</span>
                            </div>

                            <div className="bg-white dark:bg-gray-700 p-4 rounded-2xl shadow-inner mb-6 text-center">
                                <img
                                    src="/tng-qr.jpg"
                                    alt="TNG DuitNow QR"
                                    className="w-48 h-48 mx-auto rounded-xl shadow-md border border-gray-200 dark:border-gray-600 mb-3 object-contain"
                                />
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex justify-center items-center">
                                    <CreditCard className="w-4 h-4 mr-1" /> Scan to pay via TNG eWallet / DuitNow
                                </p>
                            </div>

                            <label className="flex items-center space-x-3 mb-6 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={hasPaid}
                                    onChange={(e) => setHasPaid(e.target.checked)}
                                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-gray-700 dark:text-gray-300 font-medium">I have successfully transferred RM {selectedPackage.price}</span>
                            </label>

                            <AnimatePresence>
                                {errorMessage && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-4 flex items-start"
                                    >
                                        <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
                                        <span className="text-sm">{errorMessage}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                onClick={handleSubmit}
                                disabled={!hasPaid || status === 'processing'}
                                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all flex justify-center items-center shadow-lg ${hasPaid && status !== 'processing'
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-blue-500/30'
                                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                {status === 'processing' ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Compressing & Uploading...
                                    </span>
                                ) : (
                                    'Submit Campaign for Approval'
                                )}
                            </button>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}