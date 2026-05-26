import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { questions, Question } from '@/data/questions';
import { ArrowLeft, Pickaxe, Trophy, Star, Gem, Timer, ChevronRight, RotateCcw, Home, Sparkles } from 'lucide-react';

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const getDifficultyForScore = (score: number): 'easy' | 'medium' | 'hard' => {
  if (score < 100) return 'easy';
  if (score < 250) return 'medium';
  return 'hard';
};

const TIME_LIMIT = 15;

export default function MinerGame() {
  const navigate = useNavigate();
  const { addScore } = useGameStore();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [armAngle, setArmAngle] = useState(0);
  const [clawOpen, setClawOpen] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const animationRef = useRef<number>();
  const timerRef = useRef<NodeJS.Timeout>();

  const getRandomQuestion = useCallback(() => {
    const difficulty = getDifficultyForScore(score);
    const filtered = questions.filter(q => q.difficulty === difficulty);
    const shuffled = shuffleArray(filtered);
    return shuffled[0];
  }, [score]);

  const startGame = useCallback(() => {
    setScore(0);
    setGameState('playing');
    setCurrentQuestion(getRandomQuestion());
    setTimeLeft(TIME_LIMIT);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowResult(false);
    setClawOpen(true);
  }, [getRandomQuestion]);

  useEffect(() => {
    if (gameState !== 'playing' || showResult) return;

    const swingArm = () => {
      const startTime = Date.now();
      const swingDuration = 2000;
      const maxAngle = 60;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = (elapsed % swingDuration) / swingDuration;
        const angle = Math.sin(progress * Math.PI * 2) * maxAngle;
        setArmAngle(angle);
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    };

    swingArm();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, showResult, score]);

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
  }, [gameState, showResult, currentQuestion]);

  const handleTimeout = useCallback(() => {
    setShowResult(true);
    setIsCorrect(false);
    setClawOpen(false);
    setTimeout(() => {
      setGameState('gameover');
      addScore(score);
    }, 1500);
  }, [score, addScore]);

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null || showResult) return;

    setSelectedAnswer(answerIndex);
    const correct = answerIndex === currentQuestion?.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
    setClawOpen(false);

    if (correct) {
      setScore(prev => prev + 20);
      setTimeout(() => {
        setClawOpen(true);
        setCurrentQuestion(getRandomQuestion());
        setTimeLeft(TIME_LIMIT);
        setSelectedAnswer(null);
        setIsCorrect(null);
        setShowResult(false);
      }, 1000);
    } else {
      setTimeout(() => {
        setGameState('gameover');
        addScore(score);
      }, 1500);
    }
  };

  const handleBack = () => {
    if (gameState === 'menu') {
      navigate('/');
    } else {
      setGameState('menu');
    }
  };

  const getTimerColor = () => {
    if (timeLeft > 10) return 'text-green-400';
    if (timeLeft > 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900 via-yellow-900 to-amber-950 overflow-hidden">
      <header className="bg-black/40 backdrop-blur-sm border-b-4 border-yellow-600 shadow-[0_4px_0_#78350f]">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="w-12 h-12 bg-gray-800 border-4 border-yellow-700 rounded-lg flex items-center justify-center hover:bg-gray-700 active:translate-y-1 transition-all shadow-[0_4px_0_#374151]"
          >
            <ArrowLeft className="w-6 h-6 text-yellow-400" />
          </button>
          <div className="flex items-center gap-2 text-2xl font-bold text-yellow-400">
            <Gem className="w-7 h-7 fill-yellow-400" />
            <span>{score}</span>
            <Gem className="w-7 h-7 fill-yellow-400" />
          </div>
          <div className="w-12"></div>
        </div>
      </header>

      {gameState === 'menu' && (
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto">
            <div className="bg-gradient-to-br from-amber-700 to-amber-900 rounded-3xl border-8 border-yellow-500 p-8 shadow-[0_8px_0_#78350f,inset_0_0_50px_rgba(0,0,0,0.3)]">
              <div className="text-center mb-6">
                <div className="text-7xl mb-4 animate-bounce">
                  <Pickaxe className="w-20 h-20 mx-auto text-yellow-400" />
                </div>
                <h1 className="text-4xl font-bold text-yellow-400 mb-2" style={{ textShadow: '4px 4px 0 #92400e' }}>
                  黄金矿工问答
                </h1>
                <p className="text-amber-200 text-lg">
                  挖掘健康知识宝藏！
                </p>
              </div>

              <div className="bg-black/30 rounded-2xl p-6 mb-6 border-4 border-amber-600">
                <h3 className="text-xl font-bold text-yellow-400 mb-4 text-center flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  游戏规则
                  <Sparkles className="w-5 h-5" />
                </h3>
                <div className="space-y-3 text-amber-100">
                  <p className="flex items-start gap-3">
                    <span className="text-yellow-400 text-2xl">⛏️</span>
                    <span>手臂左右摆动抓取问题</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-yellow-400 text-2xl">⏱️</span>
                    <span>每个问题有15秒作答时间</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-green-400 text-2xl">✅</span>
                    <span>答对 +20 金币</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-red-400 text-2xl">❌</span>
                    <span>答错或超时游戏结束</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-purple-400 text-2xl">📈</span>
                    <span>分数越高，题目难度越大！</span>
                  </p>
                </div>
              </div>

              <button
                onClick={startGame}
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-2xl font-bold py-4 rounded-2xl border-4 border-yellow-300 hover:from-yellow-400 hover:to-amber-400 active:translate-y-2 transition-all shadow-[0_6px_0_#92400e]"
              >
                <span className="flex items-center justify-center gap-2">
                  <Pickaxe className="w-7 h-7" />
                  开始挖掘
                  <Pickaxe className="w-7 h-7" />
                </span>
              </button>

              <div className="mt-6 flex justify-center gap-4 text-4xl">
                <span className="animate-pulse">💎</span>
                <span className="animate-bounce">🪙</span>
                <span className="animate-pulse">⭐</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>🪙</span>
                <span className="animate-pulse">💎</span>
              </div>
            </div>
          </div>
        </main>
      )}

      {gameState === 'playing' && currentQuestion && (
        <main className="container mx-auto px-4 py-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-b from-stone-700 to-stone-900 rounded-3xl border-8 border-amber-600 p-4 mb-4 shadow-[0_8px_0_#44403c] relative overflow-hidden">
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 50px, #92400e 50px, #92400e 51px)`
              }}></div>
              
              <div className="flex justify-between items-center mb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <Timer className={`w-5 h-5 ${getTimerColor()}`} />
                  <span className={`text-xl font-bold ${getTimerColor()}`}>
                    {timeLeft}s
                  </span>
                </div>
                <div className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-5 h-5 fill-yellow-400" />
                  <span className="font-bold">+20</span>
                </div>
              </div>

              <div className="relative h-48 flex items-center justify-center">
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-32 bg-gradient-to-t from-stone-600 to-stone-400"></div>
                
                <div 
                  className="absolute bottom-0 left-1/2 origin-bottom transition-transform duration-100"
                  style={{ transform: `translateX(-50%) rotate(${armAngle}deg)` }}
                >
                  <div className="w-3 h-24 bg-gradient-to-t from-amber-600 to-amber-400 rounded-sm"></div>
                  <div 
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 transition-transform duration-200"
                    style={{ transform: `translateX(-50%) ${clawOpen ? 'translateY(-8px)' : 'translateY(0)'}` }}
                  >
                    <div className="text-5xl">
                      {showResult ? (
                        isCorrect ? '✅' : '❌'
                      ) : (
                        '❓'
                      )}
                    </div>
                    <div className={`flex gap-1 -translate-x-1/2 left-1/2`} style={{ 
                      transform: clawOpen ? 'rotate(-30deg)' : 'rotate(0deg)',
                      transformOrigin: 'center'
                    }}>
                      <div className="w-2 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-sm" 
                           style={{ transform: clawOpen ? 'rotate(-45deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}></div>
                      <div className="w-2 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-sm"
                           style={{ transform: clawOpen ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}></div>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-2 left-4 text-4xl">🧑‍🏭</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-3xl border-6 border-amber-500 p-5 shadow-[0_6px_0_#78350f]">
              <div className="bg-black/30 rounded-2xl p-4 mb-4 border-4 border-amber-600">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-3 py-1 rounded-full font-bold text-xs">
                    {currentQuestion.category === 'hygiene' ? '🧼 卫生' :
                     currentQuestion.category === 'vaccine' ? '💉 疫苗' :
                     currentQuestion.category === 'disease' ? '🦠 疾病' :
                     currentQuestion.category === 'immunity' ? '💪 免疫' :
                     currentQuestion.category === 'nutrition' ? '🥗 营养' : '🌟 习惯'}
                  </span>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    currentQuestion.difficulty === 'easy' ? 'bg-green-900 text-green-300' :
                    currentQuestion.difficulty === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-red-900 text-red-300'
                  }`}>
                    {currentQuestion.difficulty === 'easy' ? '简单' :
                     currentQuestion.difficulty === 'medium' ? '中等' : '困难'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-amber-100 leading-relaxed">
                  {currentQuestion.question}
                </h2>
              </div>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  let bgClass = 'bg-gradient-to-r from-amber-600 to-amber-700 border-amber-400 hover:from-amber-500 hover:to-amber-600';
                  
                  if (showResult) {
                    if (index === currentQuestion.correctAnswer) {
                      bgClass = 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-300';
                    } else if (index === selectedAnswer) {
                      bgClass = 'bg-gradient-to-r from-red-500 to-rose-600 border-red-300';
                    }
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      disabled={showResult}
                      className={`w-full text-left p-4 rounded-2xl border-4 transition-all hover:scale-102 active:translate-y-1 ${bgClass} ${showResult ? 'opacity-90 cursor-not-allowed' : 'cursor-pointer shadow-[0_4px_0_#78350f]'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold border-2 ${
                          showResult && index === currentQuestion.correctAnswer
                            ? 'bg-white/20 border-white text-white'
                            : showResult && index === selectedAnswer && !isCorrect
                            ? 'bg-white/20 border-white text-white'
                            : 'bg-black/20 border-amber-300 text-amber-100'
                        }`}>
                          {index === 0 ? 'A' : index === 1 ? 'B' : index === 2 ? 'C' : 'D'}
                        </span>
                        <span className="flex-1 font-bold text-amber-50">{option}</span>
                        {showResult && index === currentQuestion.correctAnswer && (
                          <span className="text-2xl"><Star className="w-7 h-7 text-yellow-300 fill-yellow-300" /></span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {showResult && (
                <div className={`mt-4 p-4 rounded-2xl border-4 ${isCorrect ? 'bg-green-900/50 border-green-400' : 'bg-red-900/50 border-red-400'}`}>
                  <p className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    {isCorrect ? '🎉 回答正确！' : '😢 回答错误！'}
                  </p>
                  <p className="text-amber-100 text-sm">{currentQuestion.explanation}</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-center gap-2">
              {Array.from({ length: Math.min(5, Math.floor(score / 20) + 1) }).map((_, i) => (
                <Gem key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400 animate-pulse" />
              ))}
            </div>
          </div>
        </main>
      )}

      {gameState === 'gameover' && (
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto">
            <div className="bg-gradient-to-br from-stone-700 to-stone-900 rounded-3xl border-8 border-red-500 p-8 shadow-[0_8px_0_#7f1d1d]">
              <div className="text-center mb-6">
                <div className="text-7xl mb-4">
                  {score >= 100 ? '💎' : score >= 50 ? '🪙' : '💰'}
                </div>
                <h1 className="text-4xl font-bold text-red-400 mb-2" style={{ textShadow: '3px 3px 0 #7f1d1d' }}>
                  游戏结束
                </h1>
                <p className="text-stone-300 text-lg mb-4">
                  {score >= 100 ? '太厉害了！' : score >= 50 ? '还不错！' : '继续加油！'}
                </p>
                <div className="bg-black/30 rounded-2xl p-6 mb-4 border-4 border-yellow-500">
                  <p className="text-stone-300 text-sm mb-2">获得金币</p>
                  <div className="text-6xl font-bold text-yellow-400 flex items-center justify-center gap-3">
                    <Gem className="w-10 h-10 fill-yellow-400" />
                    <span>{score}</span>
                    <Gem className="w-10 h-10 fill-yellow-400" />
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-2xl p-6 mb-6 border-4 border-stone-600">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-6 h-6 text-yellow-400" />
                  <span className="text-white font-bold">本次成绩</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-stone-700/50 rounded-xl p-3">
                    <p className="text-stone-400 text-sm">答对题目</p>
                    <p className="text-2xl font-bold text-green-400">{Math.floor(score / 20)} 道</p>
                  </div>
                  <div className="bg-stone-700/50 rounded-xl p-3">
                    <p className="text-stone-400 text-sm">最高难度</p>
                    <p className="text-2xl font-bold text-amber-400">
                      {score >= 250 ? '困难' : score >= 100 ? '中等' : '简单'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={startGame}
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xl font-bold py-4 rounded-2xl border-4 border-yellow-300 hover:from-yellow-400 hover:to-amber-400 active:translate-y-2 transition-all shadow-[0_5px_0_#92400e]"
                >
                  <span className="flex items-center justify-center gap-2">
                    <RotateCcw className="w-6 h-6" />
                    再玩一次
                  </span>
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gradient-to-r from-stone-600 to-stone-700 text-white text-xl font-bold py-4 rounded-2xl border-4 border-stone-400 hover:from-stone-500 hover:to-stone-600 active:translate-y-2 transition-all shadow-[0_5px_0_#374151]"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Home className="w-6 h-6" />
                    返回首页
                  </span>
                </button>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
