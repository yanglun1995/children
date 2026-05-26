import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { questions } from '@/data/questions';
import { ArrowLeft, Swords, Heart, Skull, Star, Sparkles } from 'lucide-react';

export default function QuizGame() {
  const navigate = useNavigate();
  const { addScore, addBadge, addKnowledgeCard } = useGameStore();
  const [gameState, setGameState] = useState<'menu' | 'battle' | 'result'>('menu');
  const [playerHP, setPlayerHP] = useState(5);
  const [virusHP, setVirusHP] = useState(5);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [battleAnimation, setBattleAnimation] = useState<'playerAttack' | 'virusAttack' | null>(null);
  const [message, setMessage] = useState('');

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const [gameQuestions] = useState(() => shuffleArray(questions).slice(0, 10));

  const startBattle = () => {
    setGameState('battle');
    setPlayerHP(5);
    setVirusHP(5);
    setQuestionIndex(0);
    setScore(0);
    setMessage('病毒来袭！准备战斗！');
    setCurrentQuestion(gameQuestions[0]);
  };

  const handleAnswer = async (answerIndex: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answerIndex);
    const correct = answerIndex === currentQuestion.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      setBattleAnimation('playerAttack');
      setMessage('回答正确！发起攻击！');
      setScore(prev => prev + 50);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      setVirusHP(prev => Math.max(0, prev - 1));
      setBattleAnimation(null);
      
      if (virusHP - 1 <= 0) {
        setMessage('你打败了病毒！🎉');
        await new Promise(resolve => setTimeout(resolve, 1500));
        setGameState('result');
        return;
      }
    } else {
      setBattleAnimation('virusAttack');
      setMessage('回答错误！受到攻击！');
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      setPlayerHP(prev => Math.max(0, prev - 1));
      setBattleAnimation(null);
      
      if (playerHP - 1 <= 0) {
        setMessage('你被病毒打败了...😢');
        await new Promise(resolve => setTimeout(resolve, 1500));
        setGameState('result');
        return;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 800));
    const nextIndex = questionIndex + 1;
    if (nextIndex < gameQuestions.length) {
      setQuestionIndex(nextIndex);
      setCurrentQuestion(gameQuestions[nextIndex]);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setMessage('下一个问题！');
    } else {
      if (virusHP <= 0 || playerHP <= 0) {
        setGameState('result');
      } else {
        setMessage('问题用完了，继续战斗！');
        setQuestionIndex(0);
        setCurrentQuestion(gameQuestions[0]);
        setSelectedAnswer(null);
        setIsCorrect(null);
      }
    }
  };

  const handleGameEnd = () => {
    addScore(score);
    if (score >= 200) {
      addBadge({
        id: 'quiz-master',
        name: '健康知识达人',
        icon: '🧠',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900" style={{ fontFamily: 'Courier New, monospace' }}>
      <header className="bg-black/40 backdrop-blur-sm border-b-4 border-yellow-400 shadow-[0_4px_0_#92400e]">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="w-12 h-12 bg-gray-800 border-4 border-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-700 active:translate-y-1 transition-all shadow-[0_4px_0_#1f2937]"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="text-3xl font-bold text-yellow-400 tracking-wider">
            🏆 {score} 🏆
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
                  战胜病毒，成为健康小卫士！
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
                </div>
              </div>

              <button
                onClick={startBattle}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-2xl font-bold py-4 rounded-2xl border-4 border-green-300 hover:from-green-400 hover:to-emerald-500 active:translate-y-2 transition-all shadow-[0_6px_0_#064e3b]"
              >
                ⚔️ 开始战斗 ⚔️
              </button>
            </div>
          </div>
        )}

        {gameState === 'battle' && currentQuestion && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-b from-sky-600 to-amber-700 rounded-3xl border-8 border-yellow-500 p-6 mb-6 shadow-[0_8px_0_#78350f]">
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
                  <div className="text-7xl mb-2">🦠</div>
                  <div className="bg-black/40 rounded-xl p-3 border-3 border-purple-400">
                    <p className="text-white font-bold mb-2">病毒大魔王</p>
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
                     currentQuestion.category === 'disease' ? '🦠 疾病知识' : '💪 免疫力'}
                  </span>
                  <span className="text-yellow-300 font-bold">
                    问题 {questionIndex + 1} / {gameQuestions.length}
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

        {gameState === 'result' && (
          <div className="max-w-lg mx-auto">
            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-3xl border-8 border-yellow-300 p-8 shadow-[0_8px_0_#92400e]">
              <div className="text-center mb-6">
                <div className="text-8xl mb-4">{virusHP <= 0 ? '🏆' : '😢'}</div>
                <h1 className="text-4xl font-bold text-white mb-2" style={{ textShadow: '3px 3px 0 #78350f' }}>
                  {virusHP <= 0 ? '战斗胜利！' : '再接再厉！'}
                </h1>
                <div className="text-5xl font-bold text-yellow-200 my-4">
                  {score} 分
                </div>
              </div>

              <div className="bg-black/30 rounded-2xl p-6 mb-6 border-4 border-white/30">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-white/80 mb-1">你的生命值</p>
                    <div className="flex gap-1 justify-center">
                      {[...Array(5)].map((_, i) => (
                        <Heart 
                          key={i}
                          className={`w-7 h-7 ${i < playerHP ? 'text-red-400 fill-red-400' : 'text-gray-500'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-white/80 mb-1">病毒生命值</p>
                    <div className="flex gap-1 justify-center">
                      {[...Array(5)].map((_, i) => (
                        <Skull 
                          key={i}
                          className={`w-7 h-7 ${i < virusHP ? 'text-purple-400 fill-purple-400' : 'text-gray-500'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => {
                    handleGameEnd();
                    startBattle();
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xl font-bold py-4 rounded-2xl border-4 border-purple-300 hover:from-purple-400 hover:to-pink-500 active:translate-y-2 transition-all shadow-[0_5px_0_#7e22ce]"
                >
                  🔄 再战一次
                </button>
                <button
                  onClick={() => {
                    handleGameEnd();
                    navigate('/');
                  }}
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
