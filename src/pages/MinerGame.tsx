import { useState, useEffect, useCallback, useRef } from 'react';
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
const gemEmojis = ['💎', '🥇', '💠', '🔮', '⭐', '💰'];

const EXTEND_DURATION = 550;
const GRAB_DURATION = 300;
const RETRACT_DURATION = 500;

type HookPhase = 'idle' | 'extending' | 'grabbing' | 'retracting' | 'dropped';

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
  const [hookPhase, setHookPhase] = useState<HookPhase>('idle');
  const [ropeLength, setRopeLength] = useState(36);
  const [grabTarget, setGrabTarget] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [gemIndices, setGemIndices] = useState<number[]>([]);
  const [scorePopups, setScorePopups] = useState<{id: number; x: number; y: number}[]>([]);
  const [grabbedEmoji, setGrabbedEmoji] = useState('');
  const animationRef = useRef<number>();
  const timerRef = useRef<NodeJS.Timeout>();
  const scorePopupIdRef = useRef(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  const getTargetAngle = useCallback((index: number): number => {
    if (index < 2) {
      return index === 0 ? -22 : -15;
    } else {
      return index === 2 ? 15 : 22;
    }
  }, []);

  const getRopeTargetLength = useCallback((): number => {
    const area = gameAreaRef.current;
    if (area) {
      const areaHeight = area.clientHeight;
      return Math.min(areaHeight * 0.48, 450);
    }
    return 360;
  }, []);

  const getRandomQuestion = useCallback(() => {
    const shuffled = shuffleArray(questions);
    return shuffled[0];
  }, []);

  const generateGemIndices = () => {
    return Array.from({ length: 4 }, () => Math.floor(Math.random() * gemEmojis.length));
  };

  const startGame = useCallback(() => {
    setScore(0);
    setCorrectCount(0);
    setGameState('playing');
    setCurrentQuestion(getRandomQuestion());
    setTimeLeft(TIME_LIMIT);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowResult(false);
    setHookPhase('idle');
    setRopeLength(36);
    setGrabTarget(null);
    setGrabbedEmoji('');
    setGemIndices(generateGemIndices());
    setScorePopups([]);
  }, [getRandomQuestion]);

  useEffect(() => {
    if (gameState !== 'playing' || hookPhase !== 'idle' || showResult) return;

    const swingHook = () => {
      const startTime = Date.now();
      const swingDuration = 3000;
      const maxAngle = 40;

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
  }, [gameState, hookPhase, showResult]);

  useEffect(() => {
    if (gameState !== 'playing' || showResult) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
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
  }, [gameState, showResult]);

  const handleTimeout = () => {
    setShowResult(true);
    setTimeout(() => {
      setGameState('gameover');
      addScore(score);
    }, 800);
  };

  const handleAnswer = useCallback((answerIndex: number) => {
    if (selectedAnswer !== null || showResult || hookPhase !== 'idle') return;

    setSelectedAnswer(answerIndex);
    setGrabTarget(answerIndex);

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const targetAngle = getTargetAngle(answerIndex);
    setHookAngle(targetAngle);

    const correct = answerIndex === currentQuestion?.correctAnswer;
    setIsCorrect(correct);

    setHookPhase('extending');
    setRopeLength(getRopeTargetLength());

    if (correct) {
      const emoji = gemEmojis[gemIndices[answerIndex]];

      setTimeout(() => {
        setHookPhase('grabbing');
        setGrabbedEmoji(emoji);

        const newScore = score + 10;
        setScore(newScore);

        const popupId = scorePopupIdRef.current++;
        setScorePopups(prev => [...prev, {
          id: popupId,
          x: answerIndex % 2 === 0 ? 30 : 70,
          y: 35,
        }]);
        setTimeout(() => {
          setScorePopups(prev => prev.filter(p => p.id !== popupId));
        }, 1200);

        setTimeout(() => {
          setHookPhase('retracting');
          setRopeLength(36);

          setTimeout(() => {
            setSelectedAnswer(null);
            setIsCorrect(null);
            setGrabTarget(null);
            setHookPhase('idle');
            setGrabbedEmoji('');
            setTimeLeft(TIME_LIMIT);
            setCurrentQuestion(getRandomQuestion());
            setShowResult(false);
            setCorrectCount(prev => prev + 1);
            setGemIndices(generateGemIndices());
          }, RETRACT_DURATION + 200);
        }, GRAB_DURATION);
      }, EXTEND_DURATION);
    } else {
      setTimeout(() => {
        setHookPhase('grabbing');
        setGrabbedEmoji(gemEmojis[gemIndices[answerIndex]]);

        setTimeout(() => {
          setHookPhase('dropped');
          setGrabbedEmoji('');

          setTimeout(() => {
            handleTimeout();
          }, 600);
        }, GRAB_DURATION);
      }, EXTEND_DURATION);
    }
  }, [selectedAnswer, showResult, hookPhase, currentQuestion, score, getRandomQuestion,
      gemIndices, getTargetAngle, getRopeTargetLength]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 via-sky-300 to-green-400 select-none overflow-hidden relative">
      <header className="bg-black/40 backdrop-blur-sm relative z-20">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-1">
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
              <div className="text-8xl mb-4 animate-bounce">⛏️</div>
              <h1 className="text-3xl font-bold text-yellow-300 mb-2" style={{ textShadow: '3px 3px 0 #78350f' }}>
                黄金矿工问答
              </h1>
              <p className="text-amber-200">挖掘宝藏，学习健康知识！</p>
            </div>

            <div className="bg-black/30 rounded-2xl p-5 mb-6 border-2 border-yellow-600">
              <h3 className="text-lg font-bold text-yellow-300 mb-3 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" /> 游戏规则
              </h3>
              <ul className="space-y-2 text-amber-100 text-sm">
                <li className="flex items-center gap-2"><span>⏱️</span> 每道题15秒时间</li>
                <li className="flex items-center gap-2"><span>✅</span> 答对得10分，钩子抓回宝石</li>
                <li className="flex items-center gap-2"><span>❌</span> 答错或超时游戏结束</li>
                <li className="flex items-center gap-2"><span>💎</span> 点击宝藏方块，用钩子抓住它！</li>
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
        <div
          ref={gameAreaRef}
          className="absolute inset-0 top-14 flex flex-col"
        >
          <div className="relative h-[25%] min-h-[120px] bg-gradient-to-b from-sky-400 via-sky-300 to-green-400">
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-b from-green-500 to-green-700">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle, #4ade80 1px, transparent 1px)',
                backgroundSize: '12px 12px',
                opacity: 0.4,
              }} />
            </div>
            <div className="absolute bottom-6 left-0 right-0 flex justify-around text-2xl opacity-60">
              <span>🌿</span><span>🌱</span><span>🌿</span><span>🌱</span><span>🌿</span>
              <span>🌱</span><span>🌿</span><span>🌱</span><span>🌿</span><span>🌱</span>
            </div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="text-5xl" style={{ filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.3))' }}>🧑‍🏭</div>
              <div className="text-xs font-bold text-white bg-amber-700 px-2 py-0.5 rounded-full mt-0.5 whitespace-nowrap">
                矿工
              </div>
            </div>
          </div>

          <div className="relative h-[15%] min-h-[80px] bg-gradient-to-b from-green-700 via-amber-900 to-amber-950">
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: 'radial-gradient(circle, #92400e 2px, transparent 2px)',
              backgroundSize: '16px 16px',
            }} />
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-green-700 to-transparent" />
          </div>

          <div className="flex-1 bg-gradient-to-b from-amber-950 via-amber-900 to-yellow-950 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'radial-gradient(circle, #78350f 3px, transparent 3px)',
              backgroundSize: '20px 20px',
            }} />
            <div className="absolute top-4 left-0 right-0 h-px bg-amber-800/30" />
            <div className="absolute top-12 left-0 right-0 h-px bg-amber-800/20" />
            <div className="absolute bottom-20 left-0 right-0 h-px bg-amber-800/30" />

            <div className="absolute top-8 left-[20%] text-2xl opacity-30">🪨</div>
            <div className="absolute top-6 right-[15%] text-xl opacity-25">🪨</div>
            <div className="absolute bottom-16 left-[10%] text-xl opacity-20">🪨</div>
            <div className="absolute bottom-12 right-[25%] text-2xl opacity-25">🪨</div>

            <div className="relative z-10 mx-4 mt-3 mb-2">
              <div className="bg-gradient-to-r from-amber-800/90 via-yellow-800/90 to-amber-800/90 rounded-xl px-4 py-3 border-2 border-yellow-600/50 shadow-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-300 text-xs font-bold">第 {correctCount + 1} 题</span>
                </div>
                <p className="text-white font-bold text-sm leading-relaxed">
                  {currentQuestion.question}
                </p>
              </div>
            </div>

            <div className="relative z-10 mx-3 mt-1 grid grid-cols-2 gap-3 px-1 pb-4 options-container">
              {currentQuestion.options.map((option, index) => {
                const gemEmoji = gemEmojis[gemIndices[index] ?? 0];
                let optionStyle = 'bg-gradient-to-br from-amber-600/90 via-yellow-700/90 to-amber-800/90 border-amber-500/60 hover:from-yellow-500/90 hover:to-amber-600/90';

                if (selectedAnswer !== null) {
                  if (index === currentQuestion.correctAnswer) {
                    optionStyle = 'bg-gradient-to-br from-green-500/90 to-emerald-600/90 border-green-400/80';
                  } else if (index === selectedAnswer && !isCorrect) {
                    optionStyle = 'bg-gradient-to-br from-red-500/90 to-rose-600/90 border-red-400/80';
                  }
                }

                const isGrabbed = selectedAnswer !== null && index === selectedAnswer;
                const isRetracting = isGrabbed && hookPhase === 'retracting';
                const isDropped = isGrabbed && hookPhase === 'dropped';
                const showRopeGrab = isGrabbed && (hookPhase === 'grabbing' || hookPhase === 'retracting');

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={selectedAnswer !== null}
                    className={`option-button relative rounded-xl border-2 p-3 transition-all duration-300 flex flex-col items-center gap-1 overflow-hidden ${
                      optionStyle
                    } ${
                      isGrabbed && hookPhase === 'extending' ? 'scale-105 shadow-2xl ring-2 ring-yellow-400/60' : ''
                    } ${
                      isGrabbed && hookPhase === 'grabbing' ? 'scale-110 animate-pulse ring-2 ring-yellow-300 shadow-[0_0_25px_rgba(234,179,8,0.5)]' : ''
                    } ${
                      isRetracting ? 'opacity-30 scale-90' : ''
                    } ${
                      isDropped ? 'scale-95 opacity-60 translate-y-4' : ''
                    } ${
                      selectedAnswer !== null && !isGrabbed ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    style={{
                      boxShadow: selectedAnswer === null
                        ? '0 4px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)'
                        : index === currentQuestion.correctAnswer
                        ? '0 0 20px rgba(34,197,94,0.4)'
                        : '0 4px 6px rgba(0,0,0,0.3)',
                      transition: isDropped ? 'all 0.5s ease-in' : undefined,
                    }}
                  >
                    <div className="relative">
                      <span className={`text-3xl ${isRetracting ? 'opacity-0' : ''} ${isDropped ? 'opacity-0' : ''}`}>
                        {gemEmoji}
                      </span>
                      {selectedAnswer === null && (
                        <span className="absolute -top-1 -right-1 text-xs animate-ping opacity-70">✨</span>
                      )}
                      {showRopeGrab && (
                        <span className="absolute inset-0 flex items-center justify-center text-3xl animate-bounce">
                          {gemEmoji}
                        </span>
                      )}
                    </div>
                    <span className={`text-white text-xs font-bold text-center leading-tight line-clamp-2 ${
                      isRetracting ? 'opacity-0' : ''
                    }`}>
                      {option}
                    </span>
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-amber-950/40 to-transparent pointer-events-none" />

                    {selectedAnswer !== null && index === currentQuestion.correctAnswer && (
                      <div className="absolute -top-1 -right-1 text-lg">✅</div>
                    )}
                    {selectedAnswer === index && !isCorrect && (
                      <div className="absolute -top-1 -right-1 text-lg">❌</div>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedAnswer !== null && isCorrect && (
              <div className="relative z-10 mx-4 mb-2 bg-green-900/80 rounded-xl p-3 border border-green-500/50">
                <p className="text-green-300 text-xs">{currentQuestion.explanation}</p>
              </div>
            )}

            {selectedAnswer !== null && !isCorrect && hookPhase === 'dropped' && (
              <div className="relative z-10 mx-4 mb-2 bg-red-900/80 rounded-xl p-3 border border-red-500/50">
                <p className="text-red-300 text-xs">{currentQuestion.explanation}</p>
              </div>
            )}
          </div>

          {/* Hook overlay - spans from dirt section top to bottom */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none z-10" style={{ top: '25%' }}>
            <div
              className="absolute flex flex-col items-center"
              style={{
                left: '50%',
                top: '0px',
                transform: `rotate(${hookAngle}deg)`,
                transformOrigin: 'top center',
                transition: hookPhase === 'idle'
                  ? 'none'
                  : `transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)`,
              }}
            >
              <div
                className="w-1.5 bg-gradient-to-b from-amber-600 to-amber-800 rounded-full shadow-md relative"
                style={{
                  height: `${ropeLength}px`,
                  transition: hookPhase === 'extending'
                    ? `height ${EXTEND_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`
                    : hookPhase === 'retracting'
                    ? `height ${RETRACT_DURATION}ms cubic-bezier(0.36, 0, 0.66, 1)`
                    : 'height 0.3s ease',
                }}
              >
                {/* Rope speed lines */}
                {hookPhase === 'extending' && (
                  <div className="absolute inset-x-0 top-1/4 h-1/2 overflow-hidden">
                    <div className="h-full w-full" style={{
                      background: 'repeating-linear-gradient(0deg, transparent, transparent 6px, rgba(255,255,255,0.08) 6px, rgba(255,255,255,0.08) 8px)',
                      animation: 'ropeSpeed 0.3s linear infinite',
                    }} />
                  </div>
                )}
              </div>

              {/* Hook with grab effects */}
              <div className="relative -mt-0.5">
                <span className={`text-3xl block transition-all duration-200 ${
                  hookPhase === 'grabbing' ? 'scale-125' : ''
                } ${hookPhase === 'extending' ? 'scale-110' : ''}`}>
                  ⛓️
                </span>

                {/* Grabbed emoji traveling with hook */}
                {grabbedEmoji && (hookPhase === 'grabbing' || hookPhase === 'retracting') && (
                  <span
                    className="absolute left-1/2 -translate-x-1/2 text-2xl"
                    style={{
                      top: hookPhase === 'retracting' ? '-44px' : '34px',
                      transition: hookPhase === 'retracting'
                        ? 'top 0.4s cubic-bezier(0.36, 0, 0.66, 1)'
                        : 'top 0.2s ease',
                      animation: hookPhase === 'grabbing' ? 'grabBounce 0.3s ease-in-out' : undefined,
                    }}
                  >
                    {grabbedEmoji}
                  </span>
                )}

                {/* Dropped emoji falling */}
                {hookPhase === 'dropped' && grabbedEmoji === '' && gemEmojis[gemIndices[grabTarget ?? 0]] && (
                  <span
                    className="absolute left-1/2 -translate-x-1/2 text-2xl opacity-0"
                    style={{
                      animation: 'emojiFall 0.6s ease-in forwards',
                    }}
                  >
                    {gemEmojis[gemIndices[grabTarget ?? 0]]}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Score popups */}
          {scorePopups.map(popup => (
            <div
              key={popup.id}
              className="absolute z-30 text-2xl font-bold text-yellow-300 pointer-events-none"
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
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="max-w-md w-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl border-4 border-yellow-600 p-8 shadow-2xl text-center">
            <div className="text-8xl mb-4">💎</div>
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
          100% { opacity: 0; transform: translateY(-60px) scale(1.5); }
        }
        @keyframes ropeSpeed {
          0% { transform: translateY(0); }
          100% { transform: translateY(-8px); }
        }
        @keyframes grabBounce {
          0% { transform: translateX(-50%) scale(0.5); opacity: 0; }
          50% { transform: translateX(-50%) scale(1.2); opacity: 1; }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }
        @keyframes emojiFall {
          0% { opacity: 1; transform: translateX(-50%) translateY(0) rotate(0deg); }
          100% { opacity: 0; transform: translateX(-50%) translateY(60px) rotate(45deg); }
        }
      `}</style>
    </div>
  );
}