import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Trophy, Play, RotateCcw, Home, Coffee, BookOpen, ListOrdered } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GAMEOVER_TITLES = [
    "SEM WASTED",
    "ACADEMIC PROBATION",
    "MCDONALD'S IS HIRING",
    "GG NO RE",
    "CAUGHT BY TURNITIN",
    "SLEPT THROUGH FINALS"
];

// Soft Pastel Colors for Anti-Visual Fatigue
const OBSTACLE_TYPES = [
    { name: "8AM Class", emoji: "😴", color: '#60a5fa', h: 40, w: 30 }, // Soft Blue
    { name: "Finals", emoji: "📚", color: '#fb7185', h: 70, w: 35 },   // Soft Rose
    { name: "MMLS Down", emoji: "🚨", color: '#fbbf24', h: 35, w: 40 },  // Soft Amber
    { name: "Ghosting", emoji: "👻", color: '#c084fc', h: 50, w: 30 }    // Soft Purple
];

export default function CGPADash() {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    const [gameState, setGameState] = useState('START'); // START, PLAYING, GAMEOVER
    const [finalScore, setFinalScore] = useState(0);
    const [gameOverTitle, setGameOverTitle] = useState('');

    const [leaderboard, setLeaderboard] = useState([]);
    const [showLeaderboardOnMobile, setShowLeaderboardOnMobile] = useState(false);

    const [playerName, setPlayerName] = useState('');
    const [nameError, setNameError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Engine Refs
    const reqRef = useRef(null);
    const frameRef = useRef(0);
    const scoreRef = useRef(0);
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
        // Retrieve previously saved name to persist identity
        const savedName = localStorage.getItem('cgpa_dash_username');
        if (savedName) setPlayerName(savedName);

        return () => { if (reqRef.current) cancelAnimationFrame(reqRef.current); };
    }, []);

    // Prevent scrolling on mobile while playing
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
        if (!playerName.trim() || finalScore === 0) return;
        setIsSubmitting(true);
        setNameError('');

        const trimmedName = playerName.trim();
        const localSavedName = localStorage.getItem('cgpa_dash_username');

        try {
            // Check if name already exists in DB
            const { data: existingUser } = await supabase
                .from('minigame_scores')
                .select('id, score, username')
                .ilike('username', trimmedName)
                .maybeSingle();

            if (existingUser) {
                // If name exists, check if it belongs to this device/user session
                if (localSavedName && localSavedName.toLowerCase() === trimmedName.toLowerCase()) {
                    // Update their previous high score if current score is better
                    if (finalScore > existingUser.score) {
                        await supabase.from('minigame_scores').update({ score: finalScore }).eq('id', existingUser.id);
                    }
                } else {
                    // Name exists but belongs to someone else
                    setNameError('This name is already in use! Please choose another name.');
                    setIsSubmitting(false);
                    return;
                }
            } else {
                // New unique name
                await supabase.from('minigame_scores').insert([{ username: trimmedName, score: finalScore }]);
                localStorage.setItem('cgpa_dash_username', trimmedName);
            }

            await fetchLeaderboard();
            setIsSubmitting(false);
            setGameState('START');
            setShowLeaderboardOnMobile(true);
        } catch (err) {
            console.error("Error submitting score:", err);
            setIsSubmitting(false);
        }
    };

    const spawnPopup = (x, y, text, color = '#10b981') => {
        entitiesRef.current.popups.push({ x, y, text, color, life: 1, dy: -2 });
    };

    const createParticles = (x, y, color, count, speed = 1, emoji = null) => {
        const isMobile = window.innerWidth < 768;
        const finalCount = isMobile ? Math.floor(count * 0.5) : count;
        for (let i = 0; i < finalCount; i++) {
            entitiesRef.current.particles.push({
                x, y, vx: (Math.random() - 0.5) * 8 * speed, vy: (Math.random() - 0.5) * 8 * speed,
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
            createParticles(p.x + p.width / 2, p.y + p.height, '#94a3b8', 8, 0.5);
        } else if (p.canDoubleJump) {
            p.dy = p.jumpForce * 0.85;
            p.canDoubleJump = false;
            createParticles(p.x + p.width / 2, p.y + p.height, '#a78bfa', 12, 0.8);
            spawnPopup(p.x, p.y - 20, "CRAM!", "#8b5cf6");
        }
    };

    const startGame = () => {
        playerRef.current = { x: 80, y: 200, width: 36, height: 36, dy: 0, jumpForce: -13, trail: [], canDoubleJump: false, isGrounded: false, invincibleTimer: 0 };
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
        shakeRef.current = 10;
        setGameState('GAMEOVER');
        setFinalScore(Math.floor(scoreRef.current));
        setGameOverTitle(GAMEOVER_TITLES[Math.floor(Math.random() * GAMEOVER_TITLES.length)]);

        const p = playerRef.current;
        createParticles(p.x + p.width / 2, p.y + p.height / 2, '#ef4444', 30, 1.5, "💀");

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

        // Screen Shake
        ctx.save();
        if (shakeRef.current > 0) {
            const dx = (Math.random() - 0.5) * shakeRef.current;
            const dy = (Math.random() - 0.5) * shakeRef.current;
            ctx.translate(dx, dy);
            shakeRef.current *= 0.9;
            if (shakeRef.current < 0.5) shakeRef.current = 0;
        }

        // CLEAN, FLAT BACKGROUND (No neon grid to prevent visual fatigue)
        ctx.fillStyle = '#1e293b'; // Soft slate-800
        ctx.fillRect(0, 0, width, height);

        // FLAT GROUND
        ctx.fillStyle = '#334155'; // Soft slate-700
        ctx.fillRect(0, groundY, width, 40);

        // Solid boundary line
        ctx.strokeStyle = p.invincibleTimer > 0 ? '#facc15' : '#64748b';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(width, groundY); ctx.stroke();

        // Update Player
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

        // Trail
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > (p.invincibleTimer > 0 ? 12 : 6)) p.trail.shift();

        p.trail.forEach((pos, idx) => {
            const alpha = idx / 15;
            ctx.fillStyle = p.invincibleTimer > 0 ? `rgba(250, 204, 21, ${alpha})` : `rgba(56, 189, 248, ${alpha * 0.5})`;
            ctx.fillRect(pos.x, pos.y, p.width, p.height);
        });

        // Player Box (FLAT DESIGN, NO BLUR)
        ctx.fillStyle = p.invincibleTimer > 0 ? '#facc15' : (p.canDoubleJump ? '#c084fc' : '#38bdf8');
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.width, p.height, 6);
        ctx.fill();

        // Player Emoji
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '22px Arial';
        let playerEmoji = "🥵";
        if (p.invincibleTimer > 0) playerEmoji = "😈";
        else if (p.dy < -5) playerEmoji = "🚀";
        else if (!p.isGrounded && p.dy > 0) playerEmoji = "😱";

        ctx.fillText(playerEmoji, p.x + p.width / 2, p.y + p.height / 2 + 2);

        // Spawning Logic
        const spawnRate = Math.max(45, 90 - Math.floor(scoreRef.current / 40));
        if (frameRef.current % spawnRate === 0) {
            if (Math.random() < 0.15) {
                const isCoffee = Math.random() < 0.6;
                entitiesRef.current.powerups.push({
                    x: width, y: groundY - 60 - Math.random() * 60,
                    w: 30, h: 30,
                    type: isCoffee ? 'coffee' : 'past_year',
                    emoji: isCoffee ? '☕' : '📄',
                    color: isCoffee ? '#a78bfa' : '#facc15',
                    collected: false
                });
            } else {
                const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
                const isFloating = type.name === "MMLS Down" || type.name === "Ghosting";
                entitiesRef.current.obstacles.push({
                    x: width,
                    y: isFloating ? groundY - type.h - 50 : groundY - type.h,
                    width: type.w, height: type.h,
                    ...type, passed: false
                });
            }
        }

        // Update Powerups
        const { powerups, obstacles } = entitiesRef.current;
        for (let i = powerups.length - 1; i >= 0; i--) {
            let pup = powerups[i];
            pup.x -= currentSpeed * 0.8;

            const yOffset = Math.sin(frameRef.current * 0.1) * 5;

            // Flat Bubble background
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath(); ctx.arc(pup.x + pup.w / 2, pup.y + pup.h / 2 + yOffset, 18, 0, Math.PI * 2); ctx.fill();

            // Emoji
            ctx.font = '24px Arial';
            ctx.fillText(pup.emoji, pup.x + pup.w / 2, pup.y + pup.h / 2 + yOffset);

            // Collision
            if (!pup.collected && p.x < pup.x + pup.w && p.x + p.width > pup.x && p.y < pup.y + pup.h && p.y + p.height > pup.y) {
                pup.collected = true;
                createParticles(pup.x, pup.y, pup.color, 15, 1, pup.emoji);
                if (pup.type === 'coffee') {
                    p.invincibleTimer = 300;
                    shakeRef.current = 5;
                    spawnPopup(p.x, p.y - 40, "CAFFEINE RUSH!", "#facc15");
                } else {
                    scoreRef.current += 50;
                    spawnPopup(p.x, p.y - 40, "LEAKED PAPER! +50", "#facc15");
                }
            }
            if (pup.x + pup.w < 0 || pup.collected) powerups.splice(i, 1);
        }

        // Update Obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
            let obs = obstacles[i];
            obs.x -= currentSpeed;

            // Flat Obstacle Box
            ctx.fillStyle = obs.color;
            ctx.beginPath(); ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 6); ctx.fill();

            // Emoji Only (Text on top removed)
            ctx.fillStyle = '#ffffff';
            ctx.font = '22px Arial';
            ctx.fillText(obs.emoji, obs.x + obs.width / 2, obs.y + obs.height / 2 + 2);

            // Hitbox Detection
            const margin = 4;
            if (p.x + margin < obs.x + obs.width - margin && p.x + p.width - margin > obs.x + margin && p.y + margin < obs.y + obs.height - margin && p.y + p.height - margin > obs.y + margin) {
                if (p.invincibleTimer > 0) {
                    createParticles(obs.x, obs.y, obs.color, 20, 2, "💥");
                    spawnPopup(obs.x, obs.y - 20, "SMASHED!", "#facc15");
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
                scoreRef.current += 10;
                const messages = ["Clutch!", "Phew!", "+10", "Dodge!"];
                spawnPopup(p.x, p.y - 20, messages[Math.floor(Math.random() * messages.length)], "#60a5fa");
            }

            if (obs.x + obs.width < 0) obstacles.splice(i, 1);
        }

        drawParticles(ctx);

        // Soft UI Overlay
        scoreRef.current += 0.05;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
        ctx.beginPath(); ctx.roundRect(15, 15, 200, 45, 12); ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'left';
        ctx.font = '800 22px "Inter", sans-serif';
        ctx.fillText(`CGPA: ${(scoreRef.current / 100).toFixed(2)}`, 30, 45);

        // Invincibility Bar
        if (p.invincibleTimer > 0) {
            ctx.fillStyle = '#facc15';
            ctx.beginPath(); ctx.roundRect(15, 65, (p.invincibleTimer / 300) * 200, 6, 3); ctx.fill();
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

    // Dynamic classes for fullscreen gameplay expansion
    const isPlaying = gameState === 'PLAYING';

    return (
        <div className="min-h-[calc(100vh-60px)] bg-slate-50 dark:bg-slate-950 pt-16 pb-8 px-4 sm:px-6 flex items-center justify-center font-sans transition-colors duration-500">
            <div className={`w-full mx-auto flex flex-col items-center gap-6 lg:gap-8 transition-all duration-700
            ${isPlaying ? 'max-w-5xl' : 'max-w-6xl lg:flex-row lg:items-stretch'}`}>

                {/* Game Canvas Container */}
                <div ref={containerRef} className={`w-full bg-[#1e293b] rounded-[2rem] overflow-hidden shadow-2xl relative border-4 border-slate-700 flex flex-col justify-center transition-all duration-500
                ${isPlaying ? 'h-[60vh] min-h-[400px] lg:min-h-[500px]' : 'min-h-[460px] flex-1'}`}>

                    {/* Header Navbar */}
                    <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-20 pointer-events-none">
                        <button onClick={() => navigate(-1)} className="pointer-events-auto flex items-center gap-2 text-slate-300 hover:text-white transition-colors bg-slate-800/80 px-4 py-2 rounded-full backdrop-blur-sm border border-slate-600 shadow-sm">
                            <Home size={16} /> <span className="text-sm font-semibold hidden sm:inline">MMU Hub</span>
                        </button>
                        <div className="flex items-center gap-2 text-blue-400 bg-slate-800/80 px-4 py-2 rounded-full backdrop-blur-sm border border-slate-600 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                            <span className="text-xs sm:text-sm font-black tracking-widest">ARCADE</span>
                        </div>
                    </div>

                    <canvas
                        ref={canvasRef}
                        width={CANVAS_WIDTH}
                        height={CANVAS_HEIGHT}
                        onPointerDown={(e) => { e.preventDefault(); if (gameState === 'PLAYING') jump(); }}
                        className={`w-full h-auto object-contain cursor-pointer touch-none block ${isPlaying ? 'max-h-[60vh] lg:max-h-[500px]' : 'max-h-[450px]'}`}
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                    />

                    {/* START SCREEN */}
                    {gameState === 'START' && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm text-white p-4">
                            <div className="bg-slate-800 border-2 border-slate-600 p-6 sm:p-8 rounded-[2rem] shadow-2xl max-w-[90%] sm:max-w-md w-full text-center">
                                <div className="text-6xl mb-4 animate-bounce">🥵</div>
                                <h2 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-2 tracking-tight">CGPA SURVIVOR</h2>

                                <p className="text-sm sm:text-base text-slate-300 mb-6 font-medium">
                                    Dodge assignments, 8AM classes, and finals. Protect the GPA.
                                </p>

                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-slate-700/50 rounded-xl p-3 flex flex-col items-center gap-1">
                                        <Coffee className="text-yellow-400" size={24} />
                                        <span className="text-xs text-slate-300 font-bold">INVINCIBLE</span>
                                    </div>
                                    <div className="bg-slate-700/50 rounded-xl p-3 flex flex-col items-center gap-1">
                                        <BookOpen className="text-blue-400" size={24} />
                                        <span className="text-xs text-slate-300 font-bold">+50 POINTS</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button onClick={startGame} className="w-full flex items-center justify-center gap-2 py-4 bg-blue-500 hover:bg-blue-400 text-white text-lg font-black rounded-xl transition-all shadow-md active:scale-95 uppercase tracking-wide">
                                        <Play size={24} fill="currentColor" /> Start Semester
                                    </button>

                                    {/* Mobile-only Leaderboard Toggle */}
                                    <button onClick={() => setShowLeaderboardOnMobile(!showLeaderboardOnMobile)} className="lg:hidden w-full flex items-center justify-center gap-2 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors">
                                        <ListOrdered size={18} /> {showLeaderboardOnMobile ? 'Hide Rankings' : 'View Rankings'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* GAME OVER SCREEN */}
                    {gameState === 'GAMEOVER' && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md text-white p-4">
                            <div className="bg-slate-800 border-2 border-slate-600 p-6 sm:p-8 rounded-[2rem] shadow-2xl max-w-[90%] sm:max-w-sm w-full text-center">
                                <div className="text-5xl mb-3">💀</div>
                                <h2 className="text-2xl sm:text-3xl font-black text-rose-400 mb-4 tracking-tight uppercase leading-tight">{gameOverTitle}</h2>

                                <div className="bg-slate-900/50 rounded-2xl p-4 mb-5 border border-slate-700 shadow-inner">
                                    <p className="text-slate-400 text-xs sm:text-sm font-bold mb-1 uppercase tracking-widest">Final CGPA</p>
                                    <p className="text-5xl font-black text-blue-400">
                                        {(finalScore / 100).toFixed(2)}
                                    </p>
                                </div>

                                <form onSubmit={submitScore} className="flex flex-col gap-3 w-full mb-4">
                                    <input
                                        type="text" placeholder="Enter student name..." value={playerName}
                                        onChange={(e) => setPlayerName(e.target.value)} maxLength={12}
                                        className="w-full px-4 py-3.5 bg-slate-900 border border-slate-600 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-center font-bold text-white text-base placeholder-slate-500 transition-all shadow-inner"
                                        required
                                    />
                                    {nameError && <p className="text-rose-400 text-xs font-bold animate-pulse">{nameError}</p>}

                                    <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-xl disabled:opacity-50 transition-colors shadow-md text-sm sm:text-base uppercase tracking-wide">
                                        <Trophy size={18} /> {isSubmitting ? 'Submitting...' : 'Save Record'}
                                    </button>
                                </form>

                                <button onClick={startGame} className="w-full flex items-center justify-center gap-2 py-3 bg-transparent hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-xl transition-colors text-sm sm:text-base">
                                    <RotateCcw size={16} /> Retake Semester
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* LEADERBOARD (Hidden during gameplay. Stacked on mobile via state, side-by-side on desktop) */}
                {(!isPlaying) && (
                    <div className={`w-full lg:w-[380px] bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex-col h-[400px] sm:h-[460px] 
                    ${showLeaderboardOnMobile ? 'flex' : 'hidden lg:flex'}`}>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
                            <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-3 text-lg tracking-tight uppercase">
                                <Trophy className="text-yellow-500" size={24} /> Dean's List
                            </h3>
                            <button onClick={fetchLeaderboard} className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg uppercase">
                                Refresh
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 scroll-smooth">
                            {leaderboard.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                                    <Trophy size={48} className="opacity-20" />
                                    <p className="text-sm font-bold">No survivors yet.</p>
                                </div>
                            ) : (
                                <ul className="flex flex-col gap-2">
                                    {leaderboard.map((entry, idx) => (
                                        <li key={entry.id || idx} className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm
                                                ${idx === 0 ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400' :
                                                        idx === 1 ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' :
                                                            idx === 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-500' :
                                                                'bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}>
                                                    {idx + 1}
                                                </div>
                                                <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[130px] sm:max-w-[160px] group-hover:text-blue-500 transition-colors">
                                                    {entry.username}
                                                </span>
                                            </div>
                                            <span className="font-black text-lg text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-100 dark:border-blue-500/20">
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