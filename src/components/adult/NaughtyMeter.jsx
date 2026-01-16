import React, { useMemo } from 'react';
import { Thermometer, Skull, Heart, Zap } from 'lucide-react';

export default function NaughtyMeter({ text = "" }) {
    const { score, verdict, color, icon: Icon } = useMemo(() => {
        const lowerText = text.toLowerCase();

        const naughtyWords = ['kiss', 'touch', 'bed', 'night', 'wet', 'hard', 'body', 'skin', 'lip', 'lust', 'horny', 'sex', 'naked', 'wild'];
        const simpWords = ['love', 'miss', 'crush', 'wait', 'text', 'reply', 'forever', 'queen', 'king', 'please', 'sorry'];
        const toxicWords = ['ex', 'cheat', 'hate', 'block', 'fight', 'steal', 'lie', 'ignore', 'toxic', 'red flag'];

        let nCount = 0;
        let sCount = 0;
        let tCount = 0;

        naughtyWords.forEach(w => { if (lowerText.includes(w)) nCount++; });
        simpWords.forEach(w => { if (lowerText.includes(w)) sCount++; });
        toxicWords.forEach(w => { if (lowerText.includes(w)) tCount++; });

        let calculatedScore = 50 + (nCount * 15) + (tCount * 10) - (sCount * 5);
        calculatedScore = Math.min(Math.max(calculatedScore, 0), 100);

        let result = { score: calculatedScore };

        if (tCount > nCount && tCount > sCount) {
            result.verdict = "Walking Red Flag 🚩";
            result.color = "text-rose-500";
            result.barColor = "bg-rose-600";
            result.icon = Skull;
        } else if (sCount > nCount && sCount > 2) {
            result.verdict = "Down Bad (Simp) 🥺";
            result.color = "text-blue-400";
            result.barColor = "bg-blue-500";
            result.icon = Heart;
        } else if (calculatedScore > 80) {
            result.verdict = "Menace to Society 😈";
            result.color = "text-violet-500";
            result.barColor = "bg-violet-600";
            result.icon = Zap;
        } else if (calculatedScore > 50) {
            result.verdict = "Kinda Sus 🤨";
            result.color = "text-orange-400";
            result.barColor = "bg-orange-500";
            result.icon = Thermometer;
        } else {
            result.verdict = "Pure Soul (Boring) 😇";
            result.color = "text-emerald-400";
            result.barColor = "bg-emerald-500";
            result.icon = Thermometer;
        }

        return result;
    }, [text]);

    return (
        <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50 mt-4 mb-2">
            <div className="flex justify-between items-center mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${color}`}>
                    <Icon className="w-3 h-3" />
                    Vibe Check: {verdict}
                </span>
                <span className="text-[10px] font-mono text-slate-500">{score}% Intensity</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ${color.replace('text-', 'bg-')}`}
                    style={{ width: `${score}%` }}
                ></div>
            </div>
        </div>
    );
}