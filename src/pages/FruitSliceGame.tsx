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
  vx: number;
  vy: number;
  emoji: string;
  type: 'fruit' | 'bacteria';
  rotation: number;
  rotationSpeed: number;
}

interface SlicedEffect {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  emoji: string;
  opacity: number;
  half: 'left' | 'right';
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  opacity: number;
}

export default function FruitSliceGame() {
  const navigate = useNavigate();
  const { addScore, addBadge, addKnowledgeCard } = useGameStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [fruits, setFruits] = useState<FruitItem[]>([]);
  const [slicedEffects, setSlicedEffects] = useState<SlicedEffect[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [reviveKnowledge, setReviveKnowledge] = useState<any>(null);
  const [isKnowledgeLearned, setIsKnowledgeLearned] = useState(false);
  const [showScorePopup, setShowScorePopup] = useState<{ x: number; y: number; value: number } | null>(null);
  
  const animationRef = useRef<number>(0);
  const fruitIdRef = useRef(0);
  const particleIdRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const gameStateRef = useRef(gameState);
  const fruitsRef = useRef<FruitItem[]>([]);
  const slicedRef = useRef<SlicedEffect[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const containerHeightRef = useRef(0);
  const containerWidthRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const playSliceSound = () => {
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.log('Audio not available');
    }
  };

  const playBacteriaSound = () => {
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(200, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.log('Audio not available');
    }
  };

  const playComboSound = (combo: number) => {
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const baseFreq = 400 + combo * 100;
      for (let i = 0; i < Math.min(combo, 3); i++) {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(baseFreq + i * 200, ctx.currentTime);
        
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        
        oscillator.start(ctx.currentTime + i * 0.05);
        oscillator.stop(ctx.currentTime + 0.2 + i * 0.05);
      }
    } catch (e) {
      console.log('Audio not available');
    }
  };

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
      vx: (Math.random() - 0.5) * 5 * side,
      vy,
      emoji,
      type: isBacteria ? 'bacteria' : 'fruit',
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
    }];
    
    setFruits([...fruitsRef.current]);
  }, []);

  const createParticles = (x: number, y: number, type: 'fruit' | 'bacteria') => {
    const colors = type === 'fruit' 
      ? ['#FF6B6B', '#FFE66D', '#4ECDC4', '#FF9F43', '#EE5A24']
      : ['#8B0000', '#FF0000', '#DC143C'];
    
    const newParticles: Particle[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
      const speed = 3 + Math.random() * 5;
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 6,
        opacity: 1,
      });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
    setParticles([...particlesRef.current]);
  };

  const createSlicedEffect = (fruit: FruitItem) => {
    const leftHalf: SlicedEffect = {
      id: fruit.id * 2,
      x: fruit.x - 20,
      y: fruit.y,
      vx: fruit.vx - 3,
      vy: fruit.vy - 2,
      rotation: fruit.rotation,
      rotationSpeed: -0.3,
      emoji: fruit.emoji,
      opacity: 1,
      half: 'left',
    };
    const rightHalf: SlicedEffect = {
      id: fruit.id * 2 + 1,
      x: fruit.x + 20,
      y: fruit.y,
      vx: fruit.vx + 3,
      vy: fruit.vy - 2,
      rotation: fruit.rotation,
      rotationSpeed: 0.3,
      emoji: fruit.emoji,
      opacity: 1,
      half: 'right',
    };
    slicedRef.current = [...slicedRef.current, leftHalf, rightHalf];
    setSlicedEffects([...slicedRef.current]);
  };

  const gameLoop = useCallback((timestamp: number) => {
    if (gameStateRef.current !== 'playing') return;

    if (timestamp - lastSpawnRef.current > 800) {
      spawnFruit();
      lastSpawnRef.current = timestamp;
    }

    fruitsRef.current = fruitsRef.current
      .map(fruit => ({
        ...fruit,
        x: fruit.x + fruit.vx,
        y: fruit.y + fruit.vy,
        vy: fruit.vy + 0.25,
        rotation: fruit.rotation + fruit.rotationSpeed,
      }))
      .filter(fruit => fruit.y < containerHeightRef.current + 100 && fruit.y > -100);
    setFruits([...fruitsRef.current]);

    slicedRef.current = slicedRef.current
      .map(effect => ({
        ...effect,
        x: effect.x + effect.vx,
        y: effect.y + effect.vy,
        vy: effect.vy + 0.4,
        rotation: effect.rotation + effect.rotationSpeed,
        opacity: effect.opacity - 0.02,
      }))
      .filter(effect => effect.opacity > 0 && effect.y < containerHeightRef.current + 200);
    slicedRef.current = slicedRef.current;
    setSlicedEffects([...slicedRef.current]);

    particlesRef.current = particlesRef.current
      .map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + 0.2,
        opacity: p.opacity - 0.03,
        size: p.size * 0.97,
      }))
      .filter(p => p.opacity > 0);
    particlesRef.current = particlesRef.current;
    setParticles([...particlesRef.current]);

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

  const handleSlice = (fruitId: number) => {
    if (gameStateRef.current !== 'playing') return;

    const fruit = fruitsRef.current.find(f => f.id === fruitId);
    if (!fruit) return;

    playSliceSound();
    createParticles(fruit.x, fruit.y, fruit.type);

    if (fruit.type === 'bacteria') {
      playBacteriaSound();
      setReviveKnowledge(getRandomKnowledge());
      setIsKnowledgeLearned(false);
      gameStateRef.current = 'gameover';
      setGameState('gameover');
      createParticles(fruit.x, fruit.y, 'bacteria');
    } else {
      createSlicedEffect(fruit);
      setScore(prev => prev + 10);
      setShowScorePopup({ x: fruit.x, y: fruit.y, value: 10 });
      setTimeout(() => setShowScorePopup(null), 500);
    }

    fruitsRef.current = fruitsRef.current.filter(f => f.id !== fruitId);
    setFruits([...fruitsRef.current]);
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
    slicedRef.current = [];
    particlesRef.current = [];
    fruitIdRef.current = 0;
    lastSpawnRef.current = 0;
    setFruits([]);
    setSlicedEffects([]);
    setParticles([]);
    setGameState('playing');
  };

  const startGame = () => {
    initAudio();
    fruitsRef.current = [];
    slicedRef.current = [];
    particlesRef.current = [];
    fruitIdRef.current = 0;
    lastSpawnRef.current = 0;
    setFruits([]);
    setSlicedEffects([]);
    setParticles([]);
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
        <div className="absolute top-10 left-10 text-6xl opacity-30 animate-bounce" style={{ animationDuration: '3s' }}>☁️</div>
        <div className="absolute top-20 right-20 text-5xl opacity-25 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>☁️</div>
        <div className="absolute top-5 left-1/3 text-4xl opacity-20 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>☁️</div>

        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              opacity: p.opacity,
              transform: 'translate(-50%, -50%)',
              boxShadow: `0 0 ${p.size}px ${p.color}`,
            }}
          />
        ))}

        {slicedEffects.map((effect) => (
          <div
            key={effect.id}
            className="absolute select-none pointer-events-none"
            style={{
              left: effect.x,
              top: effect.y,
              transform: `translate(-50%, -50%) rotate(${effect.rotation}rad) scaleX(${effect.half === 'left' ? -1 : 1})`,
              fontSize: '52px',
              opacity: effect.opacity,
              filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))',
              clipPath: effect.half === 'left' ? 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' : 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)',
            }}
          >
            {effect.emoji}
          </div>
        ))}

        {fruits.map((fruit) => (
          <div
            key={fruit.id}
            className="absolute select-none cursor-pointer"
            style={{
              left: fruit.x,
              top: fruit.y,
              transform: `translate(-50%, -50%) rotate(${fruit.rotation}rad)`,
              fontSize: '56px',
              filter: fruit.type === 'bacteria' 
                ? 'drop-shadow(0 0 15px rgba(255, 0, 0, 0.9))' 
                : 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.7))',
              transition: 'transform 0.05s',
            }}
            onClick={() => handleSlice(fruit.id)}
            onTouchStart={(e) => {
              e.preventDefault();
              handleSlice(fruit.id);
            }}
          >
            {fruit.emoji}
          </div>
        ))}

        {showScorePopup && (
          <div
            className="absolute pointer-events-none animate-bounce text-3xl font-bold text-green-500"
            style={{
              left: showScorePopup.x,
              top: showScorePopup.y - 30,
              transform: 'translate(-50%, -50%)',
              textShadow: '0 0 10px rgba(0, 255, 0, 0.5), 2px 2px 0 white',
            }}
          >
            +{showScorePopup.value}
          </div>
        )}

        {gameState === 'menu' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm mx-4">
              <div className="text-7xl mb-4">🍎</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">切水果大战细菌</h2>
              <div className="text-left bg-gray-50 rounded-2xl p-4 mb-6">
                <p className="text-gray-700 mb-2">🎮 游戏规则：</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✓ 点击水果获得 +10 分</li>
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
