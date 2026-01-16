import React, { useMemo } from 'react';
import { Thermometer, Skull, Heart, Zap, AlertTriangle } from 'lucide-react';

export default function NaughtyMeter({ text = "" }) {
    const { score, verdict, color, bgGradient, borderColor, icon: Icon } = useMemo(() => {
        const lowerText = text.toLowerCase();

        const naughtyWords = ['kiss', 'touch', 'bed', 'night', 'wet', 'hard', 'body', 'skin', 'lip', 'lust', 'horny', 'sex', 'naked', 'wild', 'desire', 'pleasure'];
        const simpWords = ['love', 'miss', 'crush', 'wait', 'text', 'reply', 'forever', 'queen', 'king', 'please', 'sorry', 'worship', 'beautiful', 'angel'];
        const toxicWords = ['ex', 'cheat', 'hate', 'block', 'fight', 'steal', 'lie', 'ignore', 'toxic', 'red flag', 'manipulate', 'gaslight', 'kill', 'shut up'];

        let nCount = 0;
        let sCount = 0;
        let tCount = 0;

        naughtyWords.forEach(w => { if (lowerText.includes(w)) nCount++; });
        simpWords.forEach(w => { if (lowerText.includes(w)) sCount++; });
        toxicWords.forEach(w => { if (lowerText.includes(w)) tCount++; });

        let calculatedScore = 50 + (nCount * 15) + (tCount * 12) - (sCount * 5);
        calculatedScore = Math.min(Math.max(calculatedScore, 0), 100);

        let result = { score: calculatedScore };

        if (tCount > 0 && tCount >= nCount && tCount >= sCount) {
            result.verdict = "Walking Red Flag 🚩";
            result.color = "text-rose-500";
            result.bgGradient = "from-rose-500 to-rose-600";
            result.borderColor = "border-rose-500/30";
            result.icon = Skull;
        } else if (sCount > nCount && sCount > 2) {
            result.verdict = "Down Bad (Simp) 🥺";
            result.color = "text-sky-400";
            result.bgGradient = "from-sky-400 to-blue-500";
            result.borderColor = "border-sky-500/30";
            result.icon = Heart;
        } else if (calculatedScore >= 85) {
            result.verdict = "Menace to Society 😈";
            result.color = "text-violet-400";
            result.bgGradient = "from-violet-500 to-fuchsia-500";
            result.borderColor = "border-violet-500/30";
            result.icon = Zap;
        } else if (calculatedScore > 60) {
            result.verdict = "Kinda Sus 🤨";
            result.color = "text-orange-400";
            result.bgGradient = "from-orange-400 to-amber-500";
            result.borderColor = "border-orange-500/30";
            result.icon = AlertTriangle;
        } else {
            result.verdict = "Pure Soul (Boring) 😇";
            result.color = "text-emerald-400";
            result.bgGradient = "from-emerald-400 to-teal-500";
            result.borderColor = "border-emerald-500/30";
            result.icon = Thermometer;
        }

        return result;
    }, [text]);

    if (!text || text.length < 10) return null;

    return (
        <div className={`relative overflow-hidden rounded-lg bg-slate-950/50 border ${borderColor} p-2.5 transition-all duration-500`}>
            <div className={`absolute top-0 right-0 w-24 h-24 ${bgGradient} opacity-5 blur-2xl rounded-full -mr-10 -mt-10 pointer-events-none`}></div>

            <div className="relative z-10 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5 ${color}`} />
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${color}`}>
                            {verdict}
                        </span>
                    </div>
                    <span className="text-[10px] font-mono font-medium text-slate-500 tabular-nums">
                        {score}% TOXIC
                    </span>
                </div>

                <div className="h-1.5 w-full bg-slate-900/80 rounded-full overflow-hidden shadow-inner">
                    <div
                        className={`h-full bg-gradient-to-r ${bgGradient} shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-all duration-1000 ease-out`}
                        style={{ width: `${score}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
}