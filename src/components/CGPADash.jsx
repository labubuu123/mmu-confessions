import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Trophy, Play, RotateCcw, Home, Coffee, BookOpen, ListOrdered, Smartphone, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GAMEOVER_TITLES = [
    "SEM WASTED",
    "ACADEMIC PROBATION",
    "MCDONALD'S IS HIRING",
    "GG NO RE",
    "CAUGHT BY TURNITIN",
    "SLEPT THROUGH FINALS"
];

const OBSTACLE_TYPES = [
    { name: "8AM Class", emoji: "😴", color: '#60a5fa', h: 55, w: 40, behavior: 'normal' },
    { name: "Finals", emoji: "📚", color: '#fb7185', h: 95, w: 45, behavior: 'normal' },
    { name: "MMLS Down", emoji: "🚨", color: '#fbbf24', h: 50, w: 55, behavior: 'wave' },
    { name: "Ghosting", emoji: "👻", color: '#c084fc', h: 65, w: 45, behavior: 'fast' }
];

export default function CGPADash() {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    const [gameState, setGameState] = useState('START');
    const [finalScore, setFinalScore] = useState(0);
    const [gameOverTitle, setGameOverTitle] = useState('');

    const [leaderboard, setLeaderboard] = useState([]);
    const [showLeaderboardOnMobile, setShowLeaderboardOnMobile] = useState(false);

    const [playerName, setPlayerName] = useState('');
    const [nameError, setNameError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const reqRef = useRef(null);
    const frameRef = useRef(0);
    const scoreRef = useRef(0);
    const shakeRef = useRef(0);

    const playerRef = useRef({
        x: 80, y: 200, width: 48, height: 48,
        dy: 0, jumpForce: -15.0, trail: [],
        canDoubleJump: false, isGrounded: false,
        invincibleTimer: 0
    });

    const entitiesRef = useRef({ obstacles: [], powerups: [], popups: [], particles: [] });

    const GRAVITY = 0.8;
    let BASE_GAME_SPEED = 7.5;

    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 400;

    useEffect(() => {
        fetchLeaderboard();
        const savedName = localStorage.getItem('cgpa_dash_username');
        if (savedName) setPlayerName(savedName);

        return () => { if (reqRef.current) cancelAnimationFrame(reqRef.current); };
    }, []);

    useEffect(() => {
        const preventScroll = (e) => { if (gameState === 'PLAYING') e.preventDefault(); };
        const container = containerRef.current;
        if (container) container.addEventListener('touchmove', preventScroll, { passive: false });
        return () => { if (container) container.removeEventListener('touchmove', preventScroll); };
    }, [gameState]);

    const fetchLeaderboard = async () => {
        const { data } = await supabase
            .from('minigame_scores')
            .select('id, username, score')
            .order('score', { ascending: false })
            .limit(8);
        if (data) setLeaderboard(data);
    };

    const submitScore = async (e) => {
        e.preventDefault();
        if (!playerName.trim() || isSubmitting) return;

        setIsSubmitting(true);
        setNameError('');

        const trimmedName = playerName.trim();
        const localSavedName = localStorage.getItem('cgpa_dash_username');

        try {
            const { data: existingUsers } = await supabase
                .from('minigame_scores')
                .select('id, score, username')
                .ilike('username', trimmedName)
                .limit(1);

            const existingUser = existingUsers?.[0];

            if (existingUser) {
                if (localSavedName && localSavedName.toLowerCase() === trimmedName.toLowerCase()) {
                    if (finalScore > existingUser.score) {
                        await supabase
                            .from('minigame_scores')
                            .update({ score: finalScore })
                            .eq('id', existingUser.id);
                    }
                } else {
                    setNameError('Name in use! Please choose another.');
                    setIsSubmitting(false);
                    return;
                }
            } else {
                await supabase.from('minigame_scores').insert([{ username: trimmedName, score: finalScore }]);
                localStorage.setItem('cgpa_dash_username', trimmedName);
            }

            await fetchLeaderboard();
            setGameState('START');
            setShowLeaderboardOnMobile(true);
        } catch (err) {
            console.error("Error submitting score:", err);
            setNameError('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const spawnPopup = (x, y, text, color = '#10b981', size = 20) => {
        entitiesRef.current.popups.push({ x, y, text, color, life: 1, dy: -2, size });
    };

    const createParticles = (x, y, color, count, speed = 1, emoji = null) => {
        const isMobile = window.innerWidth < 768;
        const finalCount = isMobile ? Math.floor(count * 0.5) : count;
        for (let i = 0; i < finalCount; i++) {
            entitiesRef.current.particles.push({
                x, y, vx: (Math.random() - 0.5) * 10 * speed, vy: (Math.random() - 0.5) * 10 * speed,
                life: 1, color, size: Math.random() * 6 + 3, emoji
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
            createParticles(p.x + p.width / 2, p.y + p.height, '#94a3b8', 10, 0.5);
        } else if (p.canDoubleJump) {
            p.dy = p.jumpForce * 0.85;
            p.canDoubleJump = false;
            createParticles(p.x + p.width / 2, p.y + p.height, '#a78bfa', 15, 0.8);
            spawnPopup(p.x, p.y - 20, "CRAM!", "#8b5cf6");
        }
    };

    const startGame = () => {
        playerRef.current = { x: 80, y: 200, width: 48, height: 48, dy: 0, jumpForce: -15.0, trail: [], canDoubleJump: false, isGrounded: false, invincibleTimer: 0 };
        entitiesRef.current = { obstacles: [], powerups: [], popups: [], particles: [] };
        scoreRef.current = 0;
        frameRef.current = 0;
        shakeRef.current = 0;
        setShowLeaderboardOnMobile(false);
        setNameError('');
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
        createParticles(p.x + p.width / 2, p.y + p.height / 2, '#ef4444', 40, 1.5, "💀");

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
                ctx.font = `${p.size * 5}px Arial`;
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
            ctx.font = `900 ${p.size}px "Inter", sans-serif`;
            ctx.fillStyle = p.color;
            ctx.textAlign = 'center';

            ctx.lineWidth = 4;
            ctx.strokeStyle = '#0f172a';
            ctx.strokeText(p.text, p.x, p.y);
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

        const currentSpeed = BASE_GAME_SPEED + (scoreRef.current * 0.005);
        const p = playerRef.current;

        ctx.save();
        if (shakeRef.current > 0) {
            const dx = (Math.random() - 0.5) * shakeRef.current;
            const dy = (Math.random() - 0.5) * shakeRef.current;
            ctx.translate(dx, dy);
            shakeRef.current *= 0.9;
            if (shakeRef.current < 0.5) shakeRef.current = 0;
        }

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#334155';
        ctx.fillRect(0, groundY, width, 40);
        ctx.strokeStyle = p.invincibleTimer > 0 ? '#facc15' : '#64748b';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(width, groundY); ctx.stroke();

        p.dy += GRAVITY;
        p.y += p.dy;
        if (p.invincibleTimer > 0) p.invincibleTimer--;

        if (p.y + p.height >= groundY) {
            p.y = groundY - p.height;
            p.dy = 0;
            if (!p.isGrounded) createParticles(p.x + p.width / 2, groundY, '#cbd5e1', 6, 0.3);
            p.isGrounded = true;
            p.canDoubleJump = false;
        }

        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > (p.invincibleTimer > 0 ? 15 : 7)) p.trail.shift();

        p.trail.forEach((pos, idx) => {
            const alpha = idx / 15;
            ctx.fillStyle = p.invincibleTimer > 0 ? `rgba(250, 204, 21, ${alpha})` : `rgba(56, 189, 248, ${alpha * 0.5})`;
            ctx.fillRect(pos.x, pos.y, p.width, p.height);
        });

        ctx.fillStyle = p.invincibleTimer > 0 ? '#facc15' : (p.canDoubleJump ? '#c084fc' : '#38bdf8');
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.width, p.height, 8);
        ctx.fill();

        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '32px Arial';
        let playerEmoji = "🥵";
        if (p.invincibleTimer > 0) playerEmoji = "😈";
        else if (p.dy < -5) playerEmoji = "🚀";
        else if (!p.isGrounded && p.dy > 0) playerEmoji = "😱";
        ctx.fillText(playerEmoji, p.x + p.width / 2, p.y + p.height / 2 + 2);

        const spawnRate = Math.max(30, 80 - Math.floor(scoreRef.current / 30));
        if (frameRef.current % spawnRate === 0) {
            if (Math.random() < 0.12) {
                const isCoffee = Math.random() < 0.5;
                entitiesRef.current.powerups.push({
                    x: width, y: groundY - 70 - Math.random() * 60,
                    w: 40, h: 40,
                    type: isCoffee ? 'coffee' : 'past_year',
                    emoji: isCoffee ? '☕' : '📄',
                    color: isCoffee ? '#a78bfa' : '#facc15',
                    collected: false
                });
            } else {
                const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
                let startY = groundY - type.h;
                if (type.behavior === 'wave') startY -= 40;

                entitiesRef.current.obstacles.push({
                    x: width,
                    y: startY,
                    baseY: startY,
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
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath(); ctx.arc(pup.x + pup.w / 2, pup.y + pup.h / 2 + yOffset, 22, 0, Math.PI * 2); ctx.fill();
            ctx.font = '28px Arial';
            ctx.fillText(pup.emoji, pup.x + pup.w / 2, pup.y + pup.h / 2 + yOffset);

            if (!pup.collected && p.x < pup.x + pup.w && p.x + p.width > pup.x && p.y < pup.y + pup.h && p.y + p.height > pup.y) {
                pup.collected = true;
                createParticles(pup.x, pup.y, pup.color, 15, 1, pup.emoji);
                if (pup.type === 'coffee') {
                    p.invincibleTimer = 300;
                    shakeRef.current = 5;
                    spawnPopup(p.x, p.y - 40, "CAFFEINE RUSH!", "#facc15", 26);
                } else {
                    scoreRef.current += 50;
                    spawnPopup(p.x, p.y - 40, "LEAKED PAPER! +50", "#facc15", 26);
                }
            }
            if (pup.x + pup.w < 0 || pup.collected) powerups.splice(i, 1);
        }

        for (let i = obstacles.length - 1; i >= 0; i--) {
            let obs = obstacles[i];

            let obsSpeed = currentSpeed;
            if (obs.behavior === 'fast') obsSpeed *= 1.3;
            obs.x -= obsSpeed;

            if (obs.behavior === 'wave') {
                obs.y = obs.baseY + Math.sin(frameRef.current * 0.1) * 20;
            }

            ctx.fillStyle = obs.color;
            ctx.beginPath(); ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 8); ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = '32px Arial';
            ctx.fillText(obs.emoji, obs.x + obs.width / 2, obs.y + obs.height / 2 + 2);

            const margin = 6;
            if (p.x + margin < obs.x + obs.width - margin && p.x + p.width - margin > obs.x + margin && p.y + margin < obs.y + obs.height - margin && p.y + p.height - margin > obs.y + margin) {
                if (p.invincibleTimer > 0) {
                    createParticles(obs.x, obs.y, obs.color, 25, 2, "💥");
                    spawnPopup(obs.x, obs.y - 20, "SMASHED!", "#facc15", 26);
                    shakeRef.current = 6;
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

                const distanceToTop = (p.y + p.height) - obs.y;
                if (distanceToTop > -10 && distanceToTop < 10) {
                    scoreRef.current += 30;
                    spawnPopup(p.x, p.y - 30, "CLOSE CALL! +30", "#facc15", 26);
                } else {
                    scoreRef.current += 10;
                    const messages = ["Clutch!", "Phew!", "+10", "Dodge!"];
                    spawnPopup(p.x, p.y - 20, messages[Math.floor(Math.random() * messages.length)], "#60a5fa", 22);
                }
            }

            if (obs.x + obs.width < 0) obstacles.splice(i, 1);
        }

        drawParticles(ctx);

        scoreRef.current += 0.08;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.beginPath();
        ctx.roundRect(15, 5, 260, 55, 12);
        ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'left';
        ctx.font = '900 28px "Inter", sans-serif';
        ctx.fillText(`CGPA: ${(scoreRef.current / 100).toFixed(2)}`, 30, 42);

        if (p.invincibleTimer > 0) {
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.roundRect(15, 65, (p.invincibleTimer / 300) * 260, 8, 4);
            ctx.fill();
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

    const isPlaying = gameState === 'PLAYING';

    return (
        <div className={`min-h-[calc(100vh-60px)] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center font-sans transition-all duration-500 p-4 sm:p-6`}>

            <div className={`w-full mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8 transition-all duration-700
            ${isPlaying ? 'max-w-5xl justify-center' : 'max-w-6xl items-stretch'}`}>

                <div className={`w-full bg-slate-900 overflow-hidden shadow-2xl relative border-4 border-slate-700 flex flex-col transition-all duration-500 rounded-3xl sm:rounded-[2rem] 
                ${isPlaying ? 'min-h-[500px]' : 'min-h-[580px] sm:min-h-[520px] flex-1'}`}>

                    <div className="w-full px-5 py-4 flex justify-between items-center bg-slate-900 border-b border-slate-800 shrink-0">
                        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white bg-slate-700 hover:bg-slate-600 transition-colors px-4 py-2 rounded-xl shadow-md font-bold text-xs sm:text-sm">
                            <Home size={16} /> <span>Hub</span>
                        </button>
                        <div className="flex items-center gap-2 text-blue-400 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl font-bold tracking-widest text-xs sm:text-sm uppercase shadow-sm">
                            <Zap size={14} className="animate-pulse text-yellow-400" />
                            <span>Arcade</span>
                        </div>
                    </div>

                    <div className="relative w-full flex-1 flex flex-col items-center justify-center overflow-hidden bg-[#1e293b]" ref={containerRef}>
                        <canvas
                            ref={canvasRef}
                            width={CANVAS_WIDTH}
                            height={CANVAS_HEIGHT}
                            onPointerDown={(e) => { e.preventDefault(); if (gameState === 'PLAYING') jump(); }}
                            className="w-full h-auto aspect-[2/1] object-contain cursor-pointer touch-none block mx-auto"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                        />

                        {gameState === 'START' && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 overflow-y-auto">
                                <div className="bg-slate-800 border border-slate-600 p-5 sm:p-8 rounded-3xl shadow-2xl w-full max-w-[90%] sm:max-w-md text-center flex flex-col items-center justify-center gap-3 sm:gap-4 my-auto">

                                    <div className="text-5xl sm:text-6xl animate-bounce drop-shadow-lg leading-none">🥵</div>

                                    <div className="flex flex-col items-center gap-1 sm:gap-2">
                                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 tracking-tight leading-tight">CGPA SURVIVOR</h2>
                                        <p className="text-xs sm:text-sm text-slate-300 font-medium">
                                            Dodge assignments, 8AM classes, and finals.
                                        </p>
                                    </div>

                                    <div className="flex flex-row justify-center gap-2 sm:gap-3 w-full">
                                        <div className="bg-slate-700/50 rounded-xl p-2 sm:p-3 flex-1 flex flex-col items-center justify-center gap-1 sm:gap-2 border border-slate-600">
                                            <Coffee className="text-yellow-400 w-5 h-5 sm:w-6 sm:h-6" />
                                            <span className="text-[10px] sm:text-xs text-slate-300 font-bold uppercase tracking-wider text-center">Invincible</span>
                                        </div>
                                        <div className="bg-slate-700/50 rounded-xl p-2 sm:p-3 flex-1 flex flex-col items-center justify-center gap-1 sm:gap-2 border border-slate-600">
                                            <BookOpen className="text-blue-400 w-5 h-5 sm:w-6 sm:h-6" />
                                            <span className="text-[10px] sm:text-xs text-slate-300 font-bold uppercase tracking-wider text-center">+50 Pts</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2.5 sm:gap-3 w-full mt-1">
                                        <button onClick={startGame} className="w-full flex items-center justify-center gap-2 py-3.5 sm:py-4 bg-blue-500 hover:bg-blue-400 text-white text-base sm:text-lg font-black rounded-xl transition-all shadow-lg active:scale-95 uppercase tracking-wide">
                                            <Play size={20} className="sm:w-6 sm:h-6" fill="currentColor" /> Start Semester
                                        </button>

                                        <button onClick={() => setShowLeaderboardOnMobile(!showLeaderboardOnMobile)} className="lg:hidden w-full flex items-center justify-center gap-2 py-3 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-xl transition-colors border border-slate-600 shadow-md">
                                            <ListOrdered size={16} /> {showLeaderboardOnMobile ? 'Hide Rankings' : 'View Rankings'}
                                        </button>
                                    </div>

                                    <p className="text-[10px] sm:text-[11px] text-slate-400 sm:hidden flex items-center justify-center gap-1.5 opacity-80 font-semibold mt-1">
                                        <Smartphone size={14} /> Rotate device for a larger view
                                    </p>
                                </div>
                            </div>
                        )}

                        {gameState === 'GAMEOVER' && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-md p-4 overflow-y-auto">
                                <div className="bg-slate-800 border border-slate-600 p-5 sm:p-8 rounded-3xl shadow-2xl w-full max-w-[90%] sm:max-w-sm text-center flex flex-col items-center justify-center gap-3 sm:gap-4 my-auto">

                                    <div className="text-4xl sm:text-5xl leading-none drop-shadow-md">💀</div>

                                    <h2 className="text-lg sm:text-2xl font-black text-rose-400 tracking-tight uppercase leading-tight">{gameOverTitle}</h2>

                                    <div className="bg-slate-900/80 w-full rounded-2xl p-3 sm:p-4 border border-slate-700 shadow-inner flex flex-col justify-center items-center gap-1">
                                        <p className="text-slate-400 text-xs sm:text-sm font-bold uppercase tracking-widest">Final CGPA</p>
                                        <p className="text-4xl sm:text-5xl font-black text-blue-400 drop-shadow-md leading-none py-1 sm:py-2">
                                            {(finalScore / 100).toFixed(2)}
                                        </p>
                                    </div>

                                    <form onSubmit={submitScore} className="flex flex-col gap-2 sm:gap-3 w-full">
                                        <input
                                            type="text" placeholder="Enter student name..." value={playerName}
                                            onChange={(e) => setPlayerName(e.target.value)} maxLength={12}
                                            className="w-full px-4 py-3 sm:py-3.5 bg-slate-900 border border-slate-600 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 text-center font-bold text-white text-sm sm:text-base placeholder-slate-500 transition-all shadow-inner"
                                            required
                                        />
                                        {nameError && <p className="text-rose-400 text-[10px] sm:text-[11px] font-bold animate-pulse px-2">{nameError}</p>}

                                        <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-xl disabled:opacity-50 transition-colors shadow-lg text-sm sm:text-base uppercase tracking-wide">
                                            <Trophy size={16} className="sm:w-5 sm:h-5" /> {isSubmitting ? 'Saving...' : 'Save Record'}
                                        </button>
                                    </form>

                                    <button onClick={startGame} className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 bg-transparent hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-xl transition-colors text-sm sm:text-base border border-transparent hover:border-slate-600 mt-1">
                                        <RotateCcw size={16} className="sm:w-5 sm:h-5" /> Retake Semester
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {(!isPlaying) && (
                    <div className={`w-full lg:w-[380px] bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex-col h-[450px] sm:h-[500px] 
                    ${showLeaderboardOnMobile ? 'flex' : 'hidden lg:flex'}`}>
                        <div className="bg-slate-50 dark:bg-slate-800/80 p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
                            <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-3 text-lg tracking-tight uppercase">
                                <Trophy className="text-yellow-500 w-6 h-6" /> Dean's List
                            </h3>
                            <button onClick={fetchLeaderboard} className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg uppercase shadow-sm">
                                Refresh
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 scroll-smooth">
                            {leaderboard.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                                    <Trophy size={56} className="opacity-20" />
                                    <p className="text-sm font-bold uppercase tracking-wider">No survivors yet.</p>
                                </div>
                            ) : (
                                <ul className="flex flex-col gap-2.5">
                                    {leaderboard.map((entry, idx) => (
                                        <li key={entry.id || idx} className="flex justify-between items-center p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm hover:shadow-md">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shadow-inner
                                                ${idx === 0 ? 'bg-gradient-to-br from-yellow-200 to-yellow-500 text-yellow-900 border border-yellow-400' :
                                                        idx === 1 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 border border-slate-300' :
                                                            idx === 2 ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white border border-amber-600' :
                                                                'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
                                                    {idx + 1}
                                                </div>
                                                <span className="font-bold text-base text-slate-700 dark:text-slate-200 truncate max-w-[130px] sm:max-w-[160px] group-hover:text-blue-500 transition-colors">
                                                    {entry.username}
                                                </span>
                                            </div>
                                            <span className="font-black text-lg text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-500/20 shadow-sm">
                                                {(entry.score / 100).toFixed(2)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}