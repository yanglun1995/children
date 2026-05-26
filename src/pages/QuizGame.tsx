import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { questions } from '@/data/questions';
import { ArrowLeft, Heart, Skull, Star, Sparkles, Zap, Shield, Trophy, Crown, Swords } from 'lucide-react';

interface Level {
  id: number;
  name: string;
  virusName: string;
  emoji: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  requiredScore: number;
}

const levels: Level[] = [
  { id: 1, name: '第一关', virusName: '普通病毒', emoji: '🦠', difficulty: 'easy', description: '这是最常见的病毒，来试试身手吧！', requiredScore: 0 },
  { id: 2, name: '第二关', virusName: '蚊子病毒', emoji: '🦟', difficulty: 'easy', description: '通过蚊子传播的病毒，要小心应对！', requiredScore: 50 },
  { id: 3, name: '第三关', virusName: '有害细菌', emoji: '🧫', difficulty: 'medium', description: '细菌比病毒更大一些，挑战升级！', requiredScore: 100 },
  { id: 4, name: '第四关', virusName: '变异病毒', emoji: '🦠', difficulty: 'medium', description: '变异后的病毒更强大，做好准备！', requiredScore: 150 },
  { id: 5, name: '第五关', virusName: '超级细菌大魔王', emoji: '🫧', difficulty: 'hard', description: '最终BOSS！只有真正的健康小卫士才能战胜它！', requiredScore: 200 },
];

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const getRandomQuestions = (count: number, difficulty?: 'easy' | 'medium' | 'hard') => {
  const filtered = difficulty
    ? questions.filter(q => q.difficulty === difficulty)
    : questions;
  const shuffled = shuffleArray(filtered);
  return shuffled.slice(0, count);
};

