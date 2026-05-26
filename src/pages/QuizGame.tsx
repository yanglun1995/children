import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { questions } from '@/data/questions';
import { ArrowLeft, CheckCircle, XCircle, Trophy, Lightbulb, ChevronRight } from 'lucide-react';

type GamePhase = 'menu' | 'playing' | 'result' | 'feedback';

interface GameQuestion {
  id: string;
  category: 'hygiene' | 'vaccine' | 'disease' | 'immunity';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export default function QuizGame() {
  const navigate = useNavigate();
  const { addScore, addBadge, addKnowledgeCard } = useGameStore();
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [currentQuestions, setCurrentQuestions] = useState<GameQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [gameQuestions, setGameQuestions] = useState<GameQuestion[]>([]);
  const [questionQueue, setQuestionQueue] = useState<GameQuestion[]>([]);

  const categoryLabels = {
    hygiene: '🧼 卫生习惯',
    vaccine: '💉 疫苗接种',
    disease: '🦠 疾病防控',
    immunity: '💪 免疫力',
  };

  const categoryColors = {
    hygiene: 'from-cyan-400 to-blue-400',
    vaccine: 'from-purple-400 to-pink-400',
    disease: 'from-red-400 to-orange-400',
    immunity: 'from-green-400 to-teal-400',
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startGame = () => {
    const shuffled = shuffleArray(questions).slice(0, 5);
    setGameQuestions(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setGamePhase('playing');
  };

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(index);
    const correct = index === gameQuestions[currentIndex].correctAnswer;
    setIsCorrect(correct);
    
    if (correct) {
      setScore((prev) => prev + 20);
    }
    
    setGamePhase('feedback');
    
    setTimeout(() => {
      if (currentIndex < gameQuestions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
        setGamePhase('playing');
      } else {
        setGamePhase('result');
        handleGameOver();
      }
    }, 2500);
  };

  const handleGameOver = () => {
    addScore(score);
    if (score >= 80) {
      addBadge({
        id: 'quiz-master',
        name: '知识达人',
        icon: '🧠',
      });
    }
    if (score >= 40) {
      addKnowledgeCard({
        id: 'quiz-k1',
        title: '健康知识',
        content: '继续保持好奇心！学习健康知识可以帮助我们更好地保护自己和家人。',
        unlockedAt: new Date().toISOString(),
      });
    }
  };

  const currentQuestion = gameQuestions[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
      <header className="bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">疾病防控小擂台</h1>
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-1 rounded-full font-bold">
            {score} 分
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {gamePhase === 'menu' && (
          <div className="max-w-md mx-auto text-center">
            <div className="text-8xl mb-6">🎯</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">疾病防控小擂台</h2>
            <p className="text-gray-600 mb-6">
              回答健康知识问题<br />
              正确答案获得20分<br />
              共5道题目
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {Object.entries(categoryLabels).map(([key, label]) => (
                <div
                  key={key}
                  className={`bg-gradient-to-br ${categoryColors[key as keyof typeof categoryColors]} text-white rounded-2xl p-4 shadow-lg`}
                >
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-purple-400 to-pink-400 text-white font-bold py-4 px-12 rounded-full shadow-lg hover:scale-105 transition-transform text-xl"
            >
              开始挑战
            </button>
          </div>
        )}

        {gamePhase === 'playing' && currentQuestion && (
          <div className="max-w-lg mx-auto">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className={`bg-gradient-to-r ${categoryColors[currentQuestion.category]} text-white px-4 py-1 rounded-full text-sm font-medium`}>
                  {categoryLabels[currentQuestion.category]}
                </span>
                <span className="text-gray-600">
                  {currentIndex + 1} / {gameQuestions.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / gameQuestions.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">{currentQuestion.question}</h3>
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                      selectedAnswer === index
                        ? isCorrect
                          ? 'bg-green-100 border-green-500'
                          : 'bg-red-100 border-red-500'
                        : selectedAnswer !== null && index === currentQuestion.correctAnswer
                        ? 'bg-green-100 border-green-500'
                        : 'bg-gray-50 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        selectedAnswer === index
                          ? isCorrect
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                          : selectedAnswer !== null && index === currentQuestion.correctAnswer
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-gray-800 font-medium">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {gamePhase === 'feedback' && currentQuestion && (
          <div className="max-w-lg mx-auto">
            <div className={`bg-white rounded-3xl shadow-xl p-6 mb-6 ${
              isCorrect ? 'ring-4 ring-green-300' : 'ring-4 ring-red-300'
            }`}>
              <div className="text-center mb-4">
                {isCorrect ? (
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                ) : (
                  <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                )}
              </div>
              <h3 className="text-xl font-bold text-center mb-4">
                {isCorrect ? '回答正确！🎉' : '回答错误'}
              </h3>
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-4 mb-4">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700 font-medium mb-1">知识小贴士</p>
                    <p className="text-sm text-gray-600">{currentQuestion.explanation}</p>
                  </div>
                </div>
              </div>
              {!isCorrect && (
                <div className="text-center text-gray-600 text-sm">
                  正确答案是：{currentQuestion.options[currentQuestion.correctAnswer]}
                </div>
              )}
            </div>
            <div className="text-center">
              <button
                onClick={() => {
                  if (currentIndex < gameQuestions.length - 1) {
                    setCurrentIndex((prev) => prev + 1);
                    setSelectedAnswer(null);
                    setIsCorrect(null);
                    setGamePhase('playing');
                  } else {
                    setGamePhase('result');
                  }
                }}
                className="bg-gradient-to-r from-purple-400 to-pink-400 text-white font-bold py-3 px-8 rounded-full shadow-lg"
              >
                下一题 <ChevronRight className="w-5 h-5 inline" />
              </button>
            </div>
          </div>
        )}

        {gamePhase === 'result' && (
          <div className="max-w-md mx-auto text-center">
            <div className="text-8xl mb-6">
              {score >= 80 ? '🏆' : score >= 40 ? '⭐' : '💪'}
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">挑战完成！</h2>
            <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
              {score} 分
            </div>
            <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-3xl font-bold text-green-500">
                    {gameQuestions.filter((_, i) => i < currentIndex).filter((q, i) => true).length}
                  </div>
                  <div className="text-sm text-gray-600">正确</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-red-500">
                    {gameQuestions.length - Math.floor(score / 20)}
                  </div>
                  <div className="text-sm text-gray-600">错误</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-500">
                    {gameQuestions.length}
                  </div>
                  <div className="text-sm text-gray-600">总计</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-purple-400 to-pink-400 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transition-transform"
              >
                再来一局
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-gray-100 text-gray-700 font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transition-transform"
              >
                返回首页
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
