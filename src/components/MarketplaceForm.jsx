import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Upload, X, Loader2, DollarSign, Tag, MessageCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import toast from 'react-hot-toast';

export default function MarketplaceForm({ onItemPosted }) {
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        price: '',
        category: 'Textbooks',
        condition: 'Good',
        description: '',
        contact: ''
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
        if (!formData.title || !formData.price || !formData.contact) {
            toast.error("Please fill in all required fields");
            return;
        }

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
                    contact_info: formData.contact,
                    seller_id: anonId,
                    images: imageUrls
                }])
                .select()
                .single();

            if (error) throw error;

            toast.success("Item listed successfully!");
            onItemPosted(data);

            setFormData({ title: '', price: '', category: 'Textbooks', condition: 'Good', description: '', contact: '' });
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-indigo-100 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">
                List an Item
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Item Name</label>
                        <input
                            type="text"
                            placeholder="e.g., Calculus Textbook"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price (RM)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="number"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                className="w-full pl-9 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                        <select
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
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
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                        >
                            {['New', 'Like New', 'Good', 'Fair', 'Poor'].map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                    <textarea
                        rows="3"
                        placeholder="Describe the condition, features, or reason for selling..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white resize-none"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Method</label>
                    <div className="relative">
                        <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="WhatsApp Link (wa.me/601...) or Username"
                            value={formData.contact}
                            onChange={e => setFormData({ ...formData, contact: e.target.value })}
                            className="w-full pl-9 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                        Tip: Use <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">wa.me/60123456789</code> for a direct WhatsApp link.
                    </p>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Photos (Max 3)</label>
                    <div className="flex flex-wrap gap-3">
                        {previews.map((src, idx) => (
                            <div key={idx} className="relative w-20 h-20 group">
                                <img src={src} alt="Preview" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                                <button type="button" onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        {images.length < 3 && (
                            <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors">
                                <Upload className="w-6 h-6 text-gray-400" />
                                <span className="text-[10px] text-gray-500 mt-1">Add Photo</span>
                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'List Item Now'}
                </button>
            </form>
        </div>
    );
}