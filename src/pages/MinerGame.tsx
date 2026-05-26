import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { questions, Question } from '@/data/questions';
import { ArrowLeft, Pickaxe, Trophy, Star, Gem, Timer, ChevronRight, RotateCcw, Home, Sparkles, CheckCircle } from 'lucide-react';

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
  const [correctCount, setCorrectCount] = useState(0);
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
    setCorrectCount(0);
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
      const swingDuration = 2500;
      const maxAngle = 50;

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
    setGameState('gameover');
    addScore(score);
  };

  const handleAnswer = useCallback((answerIndex: number) => {
    if (selectedAnswer !== null || showResult) return;

    setSelectedAnswer(answerIndex);
    const correct = answerIndex === currentQuestion?.correctAnswer;
    setIsCorrect(correct);
    setClawOpen(!correct);

    if (correct) {
      const newScore = score + 10;
      setScore(newScore);
      setCorrectCount(prev => prev + 1);
      
      setTimeout(() => {
        setSelectedAnswer(null);
        setIsCorrect(null);
        setClawOpen(true);
        setTimeLeft(TIME_LIMIT);
        setCurrentQuestion(getRandomQuestion());
        setShowResult(false);
      }, 1500);
    } else {
      setTimeout(() => {
        handleTimeout();
      }, 1000);
    }
  }, [selectedAnswer, showResult, currentQuestion, score, getRandomQuestion]);

  const getDifficultyLabel = () => {
    const difficulty = getDifficultyForScore(score);
    switch (difficulty) {
      case 'easy': return { label: '简单', color: 'text-green-400', bg: 'bg-green-500/20' };
      case 'medium': return { label: '中等', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
      case 'hard': return { label: '困难', color: 'text-red-400', bg: 'bg-red-500/20' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900 via-yellow-900 to-orange-900">
      <header className="bg-black/40 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
              {score} <Gem className="w-4 h-4 inline" />
            </div>
            <div className={`px-3 py-1 rounded-full ${getDifficultyLabel().bg}`}>
              <span className={`font-bold ${getDifficultyLabel().color}`}>{getDifficultyLabel().label}</span>
            </div>
          </div>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {gameState === 'menu' && (
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-amber-800 to-yellow-900 rounded-3xl border-4 border-yellow-400 p-8 shadow-2xl">
              <div className="text-center mb-6">
                <div className="text-8xl mb-4 animate-bounce">⛏️</div>
                <h1 className="text-3xl font-bold text-yellow-300 mb-2" style={{ textShadow: '3px 3px 0 #78350f' }}>
                  黄金矿工问答
                </h1>
                <p className="text-amber-200">学习健康知识，挖到黄金！</p>
              </div>

              <div className="bg-black/30 rounded-2xl p-5 mb-6 border-2 border-yellow-600">
                <h3 className="text-lg font-bold text-yellow-300 mb-3 flex items-center justify-center gap-2">
                  <Timer className="w-5 h-5" /> 游戏规则
                </h3>
                <ul className="space-y-2 text-amber-100 text-sm">
                  <li className="flex items-center gap-2">
                    <span>⏱️</span> 每道题15秒时间
                  </li>
                  <li className="flex items-center gap-2">
                    <span>✅</span> 答对得10分，继续答题
                  </li>
                  <li className="flex items-center gap-2">
                    <span>❌</span> 答错或超时游戏结束
                  </li>
                  <li className="flex items-center gap-2">
                    <span>📈</span> 分数越高难度越大
                  </li>
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
          <div className="max-w-lg mx-auto">
            <div className="bg-gradient-to-br from-amber-800 to-yellow-900 rounded-3xl border-4 border-yellow-400 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Pickaxe className="w-6 h-6 text-yellow-400" />
                  <span className="text-yellow-300 font-bold">第 {correctCount + 1} 题</span>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${timeLeft <= 5 ? 'bg-red-500/30' : 'bg-blue-500/30'}`}>
                  <Timer className={`w-5 h-5 ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`} />
                  <span className={`font-bold text-xl ${timeLeft <= 5 ? 'text-red-400' : 'text-blue-400'}`}>{timeLeft}s</span>
                </div>
              </div>

              <div className="bg-gradient-to-b from-amber-700/50 to-amber-800/50 rounded-2xl p-6 mb-6 border-2 border-yellow-500/50">
                <div className="flex justify-center mb-4">
                  <div 
                    className="relative"
                    style={{ 
                      transform: `rotate(${armAngle}deg)`,
                      transformOrigin: 'top center'
                    }}
                  >
                    <div className="w-3 h-32 bg-gradient-to-b from-amber-400 to-amber-600 mx-auto rounded-full shadow-lg"></div>
                    <div className={`text-4xl mt-2 transition-transform ${clawOpen ? 'scale-100' : 'scale-90'}`}>
                      {clawOpen ? '✋' : '🤝'}
                    </div>
                  </div>
                </div>

                <div className="bg-black/30 rounded-xl p-4 text-center border-2 border-yellow-600">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-300 font-bold">健康知识问题</span>
                  </div>
                  <p className="text-xl font-bold text-white leading-relaxed">
                    {currentQuestion.question}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {currentQuestion.options.map((option, index) => {
                  let buttonClass = 'bg-gradient-to-r from-amber-600 to-orange-600 border-amber-400 hover:from-amber-500 hover:to-orange-500';
                  
                  if (selectedAnswer !== null) {
                    if (index === currentQuestion.correctAnswer) {
                      buttonClass = 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-400';
                    } else if (index === selectedAnswer && !isCorrect) {
                      buttonClass = 'bg-gradient-to-r from-red-500 to-rose-600 border-red-400';
                    }
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      disabled={selectedAnswer !== null}
                      className={`p-4 rounded-xl border-2 transition-all hover:scale-102 active:translate-y-1 ${buttonClass} ${selectedAnswer !== null ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold text-white">{String.fromCharCode(65 + index)}</span>
                        </div>
                        <span className="text-white font-bold flex-1">{option}</span>
                        {selectedAnswer !== null && index === currentQuestion.correctAnswer && (
                          <CheckCircle className="w-6 h-6 text-yellow-300" />
                        )}
                        {selectedAnswer === index && !isCorrect && (
                          <span className="text-xl">❌</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedAnswer !== null && isCorrect && (
                <div className="mt-4 bg-green-900/50 rounded-xl p-4 border-2 border-green-500">
                  <p className="text-green-300 text-sm">{currentQuestion.explanation}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl border-4 border-gray-600 p-8 shadow-2xl text-center">
              <div className="text-8xl mb-4">💎</div>
              <h2 className="text-3xl font-bold text-white mb-2">游戏结束！</h2>
              <div className="text-5xl font-bold text-yellow-400 my-4">{score} 分</div>
              <div className="bg-black/30 rounded-xl p-4 mb-6">
                <div className="flex justify-center gap-4">
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">答对题数</p>
                    <p className="text-3xl font-bold text-green-400">{correctCount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">难度等级</p>
                    <p className={`text-3xl font-bold ${getDifficultyLabel().color}`}>{getDifficultyLabel().label}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={startGame}
                  className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-bold py-3 px-6 rounded-xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" /> 再玩一次
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
      </main>
    </div>
  );
}
