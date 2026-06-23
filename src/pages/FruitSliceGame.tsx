import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { ArrowLeft, Pause, Play, RotateCcw, BookOpen, CheckCircle } from 'lucide-react';
import { knowledgeCards } from '@/data/questions';

const FRUIT_EMOJIS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒', '🥝', '🍌', '🍉', '🍍', '🥭', '🍐', '🍏'];
const BACTERIA_EMOJIS = ['🦠', '🤢', '💀'];

interface FruitItem {
  id: number;
  x: number;
  y: number;
  emoji: string;
  type: 'fruit' | 'bacteria';
}

export default function FruitSliceGame() {
  const navigate = useNavigate();
  const { addScore, addBadge, addKnowledgeCard } = useGameStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [fruits, setFruits] = useState<FruitItem[]>([]);
  const [reviveKnowledge, setReviveKnowledge] = useState<any>(null);
  const [isKnowledgeLearned, setIsKnowledgeLearned] = useState(false);
  const [slicedIds, setSlicedIds] = useState<Set<number>>(new Set());
  
  const animationRef = useRef<number>(0);
  const fruitIdRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const gameStateRef = useRef(gameState);
  const fruitsRef = useRef<FruitItem[]>([]);
  const velocitiesRef = useRef<Map<number, { vx: number; vy: number; rotation: number; rotationSpeed: number }>>(new Map());
  const containerHeightRef = useRef(0);
  const containerWidthRef = useRef(0);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const getRandomKnowledge = () => knowledgeCards[Math.floor(Math.random() * knowledgeCards.length)];

  const spawnFruit = useCallback(() => {
    const isBacteria = Math.random() < 0.15;
    const emojiArr = isBacteria ? BACTERIA_EMOJIS : FRUIT_EMOJIS;
    const emoji = emojiArr[Math.floor(Math.random() * emojiArr.length)];
    const side = Math.random() < 0.5 ? -1 : 1;
    const id = fruitIdRef.current++;
    const x = containerWidthRef.current * 0.2 + Math.random() * containerWidthRef.current * 0.6;
    const vy = -(Math.random() * 4 + 10);
    
    fruitsRef.current = [...fruitsRef.current, {
      id,
      x,
      y: containerHeightRef.current + 60,
      emoji,
      type: isBacteria ? 'bacteria' : 'fruit',
    }];
    
    velocitiesRef.current.set(id, {
      vx: (Math.random() - 0.5) * 5 * side,
      vy,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
    });
    
    setFruits([...fruitsRef.current]);
  }, []);

  const gameLoop = useCallback((timestamp: number) => {
    if (gameStateRef.current !== 'playing') return;

    if (timestamp - lastSpawnRef.current > 800) {
      spawnFruit();
      lastSpawnRef.current = timestamp;
    }

    const newFruits: FruitItem[] = [];
    fruitsRef.current.forEach((fruit) => {
      const vel = velocitiesRef.current.get(fruit.id);
      if (!vel) return;
      
      const newVy = vel.vy + 0.25;
      const newX = fruit.x + vel.vx;
      const newY = fruit.y + newVy;
      const newRotation = vel.rotation + vel.rotationSpeed;
      
      if (newY < containerHeightRef.current + 100 && newY > -100) {
        newFruits.push({ ...fruit, x: newX, y: newY });
        velocitiesRef.current.set(fruit.id, { ...vel, vy: newVy, rotation: newRotation });
      } else {
        velocitiesRef.current.delete(fruit.id);
      }
    });
    
    fruitsRef.current = newFruits;
    setFruits([...newFruits]);

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [spawnFruit]);

  useEffect(() => {
    if (gameState !== 'playing') {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    containerWidthRef.current = rect.width;
    containerHeightRef.current = rect.height;

    lastSpawnRef.current = 0;
    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, gameLoop]);

  const handleSlice = (e: React.MouseEvent | React.TouchEvent, fruitId: number) => {
    e.stopPropagation();
    if (gameStateRef.current !== 'playing') return;
    if (slicedIds.has(fruitId)) return;

    const fruit = fruitsRef.current.find(f => f.id === fruitId);
    if (!fruit) return;

    setSlicedIds(prev => new Set([...prev, fruitId]));

    if (fruit.type === 'bacteria') {
      setReviveKnowledge(getRandomKnowledge());
      setIsKnowledgeLearned(false);
      gameStateRef.current = 'gameover';
      setGameState('gameover');
    } else {
      setScore(prev => prev + 10);
    }

    setTimeout(() => {
      fruitsRef.current = fruitsRef.current.filter(f => f.id !== fruitId);
      velocitiesRef.current.delete(fruitId);
      setFruits([...fruitsRef.current]);
    }, 300);
  };

  const handleGameOver = () => {
    addScore(score);
    if (score >= 100) addBadge({ id: 'fruit-master', name: '切水果大师', icon: '🍎' });
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
    fruitsRef.current = [];
    velocitiesRef.current.clear();
    fruitIdRef.current = 0;
    lastSpawnRef.current = 0;
    setSlicedIds(new Set());
    setFruits([]);
    setGameState('playing');
  };

  const startGame = () => {
    fruitsRef.current = [];
    velocitiesRef.current.clear();
    fruitIdRef.current = 0;
    lastSpawnRef.current = 0;
    setSlicedIds(new Set());
    setFruits([]);
    setScore(0);
    setGameState('playing');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 via-emerald-200 to-orange-100">
      <header className="bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-6 py-2 rounded-full font-bold text-xl shadow-lg">
            {score} 分
          </div>
          {gameState === 'playing' && (
            <button onClick={() => setGameState('paused')} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
              <Pause className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>
      </header>

      <div 
        ref={containerRef} 
        className="relative w-full h-[calc(100vh-120px)] touch-none overflow-hidden bg-gradient-to-b from-sky-300 via-green-200 to-amber-100"
      >
        <div className="absolute top-10 left-10 text-6xl opacity-30">☁️</div>
        <div className="absolute top-20 right-20 text-5xl opacity-25">☁️</div>
        <div className="absolute top-5 left-1/3 text-4xl opacity-20">☁️</div>

        {fruits.map((fruit) => (
          <div
            key={fruit.id}
            className={`absolute select-none cursor-pointer transition-transform ${
              slicedIds.has(fruit.id) ? 'scale-150 opacity-0' : 'hover:scale-110'
            }`}
            style={{
              left: fruit.x,
              top: fruit.y,
              transform: 'translate(-50%, -50%)',
              fontSize: '56px',
              transition: slicedIds.has(fruit.id) ? 'all 0.3s ease-out' : 'transform 0.1s',
              filter: fruit.type === 'bacteria' 
                ? 'drop-shadow(0 0 12px rgba(255, 68, 68, 0.8))' 
                : 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))',
            }}
            onMouseEnter={(e) => handleSlice(e, fruit.id)}
            onMouseDown={(e) => handleSlice(e, fruit.id)}
            onTouchStart={(e) => handleSlice(e, fruit.id)}
            onTouchMove={(e) => {
              const touch = e.touches[0];
              const target = document.elementFromPoint(touch.clientX, touch.clientY);
              if (target && (target as HTMLElement).dataset?.fruitId) {
                handleSlice(e, parseInt((target as HTMLElement).dataset.fruitId));
              }
            }}
            data-fruit-id={fruit.id}
          >
            {fruit.emoji}
          </div>
        ))}

        {gameState === 'menu' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm mx-4">
              <div className="text-7xl mb-4">🍎</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">切水果大战细菌</h2>
              <div className="text-left bg-gray-50 rounded-2xl p-4 mb-6">
                <p className="text-gray-700 mb-2">🎮 游戏规则：</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✓ 切水果获得 +10 分</li>
                  <li>✗ 碰到细菌游戏结束</li>
                  <li>💡 学习知识可以复活</li>
                </ul>
              </div>
              <button 
                onClick={startGame} 
                className="bg-gradient-to-r from-red-400 to-orange-400 text-white font-bold py-4 px-10 rounded-full shadow-lg hover:scale-105 transition-transform text-lg"
              >
                开始游戏
              </button>
            </div>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm mx-4">
              <div className="text-7xl mb-4">⏸️</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">游戏暂停</h2>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setGameState('playing')} 
                  className="bg-gradient-to-r from-green-400 to-teal-400 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
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
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm mx-4">
              <div className="text-7xl mb-4">💥</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">游戏结束！</h2>
              <div className="text-4xl font-bold text-orange-500 mb-6">{score} 分</div>
              
              {!isKnowledgeLearned && reviveKnowledge && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-5 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-6 h-6 text-purple-500" />
                    <h3 className="font-bold text-gray-800">学习知识复活</h3>
                  </div>
                  <div className="bg-white rounded-xl p-4 mb-4">
                    <h4 className="font-bold text-gray-800 mb-2">{reviveKnowledge.title}</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-line">{reviveKnowledge.content}</p>
                  </div>
                  <button 
                    onClick={learnAndRevive} 
                    className="w-full bg-gradient-to-r from-purple-400 to-pink-400 text-white font-bold py-3 rounded-full shadow-lg hover:scale-105 transition-transform"
                  >
                    我学会了 ✅
                  </button>
                </div>
              )}

              {isKnowledgeLearned && (
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={revive} 
                    className="bg-gradient-to-r from-green-400 to-teal-400 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" /> 复活继续
                  </button>
                  <button 
                    onClick={() => { handleGameOver(); navigate('/'); }} 
                    className="bg-gray-100 text-gray-700 font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transition-transform"
                  >
                    返回首页
                  </button>
                </div>
              )}

              {!reviveKnowledge && (
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={startGame} 
                    className="bg-gradient-to-r from-red-400 to-orange-400 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transition-transform"
                  >
                    再玩一次
                  </button>
                  <button 
                    onClick={() => { handleGameOver(); navigate('/'); }} 
                    className="bg-gray-100 text-gray-700 font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transition-transform"
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
