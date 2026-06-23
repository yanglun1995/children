import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { ArrowLeft, CheckCircle, XCircle, Eye, Trophy } from 'lucide-react';

// 场景定义
const scenes = [
  {
    id: 'classroom',
    name: '教室',
    emoji: '🏫',
    bg: 'from-blue-400 via-indigo-500 to-purple-600',
    habits: [
      // 好习惯
      { id: 'c1', good: { person: '👧', action: '📚', text: '认真看书' }, bad: { person: '👦', action: '😴', text: '趴着睡觉' } },
      { id: 'c2', good: { person: '👦', action: '✋', text: '举手发言' }, bad: { person: '👧', action: '💬', text: '大声喧哗' } },
      { id: 'c3', good: { person: '👧', action: '🪑', text: '坐姿端正' }, bad: { person: '👦', action: '🦌', text: '驼背写字' } },
      { id: 'c4', good: { person: '👦', action: '🧹', text: '整理课桌' }, bad: { person: '👧', action: '🗑️', text: '乱扔垃圾' } },
    ]
  },
  {
    id: 'dining',
    name: '餐厅',
    emoji: '🍽️',
    bg: 'from-orange-400 via-amber-500 to-yellow-600',
    habits: [
      // 好习惯
      { id: 'd1', good: { person: '👧', action: '🥗', text: '多吃蔬菜' }, bad: { person: '👦', action: '🍔', text: '只吃肉' } },
      { id: 'd2', good: { person: '👦', action: '🍚', text: '细嚼慢咽' }, bad: { person: '👧', action: '🏃', text: '边吃边玩' } },
      { id: 'd3', good: { person: '👧', action: '💧', text: '多喝白开水' }, bad: { person: '👦', action: '🥤', text: '爱喝饮料' } },
      { id: 'd4', good: { person: '👦', action: '🙏', text: '感恩食物' }, bad: { person: '👧', action: '😤', text: '挑食厌食' } },
    ]
  },
  {
    id: 'bedroom',
    name: '卧室',
    emoji: '🛏️',
    bg: 'from-purple-400 via-pink-500 to-rose-600',
    habits: [
      // 好习惯
      { id: 'b1', good: { person: '👧', action: '😴', text: '按时睡觉' }, bad: { person: '👦', action: '🌙', text: '熬夜不睡' } },
      { id: 'b2', good: { person: '👦', action: '🧹', text: '整理床铺' }, bad: { person: '👧', action: '😕', text: '房间凌乱' } },
      { id: 'b3', good: { person: '👧', action: '💡', text: '开灯看书' }, bad: { person: '👦', action: '📱', text: '躺玩手机' } },
      { id: 'b4', good: { person: '👦', action: '🪟', text: '开窗通风' }, bad: { person: '👧', action: '😷', text: '不通风' } },
    ]
  },
  {
    id: 'playground',
    name: '操场',
    emoji: '⚽',
    bg: 'from-green-400 via-emerald-500 to-teal-600',
    habits: [
      // 好习惯
      { id: 'p1', good: { person: '👧', action: '💧', text: '及时补水' }, bad: { person: '👦', action: '🧊', text: '运动后喝冷饮' } },
      { id: 'p2', good: { person: '👦', action: '🧘', text: '运动前热身' }, bad: { person: '👧', action: '💨', text: '不做热身' } },
      { id: 'p3', good: { person: '👧', action: '🤝', text: '友好玩耍' }, bad: { person: '👦', action: '😠', text: '打架争吵' } },
      { id: 'p4', good: { person: '👦', action: '🧴', text: '注意防晒' }, bad: { person: '👧', action: '🥵', text: '暴晒中暑' } },
    ]
  },
];

