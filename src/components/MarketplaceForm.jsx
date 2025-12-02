import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Upload, X, Loader2, DollarSign, MessageCircle, AlertCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import toast from 'react-hot-toast';

export default function MarketplaceForm({ onItemPosted, onCancel }) {
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        price: '',
        category: 'Textbooks',
        condition: 'Good',
        description: '',
        phoneNumber: ''
    });

    const getAnonId = () => {
        let anonId = localStorage.getItem('anonId');
        if (!anonId) {
            anonId = crypto.randomUUID();
            localStorage.setItem('anonId', anonId);
        }
        return anonId;
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length + images.length > 3) {
            toast.error("Maximum 3 images allowed");
            return;
        }

        const newImages = [...images, ...files];
        setImages(newImages);

        const newPreviews = [];
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.price || !formData.phoneNumber) {
            toast.error("Please fill in all required fields");
            return;
        }

        const phoneClean = formData.phoneNumber.replace(/\D/g, '');
        if (phoneClean.length < 9) {
            toast.error("Please enter a valid phone number");
            return;
        }

        const contactInfo = `wa.me/60${phoneClean}`;

        setLoading(true);
        const anonId = getAnonId();
        let imageUrls = [];

        try {
            for (let i = 0; i < images.length; i++) {
                const img = images[i];
                const compressed = await imageCompression(img, { maxSizeMB: 1, maxWidthOrHeight: 1600 });
                const ext = img.name.split('.').pop();
                const path = `public/marketplace-${Date.now()}-${anonId.substring(0, 8)}-${i}.${ext}`;

                const { error: uploadError } = await supabase.storage
                    .from('confessions')
                    .upload(path, compressed);

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('confessions')
                    .getPublicUrl(path);

                imageUrls.push(publicUrlData.publicUrl);
            }

            const { data, error } = await supabase
                .from('marketplace_items')
                .insert([{
                    title: formData.title,
                    price: parseFloat(formData.price),
                    category: formData.category,
                    condition: formData.condition,
                    description: formData.description,
                    contact_info: contactInfo,
                    seller_id: anonId,
                    images: imageUrls
                }])
                .select()
                .single();

            if (error) throw error;

            toast.success("Item listed successfully!");
            onItemPosted(data);

            setFormData({ title: '', price: '', category: 'Textbooks', condition: 'Good', description: '', phoneNumber: '' });
            setImages([]);
            setPreviews([]);

        } catch (error) {
            console.error(error);
            toast.error("Failed to list item: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-xl border border-indigo-50 dark:border-gray-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-1.5 rounded-lg">
                        <Upload className="w-4 h-4" />
                    </span>
                    List New Item
                </h2>
                <button onClick={onCancel} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Photos (Max 3)</label>
                    <div className="flex flex-wrap gap-3">
                        {previews.map((src, idx) => (
                            <div key={idx} className="relative w-20 h-20 group">
                                <img src={src} alt="Preview" className="w-full h-full object-cover rounded-xl border border-gray-200 dark:border-gray-600" />
                                <button type="button" onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        {images.length < 3 && (
                            <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all group">
                                <Upload className="w-6 h-6 text-gray-400 group-hover:text-indigo-500" />
                                <span className="text-[9px] text-gray-400 font-bold mt-1 uppercase">Add</span>
                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Item Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Scientific Calculator"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white text-base"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="number"
                                inputMode="decimal"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                className="w-full pl-9 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white text-base font-medium"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                        <select
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white text-sm"
                        >
                            {['Textbooks', 'Electronics', 'Furniture', 'Fashion', 'Room Rental', 'Others'].map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Condition</label>
                        <select
                            value={formData.condition}
                            onChange={e => setFormData({ ...formData, condition: e.target.value })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white text-sm"
                        >
                            {['New', 'Like New', 'Good', 'Fair', 'Poor'].map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">WhatsApp Number</label>
                    <div className="flex shadow-sm rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                        <div className="bg-gray-100 dark:bg-gray-800 px-4 flex items-center justify-center border-r border-gray-200 dark:border-gray-700">
                            <span className="text-gray-500 dark:text-gray-400 font-bold text-sm">+60</span>
                        </div>
                        <input
                            type="tel"
                            inputMode="numeric"
                            placeholder="12 345 6789"
                            value={formData.phoneNumber}
                            onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                            className="flex-1 p-3 bg-gray-50 dark:bg-gray-900 outline-none dark:text-white text-base font-medium"
                        />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Buyer will click to WhatsApp you directly.
                    </p>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                    <textarea
                        rows="3"
                        placeholder="Details about item condition, meetup location, etc."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white resize-none text-base"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-base"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publish Listing'}
                </button>
            </form>
        </div>
    );
}