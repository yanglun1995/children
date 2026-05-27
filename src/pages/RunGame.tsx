import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { ArrowLeft, Pause, Play, RotateCcw, Star } from 'lucide-react';
import { knowledgeCards } from '@/data/questions';

interface GameObject {
  id: number;
  x: number;
  y: number;
  type: 'obstacle' | 'brick' | 'fruit' | 'coin' | 'mushroom' | 'star' | 'heart';
  emoji: string;
  width: number;
  height: number;
  hit: boolean;
  vy?: number;
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
}

const CANVAS_WIDTH = 420;
const CANVAS_HEIGHT = 520;
const GROUND_Y = 440;
const GRAVITY = 0.8;
const JUMP_FORCE = -16;
const GAME_SPEED_BASE = 4;

const fruits = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒', '🥝', '🍌', '🍉'];
const obstacles = ['🍔', '🍟', '🍕', '🚬', '🌶️', '🍻', '🍿', '🧁'];

export default function RunGame() {
  const navigate = useNavigate();
  const { addScore, addBadge } = useGameStore();
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
  
  const objectsRef = useRef<GameObject[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const objectIdRef = useRef(0);
  const floatingTextIdRef = useRef(0);
  const particleIdRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const invincibleTimerRef = useRef<NodeJS.Timeout>();
  const runningTimerRef = useRef<NodeJS.Timeout>();

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
        vy: -5 - Math.random() * 5,
        vx: (Math.random() - 0.5) * 6,
        life: 1,
        color,
      });
    }
  };

  const spawnObject = useCallback((time: number) => {
    const rand = Math.random();
    let obj: GameObject;
    
    if (rand < 0.25) {
      obj = {
        id: objectIdRef.current++,
        x: CANVAS_WIDTH + 50,
        y: GROUND_Y - 45,
        type: 'obstacle',
        emoji: obstacles[Math.floor(Math.random() * obstacles.length)],
        width: 45,
        height: 45,
        hit: false,
      };
    } else if (rand < 0.40) {
      obj = {
        id: objectIdRef.current++,
        x: CANVAS_WIDTH + 50,
        y: GROUND_Y - 90,
        type: 'brick',
        emoji: '🧱',
        width: 45,
        height: 45,
        hit: false,
      };
    } else if (rand < 0.55) {
      obj = {
        id: objectIdRef.current++,
        x: CANVAS_WIDTH + 50,
        y: GROUND_Y - 130 - Math.random() * 60,
        type: 'coin',
        emoji: '🪙',
        width: 28,
        height: 28,
        hit: false,
        vy: Math.sin(time * 0.005) * 2,
      };
    } else if (rand < 0.65) {
      obj = {
        id: objectIdRef.current++,
        x: CANVAS_WIDTH + 50,
        y: GROUND_Y - 140,
        type: 'brick',
        emoji: '❓',
        width: 45,
        height: 45,
        hit: false,
      };
    } else if (rand < 0.72) {
      obj = {
        id: objectIdRef.current++,
        x: CANVAS_WIDTH + 50,
        y: GROUND_Y - 50,
        type: 'mushroom',
        emoji: '🍄',
        width: 40,
        height: 40,
        hit: false,
      };
    } else if (rand < 0.82) {
      obj = {
        id: objectIdRef.current++,
        x: CANVAS_WIDTH + 50,
        y: GROUND_Y - 80 - Math.random() * 120,
        type: 'fruit',
        emoji: fruits[Math.floor(Math.random() * fruits.length)],
        width: 38,
        height: 38,
        hit: false,
      };
    } else if (rand < 0.88) {
      obj = {
        id: objectIdRef.current++,
        x: CANVAS_WIDTH + 50,
        y: GROUND_Y - 160 - Math.random() * 80,
        type: 'star',
        emoji: '⭐',
        width: 32,
        height: 32,
        hit: false,
      };
    } else {
      obj = {
        id: objectIdRef.current++,
        x: CANVAS_WIDTH + 50,
        y: GROUND_Y - 100 - Math.random() * 100,
        type: 'heart',
        emoji: '❤️',
        width: 30,
        height: 30,
        hit: false,
      };
    }
    return obj;
  }, []);

  const createFloatingText = (x: number, y: number, text: string) => {
    return {
      id: floatingTextIdRef.current++,
      x,
      y,
      text,
      life: 1,
      vy: -3,
    };
  };

  const handleJump = useCallback(() => {
    if (!isJumping) {
      setPlayerVy(JUMP_FORCE);
      setIsJumping(true);
      createParticles(playerX + 25, playerY, '#FFD700', 8);
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isJumping, handleJump]);

  useEffect(() => {
    if (isRunning) {
      runningTimerRef.current = setTimeout(() => setIsRunning(false), 200);
    }
    return () => {
      if (runningTimerRef.current) clearTimeout(runningTimerRef.current);
    };
  }, [isRunning]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let bgOffset = 0;
    let cloudOffset = 0;
    let mountainOffset = 0;
    let treeOffset = 0;
    let castleOffset = 0;
    let playerFrame = 0;

    const gameLoop = (timestamp: number) => {
      if (gameState !== 'playing') return;

      bgOffset = (bgOffset + gameSpeed * 0.2) % 100;
      cloudOffset = (cloudOffset + gameSpeed * 0.08) % 400;
      mountainOffset = (mountainOffset + gameSpeed * 0.15) % 300;
      treeOffset = (treeOffset + gameSpeed * 0.4) % 250;
      castleOffset = (castleOffset + gameSpeed * 0.05) % 600;
      playerFrame = (playerFrame + 1) % 4;

      const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      skyGradient.addColorStop(0, '#4A90D9');
      skyGradient.addColorStop(0.3, '#7EC8E3');
      skyGradient.addColorStop(0.7, '#B8E4F0');
      skyGradient.addColorStop(1, '#D4EDF7');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      for (let i = 0; i < 3; i++) {
        const castleX = ((i * 600 + castleOffset) % (CANVAS_WIDTH + 800)) - 200;
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(castleX + 50, GROUND_Y - 180, 80, 60);
        ctx.fillRect(castleX + 30, GROUND_Y - 140, 20, 100);
        ctx.fillRect(castleX + 130, GROUND_Y - 140, 20, 100);
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(castleX + 90, GROUND_Y - 220);
        ctx.lineTo(castleX + 100, GROUND_Y - 180);
        ctx.lineTo(castleX + 80, GROUND_Y - 180);
        ctx.fill();
      }

      for (let i = 0; i < 5; i++) {
        const mountainX = ((i * 250 + mountainOffset) % (CANVAS_WIDTH + 300)) - 150;
        ctx.fillStyle = '#6B8E23';
        ctx.beginPath();
        ctx.moveTo(mountainX, GROUND_Y);
        ctx.lineTo(mountainX + 80, GROUND_Y - 120);
        ctx.lineTo(mountainX + 160, GROUND_Y);
        ctx.fill();
        ctx.fillStyle = '#8FBC8F';
        ctx.beginPath();
        ctx.moveTo(mountainX + 20, GROUND_Y);
        ctx.lineTo(mountainX + 80, GROUND_Y - 90);
        ctx.lineTo(mountainX + 140, GROUND_Y);
        ctx.fill();
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.9;
      for (let i = 0; i < 6; i++) {
        const cloudX = ((i * 200 + cloudOffset) % (CANVAS_WIDTH + 300)) - 150;
        const cloudY = 40 + (i % 3) * 50;
        const cloudScale = 0.8 + (i % 2) * 0.4;
        
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, 30 * cloudScale, 0, Math.PI * 2);
        ctx.arc(cloudX + 25 * cloudScale, cloudY - 12 * cloudScale, 25 * cloudScale, 0, Math.PI * 2);
        ctx.arc(cloudX + 50 * cloudScale, cloudY, 30 * cloudScale, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      for (let i = 0; i < 15; i++) {
        const treeX = ((i * 120 + treeOffset) % (CANVAS_WIDTH + 150)) - 75;
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(treeX - 5, GROUND_Y - 30, 10, 30);
        
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.moveTo(treeX - 20, GROUND_Y - 30);
        ctx.lineTo(treeX, GROUND_Y - 70);
        ctx.lineTo(treeX + 20, GROUND_Y - 30);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(treeX - 15, GROUND_Y - 45);
        ctx.lineTo(treeX, GROUND_Y - 75);
        ctx.lineTo(treeX + 15, GROUND_Y - 45);
        ctx.fill();
      }

      const groundGradient = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_HEIGHT);
      groundGradient.addColorStop(0, '#90EE90');
      groundGradient.addColorStop(0.5, '#7CFC00');
      groundGradient.addColorStop(1, '#228B22');
      ctx.fillStyle = groundGradient;
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

      ctx.fillStyle = '#228B22';
      for (let i = 0; i < 25; i++) {
        const x = ((i * 25 + bgOffset) % CANVAS_WIDTH);
        ctx.fillRect(x, GROUND_Y - 6, 15, 6);
      }

      ctx.fillStyle = '#FFD700';
      ctx.fillRect(0, GROUND_Y - 3, CANVAS_WIDTH, 3);

      ctx.fillStyle = '#000080';
      for (let i = 0; i < 10; i++) {
        const x = ((i * 50 + bgOffset * 1.5) % CANVAS_WIDTH);
        ctx.fillRect(x, GROUND_Y + 5, 20, 8);
        ctx.fillRect(x + 5, GROUND_Y + 13, 10, 5);
      }

      if (timestamp - lastSpawnRef.current > 1000 - gameSpeed * 30) {
        objectsRef.current.push(spawnObject(timestamp));
        lastSpawnRef.current = timestamp;
        
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
        if (obj.vy) {
          obj.y += Math.sin(timestamp * 0.003) * obj.vy;
        }

        const px = playerX + 22;
        const py = playerY;
        const pw = 32;
        const ph = 50;

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
          } else if (obj.type === 'brick') {
            if (playerVy > 0 && py + ph - 15 < oy + oh / 2) {
              obj.hit = true;
              setPlayerVy(-10);
              setIsJumping(true);
              createParticles(obj.x + obj.width / 2, obj.y, '#FFD700', 15);
              
              const randItems = Math.floor(Math.random() * 2) + 2;
              for (let i = 0; i < randItems; i++) {
                setTimeout(() => {
                  const itemTypes = ['fruit', 'coin', 'star'];
                  const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
                  objectsRef.current.push({
                    id: objectIdRef.current++,
                    x: obj.x + i * 20,
                    y: obj.y,
                    type: itemType as any,
                    emoji: itemType === 'fruit' ? fruits[Math.floor(Math.random() * fruits.length)] :
                           itemType === 'coin' ? '🪙' : '⭐',
                    width: itemType === 'coin' ? 25 : 30,
                    height: itemType === 'coin' ? 25 : 30,
                    hit: false,
                    vy: -4,
                  });
                }, i * 80);
              }
            }
          } else if (obj.type === 'fruit') {
            const newScore = score + 15;
            setScore(newScore);
            floatingTextsRef.current.push(createFloatingText(obj.x, obj.y, '+15'));
            createParticles(obj.x + obj.width / 2, obj.y, '#FF69B4', 8);
            return false;
          } else if (obj.type === 'coin') {
            setCoins(prev => prev + 1);
            setScore(prev => prev + 8);
            floatingTextsRef.current.push(createFloatingText(obj.x, obj.y, '+8'));
            createParticles(obj.x + obj.width / 2, obj.y, '#FFD700', 6);
            return false;
          } else if (obj.type === 'mushroom') {
            setIsInvincible(true);
            floatingTextsRef.current.push(createFloatingText(obj.x, obj.y, '✨无敌5秒'));
            createParticles(obj.x + obj.width / 2, obj.y, '#98FB98', 10);
            if (invincibleTimerRef.current) clearTimeout(invincibleTimerRef.current);
            invincibleTimerRef.current = setTimeout(() => {
              setIsInvincible(false);
            }, 5000);
            return false;
          } else if (obj.type === 'star') {
            const newScore = score + 30;
            setScore(newScore);
            floatingTextsRef.current.push(createFloatingText(obj.x, obj.y, '+30'));
            createParticles(obj.x + obj.width / 2, obj.y, '#FFFF00', 15);
            return false;
          } else if (obj.type === 'heart') {
            setLives(prev => Math.min(prev + 1, 5));
            floatingTextsRef.current.push(createFloatingText(obj.x, obj.y, '+1生命'));
            createParticles(obj.x + obj.width / 2, obj.y, '#FF6B6B', 10);
            return false;
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
          createParticles(playerX + 25, playerY, '#FF6B6B', 20);
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
        
        if (obj.type === 'coin') {
          const coinAngle = (timestamp * 0.01) % (Math.PI * 2);
          ctx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
          ctx.rotate(coinAngle);
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
        
        if (obj.type === 'brick' && !obj.hit) {
          ctx.strokeStyle = '#8B4513';
          ctx.lineWidth = 3;
          ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
          ctx.fillStyle = '#DEB887';
          ctx.fillRect(obj.x + 2, obj.y + 2, obj.width - 4, obj.height - 4);
          ctx.font = `${obj.width - 8}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#654321';
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
        ctx.arc(p.x, p.y, 4 * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      ctx.save();
      ctx.translate(playerX + 26, playerY + 25);
      ctx.scale(playerDir, 1);
      
      if (isInvincible) {
        ctx.globalAlpha = 0.4 + Math.sin(timestamp * 0.015) * 0.4;
      }
      
      ctx.font = '50px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const playerSprites = ['🧑‍🦱', '🏃', '🧑‍🦱', '🏃'];
      ctx.fillText(playerSprites[playerFrame], 0, 0);
      
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
  }, [gameState, spawnObject, playerVy, score, isInvincible, gameSpeed, playerDir, lives]);

  const learnAndRevive = () => {
    if (reviveKnowledge) {
      setIsKnowledgeLearned(true);
    }
  };

  const revive = () => {
    setGameState('playing');
    setPlayerX(80);
    setPlayerY(GROUND_Y);
    setPlayerVy(0);
    setIsJumping(false);
    setIsInvincible(false);
    setGameSpeed(GAME_SPEED_BASE);
    setLives(3);
    objectsRef.current = [];
    floatingTextsRef.current = [];
    particlesRef.current = [];
    objectIdRef.current = 0;
    lastSpawnRef.current = 0;
  };

  const startGame = () => {
    setScore(0);
    setCoins(0);
    setLives(3);
    setPlayerX(80);
    setPlayerY(GROUND_Y);
    setPlayerVy(0);
    setIsJumping(false);
    setIsInvincible(false);
    setGameSpeed(GAME_SPEED_BASE);
    objectsRef.current = [];
    floatingTextsRef.current = [];
    particlesRef.current = [];
    objectIdRef.current = 0;
    lastSpawnRef.current = 0;
    setGameState('playing');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-500 to-green-400">
      <header className="bg-black/50 backdrop-blur-sm">
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
                <span key={i} className={`text-xl ${i < lives ? 'opacity-100' : 'opacity-30'}`}>
                  ❤️
                </span>
              ))}
            </div>
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2">
              <Star className="w-4 h-4" />
              {score}
            </div>
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-3 py-2 rounded-full font-bold">
              🪙 {coins}
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
        <p className="text-center text-white/90 text-sm mb-2">👈👉 左右滑动移动 | ⬆️ 上滑/空格跳跃</p>
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
          <div className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 rounded-3xl p-8 text-center shadow-2xl max-w-sm mx-4 border-4 border-yellow-400">
            <div className="text-9xl mb-4 animate-bounce">🍄</div>
            <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">超级健康马里奥</h2>
            <p className="text-green-200 mb-6">躲避垃圾食品，收集水果金币！</p>
            
            <div className="bg-black/40 rounded-2xl p-5 mb-6 border border-green-500/30">
              <h3 className="text-lg font-bold text-yellow-300 mb-3">🎮 游戏规则</h3>
              <ul className="text-left text-green-100 text-sm space-y-2">
                <li className="flex items-center gap-2"><span>🏃</span> 左右滑动移动</li>
                <li className="flex items-center gap-2"><span>⬆️</span> 上滑/空格跳跃</li>
                <li className="flex items-center gap-2"><span>🧱</span> 顶砖块掉落奖励</li>
                <li className="flex items-center gap-2"><span>🍎</span> 水果 +15分</li>
                <li className="flex items-center gap-2"><span>🪙</span> 金币 +8分</li>
                <li className="flex items-center gap-2"><span>⭐</span> 星星 +30分</li>
                <li className="flex items-center gap-2"><span>❤️</span> 爱心 +1生命</li>
                <li className="flex items-center gap-2"><span>🍄</span> 蘑菇=5秒无敌</li>
                <li className="flex items-center gap-2"><span>🍔</span> 垃圾食品=减命</li>
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
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 text-center shadow-2xl max-w-sm mx-4 border-2 border-yellow-500">
            <div className="text-6xl mb-4">⏸️</div>
            <h2 className="text-2xl font-bold text-white mb-6">游戏暂停</h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setGameState('playing')}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" /> 继续游戏
              </button>
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> 重新开始
              </button>
            </div>
          </div>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-red-700 via-red-800 to-red-900 rounded-3xl p-8 text-center shadow-2xl max-w-sm mx-4 border-4 border-yellow-400">
            <div className="text-6xl mb-4">💥</div>
            <h2 className="text-2xl font-bold text-white mb-2">游戏结束！</h2>
            <div className="text-4xl font-bold text-yellow-400 mb-2">{score} 分</div>
            <div className="text-xl text-amber-300 mb-4">🪙 {coins} 金币</div>
            
            {!isKnowledgeLearned && reviveKnowledge && (
              <div className="bg-purple-900/50 rounded-2xl p-4 mb-6 border border-purple-400">
                <h3 className="font-bold text-white mb-3 flex items-center justify-center gap-2">
                  <Star className="w-5 h-5 text-purple-400" /> 学习知识复活
                </h3>
                <p className="text-sm text-gray-300 whitespace-pre-line">{reviveKnowledge.content}</p>
                <button
                  onClick={learnAndRevive}
                  className="w-full mt-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-2 rounded-full hover:scale-105 transition-transform"
                >
                  我学会了 ✅
                </button>
              </div>
            )}

            {isKnowledgeLearned && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={revive}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform"
                >
                  ✅ 复活继续
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="bg-gray-700 text-gray-200 font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform"
                >
                  返回首页
                </button>
              </div>
            )}

            {!isKnowledgeLearned && !reviveKnowledge && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={startGame}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform"
                >
                  再玩一次
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="bg-gray-700 text-gray-200 font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform"
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