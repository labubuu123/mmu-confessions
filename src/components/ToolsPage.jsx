import React, { useState, useEffect } from 'react';
import {
    MousePointer2, BookOpen, LayoutDashboard, Lock, FileText, Map, MapPin,
    Monitor, Phone, Siren, Users, Headphones, ExternalLink, Wrench, ArrowLeft,
    QrCode, Banknote, Calculator, Plus, Trash2, RotateCcw, Save, Shield, Eye, EyeOff, Copy, Check, RefreshCw, AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const GRADE_POINTS = {
    'A+': 4.00, 'A': 4.00, 'A-': 3.67,
    'B+': 3.33, 'B': 3.00, 'B-': 2.67,
    'C+': 2.33, 'C': 2.00, 'C-': 1.67,
    'D+': 1.33, 'D': 1.00, 'F': 0.00
};

const IdentityManager = () => {
    const [anonId, setAnonId] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const [copied, setCopied] = useState(false);
    const [restoreInput, setRestoreInput] = useState('');
    const [showRestore, setShowRestore] = useState(false);

    useEffect(() => {
        const id = localStorage.getItem('anonId');
        if (id) setAnonId(id);
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(anonId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRestore = () => {
        if (!restoreInput.trim()) return;

        if (window.confirm("WARNING: Restoring an ID will replace your current identity on this device. You will lose access to your current Matchmaker profile and Marketplace listings unless you have backed them up. Continue?")) {
            localStorage.setItem('anonId', restoreInput.trim());
            alert("Identity restored successfully. The page will now reload.");
            window.location.reload();
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-300 mb-10">
            <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Identity & Backup</h3>
                        <p className="text-emerald-100 text-sm opacity-90">Manage your anonymous ID for Matchmaker & Marketplace</p>
                    </div>
                </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                        <strong>Important:</strong> Your "Anonymous ID" is the only key to your Matchmaker profile and Marketplace listings.
                        If you clear your browser cache, you will lose access. <strong>Copy and save this ID somewhere safe!</strong>
                    </p>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Your Secret ID
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type={isVisible ? "text" : "password"}
                                value={anonId}
                                readOnly
                                className="w-full pl-4 pr-10 py-3 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-mono text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                            <button
                                onClick={() => setIsVisible(!isVisible)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <button
                            onClick={handleCopy}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={() => setShowRestore(!showRestore)}
                        className="text-sm text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        I want to restore an old identity
                    </button>

                    {showRestore && (
                        <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Paste Previous ID
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Paste your saved ID here..."
                                    value={restoreInput}
                                    onChange={(e) => setRestoreInput(e.target.value)}
                                    className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white text-sm"
                                />
                                <button
                                    onClick={handleRestore}
                                    className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                                >
                                    Restore
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const CGPACalculator = () => {
    const [subjects, setSubjects] = useState([
        { id: 1, name: '', credit: 3, grade: 'A' }
    ]);
    const [previousCGPA, setPreviousCGPA] = useState('');
    const [previousCredits, setPreviousCredits] = useState('');

    useEffect(() => {
        const savedData = localStorage.getItem('mmu_cgpa_data');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.subjects) setSubjects(parsed.subjects);
                if (parsed.previousCGPA) setPreviousCGPA(parsed.previousCGPA);
                if (parsed.previousCredits) setPreviousCredits(parsed.previousCredits);
            } catch (e) {
                console.error("Failed to load saved CGPA data");
            }
        }
    }, []);

    useEffect(() => {
        const dataToSave = { subjects, previousCGPA, previousCredits };
        localStorage.setItem('mmu_cgpa_data', JSON.stringify(dataToSave));
    }, [subjects, previousCGPA, previousCredits]);

    const addSubject = () => {
        setSubjects([...subjects, { id: Date.now(), name: '', credit: 3, grade: 'A' }]);
    };

    const removeSubject = (id) => {
        setSubjects(subjects.filter(sub => sub.id !== id));
    };

    const updateSubject = (id, field, value) => {
        setSubjects(subjects.map(sub =>
            sub.id === id ? { ...sub, [field]: value } : sub
        ));
    };

    const resetCalculator = () => {
        if (window.confirm('Clear all calculator data?')) {
            setSubjects([{ id: Date.now(), name: '', credit: 3, grade: 'A' }]);
            setPreviousCGPA('');
            setPreviousCredits('');
            localStorage.removeItem('mmu_cgpa_data');
        }
    };

    const calculateResults = () => {
        let currentPoints = 0;
        let currentCredits = 0;

        subjects.forEach(sub => {
            const credit = parseFloat(sub.credit) || 0;
            const point = GRADE_POINTS[sub.grade] || 0;
            currentPoints += point * credit;
            currentCredits += credit;
        });

        const gpa = currentCredits > 0 ? (currentPoints / currentCredits).toFixed(2) : "0.00";

        let totalPoints = currentPoints;
        let totalCredits = currentCredits;

        if (previousCGPA && previousCredits) {
            const prevPts = parseFloat(previousCGPA) * parseFloat(previousCredits);
            totalPoints += prevPts;
            totalCredits += parseFloat(previousCredits);
        }

        const cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";

        return { gpa, cgpa, currentCredits, totalCredits };
    };

    const results = calculateResults();

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-300">
            <div className="p-6 sm:p-8 bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Calculator className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">GPA & CGPA Calculator</h3>
                            <p className="text-indigo-100 text-sm opacity-90">Auto-saves to your device</p>
                        </div>
                    </div>
                    <button
                        onClick={resetCalculator}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        title="Reset Calculator"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Previous CGPA (Optional)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 3.50"
                            value={previousCGPA}
                            onChange={(e) => setPreviousCGPA(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 dark:text-white transition-all outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Previous Credits Earned
                        </label>
                        <input
                            type="number"
                            placeholder="e.g. 45"
                            value={previousCredits}
                            onChange={(e) => setPreviousCredits(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 dark:text-white transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="grid grid-cols-12 gap-2 px-2 mb-2">
                        <div className="col-span-6 sm:col-span-5 text-xs font-bold text-gray-400 uppercase">Subject (Optional)</div>
                        <div className="col-span-2 sm:col-span-3 text-xs font-bold text-gray-400 uppercase text-center">Grade</div>
                        <div className="col-span-2 sm:col-span-2 text-xs font-bold text-gray-400 uppercase text-center">Credit</div>
                        <div className="col-span-2 sm:col-span-2"></div>
                    </div>

                    {subjects.map((sub) => (
                        <div key={sub.id} className="grid grid-cols-12 gap-2 items-center animate-fade-in-up">
                            <div className="col-span-6 sm:col-span-5">
                                <input
                                    type="text"
                                    placeholder="Subject Name"
                                    value={sub.name}
                                    onChange={(e) => updateSubject(sub.id, 'name', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:text-white text-sm outline-none transition-colors"
                                />
                            </div>
                            <div className="col-span-2 sm:col-span-3">
                                <select
                                    value={sub.grade}
                                    onChange={(e) => updateSubject(sub.id, 'grade', e.target.value)}
                                    className="w-full px-1 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:text-white text-sm font-medium text-center outline-none cursor-pointer"
                                >
                                    {Object.keys(GRADE_POINTS).map(g => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2 sm:col-span-2">
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={sub.credit}
                                    onChange={(e) => updateSubject(sub.id, 'credit', e.target.value)}
                                    className="w-full px-1 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:text-white text-sm text-center outline-none"
                                />
                            </div>
                            <div className="col-span-2 sm:col-span-2 flex justify-center">
                                <button
                                    onClick={() => removeSubject(sub.id)}
                                    disabled={subjects.length === 1}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={addSubject}
                    className="flex items-center gap-2 text-sm font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 px-4 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors mb-8"
                >
                    <Plus className="w-4 h-4" />
                    Add Another Subject
                </button>

                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 text-center">
                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                            Current GPA
                        </div>
                        <div className="text-3xl sm:text-4xl font-black text-indigo-700 dark:text-indigo-300">
                            {results.gpa}
                        </div>
                        <div className="text-xs text-indigo-400 dark:text-indigo-500 mt-1 font-medium">
                            {results.currentCredits} credits
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 text-center">
                        <div className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">
                            Total CGPA
                        </div>
                        <div className="text-3xl sm:text-4xl font-black text-purple-700 dark:text-purple-300">
                            {results.cgpa}
                        </div>
                        <div className="text-xs text-purple-400 dark:text-purple-500 mt-1 font-medium">
                            {results.totalCredits} total credits
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function ToolsPage() {
    const universityTools = [
        {
            name: 'CLIC',
            icon: MousePointer2,
            url: 'https://clic.mmu.edu.my/psp/csprd/EMPLOYEE/SA/h/?tab=DEFAULT&cmd=login&errorCode=105&languageCd=ENG',
            color: 'text-blue-600',
            bg: 'bg-blue-100'
        },
        {
            name: 'eBwise',
            icon: BookOpen,
            url: 'https://ebwise.mmu.edu.my/my/courses.php',
            color: 'text-emerald-600',
            bg: 'bg-emerald-100'
        },
        {
            name: 'MMU Portal',
            icon: LayoutDashboard,
            url: 'https://online.mmu.edu.my/',
            color: 'text-indigo-600',
            bg: 'bg-indigo-100'
        },
        {
            name: 'Setup VPN',
            icon: Lock,
            url: 'https://nice.mmu.edu.my/2021/03/vpn',
            color: 'text-slate-600',
            bg: 'bg-slate-100'
        },
        {
            name: 'Exam Schedule',
            icon: FileText,
            url: 'https://online.mmu.edu.my/index.php?func=exam',
            color: 'text-red-600',
            bg: 'bg-red-100'
        },
        {
            name: 'Campus Map',
            icon: Map,
            url: 'https://www.mmu.edu.my/campus-map/',
            color: 'text-purple-600',
            bg: 'bg-purple-100'
        },
        {
            name: 'CaMSys',
            icon: Monitor,
            url: 'https://camsys.mmu.edu.my/',
            color: 'text-cyan-600',
            bg: 'bg-cyan-100'
        },
        {
            name: 'Finance/Fees',
            icon: Banknote,
            url: 'https://online.mmu.edu.my/index.php?func=finance',
            color: 'text-green-600',
            bg: 'bg-green-100'
        }
    ];

    const emergencyContacts = [
        {
            name: 'Security Hotline',
            icon: Siren,
            contact: '03-8312 5050',
            desc: '24/7 Emergency Response',
            bg: 'bg-red-50 dark:bg-red-900/20',
            border: 'border-red-200 dark:border-red-800'
        },
        {
            name: 'Counselling',
            icon: Headphones,
            contact: '03-8312 5555',
            desc: 'Mental Health Support',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-200 dark:border-blue-800'
        },
        {
            name: 'Student Affairs',
            icon: Users,
            contact: '03-8312 5000',
            desc: 'General Enquiries',
            bg: 'bg-orange-50 dark:bg-orange-900/20',
            border: 'border-orange-200 dark:border-orange-800'
        }
    ];

    return (
        <>
            <Helmet>
                <title>MMU Tools - Student Utilities & Resources</title>
                <meta name="description" content="Access useful tools for MMU students including GPA/CGPA calculators, timetable planners, campus portals, and emergency contacts." />
            </Helmet>

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-16 animate-fade-in-up">
                        <div className="flex items-center gap-3 mb-8 px-2">
                            <div className="h-8 w-1 bg-emerald-500 rounded-full"></div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Profile & Identity</h2>
                        </div>
                        <div className="max-w-3xl mx-auto">
                            <IdentityManager />
                        </div>
                    </div>

                    <div className="mb-16 animate-fade-in-up delay-75">
                        <div className="flex items-center gap-3 mb-8 px-2">
                            <div className="h-8 w-1 bg-purple-500 rounded-full"></div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Grade Calculator</h2>
                        </div>
                        <div className="max-w-3xl mx-auto">
                            <CGPACalculator />
                        </div>
                    </div>

                    <div className="mb-16 animate-fade-in-up delay-100">
                        <div className="flex items-center gap-3 mb-8 px-2">
                            <div className="h-8 w-1 bg-red-500 rounded-full"></div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Emergency Contacts</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {emergencyContacts.map((contact) => (
                                <a
                                    key={contact.name}
                                    href={`tel:${contact.contact.replace(/\s/g, '')}`}
                                    className={`group relative p-6 rounded-2xl border ${contact.border} ${contact.bg} hover:shadow-lg transition-all duration-300 overflow-hidden`}
                                >
                                    <div className="flex items-start justify-between relative z-10">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                                                {contact.name}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                                {contact.desc}
                                            </p>
                                            <div className="inline-flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform origin-left">
                                                <Phone className="w-5 h-5" />
                                                {contact.contact}
                                            </div>
                                        </div>
                                        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                            <contact.icon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mb-8 px-2 animate-fade-in-up delay-200">
                        <div className="h-8 w-1 bg-indigo-500 rounded-full"></div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Quick Access</h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 animate-fade-in-up delay-300">
                        {universityTools.map((tool) => {
                            return (
                                <a
                                    key={tool.name}
                                    href={tool.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex flex-col items-center sm:items-start p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700 relative overflow-hidden"
                                >
                                    <div className={`absolute top-0 right-0 w-24 h-24 ${tool.bg} rounded-bl-full opacity-10 group-hover:scale-110 transition-transform duration-500`} />

                                    <div className={`p-3.5 rounded-xl ${tool.bg} ${tool.color} mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm relative z-10`}>
                                        <tool.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                                    </div>

                                    <div className="flex items-center gap-2 mb-1 w-full relative z-10">
                                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg sm:text-base text-center sm:text-left flex items-center justify-center sm:justify-start w-full sm:w-auto">
                                            {tool.name}
                                        </h3>
                                        <ExternalLink className="hidden sm:block w-3.5 h-3.5 text-gray-300 group-hover:text-cyan-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0" />
                                    </div>

                                    <p className="text-xs text-gray-400 dark:text-gray-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors font-medium">
                                        Open Tool
                                    </p>
                                </a>
                            );
                        })}
                    </div>

                    <div className="mt-10 sm:mt-16 text-center">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 font-medium text-sm group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Feed
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}