import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { ArrowLeft, RotateCcw, Home, Trophy, Star, Sparkles } from 'lucide-react';

interface PuzzlePiece {
  id: number;
  currentIndex: number;
  correctIndex: number;
  emoji: string;
}

const puzzles = [
  {
    id: 1,
    title: '健康生活拼图',
    description: '拼出健康生活方式',
    emojis: ['🧼', '💉', '🍎', '🏃', '😴', '💧'],
    hint: '这些都是保持健康的好习惯！'
  },
  {
    id: 2,
    title: '疾病预防拼图',
    description: '找出预防疾病的方法',
    emojis: ['😷', '🧴', '🧹', '🚪', '🌡️', '🛌'],
    hint: '这些都是预防疾病的好方法！'
  },
  {
    id: 3,
    title: '营养食物拼图',
    description: '拼出健康的食物',
    emojis: ['🥬', '🍊', '🥛', '🍞', '🥚', '🍌'],
    hint: '这些都是有营养的健康食物！'
  },
  {
    id: 4,
    title: '卫生习惯拼图',
    description: '拼出良好的卫生习惯',
    emojis: ['🪥', '🚿', '🧴', '👕', '🩰', '🧻'],
    hint: '这些都是保持卫生的好习惯！'
  },
];

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function PuzzleGame() {
  const navigate = useNavigate();
  const { addScore, addBadge } = useGameStore();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'win'>('menu');
  const [currentPuzzle, setCurrentPuzzle] = useState(0);
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [score, setScore] = useState(0);
  const [completedPuzzles, setCompletedPuzzles] = useState<number[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'playing') {
      timer = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState]);

  const initPuzzle = useCallback((puzzleIndex: number) => {
    const puzzle = puzzles[puzzleIndex];
    const shuffledIndices = shuffleArray([...Array(puzzle.emojis.length).keys()]);
    const newPieces: PuzzlePiece[] = puzzle.emojis.map((emoji, index) => ({
      id: index,
      currentIndex: shuffledIndices[index],
      correctIndex: index,
      emoji
    }));
    setPieces(newPieces);
    setSelectedPiece(null);
    setMoves(0);
    setTime(0);
    setCurrentPuzzle(puzzleIndex);
    setGameState('playing');
  }, []);

  const checkWin = useCallback(() => {
    if (pieces.length === 0) return;
    const isComplete = pieces.every(piece => piece.currentIndex === piece.correctIndex);
    if (isComplete && gameState === 'playing') {
      const puzzleScore = Math.max(100 - moves * 2 - Math.floor(time / 10), 10);
      const newScore = score + puzzleScore;
      setScore(newScore);
      setCompletedPuzzles(prev => [...new Set([...prev, currentPuzzle])]);

      if (completedPuzzles.length + 1 >= puzzles.length) {
        addScore(newScore);
        addBadge({
          id: 'puzzle-master',
          name: '拼图大师',
          icon: '🧩',
        });
        setGameState('win');
      } else {
        setGameState('menu');
      }
    }
  }, [pieces, moves, time, score, currentPuzzle, completedPuzzles, gameState, addScore, addBadge]);

  useEffect(() => {
    checkWin();
  }, [checkWin]);

  const handlePieceClick = (pieceId: number) => {
    if (selectedPiece === null) {
      setSelectedPiece(pieceId);
    } else if (selectedPiece === pieceId) {
      setSelectedPiece(null);
    } else {
      setPieces(prev => prev.map(piece => {
        if (piece.id === selectedPiece) {
          return { ...piece, currentIndex: prev.find(p => p.id === pieceId)!.currentIndex };
        }
        if (piece.id === pieceId) {
          return { ...piece, currentIndex: prev.find(p => p.id === selectedPiece)!.currentIndex };
        }
        return piece;
      }));
      setMoves(prev => prev + 1);
      setSelectedPiece(null);
    }
  };

  const handleNextPuzzle = () => {
    const nextPuzzle = (currentPuzzle + 1) % puzzles.length;
    initPuzzle(nextPuzzle);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900">
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
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
              {score} <Star className="w-4 h-4 inline" />
            </div>
          </div>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {gameState === 'menu' && (
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-purple-800 to-indigo-900 rounded-3xl border-4 border-purple-400 p-8 shadow-2xl">
              <div className="text-center mb-6">
                <div className="text-8xl mb-4 animate-bounce">🧩</div>
                <h1 className="text-3xl font-bold text-purple-300 mb-2">健康拼图挑战</h1>
                <p className="text-purple-200">拼出健康知识，成为拼图小能手！</p>
              </div>

              <div className="bg-black/30 rounded-2xl p-5 mb-6 border-2 border-purple-600">
                <h3 className="text-lg font-bold text-purple-300 mb-3">📜 游戏规则</h3>
                <ul className="space-y-2 text-purple-100 text-sm">
                  <li className="flex items-center gap-2">
                    <span>👆</span> 点击选择拼图块
                  </li>
                  <li className="flex items-center gap-2">
                    <span>🔄</span> 点击两块交换位置
                  </li>
                  <li className="flex items-center gap-2">
                    <span>⏱️</span> 时间越短得分越高
                  </li>
                  <li className="flex items-center gap-2">
                    <span>🏆</span> 完成所有拼图获得徽章！
                  </li>
                </ul>
              </div>

              <div className="space-y-3 mb-6">
                {puzzles.map((puzzle, index) => (
                  <button
                    key={puzzle.id}
                    onClick={() => initPuzzle(index)}
                    className={`w-full p-4 rounded-xl border-2 transition-all hover:scale-102 ${
                      completedPuzzles.includes(index)
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 border-green-400'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 border-blue-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="font-bold text-white">{puzzle.title}</p>
                        <p className="text-sm text-purple-200">{puzzle.description}</p>
                      </div>
                      {completedPuzzles.includes(index) && (
                        <span className="text-2xl">✅</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  addScore(score);
                  navigate('/');
                }}
                className="w-full bg-gray-700 text-gray-200 font-bold py-3 rounded-xl hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" /> 返回首页
              </button>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="max-w-lg mx-auto">
            <div className="bg-gradient-to-br from-purple-800 to-indigo-900 rounded-3xl border-4 border-purple-400 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="text-purple-300">
                  <span className="font-bold">{puzzles[currentPuzzle].title}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-blue-500/30 px-3 py-1 rounded-full">
                    <span className="text-blue-300 font-bold">步数: {moves}</span>
                  </div>
                  <div className="bg-pink-500/30 px-3 py-1 rounded-full">
                    <span className="text-pink-300 font-bold">{formatTime(time)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-4 mb-4 text-center border-2 border-purple-600">
                <p className="text-purple-200 text-sm">{puzzles[currentPuzzle].hint}</p>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {pieces
                  .sort((a, b) => a.currentIndex - b.currentIndex)
                  .map(piece => (
                    <button
                      key={piece.id}
                      onClick={() => handlePieceClick(piece.id)}
                      className={`aspect-square rounded-xl border-3 flex items-center justify-center text-4xl transition-all hover:scale-105 ${
                        selectedPiece === piece.id
                          ? 'bg-yellow-500/50 border-yellow-400 scale-110'
                          : piece.currentIndex === piece.correctIndex
                          ? 'bg-green-500/30 border-green-400'
                          : 'bg-purple-600/50 border-purple-400'
                      }`}
                    >
                      {piece.emoji}
                    </button>
                  ))}
              </div>

              <button
                onClick={() => initPuzzle(currentPuzzle)}
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
              <h2 className="text-3xl font-bold text-white mb-2">🎉 全部完成！🎉</h2>
              <p className="text-yellow-200 mb-4">你是拼图大师！</p>
              
              <div className="bg-black/30 rounded-xl p-6 mb-6">
                <p className="text-white text-lg mb-2">最终得分</p>
                <div className="text-6xl font-bold text-yellow-200">{score}</div>
                <p className="text-yellow-300 text-sm mt-2">完成了所有 {puzzles.length} 个拼图！</p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setScore(0);
                    setCompletedPuzzles([]);
                    initPuzzle(0);
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" /> 重新挑战
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
