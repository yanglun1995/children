import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { ArrowLeft, Pause, Play, RotateCcw, Star } from 'lucide-react';
import { knowledgeCards } from '@/data/questions';

interface GameObject {
  id: number;
  x: number;
  y: number;
  type: 'obstacle' | 'brick' | 'fruit' | 'coin' | 'mushroom';
  emoji: string;
  width: number;
  height: number;
  hit: boolean;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  life: number;
  vy: number;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 500;
const GROUND_Y = 420;
const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const GAME_SPEED_BASE = 5;

const fruits = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒', '🥝'];
const obstacles = ['🍔', '🍟', '🍕', '🚬', '🌶️', '🍻'];

export default function RunGame() {
  const navigate = useNavigate();
  const { addScore, addBadge } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const touchStartRef = useRef({ x: 0, y: 0 });
  
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [playerX, setPlayerX] = useState(80);
  const [playerY, setPlayerY] = useState(GROUND_Y);
  const [playerVy, setPlayerVy] = useState(0);
  const [playerDir, setPlayerDir] = useState(1);
  const [isJumping, setIsJumping] = useState(false);
  const [isInvincible, setIsInvincible] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(GAME_SPEED_BASE);
  
  const objectsRef = useRef<GameObject[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const objectIdRef = useRef(0);
  const floatingTextIdRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const invincibleTimerRef = useRef<NodeJS.Timeout>();

  const [reviveKnowledge, setReviveKnowledge] = useState<any>(null);
  const [isKnowledgeLearned, setIsKnowledgeLearned] = useState(false);

  const getRandomKnowledge = () => {
    return knowledgeCards[Math.floor(Math.random() * knowledgeCards.length)];
  };

  const spawnObject = useCallback((time: number) => {
    const rand = Math.random();
    let obj: GameObject;
    
    if (rand < 0.35) {
      obj = {
        id: objectIdRef.current++,
        x: CANVAS_WIDTH + 50,
        y: GROUND_Y - 40,
        type: 'obstacle',
        emoji: obstacles[Math.floor(Math.random() * obstacles.length)],
        width: 40,
        height: 40,
        hit: false,
      };
    } else if (rand < 0.55) {
      obj = {
        id: objectIdRef.current++,
        x: CANVAS_WIDTH + 50,
        y: GROUND_Y - 80,
        type: 'brick',
        emoji: '🧱',
        width: 40,
        height: 40,
        hit: false,
      };
    } else if (rand < 0.70) {
      obj = {
        id: objectIdRef.current++,
        x: CANVAS_WIDTH + 50,
        y: GROUND_Y - 120,
        type: 'coin',
        emoji: '🪙',
        width: 25,
        height: 25,
        hit: false,
      };
    } else if (rand < 0.80) {
      obj = {
        id: objectIdRef.current++,
        x: CANVAS_WIDTH + 50,
        y: GROUND_Y - 160,
        type: 'brick',
        emoji: '❓',
        width: 40,
        height: 40,
        hit: false,
      };
    } else if (rand < 0.85) {
      obj = {
        id: objectIdRef.current++,
        x: CANVAS_WIDTH + 50,
        y: GROUND_Y - 40,
        type: 'mushroom',
        emoji: '🍄',
        width: 35,
        height: 35,
        hit: false,
      };
    } else {
      obj = {
        id: objectIdRef.current++,
        x: CANVAS_WIDTH + 50,
        y: GROUND_Y - 60 - Math.random() * 100,
        type: 'fruit',
        emoji: fruits[Math.floor(Math.random() * fruits.length)],
        width: 35,
        height: 35,
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
    }
  }, [isJumping]);

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
        setPlayerX(prev => Math.min(CANVAS_WIDTH - 50, prev + 40));
        setPlayerDir(1);
      } else if (dx < -30) {
        setPlayerX(prev => Math.max(20, prev - 40));
        setPlayerDir(-1);
      }
    } else if (dy < -30) {
      handleJump();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      
      if (e.key === 'ArrowLeft') {
        setPlayerX(prev => Math.max(20, prev - 15));
        setPlayerDir(-1);
      } else if (e.key === 'ArrowRight') {
        setPlayerX(prev => Math.min(CANVAS_WIDTH - 50, prev + 15));
        setPlayerDir(1);
      } else if ((e.key === 'ArrowUp' || e.key === ' ') && !isJumping) {
        handleJump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isJumping, handleJump]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let bgOffset = 0;
    let cloudOffset = 0;

    const gameLoop = (timestamp: number) => {
      if (gameState !== 'playing') return;

      bgOffset = (bgOffset + gameSpeed * 0.3) % 200;
      cloudOffset = (cloudOffset + gameSpeed * 0.1) % 300;

      const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      skyGradient.addColorStop(0, '#87CEEB');
      skyGradient.addColorStop(0.6, '#E0F6FF');
      skyGradient.addColorStop(1, '#98D8C8');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 5; i++) {
        const cloudX = ((i * 150 + cloudOffset) % (CANVAS_WIDTH + 200)) - 100;
        const cloudY = 50 + i * 40;
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, 35, 0, Math.PI * 2);
        ctx.arc(cloudX + 30, cloudY - 15, 30, 0, Math.PI * 2);
        ctx.arc(cloudX + 60, cloudY, 35, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < 20; i++) {
        const hillX = ((i * 100 + bgOffset) % (CANVAS_WIDTH + 100)) - 50;
        ctx.fillStyle = '#7CB342';
        ctx.beginPath();
        ctx.moveTo(hillX, GROUND_Y);
        ctx.lineTo(hillX + 50, GROUND_Y - 60);
        ctx.lineTo(hillX + 100, GROUND_Y);
        ctx.fill();
      }

      const groundGradient = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_HEIGHT);
      groundGradient.addColorStop(0, '#8BC34A');
      groundGradient.addColorStop(1, '#689F38');
      ctx.fillStyle = groundGradient;
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

      ctx.fillStyle = '#689F38';
      for (let i = 0; i < 30; i++) {
        const x = ((i * 30 + bgOffset) % CANVAS_WIDTH);
        ctx.fillRect(x, GROUND_Y - 8, 20, 8);
      }

      ctx.fillStyle = '#4CAF50';
      for (let i = 0; i < 15; i++) {
        const x = ((i * 60 + bgOffset) % CANVAS_WIDTH);
        ctx.fillRect(x, GROUND_Y - 15, 30, 15);
      }

      if (timestamp - lastSpawnRef.current > 800) {
        objectsRef.current.push(spawnObject(timestamp));
        lastSpawnRef.current = timestamp;
        
        if (gameSpeed < 12) {
          setGameSpeed(prev => prev + 0.1);
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

        const px = playerX + 20;
        const py = playerY;
        const pw = 30;
        const ph = 45;

        const ox = obj.x;
        const oy = obj.y;
        const ow = obj.width;
        const oh = obj.height;

        if (px < ox + ow && px + pw > ox && py < oy + oh && py + ph > oy) {
          if (obj.type === 'obstacle') {
            if (!isInvincible) {
              hitObstacle = true;
            }
          } else if (obj.type === 'brick') {
            if (playerVy > 0 && py + ph - 10 < oy + oh / 2) {
              obj.hit = true;
              setPlayerVy(-8);
              setIsJumping(true);
              
              for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                  objectsRef.current.push({
                    id: objectIdRef.current++,
                    x: obj.x + 10 + i * 15,
                    y: obj.y,
                    type: 'fruit',
                    emoji: fruits[Math.floor(Math.random() * fruits.length)],
                    width: 25,
                    height: 25,
                    hit: false,
                  });
                }, i * 100);
              }
            }
          } else if (obj.type === 'fruit') {
            const newScore = score + 10;
            setScore(newScore);
            floatingTextsRef.current.push(createFloatingText(obj.x, obj.y, '+10'));
            return false;
          } else if (obj.type === 'coin') {
            setCoins(prev => prev + 1);
            setScore(prev => prev + 5);
            floatingTextsRef.current.push(createFloatingText(obj.x, obj.y, '+5'));
            return false;
          } else if (obj.type === 'mushroom') {
            setIsInvincible(true);
            floatingTextsRef.current.push(createFloatingText(obj.x, obj.y, '✨无敌'));
            if (invincibleTimerRef.current) clearTimeout(invincibleTimerRef.current);
            invincibleTimerRef.current = setTimeout(() => {
              setIsInvincible(false);
            }, 5000);
            return false;
          }
        }

