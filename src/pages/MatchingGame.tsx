import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { ArrowLeft, Trophy, Clock, Star, Sparkles, RefreshCw, Heart } from 'lucide-react';

interface HealthCard {
  id: string;
  emoji: string;
  text: string;
  pairId: number;
}

interface GameCard {
  id: string;
  emoji: string;
  text: string;
  pairId: number;
  isFlipped: boolean;
  isMatched: boolean;
}

const healthPairs: HealthCard[] = [
  { id: 'mask-1', emoji: '😷', text: '戴口罩', pairId: 1 },
  { id: 'mask-2', emoji: '😷', text: '戴口罩', pairId: 1 },
  { id: 'wash-1', emoji: '🧼', text: '勤洗手', pairId: 2 },
  { id: 'wash-2', emoji: '🧼', text: '勤洗手', pairId: 2 },
  { id: 'vaccine-1', emoji: '💉', text: '打疫苗', pairId: 3 },
  { id: 'vaccine-2', emoji: '💉', text: '打疫苗', pairId: 3 },
  { id: 'exercise-1', emoji: '🏃', text: '多运动', pairId: 4 },
  { id: 'exercise-2', emoji: '🏃', text: '多运动', pairId: 4 },
  { id: 'sleep-1', emoji: '😴', text: '睡好觉', pairId: 5 },
  { id: 'sleep-2', emoji: '😴', text: '睡好觉', pairId: 5 },
  { id: 'water-1', emoji: '💧', text: '多喝水', pairId: 6 },
  { id: 'water-2', emoji: '💧', text: '多喝水', pairId: 6 },
  { id: 'vegetable-1', emoji: '🥬', text: '吃蔬菜', pairId: 7 },
  { id: 'vegetable-2', emoji: '🥬', text: '吃蔬菜', pairId: 7 },
  { id: 'fruit-1', emoji: '🍎', text: '吃水果', pairId: 8 },
  { id: 'fruit-2', emoji: '🍎', text: '吃水果', pairId: 8 },
  { id: 'brush-1', emoji: '🪥', text: '刷刷牙', pairId: 9 },
  { id: 'brush-2', emoji: '🪥', text: '刷刷牙', pairId: 9 },
  { id: 'ventilate-1', emoji: '🪟', text: '常通风', pairId: 10 },
  { id: 'ventilate-2', emoji: '🪟', text: '常通风', pairId: 10 },
];

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function MatchingGame() {
  const navigate = useNavigate();
  const { addScore, addBadge } = useGameStore();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'victory' | 'defeat'>('menu');
  const [cards, setCards] = useState<GameCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [showMatchEffect, setShowMatchEffect] = useState(false);
  const [showFailEffect, setShowFailEffect] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const totalPairs = useMemo(() => {
    switch (difficulty) {
      case 'easy': return 5;
      case 'medium': return 8;
      case 'hard': return 10;
    }
  }, [difficulty]);

  const initializeCards = useCallback(() => {
    const selectedPairs = healthPairs.slice(0, totalPairs * 2);
    const shuffledCards = shuffleArray(selectedPairs.map((card, index) => ({
      ...card,
      id: `${card.id}-${index}`,
      isFlipped: false,
      isMatched: false,
    })));
    return shuffledCards;
  }, [totalPairs]);

  const startGame = useCallback((selectedDifficulty: 'easy' | 'medium' | 'hard') => {
    setDifficulty(selectedDifficulty);
    setCards(initializeCards());
    setSelectedCards([]);
    setScore(0);
    setTimeLeft(selectedDifficulty === 'easy' ? 150 : selectedDifficulty === 'medium' ? 120 : 90);
    setMatchedPairs(0);
    setGameState('playing');
    setIsProcessing(false);
  }, [initializeCards]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('defeat');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'playing' && matchedPairs === totalPairs) {
      const finalScore = score + Math.floor(timeLeft * 2);
      addScore(finalScore);
      if (finalScore >= 100) {
        addBadge({
          id: 'matching-master',
          name: '记忆大师',
          icon: '🧠',
        });
      }
      setTimeout(() => setGameState('victory'), 500);
    }
  }, [gameState, matchedPairs, totalPairs, score, timeLeft, addScore, addBadge]);

  const handleCardClick = (cardId: string) => {
    if (isProcessing) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;
    if (selectedCards.length >= 2) return;
    if (selectedCards.includes(cardId)) return;

    const newFlippedCards = [...selectedCards, cardId];
    setSelectedCards(newFlippedCards);

    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));

    if (newFlippedCards.length === 2) {
      setIsProcessing(true);
      const [firstId, secondId] = newFlippedCards;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            (c.id === firstId || c.id === secondId) 
              ? { ...c, isMatched: true }
              : c
          ));
          setScore(prev => prev + 10);
          setMatchedPairs(prev => prev + 1);
          setShowMatchEffect(true);
          setTimeout(() => setShowMatchEffect(false), 600);
          setSelectedCards([]);
          setIsProcessing(false);
        }, 400);
      } else {
        setTimeout(() => {
          setShowFailEffect(true);
          setTimeout(() => setShowFailEffect(false), 300);
        }, 400);
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            (c.id === firstId || c.id === secondId) 
              ? { ...c, isFlipped: false }
              : c
          ));
          setSelectedCards([]);
          setIsProcessing(false);
        }, 1000);
      }
    }
  };

  const getTimeColor = () => {
    if (timeLeft > 60) return 'text-green-400';
    if (timeLeft > 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const gridCols = () => {
    switch (difficulty) {
      case 'easy': return 'grid-cols-4';
      case 'medium': return 'grid-cols-4';
      case 'hard': return 'grid-cols-5';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-800 via-teal-700 to-cyan-600">
      <header className="bg-black/40 backdrop-blur-sm border-b-4 border-yellow-400 shadow-[0_4px_0_#065f46]">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => gameState === 'menu' ? navigate('/') : setGameState('menu')}
            className="w-12 h-12 bg-gray-800 border-4 border-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-700 active:translate-y-1 transition-all shadow-[0_4px_0_#1f2937]"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="text-2xl font-bold text-yellow-400 tracking-wider flex items-center gap-2">
            <Star className="w-6 h-6 fill-yellow-400" />
            {score}
            <Star className="w-6 h-6 fill-yellow-400" />
          </div>
          <div className={`flex items-center gap-2 text-xl font-bold ${getTimeColor()} bg-black/30 px-4 py-2 rounded-full border-2 border-current`}>
            <Clock className="w-6 h-6" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {gameState === 'menu' && (
          <div className="max-w-lg mx-auto">
            <div className="bg-gradient-to-br from-teal-700 to-emerald-800 rounded-3xl border-8 border-yellow-400 p-8 shadow-[0_8px_0_#065f46,inset_0_0_50px_rgba(0,0,0,0.3)]">
              <div className="text-center mb-8">
                <div className="text-7xl mb-4 animate-bounce">
                  🧩
                </div>
                <h1 className="text-4xl font-bold text-yellow-400 mb-3" style={{ textShadow: '3px 3px 0 #065f46' }}>
                  健康连连看
                </h1>
                <p className="text-cyan-200 text-lg">
                  找到相同的健康图案，学习健康知识！
                </p>
              </div>

              <div className="bg-black/30 rounded-2xl p-6 mb-6 border-4 border-teal-400">
                <h3 className="text-xl font-bold text-yellow-400 mb-4 text-center flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  游戏规则
                  <Sparkles className="w-5 h-5" />
                </h3>
                <div className="space-y-3 text-white">
                  <p className="flex items-start gap-3">
                    <span className="text-2xl">👆</span>
                    <span>点击两个相同的图案进行配对</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <span>配对成功获得 <strong className="text-yellow-400">+10分</strong></span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-2xl">⏱️</span>
                    <span>在规定时间内完成所有配对</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-2xl">🏆</span>
                    <span>剩余时间可兑换额外分数！</span>
                  </p>
                </div>
              </div>

              <div className="bg-black/20 rounded-2xl p-5 mb-6 border-4 border-teal-500">
                <h3 className="text-lg font-bold text-cyan-300 mb-4 text-center">选择难度</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => startGame('easy')}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-2xl border-4 border-green-300 hover:from-green-400 hover:to-emerald-500 active:translate-y-1 transition-all shadow-[0_4px_0_#047857]"
                  >
                    <div className="text-3xl mb-1">⭐</div>
                    <div className="font-bold">简单</div>
                    <div className="text-sm opacity-80">5对 • 2分30秒</div>
                  </button>
                  <button
                    onClick={() => startGame('medium')}
                    className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white p-4 rounded-2xl border-4 border-yellow-300 hover:from-yellow-400 hover:to-orange-500 active:translate-y-1 transition-all shadow-[0_4px_0_#c2410c]"
                  >
                    <div className="text-3xl mb-1">⭐⭐</div>
                    <div className="font-bold">中等</div>
                    <div className="text-sm opacity-80">8对 • 2分钟</div>
                  </button>
                  <button
                    onClick={() => startGame('hard')}
                    className="bg-gradient-to-r from-red-500 to-rose-600 text-white p-4 rounded-2xl border-4 border-red-300 hover:from-red-400 hover:to-rose-500 active:translate-y-1 transition-all shadow-[0_4px_0_#9f1239]"
                  >
                    <div className="text-3xl mb-1">⭐⭐⭐</div>
                    <div className="font-bold">困难</div>
                    <div className="text-sm opacity-80">10对 • 1分30秒</div>
                  </button>
                </div>
              </div>

              <div className="bg-cyan-900/30 rounded-2xl p-4 border-4 border-cyan-400">
                <h4 className="text-center text-cyan-300 font-bold mb-3">健康配对提示</h4>
                <div className="grid grid-cols-5 gap-2 text-center text-sm">
                  <div className="bg-black/30 rounded-lg p-2">
                    <div className="text-2xl">😷</div>
                    <div className="text-white">口罩</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-2">
                    <div className="text-2xl">🧼</div>
                    <div className="text-white">洗手</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-2">
                    <div className="text-2xl">💉</div>
                    <div className="text-white">疫苗</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-2">
                    <div className="text-2xl">🏃</div>
                    <div className="text-white">运动</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-2">
                    <div className="text-2xl">💧</div>
                    <div className="text-white">喝水</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="max-w-2xl mx-auto">
            <div className={`bg-gradient-to-br from-teal-800/80 to-emerald-900/80 rounded-3xl border-4 border-teal-400 p-4 mb-4 shadow-lg relative ${
              showMatchEffect ? 'animate-pulse' : ''
            } ${showFailEffect ? 'animate-shake' : ''}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="bg-gradient-to-r from-green-400 to-emerald-400 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {difficulty === 'easy' ? '⭐简单' : difficulty === 'medium' ? '⭐⭐中等' : '⭐⭐⭐困难'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-cyan-300">
                    已配对: <span className="text-yellow-400 font-bold">{matchedPairs}</span>/{totalPairs}
                  </span>
                </div>
              </div>
            </div>

            <div className={`grid ${gridCols()} gap-3 p-4 bg-black/30 rounded-3xl border-4 border-teal-500 shadow-[0_8px_0_#0f766e]`}>
              {cards.map(card => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  disabled={card.isMatched || card.isFlipped}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border-4 ${
                    card.isMatched 
                      ? 'bg-green-600/50 border-green-400 scale-95 opacity-60 cursor-default'
                      : card.isFlipped 
                        ? 'bg-cyan-600 border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.5)]'
                        : 'bg-gradient-to-br from-purple-600 to-indigo-700 border-purple-400 hover:from-purple-500 hover:to-indigo-600 hover:scale-105 active:scale-95 shadow-[0_4px_0_#4c1d95]'
                  }`}
                >
                  {card.isFlipped || card.isMatched ? (
                    <>
                      <span className={`text-4xl ${card.isMatched ? 'grayscale opacity-50' : ''}`}>
                        {card.emoji}
                      </span>
                      <span className={`text-xs mt-1 font-bold ${card.isMatched ? 'text-green-300 line-through' : 'text-white'}`}>
                        {card.text}
                      </span>
                    </>
                  ) : (
                    <span className="text-4xl opacity-50">?</span>
                  )}
                </button>
              ))}
            </div>

            {selectedCards.length === 1 && (
              <div className="mt-4 text-center">
                <p className="text-cyan-300 text-lg animate-pulse">选择第二个图案...</p>
              </div>
            )}
          </div>
        )}

        {gameState === 'victory' && (
          <div className="max-w-lg mx-auto">
            <div className="bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 rounded-3xl border-8 border-yellow-300 p-8 shadow-[0_8px_0_#92400e] relative overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-4 left-10 text-6xl animate-spin">✨</div>
                <div className="absolute top-20 right-10 text-5xl animate-pulse">⭐</div>
                <div className="absolute bottom-20 left-20 text-5xl animate-bounce">🌟</div>
                <div className="absolute bottom-10 right-20 text-6xl animate-ping">✨</div>
              </div>
              
              <div className="relative text-center mb-6">
                <div className="text-8xl mb-4">
                  <Trophy className="w-24 h-24 mx-auto text-yellow-200" />
                </div>
                <h1 className="text-4xl font-bold text-white mb-2" style={{ textShadow: '3px 3px 0 #92400e' }}>
                  🎉 恭喜通关！🎉
                </h1>
                <p className="text-yellow-100 text-lg">
                  健康知识记得真棒！
                </p>
              </div>

              <div className="bg-white/20 rounded-2xl p-6 mb-6 border-4 border-yellow-300">
                <div className="text-center mb-4">
                  <p className="text-white text-lg mb-1">最终得分</p>
                  <div className="text-6xl font-bold text-white">
                    {score + Math.floor(timeLeft * 2)}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-black/20 rounded-xl p-3">
                    <div className="text-2xl font-bold text-white">{score}</div>
                    <div className="text-yellow-100 text-sm">配对得分</div>
                  </div>
                  <div className="bg-black/20 rounded-xl p-3">
                    <div className="text-2xl font-bold text-white">{Math.floor(timeLeft * 2)}</div>
                    <div className="text-yellow-100 text-sm">时间奖励</div>
                  </div>
                  <div className="bg-black/20 rounded-xl p-3">
                    <div className="text-2xl font-bold text-white">{totalPairs}</div>
                    <div className="text-yellow-100 text-sm">配对数</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/20 rounded-2xl p-5 mb-6 border-4 border-yellow-300">
                <h3 className="text-lg font-bold text-white mb-3 text-center flex items-center justify-center gap-2">
                  <Heart className="w-5 h-5 text-red-400 fill-red-400" />
                  健康小贴士
                  <Heart className="w-5 h-5 text-red-400 fill-red-400" />
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {healthPairs.slice(0, 4).map(pair => (
                    <div key={pair.id} className="flex items-center gap-2 bg-black/20 rounded-lg p-2">
                      <span className="text-xl">{pair.emoji}</span>
                      <span className="text-white">{pair.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => startGame(difficulty)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl font-bold py-4 rounded-2xl border-4 border-green-300 hover:from-green-400 hover:to-emerald-500 active:translate-y-2 transition-all shadow-[0_5px_0_#047857]"
                >
                  🔄 再玩一次
                </button>
                <button
                  onClick={() => setGameState('menu')}
                  className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xl font-bold py-4 rounded-2xl border-4 border-gray-400 hover:from-gray-500 hover:to-gray-600 active:translate-y-2 transition-all shadow-[0_5px_0_#1f2937]"
                >
                  📋 选择难度
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xl font-bold py-4 rounded-2xl border-4 border-cyan-300 hover:from-cyan-500 hover:to-blue-500 active:translate-y-2 transition-all shadow-[0_5px_0_#0369a1]"
                >
                  🏠 返回首页
                </button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'defeat' && (
          <div className="max-w-lg mx-auto">
            <div className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-3xl border-8 border-gray-500 p-8 shadow-[0_8px_0_#1f2937]">
              <div className="text-center mb-6">
                <div className="text-8xl mb-4">⏰</div>
                <h1 className="text-4xl font-bold text-gray-300 mb-2" style={{ textShadow: '3px 3px 0 #111827' }}>
                  时间到！
                </h1>
                <p className="text-gray-400 text-lg mb-4">
                  再接再厉，你已经很不错了！
                </p>
                <div className="bg-black/30 rounded-2xl p-6 mb-4 border-4 border-gray-600">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-400">{score}</div>
                      <div className="text-gray-400 text-sm">当前得分</div>
                    </div>
                    <div className="text-4xl text-gray-500">|</div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-cyan-400">{matchedPairs}/{totalPairs}</div>
                      <div className="text-gray-400 text-sm">配对进度</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-500"
                      style={{ width: `${(matchedPairs / totalPairs) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-2xl p-5 mb-6 border-4 border-gray-600">
                <h3 className="text-lg font-bold text-cyan-400 mb-3 text-center flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  小提示
                  <Sparkles className="w-5 h-5" />
                </h3>
                <div className="space-y-2 text-gray-300 text-sm">
                  <p>💡 记住图案的位置可以更快配对</p>
                  <p>💡 先找简单的配对建立信心</p>
                  <p>💡 多练习可以提高反应速度</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => startGame(difficulty)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl font-bold py-4 rounded-2xl border-4 border-green-300 hover:from-green-400 hover:to-emerald-500 active:translate-y-2 transition-all shadow-[0_5px_0_#047857] flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  重新挑战
                </button>
                <button
                  onClick={() => setGameState('menu')}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-xl font-bold py-4 rounded-2xl border-4 border-yellow-300 hover:from-yellow-400 hover:to-orange-500 active:translate-y-2 transition-all shadow-[0_5px_0_#c2410c]"
                >
                  📋 换个难度
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xl font-bold py-4 rounded-2xl border-4 border-gray-400 hover:from-gray-500 hover:to-gray-600 active:translate-y-2 transition-all shadow-[0_5px_0_#1f2937]"
                >
                  🏠 返回首页
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px) rotate(-2deg); }
          75% { transform: translateX(5px) rotate(2deg); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
