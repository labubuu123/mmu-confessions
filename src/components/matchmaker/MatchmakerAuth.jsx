import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Mail, Phone } from 'lucide-react';

export default function MatchmakerAuth({ onAuthSuccess }) {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [isSignUp, setIsSignUp] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            let authResponse;
            if (isSignUp) {
                authResponse = await supabase.auth.signUp({ email, password });
            } else {
                authResponse = await supabase.auth.signInWithPassword({ email, password });
            }

            const { error: authError } = authResponse;

            if (authError) throw authError;

            if (isSignUp) {
                setMessage('Registration successful! Please check your email to verify your account.');
            } else {
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700">
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
                Join the Matchmaker
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                Please {isSignUp ? 'sign up' : 'log in'} to continue. This feature uses a
                separate, anonymous login.
            </p>

            {message && <div className="mb-4 text-center text-green-600 dark:text-green-400">{message}</div>}
            {error && <div className="mb-4 text-center text-red-600 dark:text-red-400">{error}</div>}

            <form onSubmit={handleAuth}>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="email">
                        Email
                    </label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <Mail className="w-5 h-5 text-gray-400" />
                        </span>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="you@example.com"
                        />
                    </div>
                </div>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="password">
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="••••••••"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50"
                >
                    {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Log In')}
                </button>
            </form>

            <button
                onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                    setMessage(null);
                }}
                className="w-full mt-4 text-sm text-center text-indigo-600 dark:text-indigo-400 hover:underline"
            >
                {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
            </button>
        </div>
    );
}