import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore, KnowledgeCard } from '@/stores/gameStore';
import { ArrowLeft, Pause, Play, RotateCcw, BookOpen, CheckCircle } from 'lucide-react';
import { knowledgeCards } from '@/data/questions';

interface GameObject {
  id: number;
  lane: number;
  y: number;
  type: 'fruit' | 'obstacle';
  emoji: string;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  life: number;
  vy: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  emoji: string;
}

const LANE_COUNT = 3;
const LANE_WIDTH = 120;
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 700;
const PLAYER_SIZE = 60;
const OBJECT_SIZE = 50;
const GROUND_Y = CANVAS_HEIGHT - 140;
const PLAYER_BASE_Y = GROUND_Y - PLAYER_SIZE;
const LANE_START_X = (CANVAS_WIDTH - LANE_COUNT * LANE_WIDTH) / 2;

const FRUITS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒', '🥝', '🍌', '🍉', '🍍', '🥭'];
const JUNK_FOOD = ['🍺', '🍻', '🚬', '🌶️', '🍗', '🍟', '🍔', '🍕'];

const BUILDING_COLORS = ['#1a1a3e', '#1e2a4a', '#162040', '#221a3a', '#1a2535', '#2a1a3a'];

export default function RunGame() {
  const navigate = useNavigate();
  const { addScore, addBadge, addKnowledgeCard } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const touchStartRef = useRef({ x: 0, y: 0 });

  const objectsRef = useRef<GameObject[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const objectIdRef = useRef(0);
  const floatIdRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const scoreRef = useRef(0);
  const speedRef = useRef(8);
  const playerLaneRef = useRef(1);
  const jumpProgressRef = useRef(0);
  const isJumpingRef = useRef(false);
  const bgOffsetRef = useRef(0);

  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
  const [displayScore, setDisplayScore] = useState(0);
  const [reviveKnowledge, setReviveKnowledge] = useState<Omit<KnowledgeCard, 'unlockedAt'> | null>(null);
  const [isKnowledgeLearned, setIsKnowledgeLearned] = useState(false);

  const getLaneCenterX = useCallback((lane: number) => {
    return LANE_START_X + lane * LANE_WIDTH + LANE_WIDTH / 2;
  }, []);

  const getRandomKnowledge = useCallback((): Omit<KnowledgeCard, 'unlockedAt'> => {
    const card = knowledgeCards[Math.floor(Math.random() * knowledgeCards.length)];
    return { id: card.id, title: card.title, content: card.content };
  }, []);

  const spawnObject = useCallback(() => {
    const lane = Math.floor(Math.random() * LANE_COUNT);
    const isFruit = Math.random() < 0.55;
    const emoji = isFruit
      ? FRUITS[Math.floor(Math.random() * FRUITS.length)]
      : JUNK_FOOD[Math.floor(Math.random() * JUNK_FOOD.length)];
    return {
      id: objectIdRef.current++,
      lane,
      y: -OBJECT_SIZE,
      type: isFruit ? 'fruit' as const : 'obstacle' as const,
      emoji,
    };
  }, []);

  const createParticles = (x: number, y: number, emoji: string): Particle[] => {
    const arr: Particle[] = [];
    for (let i = 0; i < 6; i++) {
      arr.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10 - 2,
        life: 1,
        emoji,
      });
    }
    return arr;
  };

  const startGame = () => {
    objectsRef.current = [];
    floatingTextsRef.current = [];
    particlesRef.current = [];
    objectIdRef.current = 0;
    floatIdRef.current = 0;
    lastSpawnRef.current = 0;
    scoreRef.current = 0;
    speedRef.current = 8;
    playerLaneRef.current = 1;
    jumpProgressRef.current = 0;
    isJumpingRef.current = false;
    bgOffsetRef.current = 0;
    setDisplayScore(0);
    setReviveKnowledge(null);
    setIsKnowledgeLearned(false);
    setGameState('playing');
  };

  const handleGameOver = () => {
    addScore(scoreRef.current);
    if (scoreRef.current >= 200) {
      addBadge({
        id: 'run-master',
        name: '跑步达人',
        icon: '🏃',
      });
    }
  };

  const learnAndRevive = () => {
    if (reviveKnowledge) {
      addKnowledgeCard({
        id: reviveKnowledge.id,
        title: reviveKnowledge.title,
        content: reviveKnowledge.content,
        unlockedAt: new Date().toISOString(),
      });
    }
    setIsKnowledgeLearned(true);
  };

  const revive = () => {
    objectsRef.current = [];
    floatingTextsRef.current = [];
    particlesRef.current = [];
    objectIdRef.current = 0;
    floatIdRef.current = 0;
    lastSpawnRef.current = 0;
    speedRef.current = 8;
    playerLaneRef.current = 1;
    jumpProgressRef.current = 0;
    isJumpingRef.current = false;
    bgOffsetRef.current = 0;
    setGameState('playing');
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (gameState !== 'playing') return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 40) playerLaneRef.current = Math.min(LANE_COUNT - 1, playerLaneRef.current + 1);
      else if (dx < -40) playerLaneRef.current = Math.max(0, playerLaneRef.current - 1);
    } else if (dy < -40 && !isJumpingRef.current) {
      isJumpingRef.current = true;
      jumpProgressRef.current = 0;
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      if (e.key === 'ArrowLeft') playerLaneRef.current = Math.max(0, playerLaneRef.current - 1);
      else if (e.key === 'ArrowRight') playerLaneRef.current = Math.min(LANE_COUNT - 1, playerLaneRef.current + 1);
      else if ((e.key === 'ArrowUp' || e.key === ' ') && !isJumpingRef.current) {
        e.preventDefault();
        isJumpingRef.current = true;
        jumpProgressRef.current = 0;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let buildingOffsets: number[] = [];
    for (let i = 0; i < 7; i++) {
      buildingOffsets.push(Math.random() * 1000);
    }

    const loop = (timestamp: number) => {
      if (gameState !== 'playing') {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const speed = speedRef.current;
      bgOffsetRef.current = (bgOffsetRef.current + speed * 0.4) % 200;

      if (isJumpingRef.current) {
        jumpProgressRef.current += 0.15;
        if (jumpProgressRef.current >= 1) {
          isJumpingRef.current = false;
          jumpProgressRef.current = 0;
        }
      }

      if (timestamp - lastSpawnRef.current > Math.max(400, 800 - speed * 15)) {
        objectsRef.current.push(spawnObject());
        lastSpawnRef.current = timestamp;
        if (speedRef.current < 20) speedRef.current += 0.1;
      }

      for (let i = objectsRef.current.length - 1; i >= 0; i--) {
        const obj = objectsRef.current[i];
        obj.y += speed;
        if (obj.y > CANVAS_HEIGHT + 50) {
          objectsRef.current.splice(i, 1);
          continue;
        }
        if (isJumpingRef.current) {
          const jumpH = getJumpHeight(jumpProgressRef.current);
          if (jumpH > 30) continue;
        }
        const playerCX = getLaneCenterX(playerLaneRef.current);
        const objCX = getLaneCenterX(obj.lane);
        const px = playerCX;
        const py = PLAYER_BASE_Y - getJumpHeight(jumpProgressRef.current) + PLAYER_SIZE / 2;
        const ox = objCX;
        const oy = obj.y + OBJECT_SIZE / 2;
        const dx = Math.abs(px - ox);
        const dy = Math.abs(py - oy);
        if (dx < 45 && dy < 45) {
          if (obj.type === 'fruit') {
            const fx = ox;
            const fy = oy;
            particlesRef.current.push(...createParticles(fx, fy, obj.emoji));
            floatingTextsRef.current.push({
              id: floatIdRef.current++,
              x: fx,
              y: fy - 10,
              text: '+10',
              life: 1,
              vy: -3,
            });
            scoreRef.current += 10;
            setDisplayScore(scoreRef.current);
          } else {
            setReviveKnowledge(getRandomKnowledge());
            setIsKnowledgeLearned(false);
            setGameState('gameover');
            return;
          }
          objectsRef.current.splice(i, 1);
        }
      }

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        p.life -= 0.025;
        if (p.life <= 0) particlesRef.current.splice(i, 1);
      }

      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y += ft.vy;
        ft.life -= 0.018;
        if (ft.life <= 0) floatingTextsRef.current.splice(i, 1);
      }

      // --- DRAW ---
      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      skyGrad.addColorStop(0, '#0a0a2e');
      skyGrad.addColorStop(0.3, '#141432');
      skyGrad.addColorStop(0.6, '#1a1a3e');
      skyGrad.addColorStop(1, '#1e2a4a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Stars
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 50; i++) {
        const seed = i * 137.508;
        const sx = (seed * 2.3) % CANVAS_WIDTH;
        const sy = (seed * 1.7) % (CANVAS_HEIGHT * 0.45);
        const size = 1 + (seed % 2);
        const twinkle = Math.sin(timestamp * 0.003 + i * 1.7) * 0.4 + 0.6;
        ctx.globalAlpha = twinkle * 0.8;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Moon
      ctx.fillStyle = '#f5f6fa';
      ctx.beginPath();
      ctx.arc(320, 70, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0a0a2e';
      ctx.beginPath();
      ctx.arc(332, 63, 33, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,240,0.08)';
      ctx.beginPath();
      ctx.arc(320, 70, 60, 0, Math.PI * 2);
      ctx.fill();

      // Clouds
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      for (let i = 0; i < 4; i++) {
        const cx = ((i * 160 + timestamp * 0.015 + bgOffsetRef.current * 0.5) % (CANVAS_WIDTH + 200)) - 100;
        const cy = 80 + i * 35 + Math.sin(i * 2) * 15;
        ctx.beginPath();
        ctx.arc(cx, cy, 28, 0, Math.PI * 2);
        ctx.arc(cx + 22, cy - 8, 22, 0, Math.PI * 2);
        ctx.arc(cx + 45, cy, 25, 0, Math.PI * 2);
        ctx.arc(cx + 22, cy + 8, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      // Buildings - background layer
      for (let i = 0; i < 8; i++) {
        const bx = (i * 58 + buildingOffsets[i] * 0.3 + bgOffsetRef.current * 0.15) % (CANVAS_WIDTH + 80) - 40;
        const bh = 90 + Math.sin(i * 2.3) * 40 + Math.sin(buildingOffsets[i] + timestamp * 0.001) * 10;
        ctx.fillStyle = BUILDING_COLORS[i % BUILDING_COLORS.length];
        ctx.fillRect(bx, GROUND_Y - bh, 48, bh);

        // Windows
        ctx.fillStyle = 'rgba(255,220,100,0.35)';
        const cols = Math.floor(48 / 14);
        const rows = Math.floor(bh / 18);
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (Math.random() > 0.3) {
              ctx.fillRect(bx + 6 + c * 14, GROUND_Y - bh + 8 + r * 18, 8, 10);
            }
          }
        }
      }

      // Buildings - foreground layer
      for (let i = 0; i < 6; i++) {
        const bx = (i * 80 + buildingOffsets[i + 2] * 0.5 + bgOffsetRef.current * 0.3) % (CANVAS_WIDTH + 100) - 50;
        const bh = 120 + Math.cos(i * 1.8) * 45;
        ctx.fillStyle = BUILDING_COLORS[(i + 2) % BUILDING_COLORS.length];
        ctx.fillRect(bx, GROUND_Y - bh, 60, bh);
        ctx.fillStyle = 'rgba(255,200,80,0.3)';
        const cols2 = Math.floor(60 / 16);
        const rows2 = Math.floor(bh / 20);
        for (let r = 0; r < rows2; r++) {
          for (let c = 0; c < cols2; c++) {
            if (Math.random() > 0.25) {
              ctx.fillRect(bx + 6 + c * 16, GROUND_Y - bh + 10 + r * 20, 8, 12);
            }
          }
        }
      }

      // Trees
      ctx.font = '42px Arial';
      for (let i = 0; i < 5; i++) {
        const tx = ((i * 130 + bgOffsetRef.current * 0.5) % (CANVAS_WIDTH + 100)) - 50;
        ctx.fillText('🌳', tx, GROUND_Y - 70 + Math.sin(i * 1.3) * 10);
      }

      // Streetlights
      for (let i = 0; i < 4; i++) {
        const lx = ((i * 140 + bgOffsetRef.current * 0.4) % (CANVAS_WIDTH + 100)) - 50;
        ctx.fillStyle = '#555';
        ctx.fillRect(lx - 2, GROUND_Y - 100, 4, 100);
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(lx, GROUND_Y - 100, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(243,156,18,0.12)';
        ctx.beginPath();
        ctx.arc(lx, GROUND_Y - 100, 25, 0, Math.PI * 2);
        ctx.fill();
      }

      // Side borders
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(0, 0, LANE_START_X, CANVAS_HEIGHT);
      ctx.fillRect(CANVAS_WIDTH - LANE_START_X, 0, LANE_START_X, CANVAS_HEIGHT);

      // Ground surface
      const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_HEIGHT);
      groundGrad.addColorStop(0, '#4a4a5a');
      groundGrad.addColorStop(0.3, '#3a3a4a');
      groundGrad.addColorStop(1, '#2a2a3a');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(LANE_START_X, GROUND_Y, LANE_COUNT * LANE_WIDTH, CANVAS_HEIGHT - GROUND_Y);

      // Ground lines (concrete texture)
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 20; i++) {
        const gy = GROUND_Y + (i * 12 + bgOffsetRef.current * 0.8) % (CANVAS_HEIGHT - GROUND_Y + 12);
        ctx.beginPath();
        ctx.moveTo(LANE_START_X, gy);
        ctx.lineTo(LANE_START_X + LANE_COUNT * LANE_WIDTH, gy);
        ctx.stroke();
      }

      // Yellow warning strips on ground
      ctx.fillStyle = '#e67e22';
      for (let i = 0; i < 6; i++) {
        const wy = GROUND_Y + 20 + (i * 60 + bgOffsetRef.current * 0.6) % (CANVAS_HEIGHT - GROUND_Y + 40);
        for (let wx = LANE_START_X; wx < LANE_START_X + LANE_COUNT * LANE_WIDTH; wx += 30) {
          ctx.beginPath();
          ctx.moveTo(wx, wy);
          ctx.lineTo(wx + 15, wy);
          ctx.lineTo(wx + 10, wy + 8);
          ctx.lineTo(wx - 5, wy + 8);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Small stones on ground
      ctx.fillStyle = '#6a6a7a';
      for (let i = 0; i < 30; i++) {
        const seed = i * 73.21;
        const sx = LANE_START_X + (seed * 1.7 + bgOffsetRef.current * 0.5) % (LANE_COUNT * LANE_WIDTH);
        const sy = GROUND_Y + 10 + (seed * 2.3) % (CANVAS_HEIGHT - GROUND_Y - 20);
        const s = 1.5 + (seed % 3);
        ctx.beginPath();
        ctx.arc(sx, sy, s, 0, Math.PI * 2);
        ctx.fill();
      }

      // Lane dividers (white dashed lines)
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 3;
      ctx.setLineDash([20, 15]);
      for (let i = 1; i < LANE_COUNT; i++) {
        const lx = LANE_START_X + i * LANE_WIDTH;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, GROUND_Y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Lane number markers at bottom
      ctx.font = '12px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < LANE_COUNT; i++) {
        const lx = LANE_START_X + i * LANE_WIDTH + LANE_WIDTH / 2;
        ctx.fillText(`── ${i + 1} ──`, lx, GROUND_Y + 25);
      }

      // Falling objects
      ctx.font = `${OBJECT_SIZE}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const obj of objectsRef.current) {
        const ox = getLaneCenterX(obj.lane);
        ctx.fillText(obj.emoji, ox, obj.y + OBJECT_SIZE / 2);
        // Glow for fruits
        if (obj.type === 'fruit') {
          ctx.shadowColor = 'rgba(255,215,0,0.3)';
          ctx.shadowBlur = 15;
          ctx.fillText('✨', ox - 15, obj.y + 5);
          ctx.shadowBlur = 0;
        }
      }

      // Particles
      for (const p of particlesRef.current) {
        ctx.globalAlpha = p.life;
        ctx.font = '22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.emoji, p.x, p.y);
      }
      ctx.globalAlpha = 1;

      // Floating texts (+10)
      for (const ft of floatingTextsRef.current) {
        ctx.globalAlpha = ft.life;
        ctx.font = 'bold 26px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 3;
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;

      // Player (runner)
      const playerCX = getLaneCenterX(playerLaneRef.current);
      const jumpH = getJumpHeight(jumpProgressRef.current);
      const playerY = PLAYER_BASE_Y - jumpH;
      const bounce = Math.sin(timestamp * 0.008) * 1.5;

      // Player shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(playerCX, GROUND_Y + 5, 25, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Player glow
      const playerGrad = ctx.createRadialGradient(playerCX, playerY + PLAYER_SIZE / 2, 5, playerCX, playerY + PLAYER_SIZE / 2, 40);
      playerGrad.addColorStop(0, 'rgba(0,255,136,0.2)');
      playerGrad.addColorStop(1, 'rgba(0,255,136,0)');
      ctx.fillStyle = playerGrad;
      ctx.beginPath();
      ctx.arc(playerCX, playerY + PLAYER_SIZE / 2, 40, 0, Math.PI * 2);
      ctx.fill();

      // Player emoji
      ctx.font = `${PLAYER_SIZE}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏃', playerCX, playerY + PLAYER_SIZE / 2 + bounce);

      // Running trail effect
      ctx.globalAlpha = 0.2;
      ctx.font = '20px Arial';
      for (let i = 1; i <= 3; i++) {
        ctx.globalAlpha = 0.08 / i;
        ctx.fillText('💨', playerCX + (i * 8), playerY + PLAYER_SIZE / 2 + bounce);
      }
      ctx.globalAlpha = 1;

      // Speed indicator
      ctx.font = '12px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(`⚡ ${Math.round(speedRef.current * 10)}`, CANVAS_WIDTH - 10, 10);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gameState, spawnObject, getLaneCenterX]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800/90 backdrop-blur-sm shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => {
              if (gameState === 'playing' || gameState === 'paused') handleGameOver();
              navigate('/');
            }}
            className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="bg-gradient-to-r from-green-400 to-emerald-400 text-white px-6 py-2 rounded-full font-bold text-xl shadow-lg">
            {displayScore} 分
          </div>
          {gameState === 'playing' && (
            <button
              onClick={() => setGameState('paused')}
              className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
            >
              <Pause className="w-5 h-5 text-white" />
            </button>
          )}
          {gameState !== 'playing' && <div className="w-10" />}
        </div>
      </header>

      {/* Controls hint */}
      <div className="px-4 py-2 text-center">
        <p className="text-gray-400 text-sm">👈👉 左右滑动 / 键盘左右键换道 &nbsp;|&nbsp; ⬆️ 上滑 / 空格跳跃</p>
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 flex justify-center items-center bg-gray-900 px-4 pb-4"
      >
        <div className="relative w-full max-w-[400px] h-full max-h-[700px]">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-full shadow-2xl rounded-2xl"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none' }}
          />

          {/* Menu overlay */}
          {gameState === 'menu' && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-2xl">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 text-center shadow-2xl max-w-sm mx-4 border-2 border-cyan-500">
                <div className="text-7xl mb-4">🏃</div>
                <h2 className="text-2xl font-bold text-white mb-2">地铁跑酷大作战</h2>
                <div className="text-left bg-gray-700/50 rounded-2xl p-4 mb-6">
                  <p className="text-cyan-400 mb-2 font-bold">🎮 游戏规则：</p>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li className="flex items-center gap-2"><span>👈👉</span><span>左右滑动换道</span></li>
                    <li className="flex items-center gap-2"><span>⬆️</span><span>上滑 / 空格键跳跃躲障</span></li>
                    <li className="flex items-center gap-2"><span>🍎</span><span>吃水果得 +10 分</span></li>
                    <li className="flex items-center gap-2"><span>🍔🚬</span><span>碰到不健康食物游戏结束</span></li>
                    <li className="flex items-center gap-2"><span>📖</span><span>学习知识可以复活继续</span></li>
                  </ul>
                </div>
                <button
                  onClick={startGame}
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold py-4 px-10 rounded-full shadow-lg hover:scale-105 transition-transform text-lg"
                >
                  开始游戏
                </button>
              </div>
            </div>
          )}

          {/* Pause overlay */}
          {gameState === 'paused' && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-2xl">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 text-center shadow-2xl max-w-sm mx-4 border-2 border-yellow-500">
                <div className="text-7xl mb-4">⏸️</div>
                <h2 className="text-2xl font-bold text-white mb-6">游戏暂停</h2>
                <div className="text-4xl font-bold text-green-400 mb-4">{displayScore} 分</div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setGameState('playing')}
                    className="bg-gradient-to-r from-green-400 to-emerald-400 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" /> 继续游戏
                  </button>
                  <button
                    onClick={startGame}
                    className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" /> 重新开始
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Game over overlay */}
          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-2xl">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 text-center shadow-2xl max-w-sm mx-4 border-2 border-red-500">
                <div className="text-7xl mb-4">💥</div>
                <h2 className="text-2xl font-bold text-white mb-2">游戏结束！</h2>
                <div className="text-4xl font-bold text-green-400 mb-6">{displayScore} 分</div>

                {!isKnowledgeLearned && reviveKnowledge && (
                  <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-2xl p-5 mb-6 border border-purple-400">
                    <div className="flex items-center gap-2 mb-3 justify-center">
                      <BookOpen className="w-6 h-6 text-purple-400" />
                      <h3 className="font-bold text-white">学习知识复活</h3>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-4 mb-4">
                      <h4 className="font-bold text-cyan-400 mb-2">{reviveKnowledge.title}</h4>
                      <p className="text-sm text-gray-300 whitespace-pre-line">{reviveKnowledge.content}</p>
                    </div>
                    <button
                      onClick={learnAndRevive}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-full shadow-lg hover:scale-105 transition-transform"
                    >
                      我学会了 ✅
                    </button>
                  </div>
                )}

                {isKnowledgeLearned && (
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={revive}
                      className="bg-gradient-to-r from-green-400 to-emerald-400 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" /> 复活继续
                    </button>
                    <button
                      onClick={() => {
                        handleGameOver();
                        navigate('/');
                      }}
                      className="bg-gray-700 text-gray-200 font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transition-transform"
                    >
                      返回首页
                    </button>
                  </div>
                )}

                {!reviveKnowledge && (
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={startGame}
                      className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transition-transform"
                    >
                      再玩一次
                    </button>
                    <button
                      onClick={() => {
                        handleGameOver();
                        navigate('/');
                      }}
                      className="bg-gray-700 text-gray-200 font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transition-transform"
                    >
                      返回首页
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getJumpHeight(progress: number): number {
  const t = Math.min(progress, 1);
  return Math.sin(t * Math.PI) * 100;
}