import React from 'react';
import {
    MousePointer2, BookOpen, LayoutDashboard, Lock, FileText, Map, MapPin,
    Monitor, Phone, Siren, Users, Headphones, ExternalLink, Wrench, ArrowLeft,
    QrCode, Banknote
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

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
                    <div className="text-center mb-16 animate-fade-in-down">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg mb-6 transform hover:scale-105 transition-transform duration-300">
                            <Wrench className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                            MMU <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Toolkit</span>
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-medium">
                            Everything you need to survive and thrive at MMU. Quick links to portals, emergency contacts, and essential resources.
                        </p>
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