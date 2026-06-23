import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { ArrowLeft, CheckCircle, XCircle, Eye, Trophy, ThumbsUp, ThumbsDown } from 'lucide-react';

const habitScenes = [
  { id: '1', scene: '教室', emoji: '👧', action: '📚', text: '认真看书', isGood: true },
  { id: '2', scene: '教室', emoji: '👦', action: '😴', text: '趴着睡觉', isGood: false },
  { id: '3', scene: '教室', emoji: '👦', action: '✋', text: '举手发言', isGood: true },
  { id: '4', scene: '教室', emoji: '👧', action: '💬', text: '大声喧哗', isGood: false },
  { id: '5', scene: '餐厅', emoji: '👧', action: '🥗', text: '多吃蔬菜', isGood: true },
  { id: '6', scene: '餐厅', emoji: '👦', action: '🍔', text: '只吃肉', isGood: false },
  { id: '7', scene: '餐厅', emoji: '👦', action: '🍚', text: '细嚼慢咽', isGood: true },
  { id: '8', scene: '餐厅', emoji: '👧', action: '🏃', text: '边吃边玩', isGood: false },
  { id: '9', scene: '卧室', emoji: '👧', action: '😴', text: '按时睡觉', isGood: true },
  { id: '10', scene: '卧室', emoji: '👦', action: '🌙', text: '熬夜不睡', isGood: false },
  { id: '11', scene: '卧室', emoji: '👦', action: '🧹', text: '整理床铺', isGood: true },
  { id: '12', scene: '卧室', emoji: '👧', action: '📱', text: '躺玩手机', isGood: false },
  { id: '13', scene: '操场', emoji: '👧', action: '💧', text: '及时补水', isGood: true },
  { id: '14', scene: '操场', emoji: '👦', action: '🧊', text: '运动后喝冷饮', isGood: false },
  { id: '15', scene: '操场', emoji: '👦', action: '🧘', text: '运动前热身', isGood: true },
  { id: '16', scene: '操场', emoji: '👧', action: '💨', text: '不做热身', isGood: false },
];

const sceneBgColors: Record<string, string> = {
  '教室': 'from-blue-400 via-indigo-500 to-purple-600',
  '餐厅': 'from-orange-400 via-amber-500 to-yellow-600',
  '卧室': 'from-purple-400 via-pink-500 to-rose-600',
  '操场': 'from-green-400 via-emerald-500 to-teal-600',
};

const sceneEmojis: Record<string, string> = {
  '教室': '🏫',
  '餐厅': '🍽️',
  '卧室': '🛏️',
  '操场': '⚽',
};