export default function QuizGame() {
  const navigate = useNavigate();
  const { addScore, addBadge, addKnowledgeCard } = useGameStore();
  const [gameState, setGameState] = useState<'menu' | 'select' | 'battle' | 'levelComplete' | 'victory' | 'defeat'>('menu');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [playerHP, setPlayerHP] = useState(5);
  const [virusHP, setVirusHP] = useState(5);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [battleAnimation, setBattleAnimation] = useState<'playerAttack' | 'virusAttack' | 'virusHit' | null>(null);
  const [message, setMessage] = useState('');
  const [levelQuestions, setLevelQuestions] = useState<any[]>([]);
  const [virusShaking, setVirusShaking] = useState(false);
  const [virusFlickering, setVirusFlickering] = useState(false);

  const currentLevelData = levels[currentLevel - 1];

  const startLevel = useCallback((level: number) => {
    const targetLevel = levels[level - 1];
    const difficulty = targetLevel.difficulty;
    const questionCount = difficulty === 'hard' ? 6 : difficulty === 'medium' ? 5 : 4;
    const newQuestions = getRandomQuestions(questionCount, difficulty);

    setCurrentLevel(level);
    setGameState('battle');
    setPlayerHP(5);
    setVirusHP(5);
    setQuestionIndex(0);
    setScore(0);
    setTotalScore(prev => level === 1 ? 0 : prev);
    setMessage(`${targetLevel.name}开始！${targetLevel.description}`);
    setLevelQuestions(newQuestions);
    setCurrentQuestion(newQuestions[0]);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setBattleAnimation(null);
    setVirusShaking(false);
    setVirusFlickering(false);
  }, []);

  const handleAnswer = async (answerIndex: number) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answerIndex);
    const correct = answerIndex === currentQuestion.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      setBattleAnimation('playerAttack');
      setMessage('回答正确！发起攻击！');

      await new Promise(resolve => setTimeout(resolve, 500));

      setVirusShaking(true);
      setVirusFlickering(true);
      setBattleAnimation('virusHit');

      await new Promise(resolve => setTimeout(resolve, 300));
      setVirusShaking(false);
      setVirusFlickering(false);

      const newScore = score + 50;
      setScore(newScore);

      await new Promise(resolve => setTimeout(resolve, 500));
      const newVirusHP = virusHP - 1;
      setVirusHP(newVirusHP);
      setBattleAnimation(null);

      if (newVirusHP <= 0) {
        setTotalScore(prev => prev + newScore);
        addScore(newScore);
        setMessage('你打败了病毒！🎉');

        await new Promise(resolve => setTimeout(resolve, 1500));

        if (currentLevel === 5) {
          setGameState('victory');
          addBadge({
            id: 'quiz-master',
            name: '健康知识达人',
            icon: '🧠',
          });
        } else {
          setGameState('levelComplete');
        }
        return;
      }
    } else {
      setBattleAnimation('virusAttack');
      setMessage('回答错误！受到攻击！');

      await new Promise(resolve => setTimeout(resolve, 1000));
      const newPlayerHP = playerHP - 1;
      setPlayerHP(newPlayerHP);
      setBattleAnimation(null);

      if (newPlayerHP <= 0) {
        setMessage('你被病毒打败了...😢');
        await new Promise(resolve => setTimeout(resolve, 1500));
        setGameState('defeat');
        return;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 800));
    const nextIndex = questionIndex + 1;

    if (nextIndex < levelQuestions.length) {
      setQuestionIndex(nextIndex);
      setCurrentQuestion(levelQuestions[nextIndex]);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setMessage('下一个问题！');
    } else {
      if (virusHP <= 0 || playerHP <= 0) {
        if (virusHP <= 0) {
          setTotalScore(prev => prev + score);
          addScore(score);
        }
        setGameState(virusHP <= 0 ? 'levelComplete' : 'defeat');
      } else {
        setMessage('问题用完了，继续战斗！');
        const moreQuestions = getRandomQuestions(3, currentLevelData.difficulty);
        setLevelQuestions(prev => [...prev, ...moreQuestions]);
        setQuestionIndex(0);
        setCurrentQuestion(moreQuestions[0]);
        setSelectedAnswer(null);
        setIsCorrect(null);
      }
    }
  };

  const handleNextLevel = () => {
    startLevel(currentLevel + 1);
  };

  const handleRetryLevel = () => {
    startLevel(currentLevel);
  };

  const handleBackToMenu = () => {
    setGameState('menu');
    setCurrentLevel(1);
    setTotalScore(0);
  };

  const handleBackToSelect = () => {
    setGameState('select');
  };

  const getVirusEmoji = () => {
    return currentLevelData.emoji;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-white';
    }
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes shake {
        0%, 100% { transform: translateX(0) rotate(0deg); }
        25% { transform: translateX(-10px) rotate(-5deg); }
        75% { transform: translateX(10px) rotate(5deg); }
      }
      .virus-shake {
        animation: shake 0.3s ease-in-out;
      }
    `;
    document.head.appendChild(style);
    const cleanup = () => {
      document.head.removeChild(style);
    };
    return cleanup;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900" style={{ fontFamily: 'Courier New, monospace' }}>
      <header className="bg-black/40 backdrop-blur-sm border-b-4 border-yellow-400 shadow-[0_4px_0_#92400e]">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => gameState === 'menu' || gameState === 'select' ? navigate('/') : handleBackToMenu()}
            className="w-12 h-12 bg-gray-800 border-4 border-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-700 active:translate-y-1 transition-all shadow-[0_4px_0_#1f2937]"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="text-2xl font-bold text-yellow-400 tracking-wider flex items-center gap-2">
            <Star className="w-6 h-6 fill-yellow-400" />
            {totalScore + score}
            <Star className="w-6 h-6 fill-yellow-400" />
          </div>
          <div className="w-12"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {gameState === 'menu' && (
          <div className="max-w-lg mx-auto">
            <div className="bg-gradient-to-br from-purple-800 to-indigo-900 rounded-3xl border-8 border-yellow-400 p-8 shadow-[0_8px_0_#78350f,inset_0_0_50px_rgba(0,0,0,0.5)]">
              <div className="text-center mb-6">
                <div className="text-8xl mb-4 animate-bounce">
                  <Swords className="w-24 h-24 mx-auto text-yellow-400" />
                </div>
                <h1 className="text-4xl font-bold text-yellow-400 mb-2" style={{ textShadow: '4px 4px 0 #92400e' }}>
                  疾病防控小擂台
                </h1>
                <p className="text-cyan-300 text-lg">
                  战胜5个病毒boss，成为健康小卫士！
                </p>
              </div>

              <div className="bg-black/30 rounded-2xl p-6 mb-6 border-4 border-gray-600">
                <h3 className="text-xl font-bold text-yellow-400 mb-4 text-center">📜 游戏规则 📜</h3>
                <div className="space-y-3 text-white">
                  <p className="flex items-start gap-3">
                    <span className="text-green-400 text-2xl">✅</span>
                    <span>回答正确：伤害病毒 -1 HP</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-red-400 text-2xl">❌</span>
                    <span>回答错误：自己受到伤害 -1 HP</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-yellow-400 text-2xl">❤️</span>
                    <span>双方各有 5 点生命值</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-purple-400 text-2xl">🏆</span>
                    <span>击败5个病毒即可通关！</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setGameState('select')}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-2xl font-bold py-4 rounded-2xl border-4 border-green-300 hover:from-green-400 hover:to-emerald-500 active:translate-y-2 transition-all shadow-[0_6px_0_#064e3b]"
              >
                ⚔️ 开始挑战 ⚔️
              </button>
            </div>
          </div>
        )}

        {gameState === 'select' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-purple-800 to-indigo-900 rounded-3xl border-8 border-yellow-400 p-6 shadow-[0_8px_0_#78350f]">
              <h2 className="text-3xl font-bold text-yellow-400 text-center mb-6" style={{ textShadow: '3px 3px 0 #92400e' }}>
                选择关卡
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {levels.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => startLevel(level.id)}
                    className="p-4 rounded-2xl border-4 bg-gradient-to-r from-blue-600 to-purple-600 border-blue-300 hover:from-blue-500 hover:to-purple-500 shadow-[0_4px_0_#3730a3] transition-all hover:scale-102 active:translate-y-1"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-5xl">{level.emoji}</div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-white">{level.name}</span>
                          <span className={`text-sm font-bold ${getDifficultyColor(level.difficulty)}`}>
                            {level.difficulty === 'easy' ? '⭐' : level.difficulty === 'medium' ? '⭐⭐' : '⭐⭐⭐'}
                          </span>
                        </div>
                        <p className="text-gray-300">{level.virusName}</p>
                        <p className="text-gray-400 text-sm">{level.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {gameState === 'battle' && currentQuestion && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-b from-sky-600 to-amber-700 rounded-3xl border-8 border-yellow-500 p-6 mb-6 shadow-[0_8px_0_#78350f]">
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm font-bold text-yellow-300 bg-black/30 px-3 py-1 rounded-full border-2 border-yellow-400">
                  {currentLevelData.name}
                </div>
                <div className={`text-sm font-bold px-3 py-1 rounded-full border-2 ${currentLevelData.difficulty === 'easy' ? 'text-green-300 border-green-400 bg-green-900/30' : currentLevelData.difficulty === 'medium' ? 'text-yellow-300 border-yellow-400 bg-yellow-900/30' : 'text-red-300 border-red-400 bg-red-900/30'}`}>
                  {currentLevelData.difficulty === 'easy' ? '⭐简单' : currentLevelData.difficulty === 'medium' ? '⭐⭐中等' : '⭐⭐⭐困难'}
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <div className={`text-center ${battleAnimation === 'playerAttack' ? 'animate-bounce' : ''}`}>
                  <div className="text-7xl mb-2">🧑‍🎓</div>
                  <div className="bg-black/40 rounded-xl p-3 border-3 border-green-400">
                    <p className="text-white font-bold mb-2">健康小卫士</p>
                    <div className="flex gap-1 justify-center">
                      {[...Array(5)].map((_, i) => (
                        <Heart
                          key={i}
                          className={`w-8 h-8 ${i < playerHP ? 'text-red-500 fill-red-500' : 'text-gray-600'}`}
                        />
                      ))}
                    </div>
                    <p className="text-green-400 font-bold mt-1">{playerHP} / 5</p>
                  </div>
                </div>

                <div className="text-6xl animate-pulse">⚔️</div>

                <div className={`text-center ${battleAnimation === 'virusAttack' ? 'animate-bounce' : ''}`}>
                  <div
                    className={`text-7xl mb-2 ${virusShaking ? 'virus-shake' : ''} ${virusFlickering ? 'opacity-50' : ''}`}
                  >
                    {getVirusEmoji()}
                  </div>
                  <div className="bg-black/40 rounded-xl p-3 border-3 border-purple-400">
                    <p className="text-white font-bold mb-2">{currentLevelData.virusName}</p>
                    <div className="flex gap-1 justify-center">
                      {[...Array(5)].map((_, i) => (
                        <Skull
                          key={i}
                          className={`w-8 h-8 ${i < virusHP ? 'text-purple-500 fill-purple-500' : 'text-gray-600'}`}
                        />
                      ))}
                    </div>
                    <p className="text-purple-400 font-bold mt-1">{virusHP} / 5</p>
                  </div>
                </div>
              </div>

              <div className="text-center bg-gradient-to-r from-purple-900/60 to-blue-900/60 rounded-2xl py-4 px-6 border-4 border-cyan-400">
                <p className="text-2xl font-bold text-yellow-300">{message}</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-800 to-purple-900 rounded-3xl border-6 border-blue-400 p-6 shadow-[0_6px_0_#3730a3]">
              <div className="bg-white/10 rounded-2xl p-5 mb-6 border-4 border-white/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-1 rounded-full font-bold text-sm">
                    {currentQuestion.category === 'hygiene' ? '🧼 卫生习惯' :
                     currentQuestion.category === 'vaccine' ? '💉 疫苗知识' :
                     currentQuestion.category === 'disease' ? '🦠 疾病知识' :
                     currentQuestion.category === 'immunity' ? '💪 免疫力' :
                     currentQuestion.category === 'nutrition' ? '🥗 营养饮食' : '🌟 生活习惯'}
                  </span>
                  <span className="text-yellow-300 font-bold">
                    问题 {questionIndex + 1} / {levelQuestions.length}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white leading-relaxed">
                  {currentQuestion.question}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option: string, index: number) => {
                  let buttonClass = 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-300 hover:from-blue-400 hover:to-blue-500 shadow-[0_5px_0_#1e3a8a]';

                  if (selectedAnswer !== null) {
                    if (index === currentQuestion.correctAnswer) {
                      buttonClass = 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-300 shadow-[0_5px_0_#047857] animate-pulse';
                    } else if (index === selectedAnswer && !isCorrect) {
                      buttonClass = 'bg-gradient-to-r from-red-500 to-rose-600 border-red-300 shadow-[0_5px_0_#7f1d1d]';
                    }
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      disabled={selectedAnswer !== null}
                      className={`text-left p-4 rounded-2xl border-4 transition-all hover:scale-102 active:translate-y-1 ${buttonClass} ${selectedAnswer !== null ? 'opacity-90 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="text-lg font-bold text-white flex-1">{option}</span>
                        {selectedAnswer !== null && index === currentQuestion.correctAnswer && (
                          <span className="text-3xl"><Star className="w-8 h-8 text-yellow-300 fill-yellow-300" /></span>
                        )}
                        {selectedAnswer === index && !isCorrect && (
                          <span className="text-3xl">❌</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedAnswer !== null && (
                <div className={`mt-6 p-4 rounded-2xl border-4 ${isCorrect ? 'bg-green-900/50 border-green-400' : 'bg-red-900/50 border-red-400'}`}>
                  <p className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    知识小贴士
                  </p>
                  <p className="text-gray-200">{currentQuestion.explanation}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {gameState === 'levelComplete' && (
          <div className="max-w-lg mx-auto">
            <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl border-8 border-yellow-300 p-8 shadow-[0_8px_0_#064e3b]">
              <div className="text-center mb-6">
                <div className="text-8xl mb-4 animate-bounce">
                  <Trophy className="w-24 h-24 mx-auto text-yellow-400" />
                </div>
                <h1 className="text-4xl font-bold text-white mb-2" style={{ textShadow: '3px 3px 0 #065f46' }}>
                  🎉 {currentLevelData.name}通关！🎉
                </h1>
                <p className="text-green-200 text-lg mb-4">
                  你打败了 {currentLevelData.virusName}！
                </p>
                <div className="text-5xl font-bold text-yellow-200 my-4">
                  {score} 分
                </div>
                <div className="flex justify-center gap-4 mb-4">
                  <div className="bg-black/30 rounded-xl px-4 py-2 border-2 border-green-300">
                    <p className="text-green-200 text-sm">你的生命值</p>
                    <div className="flex gap-1 justify-center">
                      {[...Array(5)].map((_, i) => (
                        <Heart
                          key={i}
                          className={`w-6 h-6 ${i < playerHP ? 'text-red-400 fill-red-400' : 'text-gray-500'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-2xl p-6 mb-6 border-4 border-white/30">
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="w-6 h-6 text-yellow-400" />
                  <span className="text-white font-bold">下一关预告</span>
                </div>
                {currentLevel < 5 && (
                  <div className="flex items-center gap-4 bg-purple-900/50 rounded-xl p-4 border-2 border-purple-400">
                    <div className="text-5xl">{levels[currentLevel].emoji}</div>
                    <div>
                      <p className="text-purple-300 font-bold">{levels[currentLevel].name}</p>
                      <p className="text-white font-bold">{levels[currentLevel].virusName}</p>
                      <p className="text-gray-400 text-sm">{levels[currentLevel].description}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                {currentLevel < 5 && (
                  <>
                    <button
                      onClick={handleNextLevel}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xl font-bold py-4 rounded-2xl border-4 border-purple-300 hover:from-purple-400 hover:to-pink-500 active:translate-y-2 transition-all shadow-[0_5px_0_#7e22ce]"
                    >
                      ⚔️ 挑战下一关 ⚔️
                    </button>
                    <button
                      onClick={handleBackToSelect}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-xl font-bold py-4 rounded-2xl border-4 border-blue-300 hover:from-blue-400 hover:to-cyan-500 active:translate-y-2 transition-all shadow-[0_5px_0_#0369a1]"
                    >
                      📋 选择关卡
                    </button>
                  </>
                )}
                <button
                  onClick={handleBackToMenu}
                  className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xl font-bold py-4 rounded-2xl border-4 border-gray-400 hover:from-gray-500 hover:to-gray-600 active:translate-y-2 transition-all shadow-[0_5px_0_#1f2937]"
                >
                  🏠 返回首页
                </button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'victory' && (
          <div className="max-w-lg mx-auto">
            <div className="bg-gradient-to-br from-yellow-500 via-orange-500 to-red-600 rounded-3xl border-8 border-yellow-300 p-8 shadow-[0_8px_0_#92400e]">
              <div className="text-center mb-6">
                <div className="text-8xl mb-4 animate-bounce">
                  🏆🏆🏆
                </div>
                <h1 className="text-4xl font-bold text-white mb-2" style={{ textShadow: '3px 3px 0 #78350f' }}>
                  全部通关！
                </h1>
                <p className="text-yellow-200 text-lg mb-4">
                  你是真正的健康小卫士！
                </p>
                <div className="bg-black/30 rounded-2xl p-6 mb-4 border-4 border-yellow-300">
                  <p className="text-white text-lg mb-2">最终得分</p>
                  <div className="text-6xl font-bold text-yellow-200">
                    {totalScore + score}
                  </div>
                  <p className="text-yellow-300 text-sm mt-2">击败了所有5个病毒！</p>
                </div>
              </div>

              <div className="bg-black/30 rounded-2xl p-6 mb-6 border-4 border-white/30">
                <h3 className="text-xl font-bold text-yellow-300 mb-4 text-center flex items-center justify-center gap-2">
                  <Crown className="w-6 h-6" />
                  通关成就
                  <Crown className="w-6 h-6" />
                </h3>
                <div className="flex justify-center gap-2 flex-wrap">
                  {levels.map((level) => (
                    <div key={level.id} className="text-4xl bg-black/30 rounded-xl p-2 border-2 border-yellow-400">
                      {level.emoji}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => startLevel(1)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl font-bold py-4 rounded-2xl border-4 border-green-300 hover:from-green-400 hover:to-emerald-500 active:translate-y-2 transition-all shadow-[0_5px_0_#064e3b]"
                >
                  🔄 重新挑战
                </button>
                <button
                  onClick={handleBackToMenu}
                  className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xl font-bold py-4 rounded-2xl border-4 border-gray-400 hover:from-gray-500 hover:to-gray-600 active:translate-y-2 transition-all shadow-[0_5px_0_#1f2937]"
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
                <div className="text-8xl mb-4">{getVirusEmoji()}</div>
                <h1 className="text-4xl font-bold text-gray-300 mb-2" style={{ textShadow: '3px 3px 0 #111827' }}>
                  挑战失败
                </h1>
                <p className="text-gray-400 text-lg mb-4">
                  {currentLevelData.virusName}暂时获胜...
                </p>
                <div className="text-4xl font-bold text-yellow-400 my-4">
                  {score} 分
                </div>
              </div>

              <div className="bg-black/30 rounded-2xl p-6 mb-6 border-4 border-gray-600">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-6 h-6 text-blue-400" />
                  <span className="text-gray-300 font-bold">建议</span>
                </div>
                <p className="text-gray-400">
                  别灰心！多学习健康知识，下次一定能打败它！
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={handleRetryLevel}
                  className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white text-xl font-bold py-4 rounded-2xl border-4 border-red-300 hover:from-red-400 hover:to-rose-500 active:translate-y-2 transition-all shadow-[0_5px_0_#7f1d1d]"
                >
                  🔄 重新挑战
                </button>
                <button
                  onClick={handleBackToSelect}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-xl font-bold py-4 rounded-2xl border-4 border-blue-300 hover:from-blue-400 hover:to-cyan-500 active:translate-y-2 transition-all shadow-[0_5px_0_#0369a1]"
                >
                  📋 选择其他关卡
                </button>
                <button
                  onClick={handleBackToMenu}
                  className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xl font-bold py-4 rounded-2xl border-4 border-gray-400 hover:from-gray-500 hover:to-gray-600 active:translate-y-2 transition-all shadow-[0_5px_0_#1f2937]"
                >
                  🏠 返回首页
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
