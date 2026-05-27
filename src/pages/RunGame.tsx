import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { ArrowLeft, Pause, Play, RotateCcw, Star, Heart } from 'lucide-react';
import { knowledgeCards } from '@/data/questions';

interface GameObject {
  id: number;
  x: number;
  y: number;
  type: 'obstacle' | 'brick' | 'fruit' | 'coin' | 'mushroom' | 'heart' | 'star';
  emoji: string;
  width: number;
  height: number;
  hit: boolean;
  vy?: number;
  originalY?: number;
  coinPhase?: number;
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
  id: number;
  x: number;
  y: number;
  vy: number;
  vx: number;
  life: number;
  color: string;
  size: number;
}

interface Cloud {
  x: number;
  y: number;
  scale: number;
}

interface Tree {
  x: number;
  height: number;
}

interface Mountain {
  x: number;
  scale: number;
}

const CANVAS_WIDTH = 420;
const CANVAS_HEIGHT = 520;
const GROUND_Y = 440;
const GRAVITY = 0.8;
const JUMP_FORCE = -18;
const GAME_SPEED_BASE = 3;

const healthyFoods = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒', '🥝', '🍌', '🍉', '🥦', '🥕', '🥬', '🍅', '🥑'];
const unhealthyFoods = ['🍔', '🍟', '🍕', '🚬', '🍻', '🍿', '🧁', '🍫', '🍩', '🍪'];

