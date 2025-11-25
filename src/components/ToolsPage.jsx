import React from 'react';
import {
    MousePointer2, BookOpen, LayoutDashboard, Lock, FileText, Map, MapPin,
    Monitor, Phone, Siren, Users, Headphones, ExternalLink, Wrench, ArrowLeft,
    QrCode
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
            name: 'Past Year Paper (Need VPN)',
            icon: FileText,
            url: 'https://erep.mmu.edu.my/',
            color: 'text-amber-600',
            bg: 'bg-amber-100'
        },
        {
            name: 'Attendance Pro Max',
            icon: QrCode,
            url: 'https://play.google.com/store/apps/details?id=com.exam.autoqrcode',
            color: 'text-orange-600',
            bg: 'bg-orange-100'
        },
        {
            name: 'MMU Melaka Map',
            icon: Map,
            url: 'https://winprogramme.mmu.edu.my/wp-content/uploads/2020/11/melaka.pdf',
            color: 'text-red-600',
            bg: 'bg-red-100'
        },
        {
            name: 'MMU Cyberjaya Map',
            icon: MapPin,
            url: 'https://winprogramme.mmu.edu.my/wp-content/uploads/2020/11/cyberjaya.pdf',
            color: 'text-cyan-600',
            bg: 'bg-cyan-100'
        },
        {
            name: 'MMU Melaka VR',
            icon: Monitor,
            url: 'https://360vr.my/mmumelaka/',
            color: 'text-purple-600',
            bg: 'bg-purple-100'
        },
        {
            name: 'MMU Cyberjaya VR',
            icon: Monitor,
            url: 'https://360vr.my/mmucyberjaya/',
            color: 'text-fuchsia-600',
            bg: 'bg-fuchsia-100'
        },
        {
            name: 'MMU Contact Info',
            icon: Phone,
            url: 'https://www.mmu.edu.my/contact-info/',
            color: 'text-green-600',
            bg: 'bg-green-100'
        },
        {
            name: 'MMU Security Hotline',
            icon: Siren,
            url: null,
            specialData: [
                { label: 'Melaka Campus', text: '06-2523667 or 06-2523226' },
                { label: 'Cyberjaya Campus', text: '03-83125939 or 03-83125484' }
            ],
            color: 'text-rose-600',
            bg: 'bg-rose-100'
        },
        {
            name: 'MMU Expertise Directory',
            icon: Users,
            url: 'https://mmuexpert.mmu.edu.my/',
            color: 'text-teal-600',
            bg: 'bg-teal-100'
        },
        {
            name: 'Student Service Centre (SSC)',
            icon: Headphones,
            url: 'https://ssc.mmu.edu.my/login',
            color: 'text-sky-600',
            bg: 'bg-sky-100'
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
            <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
                <div className="flex flex-col items-center justify-center mb-8 sm:mb-10 text-center space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="p-4 bg-cyan-100 dark:bg-cyan-900/30 rounded-full mb-1 ring-4 ring-cyan-50 dark:ring-cyan-900/10">
                        <Wrench className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        MMU Tools
                    </h1>
                    <p className="text-sm sm:text-lg text-gray-500 dark:text-gray-400 max-w-lg px-2 leading-relaxed">
                        Quick access to student portals, maps, and emergency contacts.
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                    {universityTools.map((tool, index) => {
                        const isHotline = tool.name === 'MMU Security Hotline';
                        const cardClasses = `
                            relative overflow-hidden group
                            flex flex-col sm:flex-row items-center sm:items-start
                            p-4 sm:p-5 gap-3 sm:gap-4
                            bg-white dark:bg-gray-800
                            border border-gray-200 dark:border-gray-700
                            rounded-2xl sm:rounded-xl
                            shadow-sm hover:shadow-lg dark:shadow-none dark:hover:shadow-lg dark:hover:shadow-cyan-900/10
                            transition-all duration-200 active:scale-95 sm:active:scale-100
                        `;

                        const iconClasses = `
                            p-3 sm:p-3.5 rounded-2xl sm:rounded-xl
                            ${tool.bg} ${tool.color}
                            shrink-0
                            group-hover:scale-110 group-hover:rotate-3
                            transition-transform duration-300
                        `;

                        const iconSvgSize = "w-8 h-8 sm:w-6 sm:h-6";

                        if (isHotline) {
                            return (
                                <div key={index} className={`${cardClasses} col-span-2 sm:col-span-2 lg:col-span-2 bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30 cursor-default active:scale-100`}>
                                    <div className={iconClasses}>
                                        <tool.icon className={iconSvgSize} />
                                    </div>
                                    <div className="flex-1 w-full text-center sm:text-left">
                                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base sm:text-lg mb-3">
                                            {tool.name}
                                        </h3>
                                        <div className="grid gap-2 text-left bg-white/60 dark:bg-black/20 p-3 rounded-lg border border-rose-100 dark:border-rose-900/30">
                                            {tool.specialData.map((data, idx) => (
                                                <div key={idx} className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2">
                                                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider shrink-0 w-24 sm:w-32">
                                                        {data.label}
                                                    </span>
                                                    <span className="text-sm font-mono font-medium text-gray-800 dark:text-gray-200 select-all">
                                                        {data.text}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <a
                                key={index}
                                href={tool.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cardClasses}
                            >
                                <div className={iconClasses}>
                                    <tool.icon className={iconSvgSize} />
                                </div>

                                <div className="flex-1 min-w-0 text-center sm:text-left w-full">
                                    <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-1 mb-1">
                                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base leading-tight px-1 h-10 flex items-center justify-center sm:justify-start w-full sm:w-auto">
                                            {tool.name}
                                        </h3>
                                        <ExternalLink className="hidden sm:block w-3.5 h-3.5 text-gray-300 group-hover:text-cyan-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0" />
                                    </div>

                                    <p className="text-xs text-gray-400 dark:text-gray-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors font-medium">
                                        Open Tool
                                    </p>
                                </div>
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
    );
}