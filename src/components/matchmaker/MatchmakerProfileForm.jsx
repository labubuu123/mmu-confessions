import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Check, Loader2, User, Shield, Heart, MapPin, AtSign, X, Camera } from 'lucide-react';

const INTEREST_OPTIONS = [
    'Movies', 'Music', 'Reading', 'Gaming', 'Traveling', 'Cooking',
    'Sports', 'Hiking', 'Art', 'Photography', 'Coding', 'Fitness',
    'Anime', 'Volunteering', 'Yoga', 'Writing',
];

export default function MatchmakerProfileForm({ profile, user, onSave }) {
    const [formData, setFormData] = useState({
        nickname: '',
        gender: 'undisclosed',
        age: '',
        city: '',
        interests: [],
        self_intro: '',
        looking_for: '',
        contact_info: '',
    });
    
    // File states
    const [studentIdFile, setStudentIdFile] = useState(null);
    const [selfieFile, setSelfieFile] = useState(null);
    
    // Preview URLs
    const [previews, setPreviews] = useState({ selfie: null, id: null });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (profile) {
            setFormData({
                nickname: profile.nickname || '',
                gender: profile.gender || 'undisclosed',
                age: profile.age || '',
                city: profile.city || '',
                interests: profile.interests || [],
                self_intro: profile.self_intro || '',
                looking_for: profile.looking_for || '',
                contact_info: profile.contact_info || '',
            });

            // Load existing images into previews
            const loadImages = async () => {
                // Load Selfie (Public Bucket)
                if (profile.selfie_url) {
                    const { data } = supabase.storage
                        .from('matchmaker_selfies')
                        .getPublicUrl(profile.selfie_url);
                    setPreviews(prev => ({ ...prev, selfie: data.publicUrl }));
                }

                // Load Student ID (Private Bucket - Requires Signed URL)
                if (profile.student_id_url) {
                    const { data, error } = await supabase.storage
                        .from('matchmaker_verification')
                        .createSignedUrl(profile.student_id_url, 60 * 60); // Valid for 1 hour
                    
                    if (data?.signedUrl) {
                        setPreviews(prev => ({ ...prev, id: data.signedUrl }));
                    }
                }
            };
            loadImages();
        }
        
        // Cleanup previews on unmount
        return () => {
            if (previews.selfie) URL.revokeObjectURL(previews.selfie);
            if (previews.id) URL.revokeObjectURL(previews.id);
        };
    }, [profile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            if (type === 'selfie') {
                setSelfieFile(file);
                setPreviews(prev => ({ ...prev, selfie: url }));
            } else {
                setStudentIdFile(file);
                setPreviews(prev => ({ ...prev, id: url }));
            }
        }
    };

    const handleInterestToggle = (interest) => {
        setFormData((prev) => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter((i) => i !== interest)
                : [...prev.interests, interest],
        }));
    };

    const uploadFile = async (file, bucket, path) => {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, { cacheControl: '3600', upsert: true });
        if (error) throw error;
        return data.path;
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission
        setLoading(true);
        setError(null);
        setSuccess(false);

        // Manual Validation for Files
        // Only require files if it's a NEW profile (no existing profile data)
        if (!profile && (!studentIdFile || !selfieFile)) {
            setError('Please upload both your Student ID and a Selfie to continue.');
            setLoading(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        try {
            let studentIdPath = profile?.student_id_url || null;
            let selfiePath = profile?.selfie_url || null;
            const filesToDelete = []; // Track old files to delete after successful update

            // Upload new Student ID if selected
            if (studentIdFile) {
                // If there was an old file, mark it for deletion
                if (profile?.student_id_url) {
                    filesToDelete.push({ bucket: 'matchmaker_verification', path: profile.student_id_url });
                }

                const fileName = `student_id_${Date.now()}.${studentIdFile.name.split('.').pop()}`;
                studentIdPath = await uploadFile(studentIdFile, 'matchmaker_verification', `${user.id}/${fileName}`);
            }

            // Upload new Selfie if selected
            if (selfieFile) {
                // If there was an old file, mark it for deletion
                if (profile?.selfie_url) {
                    filesToDelete.push({ bucket: 'matchmaker_selfies', path: profile.selfie_url });
                }

                const fileName = `selfie_${Date.now()}.${selfieFile.name.split('.').pop()}`;
                selfiePath = await uploadFile(selfieFile, 'matchmaker_selfies', `${user.id}/${fileName}`);
            }

            const profileData = {
                ...formData,
                author_id: user.id,
                age: formData.age ? parseInt(formData.age, 10) : null,
                status: 'pending',
                updated_at: new Date().toISOString(),
                student_id_url: studentIdPath,
                selfie_url: selfiePath,
            };

            // Check for sensitive words
            const sensitiveCheck = await supabase.rpc('check_sensitive_words', {
                text_in: `${profileData.self_intro} ${profileData.looking_for} ${profileData.nickname}`
            });

            if (sensitiveCheck.data) {
                throw new Error("Please remove contact info (phone, handles) from your Bio, Nickname, or Looking For sections. Use the designated 'Secret Contact' field.");
            }

            const query = profile
                ? supabase.from('matchmaker_profiles').update(profileData).eq('author_id', user.id)
                : supabase.from('matchmaker_profiles').insert(profileData);

            const { error: dbError } = await query;
            if (dbError) throw dbError;

            // Clean up old files ONLY after successful DB update
            if (filesToDelete.length > 0) {
                for (const file of filesToDelete) {
                    const { error: delError } = await supabase.storage
                        .from(file.bucket)
                        .remove([file.path]);
                    if (delError) console.error('Error deleting old file:', delError);
                }
            }

            setSuccess(true);
            if (onSave) onSave();

        } catch (err) {
            console.error('Submission error:', err);
            setError(err.message || "An unexpected error occurred.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setLoading(false);
        }
    };

    const ImageUploadBox = ({ label, onChange, preview, icon: Icon, isPrivate }) => (
        <div className={`relative group w-full aspect-[4/3] rounded-xl border-2 border-dashed transition-all overflow-hidden
            ${preview 
                ? 'border-indigo-500 dark:border-indigo-400 bg-gray-900' 
                : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
        >
            <input 
                type="file" 
                accept="image/*" 
                onChange={onChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
            />
            
            {preview ? (
                <>
                    <img src={preview} alt="Preview" className="w-full h-full object-cover opacity-90" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                        <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium">
                            Change Image
                        </span>
                    </div>
                    {isPrivate && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow z-10 pointer-events-none">
                            PRIVATE
                        </div>
                    )}
                </>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center pointer-events-none">
                    <div className={`p-3 rounded-full mb-3 ${isPrivate ? 'bg-red-100 text-red-500' : 'bg-indigo-100 text-indigo-500'}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
                    <span className="text-xs text-gray-400 mt-1">Tap to upload</span>
                </div>
            )}
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto pb-12">
            
            {/* Title Section */}
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {profile ? 'Edit Profile' : 'Create Your Profile'}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-sm">
                    Complete your profile to join the matchmaker. 
                    <br/>
                    <span className="text-indigo-500 font-medium">Verification images are kept secure.</span>
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 text-red-700 dark:text-red-300">
                    <X className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {success && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3 text-green-700 dark:text-green-300">
                    <Check className="w-5 h-5" />
                    <span className="text-sm font-medium">Profile submitted successfully!</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* --- LEFT COLUMN: IDENTITY & VERIFICATION --- */}
                <div className="lg:col-span-5 space-y-6">
                    
                    {/* VERIFICATION CARD */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="bg-indigo-50/50 dark:bg-gray-700/30 px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-indigo-500" />
                            <h3 className="font-bold text-gray-800 dark:text-white text-sm uppercase tracking-wide">Verification</h3>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">1. Student ID</label>
                                    <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded">HIDDEN</span>
                                </div>
                                <ImageUploadBox 
                                    label="Upload Student ID" 
                                    onChange={(e) => handleFileChange(e, 'id')} 
                                    preview={previews.id} 
                                    icon={Shield}
                                    isPrivate={true}
                                />
                                <p className="text-[10px] text-gray-400 mt-1.5 text-center">Only admins can see this.</p>
                            </div>
                            <div className="border-t border-gray-100 dark:border-gray-700 pt-5">
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">2. Your Selfie</label>
                                    <span className="text-[10px] font-bold bg-green-100 text-green-600 px-2 py-0.5 rounded">PUBLIC</span>
                                </div>
                                <ImageUploadBox 
                                    label="Upload Selfie" 
                                    onChange={(e) => handleFileChange(e, 'selfie')} 
                                    preview={previews.selfie} 
                                    icon={Camera}
                                    isPrivate={false}
                                />
                                <p className="text-[10px] text-gray-400 mt-1.5 text-center">This will be your profile picture.</p>
                            </div>
                        </div>
                    </div>

                    {/* BASIC INFO CARD */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="bg-indigo-50/50 dark:bg-gray-700/30 px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                            <User className="w-4 h-4 text-indigo-500" />
                            <h3 className="font-bold text-gray-800 dark:text-white text-sm uppercase tracking-wide">Basic Info</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Nickname</label>
                                <input
                                    type="text" name="nickname" 
                                    value={formData.nickname} onChange={handleChange} required maxLength={25}
                                    placeholder="e.g. Alex"
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Gender</label>
                                    <div className="relative">
                                        <select
                                            name="gender" value={formData.gender} onChange={handleChange} required
                                            className="w-full appearance-none px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all font-medium"
                                        >
                                            <option value="undisclosed">Hidden</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Age</label>
                                    <input
                                        type="number" name="age" min="18" max="99" 
                                        value={formData.age} onChange={handleChange}
                                        placeholder="18+"
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">City / Campus</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text" name="city" 
                                        value={formData.city} onChange={handleChange}
                                        placeholder="e.g. Cyberjaya"
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: PROFILE DETAILS --- */}
                <div className="lg:col-span-7 space-y-6">
                    
                    {/* ABOUT CARD */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="bg-indigo-50/50 dark:bg-gray-700/30 px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                            <Heart className="w-4 h-4 text-pink-500" />
                            <h3 className="font-bold text-gray-800 dark:text-white text-sm uppercase tracking-wide">About You</h3>
                        </div>
                        <div className="p-6 space-y-5">
                            
                            <div>
                                <div className="flex justify-between mb-1.5">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Self Introduction</label>
                                    <span className="text-[10px] text-gray-400">{formData.self_intro.length}/500</span>
                                </div>
                                <textarea
                                    name="self_intro" rows={4} 
                                    value={formData.self_intro} onChange={handleChange} required maxLength={500}
                                    placeholder="Tell us about your vibe, hobbies, and personality..."
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all resize-none text-sm leading-relaxed"
                                ></textarea>
                            </div>

                            <div>
                                <div className="flex justify-between mb-1.5">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Looking For</label>
                                    <span className="text-[10px] text-gray-400">{formData.looking_for.length}/300</span>
                                </div>
                                <textarea
                                    name="looking_for" rows={3} 
                                    value={formData.looking_for} onChange={handleChange} required maxLength={300}
                                    placeholder="What kind of person or relationship are you hoping to find?"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all resize-none text-sm leading-relaxed"
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2.5">Interests</label>
                                <div className="flex flex-wrap gap-2">
                                    {INTEREST_OPTIONS.map((interest) => {
                                        const isSelected = formData.interests.includes(interest);
                                        return (
                                            <button
                                                type="button" key={interest} onClick={() => handleInterestToggle(interest)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all transform active:scale-95 border
                                                    ${isSelected 
                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                                                    }`}
                                            >
                                                {interest}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECRET CONTACT CARD */}
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/10 p-1 rounded-2xl border border-indigo-100 dark:border-indigo-500/30">
                        <div className="bg-white/50 dark:bg-gray-800/50 p-5 rounded-xl backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400">
                                <AtSign className="w-5 h-5" />
                                <h3 className="font-bold text-sm uppercase tracking-wide">Secret Contact</h3>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                                This is <strong className="text-indigo-600 dark:text-indigo-400">never shown publicly</strong>. 
                                It is only revealed to a match after you <strong>both</strong> agree to exchange details.
                            </p>
                            <input
                                type="text" name="contact_info" 
                                value={formData.contact_info} onChange={handleChange} required maxLength={100}
                                placeholder="e.g. IG: @username or Telegram: @handle"
                                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-indigo-100 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all font-medium shadow-sm"
                            />
                        </div>
                    </div>

                </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="mt-8 flex justify-end border-t border-gray-200 dark:border-gray-800 pt-6">
                <button
                    type="submit" disabled={loading}
                    className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <Check className="w-5 h-5" />
                            <span>{profile ? 'Update Profile' : 'Submit for Review'}</span>
                        </>
                    )}
                </button>
            </div>

        </form>
    );
}