        return obj.x > -100 && !obj.hit;
      });

      if (hitObstacle) {
        setReviveKnowledge(getRandomKnowledge());
        setIsKnowledgeLearned(false);
        setGameState('gameover');
        return;
      }

      floatingTextsRef.current = floatingTextsRef.current.filter(ft => {
        ft.y += ft.vy;
        ft.life -= 0.02;
        return ft.life > 0;
      });

      objectsRef.current.forEach(obj => {
        ctx.font = `${obj.type === 'brick' ? 35 : 30}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(obj.emoji, obj.x + obj.width / 2, obj.y + obj.height / 2);
        
        if (obj.type === 'brick' && !obj.hit) {
          ctx.strokeStyle = '#8D6E63';
          ctx.lineWidth = 2;
          ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        }
      });

      floatingTextsRef.current.forEach(ft => {
        ctx.globalAlpha = ft.life;
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1;
      });

      ctx.save();
      ctx.translate(playerX + 25, playerY + 22);
      ctx.scale(playerDir, 1);
      
      if (isInvincible) {
        ctx.globalAlpha = 0.5 + Math.sin(timestamp * 0.01) * 0.3;
      }
      
      ctx.font = '45px Arial';
      ctx.fillText('🧑‍🦱', 0, 0);
      
      if (isJumping) {
        ctx.font = '20px Arial';
        ctx.fillText('💨', -20, 5);
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
  }, [gameState, spawnObject, playerVy, score, isInvincible, gameSpeed, playerDir]);

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
    objectsRef.current = [];
    floatingTextsRef.current = [];
    objectIdRef.current = 0;
    lastSpawnRef.current = 0;
  };

  const startGame = () => {
    setScore(0);
    setCoins(0);
    setPlayerX(80);
    setPlayerY(GROUND_Y);
    setPlayerVy(0);
    setIsJumping(false);
    setIsInvincible(false);
    setGameSpeed(GAME_SPEED_BASE);
    objectsRef.current = [];
    floatingTextsRef.current = [];
    objectIdRef.current = 0;
    lastSpawnRef.current = 0;
    setGameState('playing');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-green-400">
      <header className="bg-black/40 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-4">
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
        <p className="text-center text-white/80 text-sm mb-2">👈👉 左右滑动 | ⬆️ 上滑/空格跳跃</p>
      </div>

      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-2xl shadow-2xl"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />
      </div>

      {gameState === 'menu' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl p-8 text-center shadow-2xl max-w-sm mx-4 border-4 border-yellow-400">
            <div className="text-8xl mb-4 animate-bounce">🍄</div>
            <h2 className="text-3xl font-bold text-white mb-2">超级健康马里奥</h2>
            <p className="text-green-200 mb-6">躲避垃圾食品，收集水果金币！</p>
            
            <div className="bg-black/30 rounded-2xl p-4 mb-6">
              <h3 className="text-lg font-bold text-yellow-300 mb-3">🎮 游戏规则</h3>
              <ul className="text-left text-green-100 text-sm space-y-2">
                <li>🏃 左右移动躲避障碍物</li>
                <li>⬆️ 跳跃躲避或顶砖块</li>
                <li>🧱 顶砖块掉落水果</li>
                <li>🍎 收集水果 +10分</li>
                <li>🪙 收集金币 +5分</li>
                <li>🍄 蘑菇可以无敌</li>
                <li>🍔 碰到垃圾食品游戏结束</li>
              </ul>
            </div>

            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xl font-bold py-4 rounded-2xl border-4 border-yellow-300 hover:scale-105 active:scale-95 transition-transform shadow-lg"
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
          <div className="bg-gradient-to-br from-red-700 to-red-900 rounded-3xl p-8 text-center shadow-2xl max-w-sm mx-4 border-4 border-yellow-400">
            <div className="text-6xl mb-4">💥</div>
            <h2 className="text-2xl font-bold text-white mb-2">游戏结束！</h2>
            <div className="text-4xl font-bold text-yellow-400 mb-4">{score} 分</div>
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