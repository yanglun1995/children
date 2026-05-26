import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { ArrowLeft, RotateCcw, Home, Trophy, Star, Sparkles } from 'lucide-react';

interface Card {
  id: number;
  emoji: string;
  text: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const cardPairs = [
  { emoji: '😷', text: '戴口罩' },
  { emoji: '🧼', text: '勤洗手' },
  { emoji: '💉', text: '打疫苗' },
  { emoji: '🏃', text: '多运动' },
  { emoji: '😴', text: '睡好觉' },
  { emoji: '💧', text: '多喝水' },
  { emoji: '🥬', text: '吃蔬菜' },
  { emoji: '🍎', text: '吃水果' },
];

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function MemoryGame() {
  const navigate = useNavigate();
  const { addScore, addBadge } = useGameStore();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'win'>('menu');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [score, setScore] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'playing') {
      timer = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState]);

  const initGame = useCallback(() => {
    const cardPairsArray = [...cardPairs, ...cardPairs];
    const shuffled = shuffleArray(cardPairsArray);
    const newCards: Card[] = shuffled.map((pair, index) => ({
      id: index,
      emoji: pair.emoji,
      text: pair.text,
      isFlipped: false,
      isMatched: false,
    }));
    setCards(newCards);
    setFlippedCards([]);
    setMoves(0);
    setTime(0);
    setScore(0);
    setMatchedPairs(0);
    setIsChecking(false);
    setGameState('playing');
  }, []);

  const checkMatch = useCallback(() => {
    if (flippedCards.length !== 2) return;

    const [first, second] = flippedCards;
    const firstCard = cards.find(c => c.id === first);
    const secondCard = cards.find(c => c.id === second);

    if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
      setCards(prev => prev.map(card => 
        card.id === first || card.id === second 
          ? { ...card, isMatched: true }
          : card
      ));
      setMatchedPairs(prev => prev + 1);
      const timeBonus = Math.max(100 - time, 10);
      const newScore = score + 50 + timeBonus;
      setScore(newScore);

      if (matchedPairs + 1 === cardPairs.length) {
        setTimeout(() => {
          addScore(newScore);
          addBadge({
            id: 'memory-master',
            name: '记忆大师',
            icon: '🧠',
          });
          setGameState('win');
        }, 500);
      }
    } else {
      setTimeout(() => {
        setCards(prev => prev.map(card => 
          card.id === first || card.id === second 
            ? { ...card, isFlipped: false }
            : card
        ));
        setIsChecking(false);
      }, 1000);
    }
    setFlippedCards([]);
    setMoves(prev => prev + 1);
  }, [flippedCards, cards, score, matchedPairs, addScore, addBadge]);

  useEffect(() => {
    if (flippedCards.length === 2 && !isChecking) {
      setIsChecking(true);
    }
  }, [flippedCards, isChecking]);

  useEffect(() => {
    if (isChecking && flippedCards.length === 2) {
      checkMatch();
    }
  }, [isChecking, flippedCards, checkMatch]);

  const handleCardClick = (cardId: number) => {
    if (isChecking) return;
    if (flippedCards.length >= 2) return;
    if (flippedCards.includes(cardId)) return;

    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));
    setFlippedCards(prev => [...prev, cardId]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-900 via-rose-900 to-red-900">
      <header className="bg-black/40 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => {
              addScore(score);
              navigate('/');
            }}
            className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
              {score} <Star className="w-4 h-4 inline" />
            </div>
          </div>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {gameState === 'menu' && (
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-pink-800 to-rose-900 rounded-3xl border-4 border-pink-400 p-8 shadow-2xl">
              <div className="text-center mb-6">
                <div className="text-8xl mb-4 animate-bounce">🎴</div>
                <h1 className="text-3xl font-bold text-pink-300 mb-2">健康记忆卡牌</h1>
                <p className="text-pink-200">翻开卡牌，找出健康知识配对！</p>
              </div>

              <div className="bg-black/30 rounded-2xl p-5 mb-6 border-2 border-pink-600">
                <h3 className="text-lg font-bold text-pink-300 mb-3">📜 游戏规则</h3>
                <ul className="space-y-2 text-pink-100 text-sm">
                  <li className="flex items-center gap-2">
                    <span>👆</span> 点击翻开卡牌
                  </li>
                  <li className="flex items-center gap-2">
                    <span>🔗</span> 找出相同的配对
                  </li>
                  <li className="flex items-center gap-2">
                    <span>⏱️</span> 时间越短得分越高
                  </li>
                  <li className="flex items-center gap-2">
                    <span>🏆</span> 完成配对获得徽章！
                  </li>
                </ul>
              </div>

              <button
                onClick={initGame}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xl font-bold py-4 rounded-2xl border-4 border-pink-300 hover:from-pink-400 hover:to-rose-400 active:translate-y-1 transition-all shadow-lg"
              >
                🎴 开始游戏 🎴
              </button>

              <button
                onClick={() => navigate('/')}
                className="w-full mt-3 bg-gray-700 text-gray-200 font-bold py-3 rounded-xl hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" /> 返回首页
              </button>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="max-w-lg mx-auto">
            <div className="bg-gradient-to-br from-pink-800 to-rose-900 rounded-3xl border-4 border-pink-400 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-500/30 px-3 py-1 rounded-full">
                    <span className="text-blue-300 font-bold">步数: {moves}</span>
                  </div>
                  <div className="bg-purple-500/30 px-3 py-1 rounded-full">
                    <span className="text-purple-300 font-bold">配对: {matchedPairs}/{cardPairs.length}</span>
                  </div>
                </div>
                <div className="bg-yellow-500/30 px-3 py-1 rounded-full">
                  <span className="text-yellow-300 font-bold">{formatTime(time)}</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-4">
                {cards.map(card => (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(card.id)}
                    disabled={card.isFlipped || card.isMatched || isChecking}
                    className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center text-xl transition-all hover:scale-105 ${
                      card.isMatched
                        ? 'bg-green-500/50 border-green-400 opacity-70'
                        : card.isFlipped
                        ? 'bg-gradient-to-br from-pink-500 to-rose-500 border-pink-300'
                        : 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600'
                    }`}
                  >
                    {card.isFlipped || card.isMatched ? (
                      <>
                        <span className="text-3xl mb-1">{card.emoji}</span>
                        <span className="text-xs text-white font-bold">{card.text}</span>
                      </>
                    ) : (
                      <span className="text-3xl">❓</span>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={initGame}
                className="w-full bg-gray-700 text-gray-200 font-bold py-3 rounded-xl hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> 重新开始
              </button>
            </div>
          </div>
        )}

        {gameState === 'win' && (
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-yellow-500 via-orange-500 to-red-600 rounded-3xl border-4 border-yellow-300 p-8 shadow-2xl text-center">
              <div className="text-8xl mb-4 animate-bounce">🏆</div>
              <h2 className="text-3xl font-bold text-white mb-2">🎉 配对完成！🎉</h2>
              <p className="text-yellow-200 mb-4">你是记忆大师！</p>
              
              <div className="bg-black/30 rounded-xl p-6 mb-6">
                <p className="text-white text-lg mb-2">最终得分</p>
                <div className="text-6xl font-bold text-yellow-200">{score}</div>
                <p className="text-yellow-300 text-sm mt-2">用了 {moves} 步，耗时 {formatTime(time)}</p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={initGame}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" /> 再玩一次
                </button>
                <button
                  onClick={() => {
                    addScore(score);
                    navigate('/');
                  }}
                  className="w-full bg-gray-700 text-gray-200 font-bold py-3 rounded-xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
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
