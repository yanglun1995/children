import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { questions } from '@/data/questions';
import { ArrowLeft, Timer, RotateCcw, Home, Sparkles, Star } from 'lucide-react';

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const GRID_SIZE = 9;
const MOLE_INTERVAL = 1200;
const GAME_DURATION = 60;

interface MoleData {
  holeIndex: number;
  questionIndex: number;
  id: number;
  appearTime: number;
}

export default function HammerGame() {
  const navigate = useNavigate();
  const { addScore } = useGameStore();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [moles, setMoles] = useState<MoleData[]>([]);
  const [activeMole, setActiveMole] = useState<MoleData | null>(null);
  const [showQuestion, setShowQuestion] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [combo, setCombo] = useState(0);
  const [hitEffects, setHitEffects] = useState<{id: number; x: number; y: number; type: 'hit' | 'miss'}[]>([]);
  const moleIdRef = useRef(0);
  const effectIdRef = useRef(0);
  const moleTimerRef = useRef<NodeJS.Timeout>();
  const gameTimerRef = useRef<NodeJS.Timeout>();
  const [questionSet, setQuestionSet] = useState<typeof questions>([]);

  const prepareQuestions = useCallback(() => {
    return shuffleArray(questions);
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setMoles([]);
    setActiveMole(null);
    setShowQuestion(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setCombo(0);
    setHitEffects([]);
    setQuestionSet(prepareQuestions());
    setGameState('playing');
  }, [prepareQuestions]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    gameTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const spawnMole = () => {
      const emptyHoles = Array.from({ length: GRID_SIZE }, (_, i) => i)
        .filter(i => !moles.some(m => m.holeIndex === i));

      if (emptyHoles.length === 0 || moles.length >= 3) return;

      const holeIndex = emptyHoles[Math.floor(Math.random() * emptyHoles.length)];
      const questionIndex = Math.floor(Math.random() * questionSet.length);

      const newMole: MoleData = {
        holeIndex,
        questionIndex,
        id: moleIdRef.current++,
        appearTime: Date.now(),
      };

      setMoles(prev => [...prev, newMole]);

      setTimeout(() => {
        setMoles(prev => prev.filter(m => m.id !== newMole.id));
      }, 2500);
    };

    moleTimerRef.current = setInterval(spawnMole, MOLE_INTERVAL);

    spawnMole();

    return () => {
      if (moleTimerRef.current) clearInterval(moleTimerRef.current);
    };
  }, [gameState, moles.length, questionSet]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const timerInterval = setInterval(() => {
      setMoles(prev => {
        const now = Date.now();
        return prev.filter(m => now - m.appearTime < 2500);
      });
    }, 500);

    return () => clearInterval(timerInterval);
  }, [gameState]);

  useEffect(() => {
    if (timeLeft <= 0 && gameState === 'playing') {
      setGameState('gameover');
      addScore(score);
    }
  }, [timeLeft, gameState, score, addScore]);

  const handleMoleClick = useCallback((mole: MoleData) => {
    if (showQuestion) return;

    setMoles(prev => prev.filter(m => m.id !== mole.id));
    setActiveMole(mole);
    setShowQuestion(true);
    setSelectedAnswer(null);
    setIsCorrect(null);

    const effId = effectIdRef.current++;
    setHitEffects(prev => [...prev, {
      id: effId,
      x: (mole.holeIndex % 3) * 33 + 16,
      y: Math.floor(mole.holeIndex / 3) * 33 + 16,
      type: 'hit',
    }]);
    setTimeout(() => {
      setHitEffects(prev => prev.filter(e => e.id !== effId));
    }, 600);
  }, [showQuestion]);

  const handleAnswer = useCallback((answerIndex: number) => {
    if (selectedAnswer !== null) return;

    const question = questionSet[activeMole?.questionIndex ?? 0];
    if (!question) return;

    setSelectedAnswer(answerIndex);
    const correct = answerIndex === question.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      const comboBonus = Math.min(combo, 5);
      const points = 10 + comboBonus * 2;
      setScore(prev => prev + points);
      setCombo(prev => prev + 1);
    } else {
      setCombo(0);
    }

    setTimeout(() => {
      setShowQuestion(false);
      setActiveMole(null);
      setSelectedAnswer(null);
      setIsCorrect(null);
    }, 1500);
  }, [selectedAnswer, activeMole, questionSet, combo]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-400 via-green-500 to-green-700 select-none overflow-hidden relative">
      <header className="bg-black/30 backdrop-blur-sm relative z-30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 bg-gray-800/80 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-1">
              <Star className="w-4 h-4" />
              <span>{score}</span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold ${
              timeLeft <= 10 ? 'bg-red-500/50 text-red-200 animate-pulse' : 'bg-blue-500/30 text-blue-100'
            }`}>
              <Timer className="w-4 h-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>
          {combo > 1 && (
            <div className="text-yellow-300 font-bold text-sm bg-yellow-500/20 px-3 py-1 rounded-full">
              🔥 {combo}连击
            </div>
          )}
        </div>
      </header>

      {gameState === 'menu' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gradient-to-br from-emerald-800 to-green-900 rounded-3xl border-4 border-green-400 p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-8xl mb-4 animate-bounce">🔨</div>
              <h1 className="text-3xl font-bold text-green-300 mb-2" style={{ textShadow: '3px 3px 0 #064e3b' }}>
                打地鼠健康问答
              </h1>
              <p className="text-green-200">敲打地鼠，学习健康知识！</p>
            </div>

            <div className="bg-black/30 rounded-2xl p-5 mb-6 border-2 border-green-600">
              <h3 className="text-lg font-bold text-green-300 mb-3 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" /> 游戏规则
              </h3>
              <ul className="space-y-2 text-green-100 text-sm">
                <li className="flex items-center gap-2"><span>🔨</span> 点击冒出来的地鼠</li>
                <li className="flex items-center gap-2"><span>❓</span> 回答地鼠带来的健康问题</li>
                <li className="flex items-center gap-2"><span>✅</span> 答对得10分，连击加分更多</li>
                <li className="flex items-center gap-2"><span>⏱️</span> 限时60秒，尽量多答对</li>
              </ul>
            </div>

            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl font-bold py-4 rounded-2xl border-4 border-green-300 hover:from-green-400 hover:to-emerald-500 active:translate-y-1 transition-all shadow-lg"
            >
              🔨 开始打地鼠 🔨
            </button>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="absolute inset-0 top-14 flex flex-col">
          {/* Grass background */}
          <div className="flex-1 relative overflow-hidden">
            {/* Grass texture */}
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle, #4ade80 2px, transparent 2px)',
              backgroundSize: '16px 16px',
              opacity: 0.3,
            }} />
            {/* Grass blades */}
            <div className="absolute top-0 left-0 right-0 flex justify-around text-2xl opacity-40">
              <span>🌿</span><span>🌱</span><span>🌿</span><span>🌱</span><span>🌿</span>
              <span>🌱</span><span>🌿</span><span>🌱</span><span>🌿</span><span>🌱</span>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-4 left-4 text-3xl opacity-30">🌸</div>
            <div className="absolute top-4 right-8 text-2xl opacity-25">🌻</div>
            <div className="absolute bottom-8 left-8 text-3xl opacity-20">🌼</div>
            <div className="absolute bottom-12 right-4 text-2xl opacity-25">🦋</div>

            {/* 3x3 Grid of holes */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid grid-cols-3 gap-4 md:gap-6 w-full max-w-sm px-4">
                {Array.from({ length: GRID_SIZE }, (_, index) => {
                  const mole = moles.find(m => m.holeIndex === index);
                  return (
                    <div key={index} className="relative aspect-square">
                      {/* Hole */}
                      <div className="absolute bottom-0 left-0 right-0 h-3/5 bg-gradient-to-b from-amber-800 to-amber-950 rounded-full shadow-inner"
                        style={{
                          boxShadow: 'inset 0 8px 12px rgba(0,0,0,0.5)',
                        }}
                      />
                      {/* Hole rim */}
                      <div className="absolute bottom-[45%] left-[-4px] right-[-4px] h-3 bg-gradient-to-b from-amber-700 to-amber-800 rounded-full" />

                      {/* Mole */}
                      {mole && (
                        <button
                          onClick={() => handleMoleClick(mole)}
                          className="absolute bottom-[30%] left-1/2 -translate-x-1/2 flex flex-col items-center cursor-pointer transition-all duration-150 hover:scale-110 z-10"
                          style={{
                            animation: 'moleUp 0.2s ease-out',
                          }}
                        >
                          <div className="text-4xl md:text-5xl hover:scale-110 transition-transform">
                            🐹
                          </div>
                          <div className="text-[8px] md:text-[10px] font-bold text-white bg-amber-700/80 px-1.5 py-0.5 rounded-full mt-0.5 whitespace-nowrap">
                            ?
                          </div>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hit effects */}
            {hitEffects.map(effect => (
              <div
                key={effect.id}
                className="absolute z-20 pointer-events-none text-3xl"
                style={{
                  left: `${effect.x}%`,
                  top: `${effect.y}%`,
                  animation: 'hitEffect 0.6s ease-out forwards',
                }}
              >
                💥
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question Modal */}
      {showQuestion && activeMole && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="max-w-sm w-full bg-gradient-to-br from-amber-800 to-yellow-900 rounded-3xl border-4 border-yellow-400 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🐹</span>
                <span className="text-yellow-300 font-bold text-sm">地鼠的问题</span>
              </div>
              {combo > 1 && (
                <span className="text-orange-400 font-bold text-xs bg-orange-500/20 px-2 py-1 rounded-full">
                  🔥 {combo}连击
                </span>
              )}
            </div>

            <div className="bg-black/30 rounded-xl p-3 mb-4 border border-yellow-600/50">
              <p className="text-white font-bold text-sm leading-relaxed">
                {questionSet[activeMole.questionIndex]?.question}
              </p>
            </div>

            <div className="space-y-2">
              {questionSet[activeMole.questionIndex]?.options.map((option, index) => {
                let btnStyle = 'bg-gradient-to-r from-amber-600 to-orange-600 border-amber-400 hover:from-amber-500 hover:to-orange-500';

                if (selectedAnswer !== null) {
                  if (index === questionSet[activeMole.questionIndex].correctAnswer) {
                    btnStyle = 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-400';
                  } else if (index === selectedAnswer && !isCorrect) {
                    btnStyle = 'bg-gradient-to-r from-red-500 to-rose-600 border-red-400';
                  }
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={selectedAnswer !== null}
                    className={`w-full p-3 rounded-xl border-2 transition-all ${btnStyle} ${
                      selectedAnswer !== null ? 'cursor-not-allowed' : 'cursor-pointer active:translate-y-0.5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-white">{String.fromCharCode(65 + index)}</span>
                      </div>
                      <span className="text-white font-bold text-xs flex-1 text-left">{option}</span>
                      {selectedAnswer !== null && index === questionSet[activeMole.questionIndex].correctAnswer && (
                        <span className="text-lg">✅</span>
                      )}
                      {selectedAnswer === index && !isCorrect && (
                        <span className="text-lg">❌</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedAnswer !== null && isCorrect && (
              <div className="mt-3 bg-green-900/60 rounded-xl p-3 border border-green-500/50">
                <p className="text-green-300 text-xs">{questionSet[activeMole.questionIndex]?.explanation}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game Over */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="max-w-md w-full bg-gradient-to-br from-emerald-800 to-green-900 rounded-3xl border-4 border-yellow-500 p-8 shadow-2xl text-center">
            <div className="text-8xl mb-4">🏆</div>
            <h2 className="text-3xl font-bold text-white mb-2">时间到！</h2>
            <div className="flex items-center justify-center gap-2 text-5xl font-bold text-yellow-400 my-4">
              <Star className="w-10 h-10" />
              {score} 分
            </div>
            <div className="bg-black/30 rounded-xl p-4 mb-6">
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <p className="text-gray-400 text-sm">敲打地鼠</p>
                  <p className="text-3xl font-bold text-green-400">
                    {Math.floor(score / 10)} 只
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm">最高连击</p>
                  <p className="text-3xl font-bold text-orange-400">{combo} 🔥</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={startGame}
                className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-bold py-3 px-6 rounded-xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> 再来一局
              </button>
              <button
                onClick={() => {
                  addScore(score);
                  navigate('/');
                }}
                className="w-full bg-gray-700 text-gray-200 font-bold py-3 px-6 rounded-xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" /> 返回首页
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes moleUp {
          0% { transform: translateX(-50%) translateY(60%); }
          100% { transform: translateX(-50%) translateY(0); }
        }
        @keyframes hitEffect {
          0% { opacity: 1; transform: scale(0.5); }
          100% { opacity: 0; transform: scale(2) translateY(-20px); }
        }
      `}</style>
    </div>
  );
}