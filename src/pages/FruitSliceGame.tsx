import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { ArrowLeft, Pause, Play, RotateCcw } from 'lucide-react';

interface Fruit {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  emoji: string;
  type: 'fruit' | 'bacteria';
  rotation: number;
  rotationSpeed: number;
}

interface SlicedFruit {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  emoji: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

interface SliceTrail {
  points: { x: number; y: number }[];
  opacity: number;
}

export default function FruitSliceGame() {
  const navigate = useNavigate();
  const { addScore, addBadge, addKnowledgeCard } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [slicedFruits, setSlicedFruits] = useState<SlicedFruit[]>([]);
  const [sliceTrail, setSliceTrail] = useState<SliceTrail>({ points: [], opacity: 1 });
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [knowledge, setKnowledge] = useState({ title: '', content: '' });
  const lastSpawnRef = useRef(0);
  const fruitIdRef = useRef(0);

  const fruitEmojis = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒', '🥝'];
  const bacteriaEmojis = ['🦠', '🤢'];

  const knowledgeTips = [
    {
      title: '七步洗手法',
      content: '掌心相对搓一搓\n手心手背搓一搓\n手指交叉搓一搓\n握成拳头搓一搓\n拇指转转搓一搓\n指尖手心搓一搓\n手腕手腕搓一搓',
    },
    {
      title: '细菌无处不在',
      content: '细菌很小很小，我们看不见它们。但是它们喜欢藏在我们的手上、玩具上、门把手上。所以一定要勤洗手哦！',
    },
    {
      title: '健康饮食',
      content: '多吃水果蔬菜可以帮助我们增强抵抗力，让身体更加强壮，不容易被细菌和病毒打败！',
    },
  ];

  const createFruit = useCallback((canvasWidth: number, canvasHeight: number): Fruit => {
    const isBacteria = Math.random() < 0.15;
    const emoji = isBacteria
      ? bacteriaEmojis[Math.floor(Math.random() * bacteriaEmojis.length)]
      : fruitEmojis[Math.floor(Math.random() * fruitEmojis.length)];
    
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = Math.random() * (canvasWidth * 0.6) + canvasWidth * 0.2;
    
    return {
      id: fruitIdRef.current++,
      x,
      y: canvasHeight + 50,
      vx: (Math.random() - 0.5) * 8 * side,
      vy: -(Math.random() * 6 + 14),
      radius: 40,
      emoji,
      type: isBacteria ? 'bacteria' : 'fruit',
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
    };
  }, []);

  const sliceFruit = useCallback((fruit: Fruit, slicedFruits: SlicedFruit[]) => {
    if (fruit.type === 'bacteria') {
      return {
        newSliced: [...slicedFruits],
        scoreChange: -10,
        isBacteria: true,
      };
    }

    const newSliced: SlicedFruit[] = [
      {
        id: fruit.id,
        x: fruit.x,
        y: fruit.y,
        vx: fruit.vx - 4,
        vy: fruit.vy - 2,
        emoji: fruit.emoji,
        rotation: fruit.rotation,
        rotationSpeed: -0.2,
        opacity: 1,
      },
      {
        id: fruit.id + 1000,
        x: fruit.x,
        y: fruit.y,
        vx: fruit.vx + 4,
        vy: fruit.vy - 2,
        emoji: fruit.emoji,
        rotation: fruit.rotation,
        rotationSpeed: 0.2,
        opacity: 1,
      },
    ];

    const knowledgeTip = knowledgeTips[Math.floor(Math.random() * knowledgeTips.length)];
    
    setTimeout(() => {
      setKnowledge(knowledgeTip);
      setShowKnowledge(true);
      setTimeout(() => setShowKnowledge(false), 3000);
    }, 500);

    return {
      newSliced: [...slicedFruits, ...newSliced],
      scoreChange: 10,
      isBacteria: false,
    };
  }, []);

  const checkSlice = useCallback((x: number, y: number) => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = x * scaleX;
    const canvasY = y * scaleY;

    let newFruits = [...fruits];
    let newSliced = [...slicedFruits];
    let scoreChange = 0;
    let lifeChange = 0;

    newFruits.forEach((fruit) => {
      const dx = canvasX - fruit.x;
      const dy = canvasY - fruit.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < fruit.radius + 20) {
        const result = sliceFruit(fruit, newSliced);
        newSliced = result.newSliced;
        scoreChange += result.scoreChange;
        if (result.isBacteria) {
          lifeChange -= 1;
        }
      }
    });

    newFruits = newFruits.filter((f) => f.id !== undefined && !newSliced.some((s) => s.id === f.id));

    setFruits(newFruits);
    setSlicedFruits(newSliced);
    setScore((prev) => Math.max(0, prev + scoreChange));
    setLives((prev) => {
      const newLives = prev + lifeChange;
      if (newLives <= 0) {
        setGameState('gameover');
        handleGameOver();
      }
      return Math.max(0, newLives);
    });
  }, [gameState, fruits, slicedFruits, sliceFruit]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState !== 'playing') return;
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSliceTrail({ points: [{ x: touch.clientX - rect.left, y: touch.clientY - rect.top }], opacity: 1 });
    checkSlice(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (gameState !== 'playing') return;
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    setSliceTrail((prev) => ({
      points: [...prev.points.slice(-20), { x, y }],
      opacity: 1,
    }));
    checkSlice(x, y);
  };

  const handleTouchEnd = () => {
    setSliceTrail((prev) => ({ ...prev, opacity: 0 }));
  };

  const handleGameOver = () => {
    addScore(score);
    if (score >= 100) {
      addBadge({
        id: 'fruit-master',
        name: '切水果大师',
        icon: '🍎',
      });
    }
    if (score >= 50) {
      addKnowledgeCard({
        id: 'fruit-k1',
        title: '水果的益处',
        content: '水果富含维生素和矿物质，可以帮助我们增强免疫力，抵抗疾病！',
        unlockedAt: new Date().toISOString(),
      });
    }
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLives(3);
    setFruits([]);
    setSlicedFruits([]);
    fruitIdRef.current = 0;
    lastSpawnRef.current = 0;
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = 0;

    const gameLoop = (timestamp: number) => {
      if (gameState !== 'playing') return;

      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (timestamp - lastSpawnRef.current > 800) {
        setFruits((prev) => [...prev, createFruit(canvas.width, canvas.height)]);
        lastSpawnRef.current = timestamp;
      }

      setFruits((prev) =>
        prev
          .map((fruit) => ({
            ...fruit,
            x: fruit.x + fruit.vx,
            y: fruit.y + fruit.vy,
            vy: fruit.vy + 0.3,
            rotation: fruit.rotation + fruit.rotationSpeed,
          }))
          .filter((fruit) => fruit.y < canvas.height + 100)
      );

      setSlicedFruits((prev) =>
        prev
          .map((fruit) => ({
            ...fruit,
            x: fruit.x + fruit.vx,
            y: fruit.y + fruit.vy,
            vy: fruit.vy + 0.5,
            rotation: fruit.rotation + fruit.rotationSpeed,
            opacity: fruit.opacity - 0.015,
          }))
          .filter((fruit) => fruit.opacity > 0)
      );

      setSliceTrail((prev) => ({ ...prev, opacity: prev.opacity * 0.95 }));

      ctx.fillStyle = '#f0f9ff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      fruits.forEach((fruit) => {
        ctx.save();
        ctx.translate(fruit.x, fruit.y);
        ctx.rotate(fruit.rotation);
        ctx.font = `${fruit.radius * 1.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fruit.emoji, 0, 0);
        ctx.restore();
      });

      slicedFruits.forEach((fruit) => {
        ctx.save();
        ctx.globalAlpha = fruit.opacity;
        ctx.translate(fruit.x, fruit.y);
        ctx.rotate(fruit.rotation);
        ctx.font = `${50}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fruit.emoji, 0, 0);
        ctx.restore();
      });

      if (sliceTrail.points.length > 1 && sliceTrail.opacity > 0.1) {
        ctx.beginPath();
        ctx.moveTo(sliceTrail.points[0].x, sliceTrail.points[0].y);
        sliceTrail.points.forEach((point, i) => {
          if (i > 0) ctx.lineTo(point.x, point.y);
        });
        ctx.strokeStyle = `rgba(255, 255, 255, ${sliceTrail.opacity})`;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, createFruit, fruits, slicedFruits, sliceTrail]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50">
      <header className="bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={`text-xl ${i < lives ? '' : 'opacity-30'}`}>❤️</span>
              ))}
            </div>
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-1 rounded-full font-bold">
              {score} 分
            </div>
          </div>
          {gameState === 'playing' && (
            <button
              onClick={() => setGameState('paused')}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <Pause className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>
      </header>

      <div ref={containerRef} className="relative w-full h-[calc(100vh-120px)] touch-none">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-full"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={(e) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
              checkSlice(e.clientX - rect.left, e.clientY - rect.top);
              setSliceTrail({ points: [{ x: e.clientX - rect.left, y: e.clientY - rect.top }], opacity: 1 });
            }
          }}
          onMouseMove={(e) => {
            if (e.buttons === 1 && gameState === 'playing') {
              const rect = containerRef.current?.getBoundingClientRect();
              if (rect) {
                checkSlice(e.clientX - rect.left, e.clientY - rect.top);
                setSliceTrail((prev) => ({
                  points: [...prev.points.slice(-20), { x: e.clientX - rect.left, y: e.clientY - rect.top }],
                  opacity: 1,
                }));
              }
            }
          }}
          onMouseUp={handleTouchEnd}
        />

        {showKnowledge && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-2xl max-w-xs animate-bounce">
            <div className="text-4xl mb-3 text-center">💡</div>
            <h3 className="font-bold text-lg text-gray-800 mb-2 text-center">{knowledge.title}</h3>
            <p className="text-gray-600 text-sm whitespace-pre-line">{knowledge.content}</p>
          </div>
        )}

        {gameState === 'menu' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm mx-4">
              <div className="text-6xl mb-4">🍎</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">切水果大战细菌</h2>
              <p className="text-gray-600 mb-4">滑动屏幕切割水果获得分数<br />注意躲避细菌！</p>
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-red-400 to-orange-400 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transition-transform"
              >
                开始游戏
              </button>
            </div>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm mx-4">
              <div className="text-6xl mb-4">⏸️</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">游戏暂停</h2>
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
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm mx-4">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">游戏结束！</h2>
              <p className="text-4xl font-bold text-orange-500 mb-4">{score} 分</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={startGame}
                  className="bg-gradient-to-r from-red-400 to-orange-400 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transition-transform"
                >
                  再玩一次
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="bg-gray-100 text-gray-700 font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transition-transform"
                >
                  返回首页
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