export default function HabitGame() {
  const navigate = useNavigate();
  const { addScore, addBadge, addKnowledgeCard } = useGameStore();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'result'>('menu');
  const [currentScene, setCurrentScene] = useState(0);
  const [foundGoods, setFoundGoods] = useState<Set<string>>(new Set());
  const [foundBads, setFoundBads] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showFeedback, setShowFeedback] = useState<{type: 'good' | 'bad', text: string} | null>(null);
  const [roundScore, setRoundScore] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  const scene = scenes[currentScene];
  const totalPerRound = 4;

  const shuffleArray = <T,>(arr: T[]): T[] => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startGame = (sceneIndex: number) => {
    setCurrentScene(sceneIndex);
    setFoundGoods(new Set());
    setFoundBads(new Set());
    setScore(0);
    setRoundScore(0);
    setTimeLeft(30);
    setGameState('playing');
    setIsAnimating(false);
  };

  const handleSelect = (habitId: string, isGood: boolean) => {
    if (isAnimating) return;
    
    const goodSet = new Set(foundGoods);
    const badSet = new Set(foundBads);
    
    if (isGood) {
      if (goodSet.has(habitId)) return;
      goodSet.add(habitId);
      setRoundScore(prev => prev + 25);
      setShowFeedback({ type: 'good', text: '太棒了！这是好习惯！+25分' });
    } else {
      if (badSet.has(habitId)) return;
      badSet.add(habitId);
      setRoundScore(prev => Math.max(0, prev - 10));
      setShowFeedback({ type: 'bad', text: '这是坏习惯！-10分' });
    }
    
    setFoundGoods(goodSet);
    setFoundBads(badSet);
    setIsAnimating(true);
    
    setTimeout(() => {
      setShowFeedback(null);
      setIsAnimating(false);
      
      // 检查是否完成
      if (goodSet.size + badSet.size >= totalPerRound * 2) {
        endRound();
      }
    }, 800);
  };

  const endRound = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const bonus = Math.floor(timeLeft * 1.5);
    const finalRoundScore = roundScore + bonus;
    setScore(prev => prev + finalRoundScore);
    
    setTimeout(() => {
      if (currentScene < scenes.length - 1) {
        setCurrentScene(prev => prev + 1);
        setFoundGoods(new Set());
        setFoundBads(new Set());
        setRoundScore(0);
        setTimeLeft(30);
        setShowFeedback(null);
      } else {
        setGameState('result');
      }
    }, 1500);
  };

  useEffect(() => {
    if (gameState === 'playing' && foundGoods.size + foundBads.size < totalPerRound * 2) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            endRound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState, foundGoods.size, foundBads.size]);

  const handleGameEnd = () => {
    addScore(score);
    if (score >= 200) {
      addBadge({
        id: 'habit-master',
        name: '习惯达人',
        icon: '🎯',
      });
    }
    navigate('/');
  };

  const shuffledHabits = shuffleArray(scene.habits);

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
            <div className={`px-4 py-2 rounded-full font-bold shadow-lg ${
              timeLeft > 10 ? 'bg-green-400' : timeLeft > 5 ? 'bg-amber-400 animate-pulse' : 'bg-red-500 text-white animate-pulse'
            }`}>
              {timeLeft}秒
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
              <p className="text-gray-600">找出不同场景下的好习惯和坏习惯！</p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 mb-6">
              <h3 className="font-bold text-purple-700 mb-3 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                游戏规则
              </h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>点击<span className="text-green-600 font-bold">绿色勾</span>选择好习惯 <span className="text-green-500 font-bold">+25分</span></span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>点击<span className="text-red-600 font-bold">红色叉</span>选择坏习惯 <span className="text-red-500 font-bold">-10分</span></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-xl flex-shrink-0">⏱️</span>
                  <span>剩余时间越多，奖励越高！</span>
                </li>
              </ul>
            </div>

            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-xl">🗺️</span> 选择场景
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {scenes.map((s, index) => (
                <button
                  key={s.id}
                  onClick={() => startGame(index)}
                  className={`bg-gradient-to-br ${s.bg} rounded-2xl p-4 shadow-lg hover:scale-105 active:scale-95 transition-all`}
                >
                  <div className="text-4xl mb-2">{s.emoji}</div>
                  <div className="text-white font-bold">{s.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="p-4">
          {/* 场景头部 */}
          <div className={`bg-gradient-to-br ${scene.bg} rounded-3xl p-4 shadow-xl mb-4`}>
            <div className="text-center mb-3">
              <div className="text-5xl mb-2">{scene.emoji}</div>
              <h3 className="text-xl font-bold text-white">{scene.name}</h3>
              <p className="text-white/80 text-sm">找出好习惯和坏习惯</p>
            </div>

            {/* 进度条 */}
            <div className="flex justify-center gap-4 mb-3">
              <div className="bg-white/20 rounded-full px-4 py-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span className="text-white font-bold">{foundGoods.size}/{totalPerRound}</span>
              </div>
              <div className="bg-white/20 rounded-full px-4 py-2 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-300" />
                <span className="text-white font-bold">{foundBads.size}/{totalPerRound}</span>
              </div>
            </div>

            {/* 回合得分 */}
            <div className="text-center text-white/90 text-sm">
              本回合: {roundScore}分
            </div>
          </div>

          {/* 反馈提示 */}
          {showFeedback && (
            <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl px-8 py-6 shadow-2xl z-50 ${
              showFeedback.type === 'good' ? 'border-4 border-green-400' : 'border-4 border-red-400'
            } animate-bounce`}>
              <div className={`text-3xl font-bold ${showFeedback.type === 'good' ? 'text-green-600' : 'text-red-600'}`}>
                {showFeedback.text}
              </div>
            </div>
          )}

          {/* 习惯卡片网格 */}
          <div className="grid grid-cols-2 gap-3">
            {shuffledHabits.map((habit) => {
              const isGoodFound = foundGoods.has(habit.id);
              const isBadFound = foundBads.has(habit.id);
              const isDone = isGoodFound || isBadFound;
              
              return (
                <div
                  key={habit.id}
                  className="bg-white rounded-2xl p-4 shadow-lg"
                >
                  {/* 好习惯选项 */}
                  <button
                    onClick={() => !isDone && handleSelect(habit.id, true)}
                    disabled={isDone}
                    className={`w-full rounded-xl p-3 mb-2 transition-all ${
                      isGoodFound
                        ? 'bg-green-100 border-4 border-green-400'
                        : isDone
                          ? 'bg-gray-100 opacity-50'
                          : 'bg-green-50 border-4 border-green-200 hover:border-green-400 hover:bg-green-100'
                    } ${!isDone ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        <span className="text-3xl bg-white rounded-full p-1">{habit.good.person}</span>
                        <span className="text-3xl bg-white rounded-full p-1">{habit.good.action}</span>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-bold text-green-700 text-sm">{habit.good.text}</div>
                        <div className="text-xs text-gray-500">好习惯</div>
                      </div>
                      {isGoodFound && <CheckCircle className="w-6 h-6 text-green-500" />}
                    </div>
                  </button>

                  {/* 坏习惯选项 */}
                  <button
                    onClick={() => !isDone && handleSelect(habit.id, false)}
                    disabled={isDone}
                    className={`w-full rounded-xl p-3 transition-all ${
                      isBadFound
                        ? 'bg-red-100 border-4 border-red-400'
                        : isDone
                          ? 'bg-gray-100 opacity-50'
                          : 'bg-red-50 border-4 border-red-200 hover:border-red-400 hover:bg-red-100'
                    } ${!isDone ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        <span className="text-3xl bg-white rounded-full p-1">{habit.bad.person}</span>
                        <span className="text-3xl bg-white rounded-full p-1">{habit.bad.action}</span>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-bold text-red-700 text-sm">{habit.bad.text}</div>
                        <div className="text-xs text-gray-500">坏习惯</div>
                      </div>
                      {isBadFound && <XCircle className="w-6 h-6 text-red-500" />}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* 下一关提示 */}
          {foundGoods.size + foundBads.size >= totalPerRound * 2 && (
            <div className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 text-center">
              <div className="text-white font-bold text-lg animate-pulse">
                {currentScene < scenes.length - 1 ? '🎉 下一关：' + scenes[currentScene + 1].name + '！' : '🏆 挑战完成！'}
              </div>
            </div>
          )}
        </div>
      )}

      {gameState === 'result' && (
        <div className="p-4">
          <div className="bg-white rounded-3xl p-6 shadow-xl text-center">
            <div className="text-7xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">挑战完成！</h2>
            <div className="text-5xl font-bold text-purple-600 mb-6">
              {score} 分
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 mb-6">
              <h3 className="font-bold text-purple-700 mb-2">🏆 成就解锁</h3>
              <div className="flex justify-center gap-4">
                <div className="text-center">
                  <div className="text-3xl">🔍</div>
                  <div className="text-xs text-gray-600">习惯侦探</div>
                </div>
                {score >= 200 && (
                  <div className="text-center">
                    <div className="text-3xl">🎯</div>
                    <div className="text-xs text-gray-600">习惯达人</div>
                  </div>
                )}
                {score >= 400 && (
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
