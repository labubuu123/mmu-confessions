import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { User, Lock, LogIn, UserPlus, RefreshCw, AlertCircle, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';

const REQUIRED_SUFFIX = '@mmumatchmaker.com';

export default function MatchmakerAuth({ onAuthSuccess, onCancel }) {
    const [mode, setMode] = useState('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value.trim() });
        setError(null);
    };

    const processUsername = (inputName) => {
        const cleanName = inputName.trim().toLowerCase();

        if (!cleanName.endsWith(REQUIRED_SUFFIX)) {
            throw new Error(`Username must end with ${REQUIRED_SUFFIX}`);
        }

        const namePart = cleanName.replace(REQUIRED_SUFFIX, '').trim();

        const validNameRegex = /^[a-zA-Z0-9_.]+$/;
        if (!namePart || !validNameRegex.test(namePart)) {
            throw new Error("Invalid username format before the '@'. No spaces or special symbols allowed.");
        }

        if (namePart.length < 3) {
            throw new Error("Username part must be at least 3 characters long.");
        }

        // 4. Return Data
        return {
            dbUsername: cleanName,
            authEmail: `${namePart}@example.com`
        };
    };

    const handleAuthError = (err) => {
        if (err.message && err.message.includes("Password should be")) {
            setError("Password is too weak. It must be at least 6 characters long.");
        } else if (err.message === "User already registered") {
            setError("This username is already taken. Please try another.");
        } else if (err.message.includes("valid email")) {
            setError("System Error: Format rejected. Please try a simpler username.");
        } else {
            setError(err.message);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        try {
            const { dbUsername, authEmail } = processUsername(formData.username);

            const { data: existing } = await supabase
                .from('matchmaker_credentials')
                .select('username')
                .eq('username', dbUsername)
                .single();

            if (existing) throw new Error("Username already taken.");

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: authEmail,
                password: formData.password,
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Registration failed.");

            const { error: dbError } = await supabase
                .from('matchmaker_credentials')
                .insert({
                    username: dbUsername,
                    password: formData.password,
                    user_id: authData.user.id
                });

            if (dbError) throw dbError;

            setSuccessMsg("Registration successful! Logging you in...");
            setTimeout(() => onAuthSuccess(), 1500);

        } catch (err) {
            handleAuthError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { authEmail } = processUsername(formData.username);

            const { error } = await supabase.auth.signInWithPassword({
                email: authEmail,
                password: formData.password
            });

            if (error) throw new Error("Invalid username or password.");
            onAuthSuccess();

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        try {
            const { dbUsername, authEmail } = processUsername(formData.username);
            const { data: creds, error: fetchError } = await supabase
                .from('matchmaker_credentials')
                .select('*')
                .eq('username', dbUsername)
                .single();

            if (fetchError || !creds) throw new Error("Username not found.");

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: authEmail,
                password: creds.password
            });

            if (signInError) throw new Error("System error: Could not authorize account for reset.");

            const { error: updateError } = await supabase.auth.updateUser({
                password: formData.password
            });

            if (updateError) throw updateError;

            const { error: dbUpdateError } = await supabase
                .from('matchmaker_credentials')
                .update({ password: formData.password })
                .eq('username', dbUsername);

            if (dbUpdateError) throw dbUpdateError;

            setSuccessMsg("Password reset successful! Please log in.");
            setFormData({ ...formData, password: '', confirmPassword: '' });
            setTimeout(() => {
                setSuccessMsg(null);
                setMode('login');
            }, 2000);

        } catch (err) {
            handleAuthError(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-6">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-300">

                <div className="p-6 bg-indigo-600 text-white text-center relative">
                    <button onClick={onCancel} className="absolute left-4 top-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h2 className="text-2xl font-bold mb-1">
                        {mode === 'login' && 'Welcome Back'}
                        {mode === 'register' && 'Create Account'}
                        {mode === 'reset' && 'Reset Password'}
                    </h2>
                </div>

                <div className="px-6 pt-8 pb-8 sm:px-8">

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-300 text-sm font-bold shadow-sm animate-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span className="break-words leading-snug">{error}</span>
                        </div>
                    )}

                    {successMsg && (
                        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-start gap-3 text-green-600 dark:text-green-300 text-sm font-bold shadow-sm animate-in slide-in-from-top-2">
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span className="break-words leading-snug">{successMsg}</span>
                        </div>
                    )}

                    <form onSubmit={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleReset} className="space-y-5">

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Username</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    name="username"
                                    type="text"
                                    placeholder={`e.g. example${REQUIRED_SUFFIX}`}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition text-gray-900 dark:text-white placeholder-gray-400 text-sm"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">
                                {mode === 'reset' ? 'New Password' : 'Password'}
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition text-gray-900 dark:text-white placeholder-gray-400"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {(mode === 'register' || mode === 'reset') && (
                            <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Confirm Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        name="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition text-gray-900 dark:text-white placeholder-gray-400"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    {mode === 'login' && <LogIn className="w-5 h-5" />}
                                    {mode === 'register' && <UserPlus className="w-5 h-5" />}
                                    {mode === 'reset' && <RefreshCw className="w-5 h-5" />}
                                    {mode === 'login' ? 'Log In' : mode === 'register' ? 'Register Account' : 'Reset Password'}
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 flex flex-col gap-3 text-center">
                        {mode === 'login' && (
                            <>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    New here? <button onClick={() => { setError(null); setMode('register'); }} className="text-indigo-600 font-bold hover:underline transition-colors">Register</button>
                                </p>
                                <button onClick={() => { setError(null); setMode('reset'); }} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                    Forgot Password?
                                </button>
                            </>
                        )}
                        {(mode === 'register' || mode === 'reset') && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Already have an account? <button onClick={() => { setError(null); setMode('login'); }} className="text-indigo-600 font-bold hover:underline transition-colors">Log In</button>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}