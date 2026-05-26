import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { ArrowLeft, Pause, Play, RotateCcw } from 'lucide-react';

interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'low' | 'high' | 'soap';
  emoji: string;
}

interface Collectible {
  id: number;
  x: number;
  y: number;
  collected: boolean;
  emoji: string;
}

interface HygieneAction {
  id: number;
  x: number;
  y: number;
  completed: boolean;
  action: string;
  emoji: string;
  title: string;
  content: string;
}

export default function RunGame() {
  const navigate = useNavigate();
  const { addScore, addBadge, addKnowledgeCard } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [lives, setLives] = useState(3);
  const [playerY, setPlayerY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [hygieneActions, setHygieneActions] = useState<HygieneAction[]>([]);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [knowledge, setKnowledge] = useState({ title: '', content: '' });
  const gameLoopRef = useRef<number>();
  const lastSpawnRef = useRef(0);
  const obstacleIdRef = useRef(0);
  const groundY = 0;
  const gravity = 0.8;
  const jumpForce = -15;

  const knowledgeTips = [
    {
      title: '正确刷牙',
      content: '刷牙要上下刷，不是左右刷！\n每次刷2分钟以上\n早晚都要刷牙哦！',
    },
    {
      title: '咳嗽礼仪',
      content: '咳嗽或打喷嚏时\n要用纸巾或手肘遮住\n不要对着人咳嗽！',
    },
    {
      title: '勤洗手',
      content: '饭前便后要洗手\n外出回家要洗手\n接触脏东西后要洗手',
    },
  ];

  const spawnObstacle = useCallback((canvasWidth: number, canvasHeight: number) => {
    const types: Obstacle['type'][] = ['low', 'high', 'soap'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let obstacle: Obstacle;
    switch (type) {
      case 'low':
        obstacle = {
          id: obstacleIdRef.current++,
          x: canvasWidth + 50,
          y: canvasHeight - 100,
          width: 60,
          height: 50,
          type: 'low',
          emoji: '🚧',
        };
        break;
      case 'high':
        obstacle = {
          id: obstacleIdRef.current++,
          x: canvasWidth + 50,
          y: canvasHeight - 200,
          width: 50,
          height: 80,
          type: 'high',
          emoji: '🦟',
        };
        break;
      case 'soap':
        obstacle = {
          id: obstacleIdRef.current++,
          x: canvasWidth + 50,
          y: canvasHeight - 80,
          width: 40,
          height: 40,
          type: 'soap',
          emoji: '🧼',
        };
        break;
    }
    return obstacle;
  }, []);

  const spawnCollectible = useCallback((canvasWidth: number, canvasHeight: number) => {
    const y = canvasHeight - 200 - Math.random() * 100;
    return {
      id: obstacleIdRef.current++,
      x: canvasWidth + 50,
      y,
      collected: false,
      emoji: ['💊', '💪', '🥕'][Math.floor(Math.random() * 3)],
    };
  }, []);

  const spawnHygieneAction = useCallback((canvasWidth: number, canvasHeight: number) => {
    const actions = [
      { action: 'wash', emoji: '🧼', title: '洗手台', content: '看到洗手台了！\n记得用七步洗手法洗手！' },
      { action: 'tissue', emoji: '🧻', title: '纸巾盒', content: '纸巾可以用来\n擦鼻涕和擦手！' },
      { action: 'mask', emoji: '😷', title: '口罩机', content: '人多的时候\n要记得戴口罩哦！' },
    ];
    const action = actions[Math.floor(Math.random() * actions.length)];
    return {
      id: obstacleIdRef.current++,
      x: canvasWidth + 50,
      y: canvasHeight - 150,
      completed: false,
      ...action,
    };
  }, []);

  const handleJump = useCallback(() => {
    if (!isJumping && gameState === 'playing') {
      setIsJumping(true);
      setPlayerY(jumpForce);
    }
  }, [isJumping, gameState]);

  const handleSlide = useCallback(() => {
    if (gameState === 'playing') {
      setIsSliding(true);
      setTimeout(() => setIsSliding(false), 500);
    }
  }, [gameState]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setDistance(0);
    setLives(3);
    setPlayerY(0);
    setIsJumping(false);
    setIsSliding(false);
    setObstacles([]);
    setCollectibles([]);
    setHygieneActions([]);
    obstacleIdRef.current = 0;
    lastSpawnRef.current = 0;
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = 0;
    let currentPlayerY = 0;
    let velocity = 0;

    const gameLoop = (timestamp: number) => {
      if (gameState !== 'playing') return;

      const deltaTime = Math.min((timestamp - lastTime) / 16.67, 2);
      lastTime = timestamp;

      ctx.fillStyle = '#e8f5e9';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#81c784';
      ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

      for (let i = 0; i < 20; i++) {
        const x = ((timestamp / 10 - i * 100) % (canvas.width + 200)) - 100;
        ctx.fillStyle = '#66bb6a';
        ctx.fillRect(x, canvas.height - 65, 40, 8);
      }

      if (timestamp - lastSpawnRef.current > 1500) {
        setObstacles((prev) => [...prev, spawnObstacle(canvas.width, canvas.height)]);
        if (Math.random() > 0.5) {
          setCollectibles((prev) => [...prev, spawnCollectible(canvas.width, canvas.height)]);
        }
        if (Math.random() > 0.7) {
          setHygieneActions((prev) => [...prev, spawnHygieneAction(canvas.width, canvas.height)]);
        }
        lastSpawnRef.current = timestamp;
      }

      setObstacles((prev) =>
        prev
          .map((obs) => ({ ...obs, x: obs.x - 8 * deltaTime }))
          .filter((obs) => obs.x > -100)
      );

      setCollectibles((prev) =>
        prev
          .map((col) => ({ ...col, x: col.x - 8 * deltaTime }))
          .filter((col) => col.x > -50 && !col.collected)
      );

      setHygieneActions((prev) =>
        prev
          .map((action) => ({ ...action, x: action.x - 8 * deltaTime }))
          .filter((action) => action.x > -100 && !action.completed)
      );

      if (isJumping) {
        velocity += gravity * deltaTime;
        currentPlayerY += velocity * deltaTime;
        if (currentPlayerY >= 0) {
          currentPlayerY = 0;
          velocity = 0;
          setIsJumping(false);
        }
      }

      obstacles.forEach((obs) => {
        const playerX = 100;
        const playerY = canvas.height - 110 + currentPlayerY;
        const playerWidth = 50;
        const playerHeight = isSliding ? 30 : 80;

        if (
          playerX + playerWidth > obs.x &&
          playerX < obs.x + obs.width &&
          playerY + playerHeight > obs.y &&
          playerY < obs.y + obs.height
        ) {
          setLives((prev) => {
            const newLives = prev - 1;
            if (newLives <= 0) {
              setGameState('gameover');
              handleGameOver();
            }
            return Math.max(0, newLives);
          });
          setObstacles((prev) => prev.filter((o) => o.id !== obs.id));
        }
      });

      collectibles.forEach((col) => {
        if (col.collected) return;
        const playerX = 100;
        const playerY = canvas.height - 110 + currentPlayerY;
        const distance = Math.sqrt(Math.pow(playerX + 25 - col.x, 2) + Math.pow(playerY + 40 - col.y, 2));
        if (distance < 50) {
          setCollectibles((prev) => prev.map((c) => (c.id === col.id ? { ...c, collected: true } : c)));
          setScore((prev) => prev + 5);
        }
      });

      hygieneActions.forEach((action) => {
        if (action.completed) return;
        const playerX = 100;
        const playerY = canvas.height - 110 + currentPlayerY;
        const distance = Math.abs(playerX + 25 - action.x);
        if (distance < 60) {
          setHygieneActions((prev) => prev.map((a) => (a.id === action.id ? { ...a, completed: true } : a)));
          setScore((prev) => prev + 15);
          const tip = knowledgeTips.find((t) => t.title === action.title);
          if (tip) {
            setKnowledge(tip);
            setShowKnowledge(true);
            setTimeout(() => setShowKnowledge(false), 3000);
          }
        }
      });

      const playerDrawY = canvas.height - 110 + currentPlayerY;
      ctx.font = isSliding ? '60px Arial' : '80px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🏃', 100, playerDrawY + (isSliding ? 20 : 30));

      obstacles.forEach((obs) => {
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(obs.emoji, obs.x + obs.width / 2, obs.y + obs.height / 2 + 15);
      });

      collectibles.forEach((col) => {
        if (col.collected) return;
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(col.emoji, col.x, col.y);
      });

      hygieneActions.forEach((action) => {
        if (action.completed) return;
        ctx.font = '60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(action.emoji, action.x, action.y);
      });

      setDistance((prev) => prev + 1);
      if (Math.floor(distance / 100) > Math.floor((distance - 1) / 100)) {
        setScore((prev) => prev + 1);
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, isJumping, isSliding, obstacles, collectibles, hygieneActions, distance, spawnObstacle, spawnCollectible, spawnHygieneAction]);

  const handleGameOver = () => {
    addScore(score);
    if (score >= 100) {
      addBadge({
        id: 'run-master',
        name: '跑步达人',
        icon: '🏃',
      });
    }
    if (score >= 50) {
      addKnowledgeCard({
        id: 'run-k1',
        title: '运动的好处',
        content: '多运动可以增强体质，提高免疫力，让我们更健康！每天运动30分钟，对身体非常好。',
        unlockedAt: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        handleSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleJump, handleSlide]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-teal-50">
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
            <div className="text-gray-600 font-medium">{distance}m</div>
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

      <div className="p-4">
        <p className="text-center text-gray-600 mb-2">空格/上键跳跃 | 下键滑行</p>
      </div>

      <div ref={containerRef} className="relative w-full h-[calc(100vh-180px)]">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="w-full h-full rounded-3xl shadow-2xl"
          onClick={handleJump}
        />

        {showKnowledge && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-2xl max-w-xs animate-bounce">
            <div className="text-4xl mb-3 text-center">💡</div>
            <h3 className="font-bold text-lg text-gray-800 mb-2 text-center">{knowledge.title}</h3>
            <p className="text-gray-600 text-sm whitespace-pre-line">{knowledge.content}</p>
          </div>
        )}

        {gameState === 'menu' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-3xl">
            <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm mx-4">
              <div className="text-6xl mb-4">🏃</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">卫生习惯跑酷</h2>
              <p className="text-gray-600 mb-4">躲避障碍物<br />收集健康能量<br />完成卫生任务</p>
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-green-400 to-teal-400 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transition-transform"
              >
                开始游戏
              </button>
            </div>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-3xl">
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
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-3xl">
            <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm mx-4">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">游戏结束！</h2>
              <p className="text-4xl font-bold text-green-500 mb-4">{score} 分</p>
              <p className="text-gray-600 mb-4">跑了 {distance} 米</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={startGame}
                  className="bg-gradient-to-r from-green-400 to-teal-400 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transition-transform"
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