export default function RunGame() {
  const navigate = useNavigate();
  const { addScore } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const touchStartRef = useRef({ x: 0, y: 0 });
  
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(3);
  const [playerX, setPlayerX] = useState(80);
  const [playerY, setPlayerY] = useState(GROUND_Y);
  const [playerVy, setPlayerVy] = useState(0);
  const [playerDir, setPlayerDir] = useState(1);
  const [isJumping, setIsJumping] = useState(false);
  const [isInvincible, setIsInvincible] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(GAME_SPEED_BASE);
  const [isRunning, setIsRunning] = useState(false);
  const [isDucking, setIsDucking] = useState(false);
  
  const objectsRef = useRef<GameObject[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const treesRef = useRef<Tree[]>([]);
  const mountainsRef = useRef<Mountain[]>([]);
  
  const objectIdRef = useRef(0);
  const floatingTextIdRef = useRef(0);
  const particleIdRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const invincibleTimerRef = useRef<NodeJS.Timeout>();
  const playerFrameRef = useRef(0);

  const [reviveKnowledge, setReviveKnowledge] = useState<any>(null);
  const [isKnowledgeLearned, setIsKnowledgeLearned] = useState(false);

  const getRandomKnowledge = () => {
    return knowledgeCards[Math.floor(Math.random() * knowledgeCards.length)];
  };

  const createParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        id: particleIdRef.current++,
        x,
        y,
        vy: -3 - Math.random() * 4,
        vx: (Math.random() - 0.5) * 6,
        life: 1,
        color,
        size: 3 + Math.random() * 4,
      });
    }
  };

  const createFloatingText = (x: number, y: number, text: string) => {
    floatingTextsRef.current.push({
      id: floatingTextIdRef.current++,
      x,
      y,
      text,
      life: 1,
      vy: -3,
    });
  };

  const initGame = useCallback(() => {
    objectsRef.current = [];
    floatingTextsRef.current = [];
    particlesRef.current = [];
    objectIdRef.current = 0;
    floatingTextIdRef.current = 0;
    particleIdRef.current = 0;
    lastSpawnRef.current = 0;
    playerFrameRef.current = 0;
    
    cloudsRef.current = Array.from({ length: 6 }, (_, i) => ({
      x: i * 80 - 50,
      y: 30 + Math.random() * 50,
      scale: 0.7 + Math.random() * 0.6,
    }));
    
    treesRef.current = Array.from({ length: 8 }, (_, i) => ({
      x: i * 70 - 30,
      height: 60 + Math.random() * 40,
    }));
    
    mountainsRef.current = Array.from({ length: 4 }, (_, i) => ({
      x: i * 150 - 100,
      scale: 0.8 + Math.random() * 0.5,
    }));
  }, []);

  const spawnObject = useCallback((time: number) => {
    const rand = Math.random();
    let obj: GameObject;
    
    if (rand < 0.4) {
      obj = {
        id: objectIdRef.current++,
        x: CANVAS_WIDTH + 60,
        y: GROUND_Y - 45,
        type: 'obstacle',
        emoji: unhealthyFoods[Math.floor(Math.random() * unhealthyFoods.length)],
        width: 45,
        height: 45,
        hit: false,
      };
    } else if (rand < 0.75) {
      obj = {
        id: objectIdRef.current++,
        x: CANVAS_WIDTH + 60,
        y: GROUND_Y - 80 - Math.random() * 120,
        type: 'fruit',
        emoji: healthyFoods[Math.floor(Math.random() * healthyFoods.length)],
        width: 40,
        height: 40,
        hit: false,
      };
    } else if (rand < 0.88) {
      obj = {
        id: objectIdRef.current++,
        x: CANVAS_WIDTH + 60,
        y: GROUND_Y - 130 - Math.random() * 60,
        type: 'coin',
        emoji: '🪙',
        width: 30,
        height: 30,
        hit: false,
        coinPhase: 0,
      };
    } else if (rand < 0.96) {
      obj = {
        id: objectIdRef.current++,
        x: CANVAS_WIDTH + 60,
        y: GROUND_Y - 160 - Math.random() * 80,
        type: 'star',
        emoji: '⭐',
        width: 35,
        height: 35,
        hit: false,
      };
    } else {
      obj = {
        id: objectIdRef.current++,
        x: CANVAS_WIDTH + 60,
        y: GROUND_Y - 100 - Math.random() * 100,
        type: 'heart',
        emoji: '❤️',
        width: 32,
        height: 32,
        hit: false,
      };
    }
    return obj;
  }, []);

  const handleJump = useCallback(() => {
    if (!isJumping) {
      setPlayerVy(JUMP_FORCE);
      setIsJumping(true);
      createParticles(playerX + 25, playerY + 40, '#f59e0b', 8);
    }
  }, [isJumping, playerX, playerY]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (gameState !== 'playing') return;
    
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30) {
        setPlayerX(prev => Math.min(CANVAS_WIDTH - 55, prev + 50));
        setPlayerDir(1);
        setIsRunning(true);
      } else if (dx < -30) {
        setPlayerX(prev => Math.max(20, prev - 50));
        setPlayerDir(-1);
        setIsRunning(true);
      }
    } else if (dy < -30) {
      handleJump();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      
      if (e.key === 'ArrowLeft') {
        setPlayerX(prev => Math.max(20, prev - 18));
        setPlayerDir(-1);
        setIsRunning(true);
      } else if (e.key === 'ArrowRight') {
        setPlayerX(prev => Math.min(CANVAS_WIDTH - 55, prev + 18));
        setPlayerDir(1);
        setIsRunning(true);
      } else if ((e.key === 'ArrowUp' || e.key === ' ') && !isJumping) {
        handleJump();
      } else if (e.key === 'ArrowDown') {
        setIsDucking(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        setIsDucking(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, isJumping, handleJump]);

  useEffect(() => {
    if (isRunning) {
      const timer = setTimeout(() => setIsRunning(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isRunning]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = (time: number) => {
      if (gameState !== 'playing') return;
      
      playerFrameRef.current++;

      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      const skyGradient = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      skyGradient.addColorStop(0, '#4A90D9');
      skyGradient.addColorStop(0.4, '#7EC8E3');
      skyGradient.addColorStop(1, '#B8E4F0');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);
      
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(360, 60, 35, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#FFE066';
      ctx.beginPath();
      ctx.arc(360, 60, 28, 0, Math.PI * 2);
      ctx.fill();

      mountainsRef.current.forEach(m => {
        m.x -= gameSpeed * 0.15;
        if (m.x < -200) m.x = CANVAS_WIDTH + 100;
        
        ctx.fillStyle = '#6B8E23';
        ctx.beginPath();
        ctx.moveTo(m.x, GROUND_Y);
        ctx.lineTo(m.x + 80 * m.scale, GROUND_Y - 120 * m.scale);
        ctx.lineTo(m.x + 160 * m.scale, GROUND_Y);
        ctx.fill();
        
        ctx.fillStyle = '#8FBC8F';
        ctx.beginPath();
        ctx.moveTo(m.x + 20, GROUND_Y);
        ctx.lineTo(m.x + 80 * m.scale, GROUND_Y - 90 * m.scale);
        ctx.lineTo(m.x + 140, GROUND_Y);
        ctx.fill();
      });

      cloudsRef.current.forEach(c => {
        c.x -= gameSpeed * 0.08;
        if (c.x < -150) c.x = CANVAS_WIDTH + 100;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 30 * c.scale, 0, Math.PI * 2);
        ctx.arc(c.x + 25 * c.scale, c.y - 12 * c.scale, 25 * c.scale, 0, Math.PI * 2);
        ctx.arc(c.x + 50 * c.scale, c.y, 30 * c.scale, 0, Math.PI * 2);
        ctx.fill();
      });

      treesRef.current.forEach(t => {
        t.x -= gameSpeed * 0.4;
        if (t.x < -100) t.x = CANVAS_WIDTH + 80;
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(t.x + 12, GROUND_Y - t.height, 15, t.height);
        
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.moveTo(t.x, GROUND_Y - t.height);
        ctx.lineTo(t.x + 20, GROUND_Y - t.height - 50);
        ctx.lineTo(t.x + 40, GROUND_Y - t.height);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(t.x + 5, GROUND_Y - t.height - 20);
        ctx.lineTo(t.x + 20, GROUND_Y - t.height - 60);
        ctx.lineTo(t.x + 35, GROUND_Y - t.height - 20);
        ctx.fill();
      });

      const groundGradient = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_HEIGHT);
      groundGradient.addColorStop(0, '#90EE90');
      groundGradient.addColorStop(0.5, '#7CFC00');
      groundGradient.addColorStop(1, '#228B22');
      ctx.fillStyle = groundGradient;
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

      ctx.fillStyle = '#228B22';
      for (let i = 0; i < 25; i++) {
        const x = ((i * 25 + time * 0.05) % CANVAS_WIDTH);
        ctx.fillRect(x, GROUND_Y - 6, 15, 6);
      }

      ctx.fillStyle = '#FFD700';
      ctx.fillRect(0, GROUND_Y - 3, CANVAS_WIDTH, 3);

      ctx.fillStyle = '#000080';
      for (let i = 0; i < 10; i++) {
        const x = ((i * 50 + time * 0.1) % CANVAS_WIDTH);
        ctx.fillRect(x, GROUND_Y + 5, 20, 8);
        ctx.fillRect(x + 5, GROUND_Y + 13, 10, 5);
      }

      if (time - lastSpawnRef.current > 1000 - gameSpeed * 30) {
        objectsRef.current.push(spawnObject(time));
        lastSpawnRef.current = time;
        
        if (gameSpeed < 15) {
          setGameSpeed(prev => prev + 0.15);
        }
      }

      setPlayerY(prev => {
        const newVy = playerVy + GRAVITY;
        const newY = prev + newVy;
        
        if (newY >= GROUND_Y) {
          setPlayerVy(0);
          setIsJumping(false);
          return GROUND_Y;
        }
        
        setPlayerVy(newVy);
        return newY;
      });

      let hitObstacle = false;

      objectsRef.current = objectsRef.current.filter(obj => {
        obj.x -= gameSpeed;
        
        if (obj.coinPhase !== undefined) {
          obj.coinPhase += 0.15;
        }

        const px = playerX + 22;
        const py = playerY;
        const pw = 32;
        const ph = isDucking ? 30 : 50;

        const ox = obj.x;
        const oy = obj.y;
        const ow = obj.width;
        const oh = obj.height;

        if (px < ox + ow && px + pw > ox && py < oy + oh && py + ph > oy) {
          createParticles(obj.x + obj.width / 2, obj.y + obj.height / 2, '#FFA500', 12);
          
          if (obj.type === 'obstacle') {
            if (!isInvincible) {
              hitObstacle = true;
            }
          } else if (obj.type === 'fruit') {
            const newScore = score + 15;
            setScore(newScore);
            createFloatingText(obj.x, obj.y, '+15');
            createParticles(obj.x + obj.width / 2, obj.y, '#FF69B4', 8);
            return false;
          } else if (obj.type === 'coin') {
            setCoins(prev => prev + 1);
            setScore(prev => prev + 8);
            createFloatingText(obj.x, obj.y, '+8');
            createParticles(obj.x + obj.width / 2, obj.y, '#FFD700', 6);
            return false;
          } else if (obj.type === 'star') {
            const newScore = score + 30;
            setScore(newScore);
            createFloatingText(obj.x, obj.y, '+30');
            createParticles(obj.x + obj.width / 2, obj.y, '#FFFF00', 15);
            return false;
          } else if (obj.type === 'heart') {
            setLives(prev => Math.min(prev + 1, 5));
            createFloatingText(obj.x, obj.y, '+1❤️');
            createParticles(obj.x + obj.width / 2, obj.y, '#FF6B6B', 10);
            return false;
          }
        }
        
        if (obj.vy !== undefined && obj.originalY === undefined) {
          obj.originalY = obj.y;
          obj.vy = -5;
        }
        if (obj.originalY !== undefined && obj.vy !== undefined) {
          obj.y += obj.vy;
          obj.vy += 0.3;
          if (obj.y > GROUND_Y - 40) {
            obj.y = GROUND_Y - 40;
            obj.vy = 0;
          }
        }

        return obj.x > -120 && !obj.hit;
      });

      if (hitObstacle) {
        const newLives = lives - 1;
        setLives(newLives);
        if (newLives <= 0) {
          setReviveKnowledge(getRandomKnowledge());
          setIsKnowledgeLearned(false);
          setGameState('gameover');
        } else {
          setIsInvincible(true);
          setTimeout(() => setIsInvincible(false), 3000);
          createParticles(playerX + 25, playerY + 20, '#FF6B6B', 20);
        }
        return;
      }

      floatingTextsRef.current = floatingTextsRef.current.filter(ft => {
        ft.y += ft.vy;
        ft.life -= 0.025;
        return ft.life > 0;
      });

      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        p.life -= 0.02;
        return p.life > 0;
      });

      objectsRef.current.forEach(obj => {
        ctx.save();
        
        if (obj.type === 'coin' && obj.coinPhase !== undefined) {
          const scaleX = Math.abs(Math.sin(obj.coinPhase));
          ctx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
          ctx.scale(scaleX, 1);
          ctx.font = `${obj.width}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(obj.emoji, 0, 0);
        } else {
          ctx.font = `${Math.max(obj.width, obj.height)}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(obj.emoji, obj.x + obj.width / 2, obj.y + obj.height / 2);
        }
        
        ctx.restore();
      });

      floatingTextsRef.current.forEach(ft => {
        ctx.globalAlpha = ft.life;
        ctx.font = 'bold 22px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1;
      });

      particlesRef.current.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      ctx.save();
      ctx.translate(playerX + 25, playerY + (isDucking ? 35 : 25));
      ctx.scale(playerDir, 1);
      
      if (isInvincible) {
        ctx.globalAlpha = 0.4 + Math.sin(time * 0.015) * 0.4;
      }
      
      ctx.font = isDucking ? '35px Arial' : '50px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const marioSprites = ['🧍', '🏃', '🧍', '🏃'];
      ctx.fillText(isDucking ? '🧎' : marioSprites[playerFrameRef.current % 4], 0, 0);
      
      if (isJumping) {
        ctx.font = '22px Arial';
        ctx.fillText('💨', -22, 8);
      } else if (isRunning) {
        ctx.font = '18px Arial';
        ctx.fillText('💨', -18, 5);
      }
      
      ctx.restore();

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, spawnObject, playerVy, score, isInvincible, gameSpeed, playerDir, lives, isDucking]);

  const learnAndRevive = () => {
    if (reviveKnowledge) {
      setIsKnowledgeLearned(true);
    }
  };

  const revive = () => {
    initGame();
    setGameState('playing');
    setPlayerX(80);
    setPlayerY(GROUND_Y);
    setPlayerVy(0);
    setIsJumping(false);
    setIsInvincible(false);
    setGameSpeed(GAME_SPEED_BASE);
    setLives(3);
    setIsDucking(false);
  };

  const startGame = () => {
    initGame();
    setScore(0);
    setCoins(0);
    setLives(3);
    setPlayerX(80);
    setPlayerY(GROUND_Y);
    setPlayerVy(0);
    setIsJumping(false);
    setIsInvincible(false);
    setGameSpeed(GAME_SPEED_BASE);
    setIsDucking(false);
    setGameState('playing');
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-500 to-green-400">
      <header className="bg-black/50 backdrop-blur-sm relative z-20">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`text-lg ${i < lives ? 'opacity-100' : 'opacity-30'}`}>
                  <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                </span>
              ))}
            </div>
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2">
              <Star className="w-4 h-4" />
              {score}
            </div>
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-3 py-2 rounded-full font-bold flex items-center gap-1">
              🪙 <span>{coins}</span>
            </div>
          </div>
          {gameState === 'playing' && (
            <button
              onClick={() => setGameState('paused')}
              className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
            >
              <Pause className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </header>

      <div className="p-3">
        <p className="text-center text-white/90 text-sm mb-2">
          👆点击/向上滑动=跳跃 | 👈👉左右滑动=移动 | ⬇️向下=下蹲
        </p>
      </div>

      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-2xl shadow-2xl border-4 border-yellow-500"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />
      </div>

      {gameState === 'menu' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-blue-600 via-red-600 to-purple-700 rounded-3xl p-8 text-center shadow-2xl max-w-md mx-4 border-4 border-yellow-400">
            <div className="text-9xl mb-4 animate-bounce">🍄</div>
            <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg font-cute">🚩 超级马里奥跑酷 🚩</h2>
            <p className="text-white/90 mb-6">躲避不健康食物，收集健康美食！</p>
            
            <div className="bg-black/50 rounded-2xl p-5 mb-6 border border-white/20">
              <h3 className="text-lg font-bold text-yellow-300 mb-3 flex items-center justify-center gap-2">
                <span className="text-xl">🎮</span> 游戏规则
              </h3>
              <ul className="space-y-2 text-white/90 text-sm text-left">
                <li className="flex items-center gap-2">
                  <span>⬆️</span> 点击/上滑跳跃躲避障碍
                </li>
                <li className="flex items-center gap-2">
                  <span>⬇️</span> 下蹲缩小体积躲避
                </li>
                <li className="flex items-center gap-2">
                  <span>🍎</span> 健康食物+15分
                </li>
                <li className="flex items-center gap-2">
                  <span>🪙</span> 金币+8分
                </li>
                <li className="flex items-center gap-2">
                  <span>⭐</span> 星星+30分
                </li>
                <li className="flex items-center gap-2">
                  <span>❤️</span> 爱心+1生命
                </li>
                <li className="flex items-center gap-2">
                  <span>🍔</span> 碰到垃圾食品扣血
                </li>
              </ul>
            </div>

            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-orange-400 text-white text-xl font-bold py-4 rounded-2xl border-4 border-yellow-200 hover:scale-105 active:scale-95 transition-transform shadow-lg"
            >
              🎮 开始游戏
            </button>
          </div>
        </div>
      )}

      {gameState === 'paused' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 text-center shadow-2xl max-w-md mx-4 border-2 border-yellow-500">
            <div className="text-6xl mb-4">⏸️</div>
            <h2 className="text-2xl font-bold text-white mb-6">游戏暂停</h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setGameState('playing')}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 px-6 rounded-full hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" /> 继续游戏
              </button>
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3 px-6 rounded-full hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> 重新开始
              </button>
            </div>
          </div>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-red-700 via-red-800 to-red-900 rounded-3xl p-8 text-center shadow-2xl max-w-md mx-4 border-4 border-yellow-400">
            <div className="text-6xl mb-4">💥</div>
            <h2 className="text-2xl font-bold text-white mb-2">游戏结束！</h2>
            <div className="flex items-center justify-center gap-2 text-5xl font-bold text-yellow-400 my-4">
              <Star className="w-8 h-8" /> {score}
            </div>
            <div className="text-xl text-amber-300 mb-2">🪙 {coins} 金币</div>
            
            {!isKnowledgeLearned && reviveKnowledge && (
              <div className="bg-purple-900/70 rounded-2xl p-5 mb-6 border border-purple-400">
                <h3 className="font-bold text-white mb-3 flex items-center justify-center gap-2">
                  <Star className="w-5 h-5 text-purple-400" /> 学习知识复活
                </h3>
                <p className="text-sm text-gray-300 whitespace-pre-line text-left mb-4">
                  {reviveKnowledge.content}
                </p>
                <button
                  onClick={learnAndRevive}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-xl hover:scale-105 transition-transform"
                >
                  我学会了 ✅
                </button>
              </div>
            )}

            {isKnowledgeLearned && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={revive}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 px-6 rounded-xl hover:scale-105 transition-transform"
                >
                  ✅ 复活继续
                </button>
                <button
                  onClick={() => {
                    addScore(score);
                    navigate('/');
                  }}
                  className="bg-gray-700 text-gray-200 font-bold py-3 px-6 rounded-xl hover:scale-105 transition-transform"
                >
                  返回首页
                </button>
              </div>
            )}

            {!isKnowledgeLearned && !reviveKnowledge && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={startGame}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3 px-6 rounded-xl hover:scale-105 transition-transform"
                >
                  再玩一次
                </button>
                <button
                  onClick={() => {
                    addScore(score);
                    navigate('/');
                  }}
                  className="bg-gray-700 text-gray-200 font-bold py-3 px-6 rounded-xl hover:scale-105 transition-transform"
                >
                  返回首页
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
