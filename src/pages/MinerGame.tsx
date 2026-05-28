import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { questions, Question } from '@/data/questions';
import { ArrowLeft, Gem, Timer, RotateCcw, Home, Sparkles, Pickaxe } from 'lucide-react';

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const TIME_LIMIT = 15;
const HOOK_EXTEND_DURATION = 500;
const HOOK_RETRACT_DURATION = 400;

const gemEmojis = ['💎', '🥇', '💠', '🔮', '⭐', '💰'];

interface OptionPosition {
  index: number;
  x: number;
  y: number;
}

export default function MinerGame() {
  const navigate = useNavigate();
  const { addScore } = useGameStore();
  
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hookAngle, setHookAngle] = useState(0);
  const [hookLength, setHookLength] = useState(0);
  const [isHookExtended, setIsHookExtended] = useState(false);
  const [isHookRetracting, setIsHookRetracting] = useState(false);
  const [grabTarget, setGrabTarget] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [gemIndices, setGemIndices] = useState<number[]>([]);
  const [scorePopups, setScorePopups] = useState<{id: number; x: number; y: number}[]>([]);
  const [optionPositions, setOptionPositions] = useState<OptionPosition[]>([]);
  
  const animationRef = useRef<number>();
  const timerRef = useRef<NodeJS.Timeout>();
  const scorePopupIdRef = useRef(0);
  const hookAnimationRef = useRef<number>();

  const getRandomQuestion = useCallback(() => {
    const shuffled = shuffleArray(questions);
    return shuffled[0];
  }, []);

  const generateGemIndices = () => {
    return Array.from({ length: 4 }, () => Math.floor(Math.random() * gemEmojis.length));
  };

  const generateOptionPositions = () => {
    const positions: OptionPosition[] = [
      { index: 0, x: 8 + Math.random() * 15, y: 38 + Math.random() * 12 },
      { index: 1, x: 78 + Math.random() * 15, y: 42 + Math.random() * 12 },
      { index: 2, x: 12 + Math.random() * 18, y: 68 + Math.random() * 12 },
      { index: 3, x: 72 + Math.random() * 18, y: 62 + Math.random() * 15 },
    ];
    return positions;
  };

  const startGame = useCallback(() => {
    setScore(0);
    setCorrectCount(0);
    setGameState('playing');
    setCurrentQuestion(getRandomQuestion());
    setTimeLeft(TIME_LIMIT);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setHookLength(0);
    setIsHookExtended(false);
    setIsHookRetracting(false);
    setGrabTarget(null);
    setGemIndices(generateGemIndices());
    setOptionPositions(generateOptionPositions());
    setScorePopups([]);
  }, [getRandomQuestion]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const swingHook = () => {
      const startTime = Date.now();
      const swingDuration = 2500;
      const maxAngle = 85;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = (elapsed % swingDuration) / swingDuration;
        const angle = Math.sin(progress * Math.PI * 2) * maxAngle;
        setHookAngle(angle);
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    };

    swingHook();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState]);

  const handleTimeout = () => {
    setTimeout(() => {
      setGameState('gameover');
      addScore(score);
    }, 800);
  };

  const handleScreenClick = useCallback(() => {
    if (gameState !== 'playing') return;
    if (isHookExtended || isHookRetracting || selectedAnswer !== null) return;

    setIsHookExtended(true);
    
    const startTime = Date.now();
    const totalLength = 450;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / HOOK_EXTEND_DURATION, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      setHookLength(totalLength * easeProgress);
      
      if (progress >= 1) {
        setTimeout(() => determineHit(), 150);
        return;
      }
      
      hookAnimationRef.current = requestAnimationFrame(animate);
    };
    
    hookAnimationRef.current = requestAnimationFrame(animate);
  }, [gameState, isHookExtended, isHookRetracting, selectedAnswer]);

  const determineHit = useCallback(() => {
    const angle = hookAngle;
    let targetIndex = 0;
    
    if (angle < -40) {
      targetIndex = 0;
    } else if (angle < 0) {
      targetIndex = 2;
    } else if (angle < 40) {
      targetIndex = 3;
    } else {
      targetIndex = 1;
    }

    setGrabTarget(targetIndex);
    setSelectedAnswer(targetIndex);

    const correct = targetIndex === currentQuestion?.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      const newScore = score + 10;
      setScore(newScore);

      const popupId = scorePopupIdRef.current++;
      const targetPos = optionPositions.find(p => p.index === targetIndex);
      if (targetPos) {
        setScorePopups(prev => [...prev, { id: popupId, x: targetPos.x, y: targetPos.y }]);
      }
      setTimeout(() => {
        setScorePopups(prev => prev.filter(p => p.id !== popupId));
      }, 1200);

      setTimeout(() => {
        setIsHookRetracting(true);
        
        const retractStartTime = Date.now();
        const animateRetract = () => {
          const elapsed = Date.now() - retractStartTime;
          const progress = Math.min(elapsed / HOOK_RETRACT_DURATION, 1);
          const easeProgress = 1 - Math.pow(1 - progress, 2);
          
          setHookLength(300 * (1 - easeProgress));
          
          if (progress >= 1) {
            setIsHookExtended(false);
            setIsHookRetracting(false);
            setGrabTarget(null);
            setSelectedAnswer(null);
            setIsCorrect(null);
            setTimeLeft(TIME_LIMIT);
            setCurrentQuestion(getRandomQuestion());
            setCorrectCount(prev => prev + 1);
            setGemIndices(generateGemIndices());
            setOptionPositions(generateOptionPositions());
            return;
          }
          
          hookAnimationRef.current = requestAnimationFrame(animateRetract);
        };
        
        hookAnimationRef.current = requestAnimationFrame(animateRetract);
      }, 600);
    } else {
      setTimeout(() => {
        handleTimeout();
      }, 800);
    }
  }, [hookAngle, currentQuestion, score, optionPositions, getRandomQuestion]);

  return (
    <div 
      className="min-h-dvh bg-gradient-to-b from-sky-400 via-sky-300 to-green-400 select-none overflow-hidden relative"
      onClick={handleScreenClick}
    >
      <header className="bg-black/40 backdrop-blur-sm relative z-20">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(-1); }}
            className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-1">
              <Pickaxe className="w-4 h-4" />
              <span>{score}</span>
              <Gem className="w-4 h-4" />
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold ${
              timeLeft <= 5 ? 'bg-red-500/40 text-red-300' : 'bg-blue-500/30 text-blue-200'
            }`}>
              <Timer className={`w-4 h-4 ${timeLeft <= 5 ? 'animate-pulse' : ''}`} />
              <span>{timeLeft}s</span>
            </div>
          </div>
          <div className="w-10"></div>
        </div>
      </header>

      {gameState === 'menu' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gradient-to-br from-amber-800 to-yellow-900 rounded-3xl border-4 border-yellow-400 p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-9xl mb-4 animate-bounce">⛏️</div>
              <h1 className="text-3xl font-bold text-yellow-300 mb-2" style={{ textShadow: '3px 3px 0 #78350f' }}>
                黄金矿工问答
              </h1>
              <p className="text-amber-200">点击屏幕让钩子伸下去挖宝！</p>
            </div>

            <div className="bg-black/30 rounded-2xl p-5 mb-6 border-2 border-yellow-600">
              <h3 className="text-lg font-bold text-yellow-300 mb-3 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" /> 游戏规则
              </h3>
              <ul className="space-y-2 text-amber-100 text-sm">
                <li className="flex items-center gap-2"><span>👆</span> 点击屏幕让钩子伸下去</li>
                <li className="flex items-center gap-2"><span>⏱️</span> 每道题15秒时间</li>
                <li className="flex items-center gap-2"><span>✅</span> 答对得10分，继续挖宝</li>
                <li className="flex items-center gap-2"><span>❌</span> 答错或超时游戏结束</li>
              </ul>
            </div>

            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xl font-bold py-4 rounded-2xl border-4 border-yellow-300 hover:from-yellow-300 hover:to-amber-400 active:translate-y-1 transition-all shadow-lg"
            >
              ⛏️ 开始挖矿 ⛏️
            </button>
          </div>
        </div>
      )}

      {gameState === 'playing' && currentQuestion && (
        <div className="absolute inset-0 top-14 flex flex-col">
          <div className="relative h-[25%] min-h-[120px] bg-gradient-to-b from-sky-400 via-sky-300 to-green-400">
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-b from-green-500 to-green-700">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle, #4ade80 2px, transparent 2px)',
                backgroundSize: '14px 14px',
                opacity: 0.5,
              }} />
            </div>
            <div className="absolute bottom-4 left-0 right-0 flex justify-around text-xl opacity-50">
              <span>🌿</span><span>🌱</span><span>🌿</span><span>🌱</span><span>🌿</span>
              <span>🌱</span><span>🌿</span><span>🌱</span><span>🌿</span><span>🌱</span>
            </div>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="text-4xl" style={{ filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.3))' }}>🧑‍🏭</div>
              <div className="text-xs font-bold text-white bg-amber-700/80 px-2 py-0.5 rounded-full mt-0.5 whitespace-nowrap">
                矿工
              </div>
            </div>
            
            <div className="absolute top-4 left-4 text-lg">☁️</div>
            <div className="absolute top-6 right-8 text-lg">☁️</div>
          </div>

          <div className="relative h-[15%] min-h-[75px] bg-gradient-to-b from-green-700 via-amber-900 to-amber-950">
            <div className="absolute inset-0 opacity-40" style={{
              backgroundImage: 'radial-gradient(circle, #92400e 3px, transparent 3px)',
              backgroundSize: '18px 18px',
            }} />
            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-green-700 to-transparent" />

            <div
              className="absolute left-1/2 flex flex-col items-center"
              style={{
                transform: `rotate(${hookAngle}deg)`,
                transformOrigin: 'top center',
                top: '-10px',
              }}
            >
              <div 
                className="w-3 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-500 rounded-full shadow-lg relative"
                style={{ 
                  height: `${50 + hookLength}px`,
                  transition: 'height 0.1s ease-out',
                }}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-b from-white/50 to-transparent rounded-t-full" />
              </div>
              <div className={`text-3xl transition-all duration-200 ${
                isHookExtended ? 'scale-110' : ''
              }`}>
                🪝
              </div>
              {isHookExtended && isHookRetracting && grabTarget !== null && (
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full animate-ping opacity-75" />
                  <div className="absolute inset-0 w-10 h-10 bg-yellow-400/30 rounded-full animate-pulse" />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 bg-gradient-to-b from-amber-950 via-amber-900 to-yellow-950 relative overflow-hidden">
            <div className="absolute inset-0 opacity-25" style={{
              backgroundImage: 'radial-gradient(circle, #78350f 4px, transparent 4px)',
              backgroundSize: '22px 22px',
            }} />
            
            <div className="absolute top-4 left-[15%] text-2xl opacity-20">🪨</div>
            <div className="absolute top-8 right-[10%] text-xl opacity-15">🪨</div>
            <div className="absolute bottom-16 left-[8%] text-xl opacity-15">🪨</div>
            <div className="absolute bottom-8 right-[20%] text-2xl opacity-20">🪨</div>
            <div className="absolute top-16 right-[25%] text-lg opacity-15">💎</div>
            <div className="absolute bottom-24 left-[60%] text-lg opacity-15">💎</div>

            <div className="relative z-10 mx-4 mt-3">
              <div className="bg-gradient-to-r from-amber-800/90 via-yellow-800/90 to-amber-800/90 rounded-2xl px-4 py-3 border-2 border-yellow-600/50 shadow-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-300 text-xs font-bold">第 {correctCount + 1} 题</span>
                </div>
                <p className="text-white font-bold text-sm leading-relaxed">
                  {currentQuestion.question}
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-2 px-2 pb-4" style={{ height: '65%' }}>
              {grabTarget !== null && (() => {
                const targetPos = optionPositions.find(p => p.index === grabTarget);
                if (!targetPos) return null;
                return (
                  <div className="absolute top-0 left-1/2 z-20 pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
                    <div 
                      className="bg-gradient-to-b from-yellow-400/60 to-yellow-500/20"
                      style={{
                        width: '3px',
                        height: `${(targetPos.y - 5)}%`,
                        boxShadow: '0 0 8px rgba(255,215,0,0.5)',
                      }}
                    />
                  </div>
                );
              })()}
              {optionPositions.map((pos) => {
                const gemEmoji = gemEmojis[gemIndices[pos.index] ?? 0];
                let optionStyle = 'bg-gradient-to-br from-amber-700 via-yellow-700 to-amber-800 border-2 border-amber-500';

                if (selectedAnswer !== null) {
                  if (pos.index === currentQuestion.correctAnswer) {
                    optionStyle = 'bg-gradient-to-br from-green-500 to-emerald-600 border-2 border-green-400';
                  } else if (pos.index === selectedAnswer && !isCorrect) {
                    optionStyle = 'bg-gradient-to-br from-red-500 to-rose-600 border-2 border-red-400';
                  }
                }

                const isGrabbed = selectedAnswer !== null && pos.index === selectedAnswer;

                return (
                  <button
                    key={pos.index}
                    onClick={(e) => e.stopPropagation()}
                    disabled={selectedAnswer !== null}
                    className={`absolute rounded-xl border-2 p-3 transition-all duration-300 shadow-lg ${
                      optionStyle
                    } ${
                      isGrabbed ? 'scale-125 shadow-2xl z-30 ring-2 ring-yellow-300 animate-pulse' : 'shadow-md'
                    } ${
                      selectedAnswer !== null ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'
                    }`}
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      transform: 'translate(-50%, -50%)',
                      minWidth: '80px',
                      maxWidth: '100px',
                    }}
                  >
                    <div className="relative">
                      <span className="text-3xl block text-center mb-1">{gemEmoji}</span>
                    </div>
                    <span className="text-white text-xs font-bold text-center leading-tight line-clamp-2 block">
                      {currentQuestion.options[pos.index]}
                    </span>
                    {selectedAnswer !== null && pos.index === currentQuestion.correctAnswer && (
                      <div className="absolute -top-2 -right-2 text-xl animate-bounce">✅</div>
                    )}
                    {selectedAnswer === pos.index && !isCorrect && (
                      <div className="absolute -top-2 -right-2 text-xl animate-shake">❌</div>
                    )}
                  </button>
                );
              })}
            </div>

            {scorePopups.map((popup) => (
              <div
                key={popup.id}
                className="absolute z-20 text-xl font-bold text-yellow-300 pointer-events-none"
                style={{
                  left: `${popup.x}%`,
                  top: `${popup.y}%`,
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                  animation: 'scoreFloat 1.2s ease-out forwards',
                }}
              >
                +10 💎
              </div>
            ))}

            {selectedAnswer !== null && isCorrect && (
              <div className="relative z-10 mx-4 mb-2 bg-green-900/70 rounded-xl p-3 border border-green-500/50">
                <p className="text-green-300 text-xs">{currentQuestion.explanation}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="max-w-md w-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl border-4 border-yellow-600 p-8 shadow-2xl text-center">
            <div className="text-9xl mb-4">💎</div>
            <h2 className="text-3xl font-bold text-white mb-2">挖矿结束！</h2>
            <div className="flex items-center justify-center gap-2 text-5xl font-bold text-yellow-400 my-4">
              <Pickaxe className="w-10 h-10" />
              {score} 分
            </div>
            <div className="bg-black/30 rounded-xl p-4 mb-6">
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <p className="text-gray-400 text-sm">答对题数</p>
                  <p className="text-3xl font-bold text-green-400">{correctCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm">获得宝石</p>
                  <p className="text-3xl font-bold text-yellow-400">{score / 10} 💎</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={startGame}
                className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-bold py-3 px-6 rounded-xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> 再挖一次
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
        @keyframes scoreFloat {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-50px) scale(1.3); }
        }
      `}</style>
    </div>
  );
}
