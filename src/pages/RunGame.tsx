import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore, KnowledgeCard } from '@/stores/gameStore';
import { ArrowLeft, Pause, Play, RotateCcw, BookOpen, CheckCircle } from 'lucide-react';
import { knowledgeCards } from '@/data/questions';

interface GameObject {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
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

export default function RunGame() {
  const navigate = useNavigate();
  const { addScore, addBadge, addKnowledgeCard } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const touchStartRef = useRef({ x: 0, y: 0 });
  
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [playerX, setPlayerX] = useState(1); // 0, 1, 2 三条道
  const [playerY, setPlayerY] = useState(0); // 跳跃时的Y偏移
  const [isJumping, setIsJumping] = useState(false);
  const [objects, setObjects] = useState<GameObject[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [speed, setSpeed] = useState(8);
  const [reviveKnowledge, setReviveKnowledge] = useState<Omit<KnowledgeCard, 'unlockedAt'> | null>(null);
  const [isKnowledgeLearned, setIsKnowledgeLearned] = useState(false);
  
  const objectIdRef = useRef(0);
  const floatingTextIdRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const laneWidth = 120;
  const canvasHeight = 800;
  const canvasWidth = 400;

  const fruits = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒', '🥝', '🍌', '🍉', '🍍', '🥭'];
  const junkFood = ['🍺', '🍻', '🚬', '🌶️', '🍗', '🍟', '🍔', '🍕'];

  const getRandomKnowledge = (): Omit<KnowledgeCard, 'unlockedAt'> => {
    const card = knowledgeCards[Math.floor(Math.random() * knowledgeCards.length)];
    return {
      id: card.id,
      title: card.title,
      content: card.content
    };
  };

  const spawnObject = useCallback(() => {
    const lane = Math.floor(Math.random() * 3);
    const isFruit = Math.random() < 0.5;
    
    let emoji, type;
    if (isFruit) {
      emoji = fruits[Math.floor(Math.random() * fruits.length)];
      type = 'fruit';
    } else {
      emoji = junkFood[Math.floor(Math.random() * junkFood.length)];
      type = 'obstacle';
    }

    return {
      id: objectIdRef.current++,
      x: lane * laneWidth + 20,
      y: -100,
      width: 70,
      height: 70,
      type,
      emoji
    };
  }, []);

  const createParticles = (x: number, y: number, emoji: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 5; i++) {
      newParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        emoji
      });
    }
    return newParticles;
  };

  const createFloatingText = (x: number, y: number, text: string) => {
    return {
      id: floatingTextIdRef.current++,
      x,
      y,
      text,
      life: 1,
      vy: -2.5
    };
  };

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
      if (dx > 50) {
        setPlayerX(prev => Math.min(2, prev + 1));
      } else if (dx < -50) {
        setPlayerX(prev => Math.max(0, prev - 1));
      }
    } else {
      if (dy < -50 && !isJumping) {
        setIsJumping(true);
        let jumpHeight = 0;
        const jumpUp = setInterval(() => {
          jumpHeight += 12;
          setPlayerY(jumpHeight);
          if (jumpHeight >= 120) {
            clearInterval(jumpUp);
            const jumpDown = setInterval(() => {
              jumpHeight -= 12;
              setPlayerY(Math.max(0, jumpHeight));
              if (jumpHeight <= 0) {
                clearInterval(jumpDown);
                setIsJumping(false);
              }
            }, 18);
          }
        }, 18);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      
      if (e.key === 'ArrowLeft') {
        setPlayerX(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setPlayerX(prev => Math.min(2, prev + 1));
      } else if ((e.key === 'ArrowUp' || e.key === ' ') && !isJumping) {
        setIsJumping(true);
        let jumpHeight = 0;
        const jumpUp = setInterval(() => {
          jumpHeight += 12;
          setPlayerY(jumpHeight);
          if (jumpHeight >= 120) {
            clearInterval(jumpUp);
            const jumpDown = setInterval(() => {
              jumpHeight -= 12;
              setPlayerY(Math.max(0, jumpHeight));
              if (jumpHeight <= 0) {
                clearInterval(jumpDown);
                setIsJumping(false);
              }
            }, 18);
          }
        }, 18);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isJumping]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let bgOffset = 0;
    let bgOffset2 = 0;
    let bgOffset3 = 0;
    let bgOffset4 = 0;
    let bgOffset5 = 0;

    const gameLoop = (timestamp: number) => {
      if (gameState !== 'playing') return;

      bgOffset = (bgOffset + speed * 0.5) % 200;
      bgOffset2 = (bgOffset2 + speed * 0.3) % 150;
      bgOffset3 = (bgOffset3 + speed * 0.2) % 300;
      bgOffset4 = (bgOffset4 + speed * 0.4) % 180;
      bgOffset5 = (bgOffset5 + speed * 0.6) % 120;

      const tunnelGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      tunnelGradient.addColorStop(0, '#1a1a2e');
      tunnelGradient.addColorStop(0.5, '#16213e');
      tunnelGradient.addColorStop(1, '#0f3460');
      ctx.fillStyle = tunnelGradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      ctx.fillStyle = '#fff';
      for (let i = 0; i < 30; i++) {
        const seed = i * 137.508;
        const x = (seed * 3) % canvasWidth;
        const y = (seed * 2) % (canvasHeight * 0.4);
        const size = 1 + (seed % 2);
        const twinkle = Math.sin(timestamp * 0.005 + i) * 0.5 + 0.5;
        ctx.globalAlpha = 0.3 + twinkle * 0.7;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = '#f5f6fa';
      ctx.beginPath();
      ctx.arc(320, 80, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a1a2e';
      ctx.beginPath();
      ctx.arc(335, 75, 35, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      for (let i = 0; i < 5; i++) {
        const cloudX = ((i * 150 + bgOffset2 * 2 + timestamp * 0.02) % (canvasWidth + 200)) - 100;
        const cloudY = 100 + i * 40;
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, 30, 0, Math.PI * 2);
        ctx.arc(cloudX + 25, cloudY - 10, 25, 0, Math.PI * 2);
        ctx.arc(cloudX + 50, cloudY, 28, 0, Math.PI * 2);
        ctx.arc(cloudX + 25, cloudY + 10, 22, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.font = '20px Arial';
      for (let i = 0; i < 4; i++) {
        const birdX = ((i * 120 + bgOffset3 * 1.5 + timestamp * 0.05) % (canvasWidth + 100)) - 50;
        const birdY = 150 + Math.sin(i * 2) * 30 + Math.sin(timestamp * 0.003 + i) * 10;
        const wingOffset = Math.sin(timestamp * 0.02 + i) * 5;
        ctx.fillText('𓅰', birdX, birdY + wingOffset);
        ctx.fillText('𓅰', birdX + 40, birdY - wingOffset);
      }

      ctx.fillStyle = '#1e3a5f';
      for (let i = -2; i < 15; i++) {
        const x = (i * 60 + bgOffset3) % (canvasWidth + 120) - 60;
        const height = 100 + Math.sin(i * 1.5) * 50;
        ctx.fillRect(x, canvasHeight - 200 - height, 40, height);
      }

      ctx.fillStyle = '#253b5c';
      for (let i = -2; i < 12; i++) {
        const x = (i * 80 + bgOffset4) % (canvasWidth + 160) - 80;
        const height = 80 + Math.cos(i * 2) * 40;
        ctx.fillRect(x, canvasHeight - 200 - height, 60, height);
        ctx.fillStyle = '#f1c40f';
        for (let wy = canvasHeight - 200 - height + 10; wy < canvasHeight - 210; wy += 20) {
          for (let wx = x + 10; wx < x + 50; wx += 15) {
            if (Math.random() > 0.3) {
              ctx.fillRect(wx, wy, 8, 12);
            }
          }
        }
        ctx.fillStyle = '#253b5c';
      }

      for (let i = -2; i < 8; i++) {
        const y = (i * 150 + bgOffset5) % (canvasHeight + 150) - 75;
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(25, y, 4, 100);
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(27, y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(243, 156, 18, 0.1)';
        ctx.beginPath();
        ctx.arc(27, y, 30, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(canvasWidth - 29, y, 4, 100);
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(canvasWidth - 27, y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(243, 156, 18, 0.1)';
        ctx.beginPath();
        ctx.arc(canvasWidth - 27, y, 30, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.font = '40px Arial';
      for (let i = -2; i < 10; i++) {
        const y = (i * 200 + bgOffset4 * 0.7) % (canvasHeight + 200) - 100;
        ctx.fillText('🌳', 40, y);
        ctx.fillText('🌳', canvasWidth - 60, y);
      }

      ctx.fillStyle = '#2d3436';
      ctx.fillRect(0, 0, 20, canvasHeight);
      ctx.fillRect(canvasWidth - 20, 0, 20, canvasHeight);

      ctx.strokeStyle = '#636e72';
      ctx.lineWidth = 3;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * laneWidth + 10, 0);
        ctx.lineTo(i * laneWidth + 10, canvasHeight);
        ctx.stroke();
      }

      ctx.fillStyle = '#e74c3c';
      for (let i = -5; i < 30; i++) {
        const y = (i * 100 + bgOffset2) % (canvasHeight + 100) - 50;
        ctx.beginPath();
        ctx.arc(10, y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(canvasWidth - 10, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      const floorGradient = ctx.createLinearGradient(0, canvasHeight - 200, 0, canvasHeight);
      floorGradient.addColorStop(0, '#636e72');
      floorGradient.addColorStop(1, '#2d3436');
      ctx.fillStyle = floorGradient;
      ctx.fillRect(0, canvasHeight - 200, canvasWidth, 200);

      ctx.fillStyle = '#4a5568';
      for (let i = -2; i < 20; i++) {
        const y = canvasHeight - 200 + (i * 40 + bgOffset * 0.8) % 200;
        ctx.fillRect(0, y, canvasWidth, 5);
      }

      ctx.fillStyle = '#e67e22';
      for (let i = -2; i < 8; i++) {
        const y = canvasHeight - 30 + (i * 50 + bgOffset) % 200;
        for (let x = -10; x < canvasWidth; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 20, y);
          ctx.lineTo(x + 15, y + 10);
          ctx.lineTo(x - 5, y + 10);
          ctx.closePath();
          ctx.fill();
        }
      }

      ctx.fillStyle = '#7f8c8d';
      for (let i = 0; i < 50; i++) {
        const seed = i * 137.508;
        const x = (seed * 2.5 + bgOffset * 1.5) % canvasWidth;
        const y = canvasHeight - 180 + (seed * 1.3) % 160;
        const size = 2 + (seed % 3);
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#f1c40f';
      for (let i = -2; i < 20; i++) {
        const y = canvasHeight - 100 + (i * 60 + bgOffset * 0.6) % 200;
        ctx.fillRect(50, y, 40, 20);
        ctx.fillRect(310, y, 40, 20);
      }

      ctx.strokeStyle = '#444';
      ctx.lineWidth = 1;
      for (let i = -2; i < 20; i++) {
        const y = canvasHeight - 200 + (i * 30 + bgOffset) % 200;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
      }

      if (timestamp - lastSpawnRef.current > 700) {
        setObjects(prev => [...prev, spawnObject()]);
        lastSpawnRef.current = timestamp;
        
        if (speed < 20) {
          setSpeed(prev => prev + 0.15);
        }
      }

      const playerScreenX = playerX * laneWidth + 20;
      const playerScreenY = canvasHeight - 130 - playerY;

      let hitObstacle = false;
      let collectedFruits = 0;
      const collectedFruitPositions: {x: number, y: number}[] = [];

      setObjects(prev => {
        const newObjects = prev.map(obj => ({
          ...obj,
          y: obj.y + speed
        }));

        const remainingObjects: GameObject[] = [];
        
        newObjects.forEach(obj => {
          const dx = Math.abs(playerScreenX + 35 - (obj.x + 35));
          const dy = Math.abs(playerScreenY + 35 - (obj.y + 35));
          
          if (dx < 55 && dy < 55) {
            if (obj.type === 'fruit') {
              collectedFruits++;
              collectedFruitPositions.push({x: obj.x + 35, y: obj.y + 35});
              setParticles(p => [...p, ...createParticles(obj.x, obj.y, obj.emoji)]);
            } else {
              hitObstacle = true;
            }
          } else if (obj.y < canvasHeight + 100) {
            remainingObjects.push(obj);
          }
        });

        return remainingObjects;
      });

      if (collectedFruits > 0) {
        const newScore = score + collectedFruits * 10;
        setScore(newScore);
        collectedFruitPositions.forEach(pos => {
          setFloatingTexts(prev => [...prev, createFloatingText(pos.x, pos.y, '+10')]);
        });
      }

      if (hitObstacle) {
        setReviveKnowledge(getRandomKnowledge());
        setIsKnowledgeLearned(false);
        setGameState('gameover');
        return;
      }

      setParticles(prev => 
        prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life - 0.02
        })).filter(p => p.life > 0)
      );

      setFloatingTexts(prev =>
        prev.map(ft => ({
          ...ft,
          y: ft.y + ft.vy,
          life: ft.life - 0.015
        })).filter(ft => ft.life > 0)
      );

      objects.forEach(obj => {
        ctx.font = '55px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(obj.emoji, obj.x + 35, obj.y + 35);
      });

      particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.font = '25px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.emoji, p.x, p.y);
        ctx.globalAlpha = 1;
      });

      floatingTexts.forEach(ft => {
        ctx.globalAlpha = ft.life;
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1;
      });

      const playerBounce = Math.sin(timestamp * 0.01) * 2;
      ctx.font = '70px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏃', playerScreenX + 35, playerScreenY + 35 + playerBounce);

      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 20;
      ctx.fillText('✨', playerScreenX + 35, playerScreenY);
      ctx.shadowBlur = 0;

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, spawnObject, playerX, playerY, objects, particles, floatingTexts, speed, score]);

  const handleGameOver = () => {
    addScore(score);
    if (score >= 200) {
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
    setGameState('playing');
    setObjects([]);
    setParticles([]);
    setFloatingTexts([]);
    setSpeed(8);
    setPlayerX(1);
    setPlayerY(0);
    setIsJumping(false);
    objectIdRef.current = 0;
    lastSpawnRef.current = 0;
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setObjects([]);
    setParticles([]);
    setFloatingTexts([]);
    setSpeed(8);
    setPlayerX(1);
    setPlayerY(0);
    setIsJumping(false);
    objectIdRef.current = 0;
    lastSpawnRef.current = 0;
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800/90 backdrop-blur-sm shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="bg-gradient-to-r from-green-400 to-emerald-400 text-white px-6 py-2 rounded-full font-bold text-xl shadow-lg">
            {score} 分
          </div>
          {gameState === 'playing' && (
            <button
              onClick={() => setGameState('paused')}
              className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
            >
              <Pause className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </header>

      <div className="p-4">
        <p className="text-center text-gray-400 mb-2">👈👉 左右滑动换道 | ⬆️ 上滑/空格跳跃</p>
      </div>

      <div ref={containerRef} className="relative w-full h-[calc(100vh-180px)] flex justify-center items-center bg-gray-900">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="h-full max-w-full shadow-2xl rounded-2xl"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />

        {gameState === 'menu' && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-2xl">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 text-center shadow-2xl max-w-sm mx-4 border-2 border-cyan-500">
              <div className="text-7xl mb-4">🏃</div>
              <h2 className="text-2xl font-bold text-white mb-2">地铁跑酷大作战</h2>
              <div className="text-left bg-gray-700/50 rounded-2xl p-4 mb-6">
                <p className="text-cyan-400 mb-2 font-bold">🎮 游戏规则：</p>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li className="flex items-center gap-2">
                    <span>👈👉</span>
                    <span>左右滑动换道</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>⬆️</span>
                    <span>上滑/空格键跳跃</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>🍎</span>
                    <span>吃水果得 +10 分</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>🍔🚬</span>
                    <span>碰到垃圾食品游戏结束</span>
                  </li>
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

        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-2xl">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 text-center shadow-2xl max-w-sm mx-4 border-2 border-yellow-500">
              <div className="text-7xl mb-4">⏸️</div>
              <h2 className="text-2xl font-bold text-white mb-6">游戏暂停</h2>
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

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-2xl">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 text-center shadow-2xl max-w-sm mx-4 border-2 border-red-500">
              <div className="text-7xl mb-4">💥</div>
              <h2 className="text-2xl font-bold text-white mb-2">游戏结束！</h2>
              <div className="text-4xl font-bold text-green-400 mb-6">{score} 分</div>
              
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
  );
}
