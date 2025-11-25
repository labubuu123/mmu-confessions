import React from 'react';
import { Mail, Code, Heart, Shield } from 'lucide-react';

export default function AboutUs() {
    return (
        <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                
                {/* Header Section */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center">
                    <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
                        About Zyora Lab
                    </h1>
                    <p className="text-indigo-100 font-medium">
                        The story behind MMU Confessions
                    </p>
                </div>

                <div className="p-6 sm:p-10 space-y-8">
                    
                    {/* Purpose Section */}
                    <section className="flex gap-4">
                        <div className="flex-shrink-0">
                            <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-xl text-pink-600 dark:text-pink-400">
                                <Heart className="w-6 h-6" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Our Purpose
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-justify">
                                MMU Confessions was built to provide a safe, anonymous, and inclusive space for students 
                                to share their thoughts, experiences, and confessions. We believe in the power of community 
                                and the importance of having a voice without fear of judgment.
                            </p>
                        </div>
                    </section>

                    <hr className="border-gray-100 dark:border-gray-700" />

                    {/* Developer Section */}
                    <section className="flex gap-4">
                        <div className="flex-shrink-0">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                                <Code className="w-6 h-6" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                The Developer
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4 text-justify">
                                This platform is developed and maintained by a single passionate MMU student under the name <strong>Zyora Lab</strong>. 
                                It is a personal project dedicated to connecting the campus community through technology.
                            </p>
                            
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">Developer:</span>
                                        <span className="text-gray-600 dark:text-gray-400">[Your Name / Student ID]</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">Faculty:</span>
                                        <span className="text-gray-600 dark:text-gray-400">FCI / FOM / FOE</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <hr className="border-gray-100 dark:border-gray-700" />

                    {/* Contact Section */}
                    <section className="flex gap-4">
                        <div className="flex-shrink-0">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                                <Mail className="w-6 h-6" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Get in Touch
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-3 text-justify">
                                Found a bug? Have a feature request? Or just want to say hi?
                            </p>
                            <a 
                                href="mailto:support@mmuconfessions.fun" 
                                className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                            >
                                support@mmuconfessions.fun
                            </a>
                        </div>
                    </section>

                    {/* Disclaimer */}
                    <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-xl flex gap-3">
                        <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                        <p className="text-xs text-yellow-800 dark:text-yellow-200 text-justify">
                            <strong>Disclaimer:</strong> This website is a student-run initiative and is not officially affiliated 
                            with Multimedia University (MMU).
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}