import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Coffee, X, Heart, CheckCircle2, Copy, Sparkles, CupSoda, Pizza, Rocket, Crown, Coins } from 'lucide-react';

const BuyMeCoffee = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState('select');
    const [selectedAmount, setSelectedAmount] = useState(5);
    const [customAmount, setCustomAmount] = useState('');
    const [copied, setCopied] = useState(false);

    const location = useLocation();

    const coffeeOptions = [
        { cups: 1, label: 'A Quick Sip', price: 1, icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-100' },
        { cups: 3, label: 'Latte Art', price: 3, icon: CupSoda, color: 'text-orange-500', bg: 'bg-orange-100' },
        { cups: 5, label: 'Boba Treat', price: 5, icon: Heart, color: 'text-rose-500', bg: 'bg-rose-100' },
        { cups: 10, label: 'Pizza Fund', price: 10, icon: Pizza, color: 'text-red-500', bg: 'bg-red-100' },
        { cups: 20, label: 'Server Booster', price: 20, icon: Rocket, color: 'text-purple-500', bg: 'bg-purple-100' },
        { cups: 50, label: 'Sugar Daddy', price: 50, icon: Crown, color: 'text-yellow-500', bg: 'bg-yellow-100' },
    ];

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setTimeout(() => {
                setStep('select');
                setCustomAmount('');
                setSelectedAmount(5);
            }, 300);
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    if (location.pathname === '/map') {
        return null;
    }

    const finalAmount = customAmount ? parseFloat(customAmount) : selectedAmount;

    const handleProceed = () => {
        if (isNaN(finalAmount) || finalAmount <= 0) {
            alert("Please enter a valid amount! 🥺");
            return;
        }
        setStep('pay');
    };

    const handleCopyTngLink = () => {
        navigator.clipboard.writeText("151728061724");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 left-6 z-40 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-3 rounded-full shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-1 transition-all duration-300 font-medium group"
            >
                <div className="bg-white/20 p-1 rounded-full group-hover:animate-bounce">
                    <Coffee size={18} />
                </div>
                <span className="hidden sm:inline font-bold tracking-wide">Buy me a coffee</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#fdfbfb] dark:bg-gray-800 rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden relative animate-in zoom-in-95 duration-400 flex flex-col max-h-[90vh] border-4 border-white dark:border-gray-700">

                        <div className="bg-gradient-to-r from-amber-200 via-orange-200 to-rose-200 pt-5 pb-6 px-5 text-center relative shrink-0">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 p-1.5 bg-white/40 hover:bg-white/80 dark:bg-black/20 dark:hover:bg-black/40 rounded-full transition-colors backdrop-blur-sm z-10"
                            >
                                <X size={18} className="text-gray-800 dark:text-white" />
                            </button>

                            <div className="mx-auto w-14 h-14 bg-white/60 dark:bg-white/10 rounded-2xl rotate-3 flex items-center justify-center mb-2 shadow-sm backdrop-blur-md border-2 border-white/50">
                                <div className="-rotate-3 flex relative">
                                    <Coffee size={28} className="text-orange-600 dark:text-orange-400" />
                                    <Sparkles size={16} className="absolute -top-2 -right-3 text-yellow-500 animate-bounce" />
                                </div>
                            </div>

                            <h2 className="text-xl font-extrabold text-gray-800 mb-0.5 drop-shadow-sm">Fuel the Developer!</h2>
                            <p className="text-orange-800/80 font-medium text-xs">Coding requires caffeine 💻☕</p>

                            <div className="absolute bottom-0 left-0 right-0 overflow-hidden line-height-0">
                                <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="block w-full h-[20px] text-[#fdfbfb] dark:text-gray-800 fill-current">
                                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118,130.85,130.6,201.33,115.2,243.68,105.8,284.4,85.5,321.39,56.44Z"></path>
                                </svg>
                            </div>
                        </div>

                        <div className="p-5 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

                            {step === 'select' && (
                                <div className="animate-in slide-in-from-right-8 duration-500">
                                    <div className="mb-4">
                                        <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                                            <Coins size={14} className="text-amber-500" /> Choose a treat
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {coffeeOptions.map((option) => {
                                                const Icon = option.icon;
                                                const isSelected = selectedAmount === option.price && !customAmount;
                                                return (
                                                    <button
                                                        key={option.cups}
                                                        onClick={() => {
                                                            setSelectedAmount(option.price);
                                                            setCustomAmount('');
                                                        }}
                                                        className={`relative py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all duration-200 border-2 ${isSelected
                                                            ? `border-orange-400 bg-orange-50 dark:bg-orange-900/20 shadow-sm scale-[1.02]`
                                                            : `border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 shadow-sm`
                                                            }`}
                                                    >
                                                        <div className={`p-1.5 rounded-full mb-1 ${isSelected ? option.bg : 'bg-gray-50 dark:bg-gray-700'}`}>
                                                            <Icon size={14} className={isSelected ? option.color : 'text-gray-400'} />
                                                        </div>
                                                        <span className={`text-sm font-black ${isSelected ? 'text-gray-900 dark:text-white' : ''}`}>RM {option.price}</span>
                                                        <span className="text-[9px] font-bold mt-0.5 opacity-70 uppercase tracking-wider text-center">{option.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="mb-5">
                                        <div className="relative flex items-center mb-2">
                                            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                                            <span className="flex-shrink-0 mx-3 text-gray-400 text-[10px] font-bold uppercase tracking-wider">Or be a custom angel</span>
                                            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                                        </div>

                                        <div className="relative group">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 font-black text-sm">RM</span>
                                            <input
                                                type="number"
                                                min="1"
                                                step="1"
                                                placeholder="Any amount..."
                                                value={customAmount}
                                                onChange={(e) => {
                                                    setCustomAmount(e.target.value);
                                                    setSelectedAmount(null);
                                                }}
                                                className="w-full pl-10 pr-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white font-black text-base focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleProceed}
                                        className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-base shadow-[0_4px_15px_rgb(249,115,22,0.3)] hover:shadow-[0_6px_20px_rgb(249,115,22,0.5)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Heart size={18} className="fill-white animate-pulse" />
                                        Support RM {(finalAmount || 0).toFixed(2)}
                                    </button>
                                </div>
                            )}

                            {step === 'pay' && (
                                <div className="animate-in slide-in-from-right-8 duration-500 flex flex-col items-center text-center">
                                    <div className="inline-flex items-center justify-center space-x-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full mb-3 font-bold text-xs">
                                        <Sparkles size={14} />
                                        <span>Scan to pay instantly</span>
                                    </div>

                                    <div className="bg-white p-3 rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.08)] border-4 border-gray-50 mb-6 relative w-full max-w-[180px] aspect-square flex items-center justify-center">

                                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-xl m-1.5"></div>
                                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-xl m-1.5"></div>
                                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-xl m-1.5"></div>
                                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-xl m-1.5"></div>

                                        <img
                                            src="/tng-qr.jpg"
                                            alt="TNG DuitNow QR"
                                            className="w-full h-full object-contain p-1.5"
                                            onError={(e) => {
                                                e.target.src = "https://via.placeholder.com/300?text=Place+tng-qr.jpg";
                                            }}
                                        />

                                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-1.5 rounded-full font-black text-xs shadow-xl whitespace-nowrap border-2 border-white flex items-center gap-1.5">
                                            <span>Total:</span> <span className="text-amber-400">RM {(finalAmount || 0).toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="w-full bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 mb-4 border border-gray-100 dark:border-gray-700">
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1.5 font-bold uppercase tracking-wider">Or transfer via DuitNow</p>
                                        <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg p-2 border border-gray-100 dark:border-gray-800 shadow-sm">
                                            <span className="font-mono font-black text-gray-800 dark:text-white tracking-widest text-sm ml-1">151728061724</span>
                                            <button
                                                onClick={handleCopyTngLink}
                                                className="flex items-center gap-1.5 font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/30 dark:hover:bg-orange-800/50 px-3 py-1.5 rounded-md transition-colors active:scale-95 text-xs"
                                            >
                                                {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                                {copied ? 'Copied!' : 'Copy'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 w-full">
                                        <button
                                            onClick={() => setStep('select')}
                                            className="py-3 px-3 rounded-xl font-bold text-gray-500 dark:text-gray-400 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors text-sm"
                                        >
                                            Go Back
                                        </button>
                                        <button
                                            onClick={() => setStep('thanks')}
                                            className="py-3 px-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black hover:scale-[1.02] transition-transform shadow-md text-sm"
                                        >
                                            I've Paid! 🎉
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 'thanks' && (
                                <div className="animate-in zoom-in-95 duration-500 flex flex-col items-center text-center py-4">

                                    <div className="relative mb-5">
                                        <div className="absolute inset-0 bg-yellow-300 blur-xl opacity-40 rounded-full animate-pulse"></div>
                                        <div className="w-20 h-20 bg-gradient-to-tr from-amber-300 to-orange-400 rounded-full flex items-center justify-center relative shadow-lg border-4 border-white">
                                            <Heart size={36} className="text-white fill-white animate-bounce" />
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-2">
                                        You're Amazing!
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 mb-6 px-2 text-sm font-medium">
                                        Thank you so much for your support. It genuinely helps keep the bugs away and the servers alive! 💛
                                    </p>

                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-full py-3 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-100 dark:to-white text-white dark:text-gray-900 font-black text-base hover:scale-[1.02] transition-all shadow-lg flex items-center justify-center gap-2"
                                    >
                                        Close Menu
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BuyMeCoffee;