export default function HabitGame() {
  const navigate = useNavigate();
  const { addScore, addBadge } = useGameStore();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'result'>('menu');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showFeedback, setShowFeedback] = useState<{ isCorrect: boolean; correctAnswer: string } | null>(null);
  const [answered, setAnswered] = useState(false);
  const [shuffledScenes, setShuffledScenes] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();

  const shuffleArray = <T,>(arr: T[]): T[] => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startGame = () => {
    const shuffled = shuffleArray(habitScenes.map(h => h.id));
    setShuffledScenes(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setCorrectCount(0);
    setShowFeedback(null);
    setAnswered(false);
    setGameState('playing');
  };

  const currentHabit = habitScenes.find(h => h.id === shuffledScenes[currentIndex]);

  const handleAnswer = (userAnswer: 'good' | 'bad') => {
    if (answered || !currentHabit) return;
    
    const isCorrect = (userAnswer === 'good' && currentHabit.isGood) || (userAnswer === 'bad' && !currentHabit.isGood);
    const points = isCorrect ? 25 : 0;
    
    setScore(prev => prev + points);
    if (isCorrect) setCorrectCount(prev => prev + 1);
    setShowFeedback({ 
      isCorrect, 
      correctAnswer: currentHabit.isGood ? '好习惯' : '坏习惯' 
    });
    setAnswered(true);

    setTimeout(() => {
      if (currentIndex < shuffledScenes.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setShowFeedback(null);
        setAnswered(false);
      } else {
        setGameState('result');
      }
    }, 1500);
  };

  useEffect(() => {
    if (gameState === 'playing' && !answered) {
      timerRef.current = setTimeout(() => {
        if (!answered && currentHabit) {
          setShowFeedback({ 
            isCorrect: false, 
            correctAnswer: currentHabit.isGood ? '好习惯' : '坏习惯' 
          });
          setAnswered(true);
          
          setTimeout(() => {
            if (currentIndex < shuffledScenes.length - 1) {
              setCurrentIndex(prev => prev + 1);
              setShowFeedback(null);
              setAnswered(false);
            } else {
              setGameState('result');
            }
          }, 1500);
        }
      }, 8000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [gameState, answered, currentIndex, shuffledScenes.length, currentHabit]);

  const handleGameEnd = () => {
    addScore(score);
    if (correctCount >= 12) {
      addBadge({
        id: 'habit-master',
        name: '习惯达人',
        icon: '🎯',
      });
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 via-pink-50 to-rose-100">
      <header className="bg-white/90 backdrop-blur-sm shadow-lg sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-2 rounded-full font-bold text-lg shadow-lg flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            {score} 分
          </div>
          {gameState === 'playing' && (
            <div className="bg-gray-100 px-4 py-2 rounded-full font-bold text-gray-700">
              {currentIndex + 1}/{shuffledScenes.length}
            </div>
          )}
        </div>
      </header>

      {gameState === 'menu' && (
        <div className="p-4">
          <div className="bg-white rounded-3xl p-6 shadow-xl mb-4">
            <div className="text-center mb-6">
              <div className="text-7xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">陋习找茬</h2>
              <p className="text-gray-600">观察动图，判断是好习惯还是坏习惯！</p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 mb-6">
              <h3 className="font-bold text-purple-700 mb-3 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                游戏规则
              </h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start gap-2">
                  <ThumbsUp className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>点击<span className="text-green-600 font-bold">👍 好习惯</span>选择好习惯 <span className="text-green-500 font-bold">+25分</span></span>
                </li>
                <li className="flex items-start gap-2">
                  <ThumbsDown className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>点击<span className="text-red-600 font-bold">👎 坏习惯</span>选择坏习惯</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-xl flex-shrink-0">⏱️</span>
                  <span>每张图有8秒时间思考，超时自动跳过！</span>
                </li>
              </ul>
            </div>

            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all text-lg"
            >
              开始游戏
            </button>
          </div>
        </div>
      )}

      {gameState === 'playing' && currentHabit && (
        <div className="p-4">
          <div className={`bg-gradient-to-br ${sceneBgColors[currentHabit.scene] || 'from-gray-400 to-gray-500'} rounded-3xl p-6 shadow-xl mb-4`}>
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">{sceneEmojis[currentHabit.scene]}</div>
              <h3 className="text-xl font-bold text-white">{currentHabit.scene}</h3>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl mb-6 text-center">
            <div className="relative">
              <div className={`text-9xl mb-6 ${showFeedback ? 'animate-pulse' : 'animate-bounce'}`}>
                <span className="inline-block animate-wiggle">{currentHabit.emoji}</span>
                <span className="inline-block animate-bounce-delay">{currentHabit.action}</span>
              </div>
              
              <p className="text-2xl font-bold text-gray-800 mb-2">{currentHabit.text}</p>
              
              {showFeedback && (
                <div className={`absolute inset-0 bg-white/90 rounded-3xl flex items-center justify-center animate-fade-in`}>
                  <div className={`text-center p-6 rounded-2xl ${showFeedback.isCorrect ? 'bg-green-100 border-4 border-green-400' : 'bg-red-100 border-4 border-red-400'}`}>
                    <div className={`text-6xl mb-4 ${showFeedback.isCorrect ? 'animate-bounce' : 'animate-shake'}`}>
                      {showFeedback.isCorrect ? '🎉' : '😅'}
                    </div>
                    <div className={`text-xl font-bold ${showFeedback.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {showFeedback.isCorrect ? '回答正确！+25分' : `回答错误！正确答案是${showFeedback.correctAnswer}`}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => handleAnswer('good')}
              disabled={answered}
              className={`flex-1 rounded-2xl p-6 shadow-lg transition-all ${
                answered
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:scale-105 active:scale-95'
              } bg-gradient-to-r from-green-400 to-emerald-500`}
            >
              <div className="text-5xl mb-2">👍</div>
              <div className="text-white font-bold text-xl">好习惯</div>
            </button>
            <button
              onClick={() => handleAnswer('bad')}
              disabled={answered}
              className={`flex-1 rounded-2xl p-6 shadow-lg transition-all ${
                answered
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:scale-105 active:scale-95'
              } bg-gradient-to-r from-red-400 to-rose-500`}
            >
              <div className="text-5xl mb-2">👎</div>
              <div className="text-white font-bold text-xl">坏习惯</div>
            </button>
          </div>

          <div className="mt-4 flex justify-center gap-2">
            {shuffledScenes.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all ${
                  index < currentIndex
                    ? 'bg-green-500'
                    : index === currentIndex
                    ? 'bg-purple-500 scale-125'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {gameState === 'result' && (
        <div className="p-4">
          <div className="bg-white rounded-3xl p-6 shadow-xl text-center">
            <div className="text-7xl mb-4">
              {correctCount >= 12 ? '🏆' : correctCount >= 8 ? '🎉' : '💪'}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">挑战完成！</h2>
            <div className="text-5xl font-bold text-purple-600 mb-4">
              {score} 分
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <p className="text-gray-700">
                答对 <span className="text-green-600 font-bold">{correctCount}</span> / {shuffledScenes.length} 题
              </p>
              <p className="text-gray-500 text-sm mt-1">
                正确率: {Math.round((correctCount / shuffledScenes.length) * 100)}%
              </p>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 mb-6">
              <h3 className="font-bold text-purple-700 mb-3">🏆 成就</h3>
              <div className="flex justify-center gap-4">
                <div className="text-center">
                  <div className="text-3xl">🔍</div>
                  <div className="text-xs text-gray-600">习惯侦探</div>
                </div>
                {correctCount >= 12 && (
                  <div className="text-center">
                    <div className="text-3xl">🎯</div>
                    <div className="text-xs text-gray-600">习惯达人</div>
                  </div>
                )}
                {correctCount === shuffledScenes.length && (
                  <div className="text-center">
                    <div className="text-3xl">⭐</div>
                    <div className="text-xs text-gray-600">习惯大师</div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleGameEnd}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              返回首页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
