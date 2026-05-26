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
  const [hookExtended, setHookExtended] = useState(false);
  const [grabTarget, setGrabTarget] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [gemIndices, setGemIndices] = useState<number[]>([]);
  const [scorePopups, setScorePopups] = useState<{id: number; x: number; y: number}[]>([]);
  const animationRef = useRef<number>();
  const timerRef = useRef<NodeJS.Timeout>();
  const scorePopupIdRef = useRef(0);

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
    setHookExtended(false);
    setGrabTarget(null);
    setGemIndices(generateGemIndices());
    setScorePopups([]);
  }, [getRandomQuestion]);

  useEffect(() => {
    if (gameState !== 'playing' || showResult) return;

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
  }, [gameState, showResult]);

  useEffect(() => {
    if (gameState !== 'playing' || showResult) return;

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
  }, [gameState, showResult]);

  const handleTimeout = () => {
    setShowResult(true);
    setTimeout(() => {
      setGameState('gameover');
      addScore(score);
    }, 800);
  };

  const handleAnswer = useCallback((answerIndex: number) => {
    if (selectedAnswer !== null || showResult) return;

    setSelectedAnswer(answerIndex);
    setHookExtended(true);
    setGrabTarget(answerIndex);

    const correct = answerIndex === currentQuestion?.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      const newScore = score + 10;
      setScore(newScore);

      const popupId = scorePopupIdRef.current++;
      setScorePopups(prev => [...prev, { id: popupId, x: answerIndex % 2 === 0 ? 30 : 70, y: 50 }]);
      setTimeout(() => {
        setScorePopups(prev => prev.filter(p => p.id !== popupId));
      }, 1200);

      setTimeout(() => {
        setSelectedAnswer(null);
        setIsCorrect(null);
        setHookExtended(false);
        setGrabTarget(null);
        setTimeLeft(TIME_LIMIT);
        setCurrentQuestion(getRandomQuestion());
        setShowResult(false);
        setCorrectCount(prev => prev + 1);
        setGemIndices(generateGemIndices());
      }, 1500);
    } else {
      setTimeout(() => {
        handleTimeout();
      }, 1200);
    }
  }, [selectedAnswer, showResult, currentQuestion, score, getRandomQuestion]);

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
                <li className="flex items-center gap-2"><span>✅</span> 答对得10分，继续挖宝</li>
                <li className="flex items-center gap-2"><span>❌</span> 答错或超时游戏结束</li>
                <li className="flex items-center gap-2"><span>💎</span> 点击宝藏方块选择答案</li>
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
          {/* Ground / Sky area */}
          <div className="relative h-[25%] min-h-[120px] bg-gradient-to-b from-sky-400 via-sky-300 to-green-400">
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-b from-green-500 to-green-700">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle, #4ade80 1px, transparent 1px)',
                backgroundSize: '12px 12px',
                opacity: 0.4,
              }} />
            </div>
            {/* Grass tufts */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-around text-2xl opacity-60">
              <span>🌿</span><span>🌱</span><span>🌿</span><span>🌱</span><span>🌿</span>
              <span>🌱</span><span>🌿</span><span>🌱</span><span>🌿</span><span>🌱</span>
            </div>
            {/* Miner */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="text-5xl" style={{ filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.3))' }}>🧑‍🏭</div>
              <div className="text-xs font-bold text-white bg-amber-700 px-2 py-0.5 rounded-full mt-0.5 whitespace-nowrap">
                矿工
              </div>
            </div>
          </div>

          {/* Rope and Hook area */}
          <div className="relative h-[15%] min-h-[80px] bg-gradient-to-b from-green-700 via-amber-900 to-amber-950">
            {/* Dirt texture */}
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: 'radial-gradient(circle, #92400e 2px, transparent 2px)',
              backgroundSize: '16px 16px',
            }} />
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-green-700 to-transparent" />

            {/* Swinging rope and hook */}
            <div
              className="absolute top-2 left-1/2 flex flex-col items-center transition-transform duration-300 ease-in-out"
              style={{
                transform: `rotate(${hookAngle}deg)`,
                transformOrigin: 'top center',
              }}
            >
              {/* Rope */}
              <div className="w-1.5 h-12 bg-gradient-to-b from-amber-600 to-amber-800 rounded-full shadow-md" />
              {/* Hook */}
              <div className={`text-3xl mt-0.5 transition-all duration-300 ${
                hookExtended ? 'scale-125 translate-y-2' : ''
              }`}>
                ⛓️
              </div>
            </div>
          </div>

          {/* Underground area with question and options */}
          <div className="flex-1 bg-gradient-to-b from-amber-950 via-amber-900 to-yellow-950 relative overflow-hidden">
            {/* Dirt texture background */}
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'radial-gradient(circle, #78350f 3px, transparent 3px)',
              backgroundSize: '20px 20px',
            }} />
            {/* Layered dirt lines */}
            <div className="absolute top-4 left-0 right-0 h-px bg-amber-800/30" />
            <div className="absolute top-12 left-0 right-0 h-px bg-amber-800/20" />
            <div className="absolute bottom-20 left-0 right-0 h-px bg-amber-800/30" />

            {/* Buried small rocks */}
            <div className="absolute top-8 left-[20%] text-2xl opacity-30">🪨</div>
            <div className="absolute top-6 right-[15%] text-xl opacity-25">🪨</div>
            <div className="absolute bottom-16 left-[10%] text-xl opacity-20">🪨</div>
            <div className="absolute bottom-12 right-[25%] text-2xl opacity-25">🪨</div>

            {/* Question display */}
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

            {/* Option gems/treasures */}
            <div className="relative z-10 mx-3 mt-1 grid grid-cols-2 gap-3 px-1 pb-4">
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

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={selectedAnswer !== null}
                    className={`relative rounded-xl border-2 p-3 transition-all duration-300 flex flex-col items-center gap-1 overflow-hidden ${
                      optionStyle
                    } ${
                      isGrabbed ? 'scale-105 translate-y-2 shadow-2xl' : 'hover:scale-102 active:translate-y-0.5 shadow-lg'
                    } ${
                      selectedAnswer !== null ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    style={{
                      boxShadow: selectedAnswer === null
                        ? '0 4px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)'
                        : index === currentQuestion.correctAnswer
                        ? '0 0 20px rgba(34,197,94,0.4)'
                        : '0 4px 6px rgba(0,0,0,0.3)',
                    }}
                  >
                    {/* Sparkle effect on gem */}
                    <div className="relative">
                      <span className="text-3xl">{gemEmoji}</span>
                      {selectedAnswer === null && (
                        <span className="absolute -top-1 -right-1 text-xs animate-ping opacity-70">✨</span>
                      )}
                    </div>
                    <span className="text-white text-xs font-bold text-center leading-tight line-clamp-2">
                      {option}
                    </span>
                    {/* Dirt overlay at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-amber-950/40 to-transparent pointer-events-none" />

                    {/* Correct/incorrect indicator */}
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

            {/* Score popups */}
            {scorePopups.map(popup => (
              <div
                key={popup.id}
                className="absolute z-20 text-2xl font-bold text-yellow-300 pointer-events-none animate-float"
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

            {/* Explanation on correct answer */}
            {selectedAnswer !== null && isCorrect && (
              <div className="relative z-10 mx-4 mb-2 bg-green-900/80 rounded-xl p-3 border border-green-500/50">
                <p className="text-green-300 text-xs">{currentQuestion.explanation}</p>
              </div>
            )}
          </div>
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

      {/* Score float animation keyframes */}
      <style>{`
        @keyframes scoreFloat {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-60px) scale(1.5); }
        }
      `}</style>
    </div>
  );
}