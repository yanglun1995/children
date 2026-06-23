import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { ArrowLeft, Pause, Play, RotateCcw, BookOpen, CheckCircle } from 'lucide-react';
import { knowledgeCards } from '@/data/questions';

interface Fruit {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  emoji: string;
  imageUrl: string;
  type: 'fruit' | 'bacteria';
  rotation: number;
  rotationSpeed: number;
  image: HTMLImageElement | null;
}

interface SlicedFruit {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  emoji: string;
  imageUrl: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  image: HTMLImageElement | null;
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
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover' | 'revive'>('menu');
  const [score, setScore] = useState(0);
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [slicedFruits, setSlicedFruits] = useState<SlicedFruit[]>([]);
  const [sliceTrail, setSliceTrail] = useState<SliceTrail>({ points: [], opacity: 1 });
  const [reviveKnowledge, setReviveKnowledge] = useState<any>(null);
  const [isKnowledgeLearned, setIsKnowledgeLearned] = useState(false);
  const lastSpawnRef = useRef(0);
  const fruitIdRef = useRef(0);

  const fruitEmojis = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒', '🥝', '🍌', '🍉'];
  const bacteriaEmojis = ['🦠', '🤢', '💀'];
  
  // 水果图片URL
  const fruitImages = [
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=red%20apple%20clipart%20cute%20flat%20illustration%20transparent%20background&image_size=square',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=orange%20citrus%20fruit%20clipart%20cute%20flat%20illustration%20transparent%20background&image_size=square',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=lemon%20yellow%20fruit%20clipart%20cute%20flat%20illustration%20transparent%20background&image_size=square',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=grapes%20purple%20fruit%20clipart%20cute%20flat%20illustration%20transparent%20background&image_size=square',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=strawberry%20red%20fruit%20clipart%20cute%20flat%20illustration%20transparent%20background&image_size=square',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=peach%20pink%20fruit%20clipart%20cute%20flat%20illustration%20transparent%20background&image_size=square',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cherry%20red%20fruit%20clipart%20cute%20flat%20illustration%20transparent%20background&image_size=square',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=kiwi%20green%20fruit%20clipart%20cute%20flat%20illustration%20transparent%20background&image_size=square',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=banana%20yellow%20fruit%20clipart%20cute%20flat%20illustration%20transparent%20background&image_size=square',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=watermelon%20green%20fruit%20clipart%20cute%20flat%20illustration%20transparent%20background&image_size=square',
  ];

  const getRandomKnowledge = () => {
    return knowledgeCards[Math.floor(Math.random() * knowledgeCards.length)];
  };

  const createFruit = useCallback((canvasWidth: number, canvasHeight: number): Fruit => {
    const isBacteria = Math.random() < 0.25;
    const emojiIndex = Math.floor(Math.random() * fruitEmojis.length);
    const emoji = isBacteria
      ? bacteriaEmojis[Math.floor(Math.random() * bacteriaEmojis.length)]
      : fruitEmojis[emojiIndex];
    const imageUrl = isBacteria ? '' : fruitImages[emojiIndex];
    
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = Math.random() * (canvasWidth * 0.6) + canvasWidth * 0.2;
    
    const newFruit: Fruit = {
      id: fruitIdRef.current++,
      x,
      y: canvasHeight + 50,
      vx: (Math.random() - 0.5) * 8 * side,
      vy: -(Math.random() * 6 + 14),
      radius: 50,
      emoji,
      imageUrl,
      type: isBacteria ? 'bacteria' : 'fruit',
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      image: null,
    };
    
    // 预加载图片
    if (!isBacteria) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
      newFruit.image = img;
    }
    
    return newFruit;
  }, []);

  const sliceFruit = useCallback((fruit: Fruit, slicedFruits: SlicedFruit[]) => {
    if (fruit.type === 'bacteria') {
      return {
        newSliced: [...slicedFruits],
        scoreChange: 0,
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
        imageUrl: fruit.imageUrl,
        rotation: fruit.rotation,
        rotationSpeed: -0.2,
        opacity: 1,
        image: fruit.image,
      },
      {
        id: fruit.id + 1000,
        x: fruit.x,
        y: fruit.y,
        vx: fruit.vx + 4,
        vy: fruit.vy - 2,
        emoji: fruit.emoji,
        imageUrl: fruit.imageUrl,
        rotation: fruit.rotation,
        rotationSpeed: 0.2,
        opacity: 1,
        image: fruit.image,
      },
    ];

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
    let hitBacteria = false;

    newFruits.forEach((fruit) => {
      const dx = canvasX - fruit.x;
      const dy = canvasY - fruit.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < fruit.radius + 20) {
        const result = sliceFruit(fruit, newSliced);
        newSliced = result.newSliced;
        scoreChange += result.scoreChange;
        if (result.isBacteria) {
          hitBacteria = true;
        }
      }
    });

    newFruits = newFruits.filter((f) => f.id !== undefined && !newSliced.some((s) => s.id === f.id));

    setFruits(newFruits);
    setSlicedFruits(newSliced);
    setScore((prev) => prev + scoreChange);
    
    if (hitBacteria) {
      setReviveKnowledge(getRandomKnowledge());
      setIsKnowledgeLearned(false);
      setGameState('gameover');
    }
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
    setFruits([]);
    setSlicedFruits([]);
    setSliceTrail({ points: [], opacity: 1 });
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setFruits([]);
    setSlicedFruits([]);
    setSliceTrail({ points: [], opacity: 1 });
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

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(0.5, '#98FB98');
      gradient.addColorStop(1, '#FFE4B5');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (timestamp - lastSpawnRef.current > 600) {
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

      fruits.forEach((fruit) => {
        ctx.save();
        ctx.translate(fruit.x, fruit.y);
        ctx.rotate(fruit.rotation);
        
        if (fruit.type === 'bacteria') {
          ctx.font = `${fruit.radius * 1.5}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = '#ff4444';
          ctx.shadowBlur = 15;
          ctx.fillText(fruit.emoji, 0, 0);
        } else if (fruit.image && fruit.image.complete) {
          // 绘制水果图片
          const size = fruit.radius * 2;
          ctx.drawImage(fruit.image, -size/2, -size/2, size, size);
        } else {
          // 图片未加载时使用emoji
          ctx.font = `${fruit.radius * 1.5}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(fruit.emoji, 0, 0);
        }
        ctx.restore();
      });

      slicedFruits.forEach((fruit) => {
        ctx.save();
        ctx.globalAlpha = fruit.opacity;
        ctx.translate(fruit.x, fruit.y);
        ctx.rotate(fruit.rotation);
        
        // 判断是细菌还是水果
        const isBacteria = bacteriaEmojis.includes(fruit.emoji);
        if (isBacteria) {
          ctx.font = `50px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(fruit.emoji, 0, 0);
        } else if (fruit.image && fruit.image.complete) {
          // 绘制水果图片
          const size = 60;
          ctx.drawImage(fruit.image, -size/2, -size/2, size, size);
        } else {
          // 图片未加载时使用emoji
          ctx.font = `50px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(fruit.emoji, 0, 0);
        }
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
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10;
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
    <div className="min-h-screen bg-gradient-to-b from-sky-400 via-emerald-200 to-orange-100">
      <header className="bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-6 py-2 rounded-full font-bold text-xl shadow-lg">
            {score} 分
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

        {gameState === 'menu' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
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
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
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
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
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
                    onClick={() => {
                      handleGameOver();
                      navigate('/');
                    }}
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
                    onClick={() => {
                      handleGameOver();
                      navigate('/');
                    }}
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
