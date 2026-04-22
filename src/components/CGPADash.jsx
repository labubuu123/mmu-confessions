import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Trophy, Play, RotateCcw, Home, Smartphone, Keyboard, Pointer, Coffee, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GAMEOVER_TITLES = [
    "SEM WASTED",
    "ACADEMIC PROBATION",
    "PARENTS DISAPPOINTED",
    "MCDONALD'S IS HIRING",
    "GG NO RE",
    "CAUGHT BY TURNITIN",
    "SLEPT THROUGH FINALS"
];

const OBSTACLE_TYPES = [
    { name: "8AM Class", emoji: "😴", color: '#3b82f6', h: 40, w: 30 },
    { name: "Finals", emoji: "📚", color: '#ef4444', h: 70, w: 35 },
    { name: "ebwise Down", emoji: "🚨", color: '#f59e0b', h: 35, w: 40 },
    { name: "Ghosting Groupmate", emoji: "👻", color: '#a855f7', h: 50, w: 30 }
];

export default function CGPADash() {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [gameState, setGameState] = useState('START');
    const [finalScore, setFinalScore] = useState(0);
    const [gameOverTitle, setGameOverTitle] = useState('');
    const [leaderboard, setLeaderboard] = useState([]);
    const [playerName, setPlayerName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const reqRef = useRef(null);
    const frameRef = useRef(0);
    const scoreRef = useRef(0);
    const bgOffsetRef = useRef(0);
    const shakeRef = useRef(0);

    const playerRef = useRef({
        x: 80, y: 200, width: 36, height: 36,
        dy: 0, jumpForce: -12.5, trail: [],
        canDoubleJump: false, isGrounded: false,
        invincibleTimer: 0
    });

    const entitiesRef = useRef({ obstacles: [], powerups: [], popups: [], particles: [] });

    const GRAVITY = 0.6;
    let GAME_SPEED = 6.0;

    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 400;

    useEffect(() => {
        fetchLeaderboard();
        return () => { if (reqRef.current) cancelAnimationFrame(reqRef.current); };
    }, []);

    useEffect(() => {
        const preventScroll = (e) => { if (gameState === 'PLAYING') e.preventDefault(); };
        const container = containerRef.current;
        if (container) container.addEventListener('touchmove', preventScroll, { passive: false });
        return () => { if (container) container.removeEventListener('touchmove', preventScroll); };
    }, [gameState]);

    const fetchLeaderboard = async () => {
        const { data } = await supabase.from('minigame_scores').select('username, score').order('score', { ascending: false }).limit(8);
        if (data) setLeaderboard(data);
    };

    const submitScore = async (e) => {
        e.preventDefault();
        if (!playerName.trim() || finalScore === 0) return;
        setIsSubmitting(true);
        await supabase.from('minigame_scores').insert([{ username: playerName.trim(), score: finalScore }]);
        await fetchLeaderboard();
        setIsSubmitting(false);
        setGameState('START');
    };

    const spawnPopup = (x, y, text, color = '#22c55e') => {
        entitiesRef.current.popups.push({ x, y, text, color, life: 1, dy: -2 });
    };

    const createParticles = (x, y, color, count, speed = 1, emoji = null) => {
        const isMobile = window.innerWidth < 768;
        const finalCount = isMobile ? Math.floor(count * 0.5) : count;
        for (let i = 0; i < finalCount; i++) {
            entitiesRef.current.particles.push({
                x, y, vx: (Math.random() - 0.5) * 10 * speed, vy: (Math.random() - 0.5) * 10 * speed,
                life: 1, color, size: Math.random() * 5 + 2, emoji
            });
        }
    };

    const jump = () => {
        if (gameState !== 'PLAYING') return;
        const p = playerRef.current;

        if (p.isGrounded) {
            p.dy = p.jumpForce;
            p.isGrounded = false;
            p.canDoubleJump = true;
            createParticles(p.x + p.width / 2, p.y + p.height, '#cbd5e1', 10, 0.5);
        } else if (p.canDoubleJump) {
            p.dy = p.jumpForce * 0.85;
            p.canDoubleJump = false;
            createParticles(p.x + p.width / 2, p.y + p.height, '#c084fc', 15, 0.8);
            spawnPopup(p.x, p.y - 20, "CRAM!", "#c084fc");
        }
    };

    const startGame = () => {
        playerRef.current = { x: 80, y: 200, width: 36, height: 36, dy: 0, jumpForce: -13, trail: [], canDoubleJump: false, isGrounded: false, invincibleTimer: 0 };
        entitiesRef.current = { obstacles: [], powerups: [], popups: [], particles: [] };
        scoreRef.current = 0;
        frameRef.current = 0;
        bgOffsetRef.current = 0;
        shakeRef.current = 0;
        setGameState('PLAYING');
        if (reqRef.current) cancelAnimationFrame(reqRef.current);
        gameLoop();
    };

    const triggerGameOver = () => {
        shakeRef.current = 15;
        setGameState('GAMEOVER');
        setFinalScore(Math.floor(scoreRef.current));
        setGameOverTitle(GAMEOVER_TITLES[Math.floor(Math.random() * GAMEOVER_TITLES.length)]);

        const p = playerRef.current;
        createParticles(p.x + p.width / 2, p.y + p.height / 2, '#f43f5e', 40, 1.5, "💀");

        requestAnimationFrame(() => {
            const canvas = canvasRef.current;
            if (canvas) { const ctx = canvas.getContext('2d'); drawParticles(ctx); }
        });
        cancelAnimationFrame(reqRef.current);
    };

    const drawParticles = (ctx) => {
        const { particles, popups } = entitiesRef.current;

        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.x += p.vx; p.y += p.vy; p.life -= 0.03;
            if (p.life <= 0) { particles.splice(i, 1); continue; }

            ctx.globalAlpha = p.life;
            if (p.emoji) {
                ctx.font = `${p.size * 4}px Arial`;
                ctx.fillText(p.emoji, p.x, p.y);
            } else {
                ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1.0;
        }

        for (let i = popups.length - 1; i >= 0; i--) {
            let p = popups[i];
            p.y += p.dy; p.life -= 0.02;
            if (p.life <= 0) { popups.splice(i, 1); continue; }

            ctx.globalAlpha = p.life;
            ctx.font = 'bold 20px "Inter", sans-serif';
            ctx.fillStyle = p.color;
            ctx.textAlign = 'center';
            ctx.fillText(p.text, p.x, p.y);
            ctx.globalAlpha = 1.0;
        }
    };

    const gameLoop = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = CANVAS_WIDTH;
        const height = CANVAS_HEIGHT;
        const groundY = height - 40;

        const currentSpeed = GAME_SPEED + (scoreRef.current * 0.003);
        const p = playerRef.current;

        ctx.save();
        if (shakeRef.current > 0) {
            const dx = (Math.random() - 0.5) * shakeRef.current;
            const dy = (Math.random() - 0.5) * shakeRef.current;
            ctx.translate(dx, dy);
            shakeRef.current *= 0.9;
            if (shakeRef.current < 0.5) shakeRef.current = 0;
        }

        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = p.invincibleTimer > 0 ? 'rgba(234, 179, 8, 0.3)' : 'rgba(30, 41, 59, 0.5)';
        ctx.lineWidth = p.invincibleTimer > 0 ? 4 : 2;
        bgOffsetRef.current = (bgOffsetRef.current - currentSpeed * 0.5) % 50;

        ctx.beginPath();
        for (let x = bgOffsetRef.current; x < width; x += 50) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
        for (let y = 0; y < height; y += 50) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, groundY, width, 40);
        ctx.strokeStyle = p.invincibleTimer > 0 ? '#facc15' : '#38bdf8';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(width, groundY); ctx.stroke();

        p.dy += GRAVITY;
        p.y += p.dy;
        if (p.invincibleTimer > 0) p.invincibleTimer--;

        if (p.y + p.height >= groundY) {
            p.y = groundY - p.height;
            p.dy = 0;
            if (!p.isGrounded) createParticles(p.x + p.width / 2, groundY, '#cbd5e1', 5, 0.3);
            p.isGrounded = true;
            p.canDoubleJump = false;
        }

        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > (p.invincibleTimer > 0 ? 15 : 8)) p.trail.shift();

        p.trail.forEach((pos, idx) => {
            const alpha = idx / 15;
            ctx.fillStyle = p.invincibleTimer > 0 ? `rgba(250, 204, 21, ${alpha})` : `rgba(6, 182, 212, ${alpha * 0.5})`;
            ctx.fillRect(pos.x, pos.y, p.width, p.height);
        });

        ctx.shadowBlur = p.invincibleTimer > 0 ? 30 : 15;
        ctx.shadowColor = p.invincibleTimer > 0 ? '#eab308' : (p.canDoubleJump ? '#c084fc' : '#06b6d4');
        ctx.fillStyle = p.invincibleTimer > 0 ? '#facc15' : (p.canDoubleJump ? '#d8b4fe' : '#22d3ee');
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.shadowBlur = 0;

        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '24px Arial';
        let playerEmoji = "🥵";
        if (p.invincibleTimer > 0) playerEmoji = "😈";
        else if (p.dy < -5) playerEmoji = "🚀";
        else if (!p.isGrounded && p.dy > 0) playerEmoji = "😱";

        ctx.fillText(playerEmoji, p.x + p.width / 2, p.y + p.height / 2 + 2);

        const spawnRate = Math.max(45, 90 - Math.floor(scoreRef.current / 40));
        if (frameRef.current % spawnRate === 0) {
            if (Math.random() < 0.15) {
                const isCoffee = Math.random() < 0.6;
                entitiesRef.current.powerups.push({
                    x: width, y: groundY - 60 - Math.random() * 60,
                    w: 30, h: 30,
                    type: isCoffee ? 'coffee' : 'past_year',
                    emoji: isCoffee ? '☕' : '📄',
                    color: isCoffee ? '#8b5cf6' : '#eab308',
                    collected: false
                });
            } else {
                const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
                const isFloating = type.name === "ebwise Down" || type.name === "Ghosting Groupmate";
                entitiesRef.current.obstacles.push({
                    x: width,
                    y: isFloating ? groundY - type.h - 50 : groundY - type.h,
                    width: type.w, height: type.h,
                    ...type, passed: false
                });
            }
        }

        const { powerups, obstacles } = entitiesRef.current;
        for (let i = powerups.length - 1; i >= 0; i--) {
            let pup = powerups[i];
            pup.x -= currentSpeed * 0.8;

            const yOffset = Math.sin(frameRef.current * 0.1) * 5;

            ctx.shadowBlur = 20; ctx.shadowColor = pup.color;
            ctx.fillStyle = pup.color + '40';
            ctx.beginPath(); ctx.arc(pup.x + pup.w / 2, pup.y + pup.h / 2 + yOffset, 20, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;

            ctx.font = '28px Arial';
            ctx.fillText(pup.emoji, pup.x + pup.w / 2, pup.y + pup.h / 2 + yOffset);

            if (!pup.collected && p.x < pup.x + pup.w && p.x + p.width > pup.x && p.y < pup.y + pup.h && p.y + p.height > pup.y) {
                pup.collected = true;
                createParticles(pup.x, pup.y, pup.color, 20, 1, pup.emoji);
                if (pup.type === 'coffee') {
                    p.invincibleTimer = 300;
                    shakeRef.current = 5;
                    spawnPopup(p.x, p.y - 40, "CAFFEINE RUSH!", "#facc15");
                } else {
                    scoreRef.current += 50;
                    spawnPopup(p.x, p.y - 40, "LEAKED PAPER! +50", "#eab308");
                }
            }
            if (pup.x + pup.w < 0 || pup.collected) powerups.splice(i, 1);
        }

        for (let i = obstacles.length - 1; i >= 0; i--) {
            let obs = obstacles[i];
            obs.x -= currentSpeed;

            ctx.shadowBlur = 10; ctx.shadowColor = obs.color;
            ctx.fillStyle = obs.color + 'dd';
            ctx.beginPath(); ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 6); ctx.fill();
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Inter';
            ctx.fillText(obs.name, obs.x + obs.width / 2, obs.y - 10);
            ctx.font = '24px Arial';
            ctx.fillText(obs.emoji, obs.x + obs.width / 2, obs.y + obs.height / 2 + 2);

            const margin = 4;
            if (p.x + margin < obs.x + obs.width - margin && p.x + p.width - margin > obs.x + margin && p.y + margin < obs.y + obs.height - margin && p.y + p.height - margin > obs.y + margin) {
                if (p.invincibleTimer > 0) {
                    createParticles(obs.x, obs.y, obs.color, 30, 2, "💥");
                    spawnPopup(obs.x, obs.y - 20, "SMASHED!", "#facc15");
                    shakeRef.current = 8;
                    obstacles.splice(i, 1);
                    continue;
                } else {
                    ctx.restore();
                    triggerGameOver();
                    return;
                }
            }

            if (!obs.passed && obs.x + obs.width < p.x) {
                obs.passed = true;
                scoreRef.current += 10;
                const messages = ["Clutch!", "Phew!", "+10", "Dodge!"];
                spawnPopup(p.x, p.y - 20, messages[Math.floor(Math.random() * messages.length)], "#38bdf8");
            }

            if (obs.x + obs.width < 0) obstacles.splice(i, 1);
        }

        drawParticles(ctx);

        scoreRef.current += 0.05;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.beginPath(); ctx.roundRect(15, 15, 200, 45, 12); ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.font = '900 22px "Inter", sans-serif';
        ctx.fillText(`CGPA: ${(scoreRef.current / 100).toFixed(2)}`, 30, 45);

        if (p.invincibleTimer > 0) {
            ctx.fillStyle = '#facc15';
            ctx.fillRect(15, 65, (p.invincibleTimer / 300) * 200, 6);
        }

        ctx.restore();
        frameRef.current++;
        reqRef.current = requestAnimationFrame(gameLoop);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                if (gameState === 'PLAYING') { e.preventDefault(); jump(); }
                else if (gameState === 'START') { e.preventDefault(); startGame(); }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState]);

    return (
        <div className="min-h-[calc(100vh-60px)] bg-slate-50 dark:bg-slate-950 pt-16 pb-8 px-4 sm:px-6 flex items-center justify-center font-sans">
            <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

                <div ref={containerRef} className="flex-1 w-full bg-[#020617] rounded-[2rem] overflow-hidden shadow-2xl shadow-indigo-500/10 relative border-4 border-slate-800 flex flex-col justify-center min-h-[460px] sm:min-h-[450px]">

                    <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-20 pointer-events-none">
                        <button onClick={() => navigate(-1)} className="pointer-events-auto flex items-center gap-2 text-slate-300 hover:text-white transition-colors bg-slate-900/80 px-4 py-2 rounded-full backdrop-blur-md border border-slate-700 shadow-lg">
                            <Home size={16} /> <span className="text-sm font-semibold hidden sm:inline">MMU Hub</span>
                        </button>
                        <div className="flex items-center gap-2 text-fuchsia-400 bg-slate-900/80 px-4 py-2 rounded-full backdrop-blur-md border border-slate-700 shadow-lg">
                            <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse"></span>
                            <span className="text-xs sm:text-sm font-black tracking-widest">SURVIVOR</span>
                        </div>
                    </div>

                    <canvas
                        ref={canvasRef}
                        width={CANVAS_WIDTH}
                        height={CANVAS_HEIGHT}
                        onPointerDown={(e) => { e.preventDefault(); if (gameState === 'PLAYING') jump(); }}
                        className="w-full h-auto max-h-[450px] object-contain cursor-pointer touch-none block"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                    />

                    {gameState === 'START' && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm text-white p-4">
                            <div className="bg-slate-900 border-2 border-slate-700 p-6 sm:p-8 rounded-[2rem] shadow-2xl max-w-[90%] sm:max-w-md w-full text-center transform transition-all scale-100 hover:scale-[1.01]">
                                <div className="text-6xl mb-4 animate-bounce">🥵</div>
                                <h2 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-fuchsia-500 mb-2 drop-shadow-lg tracking-tight">CGPA SURVIVOR</h2>

                                <p className="text-sm sm:text-base text-slate-400 mb-6 font-medium">
                                    Dodge assignments, 8AM classes, and finals. Protect the GPA.
                                </p>

                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex flex-col items-center gap-1">
                                        <Coffee className="text-yellow-500" size={24} />
                                        <span className="text-xs text-slate-400 font-bold">INVINCIBLE</span>
                                    </div>
                                    <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex flex-col items-center gap-1">
                                        <BookOpen className="text-fuchsia-500" size={24} />
                                        <span className="text-xs text-slate-400 font-bold">+50 POINTS</span>
                                    </div>
                                </div>

                                <button onClick={startGame} className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-600 to-fuchsia-600 hover:from-blue-500 hover:to-fuchsia-500 text-white text-lg font-black rounded-xl transition-all shadow-lg shadow-fuchsia-500/25 active:scale-95 uppercase tracking-wide">
                                    <Play size={24} fill="currentColor" /> Start Semester
                                </button>
                            </div>
                        </div>
                    )}

                    {gameState === 'GAMEOVER' && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-rose-950/90 backdrop-blur-md text-white p-4">
                            <div className="bg-slate-900 border-2 border-rose-500/50 p-6 sm:p-8 rounded-[2rem] shadow-2xl max-w-[90%] sm:max-w-sm w-full text-center">
                                <div className="text-5xl mb-3">💀</div>
                                <h2 className="text-2xl sm:text-3xl font-black text-rose-500 mb-4 tracking-tight uppercase leading-tight">{gameOverTitle}</h2>

                                <div className="bg-slate-950 rounded-2xl p-4 mb-6 border border-slate-800 shadow-inner">
                                    <p className="text-slate-400 text-xs sm:text-sm font-bold mb-1 uppercase tracking-widest">Final CGPA</p>
                                    <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                                        {(finalScore / 100).toFixed(2)}
                                    </p>
                                </div>

                                <form onSubmit={submitScore} className="flex flex-col gap-3 w-full mb-4">
                                    <input
                                        type="text" placeholder="Enter student name..." value={playerName}
                                        onChange={(e) => setPlayerName(e.target.value)} maxLength={12}
                                        className="w-full px-4 py-3.5 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 text-center font-bold text-white text-base placeholder-slate-600 transition-all shadow-inner"
                                        required
                                    />
                                    <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black rounded-xl disabled:opacity-50 transition-colors shadow-lg text-sm sm:text-base uppercase tracking-wide">
                                        <Trophy size={18} /> {isSubmitting ? 'Submitting...' : 'Save Record'}
                                    </button>
                                </form>

                                <button onClick={startGame} className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors text-sm sm:text-base">
                                    <RotateCcw size={16} /> Retake Semester
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-full lg:w-[380px] bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[380px] sm:h-[460px]">
                    <div className="bg-slate-50 dark:bg-slate-950/80 p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
                        <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-3 text-lg tracking-tight uppercase">
                            <Trophy className="text-yellow-500" size={24} /> Dean's List
                        </h3>
                        <button onClick={fetchLeaderboard} className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-cyan-500 transition-colors px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg uppercase">
                            Refresh
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 scroll-smooth">
                        {leaderboard.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                                <Trophy size={48} className="opacity-10" />
                                <p className="text-sm font-bold">No survivors yet.</p>
                            </div>
                        ) : (
                            <ul className="flex flex-col gap-2">
                                {leaderboard.map((entry, idx) => (
                                    <li key={idx} className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-md
                                            ${idx === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-950' :
                                                    idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900' :
                                                        idx === 2 ? 'bg-gradient-to-br from-amber-600 to-orange-700 text-white' :
                                                            'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                {idx + 1}
                                            </div>
                                            <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[130px] sm:max-w-[160px] group-hover:text-cyan-500 transition-colors">
                                                {entry.username}
                                            </span>
                                        </div>
                                        <span className="font-black text-lg text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50 px-3 py-1 rounded-lg border border-cyan-100 dark:border-cyan-900/50 shadow-sm">
                                            {(entry.score / 100).toFixed(2)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}