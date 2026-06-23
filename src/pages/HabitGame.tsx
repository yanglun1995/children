import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { ArrowLeft, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

// 陋习和好习惯对比
const habits = [
  {
    id: 'q1',
    bad: { emoji: '📱', title: '长时间玩手机', desc: '躺着玩手机伤眼睛' },
    good: { emoji: '🧘', title: '做眼保健操', desc: '保护视力很重要' },
    icon: '👀'
  },
  {
    id: 'q2',
    bad: { emoji: '🌙', title: '熬夜不睡觉', desc: '影响身体发育' },
    good: { emoji: '😴', title: '早睡早起', desc: '保证充足睡眠' },
    icon: '💤'
  },
  {
    id: 'q3',
    bad: { emoji: '🍔', title: '爱吃垃圾食品', desc: '对健康不利' },
    good: { emoji: '🥗', title: '均衡饮食', desc: '多吃蔬菜水果' },
    icon: '🥗'
  },
  {
    id: 'q4',
    bad: { emoji: '🏠', title: '整天不出门', desc: '缺乏运动' },
    good: { emoji: '⚽', title: '户外运动', desc: '增强体质' },
    icon: '🏃'
  },
  {
    id: 'q5',
    bad: { emoji: '🥤', title: '爱喝饮料', desc: '糖分过高' },
    good: { emoji: '💧', title: '多喝白开水', desc: '健康又省钱' },
    icon: '💧'
  },
  {
    id: 'q6',
    bad: { emoji: '🍬', title: '爱吃零食', desc: '影响正餐' },
    good: { emoji: '🍎', title: '吃水果', desc: '天然又健康' },
    icon: '🍎'
  },
  {
    id: 'q7',
    bad: { emoji: '📺', title: '看太久电视', desc: '伤眼睛又伤身' },
    good: { emoji: '📚', title: '多看书学习', desc: '增长知识' },
    icon: '📖'
  },
  {
    id: 'q8',
    bad: { emoji: '🦷', title: '不刷牙', desc: '会长蛀牙' },
    good: { emoji: '🪥', title: '每天刷牙', desc: '保护牙齿' },
    icon: '😁'
  },
  {
    id: 'q9',
    bad: { emoji: '🧼', title: '不爱洗手', desc: '容易生病' },
    good: { emoji: '✅', title: '勤洗手', desc: '赶走细菌' },
    icon: '🧼'
  },
  {
    id: 'q10',
    bad: { emoji: '🥱', title: '张嘴呼吸', desc: '影响面容' },
    good: { emoji: '😮', title: '用鼻呼吸', desc: '更健康' },
    icon: '👃'
  },
  {
    id: 'q11',
    bad: { emoji: '🦵', title: '坐姿不正确', desc: '容易驼背' },
    good: { emoji: '🪑', title: '坐姿端正', desc: '保护脊柱' },
    icon: '🪑'
  },
  {
    id: 'q12',
    bad: { emoji: '🥡', title: '暴饮暴食', desc: '伤胃' },
    good: { emoji: '🍽️', title: '细嚼慢咽', desc: '助消化' },
    icon: '🍽️'
  },
];

// 场景类型
const scenes = [
  { 
    id: 'classroom', 
    name: '教室', 
    emoji: '🏫',
    background: 'from-blue-400 via-blue-500 to-indigo-600',
    description: '找出教室里的坏习惯',
    badItems: ['趴着看书', '吃零食', '玩铅笔'],
    goodItems: ['认真听讲', '举手发言', '坐姿端正']
  },
  { 
    id: 'dining', 
    name: '餐厅', 
    emoji: '🍽️',
    background: 'from-orange-400 via-amber-500 to-yellow-600',
    description: '找出餐厅里的坏习惯',
    badItems: ['挑食', '边吃边玩', '喝太多饮料'],
    goodItems: ['不挑食', '专心吃饭', '多喝白开水']
  },
  { 
    id: 'bedroom', 
    name: '卧室', 
    emoji: '🛏️',
    background: 'from-purple-400 via-pink-500 to-rose-600',
    description: '找出卧室里的坏习惯',
    badItems: ['熬夜玩手机', '不整理床铺', '房间乱糟糟'],
    goodItems: ['早睡早起', '整理床铺', '保持整洁']
  },
  { 
    id: 'playground', 
    name: '操场', 
    emoji: '⚽',
    background: 'from-green-400 via-emerald-500 to-teal-600',
    description: '找出操场上的坏习惯',
    badItems: ['剧烈运动后喝冷饮', '不及时补水', '不做热身'],
    goodItems: ['适当休息', '多喝白开水', '运动前热身']
  },
];

export default function HabitGame() {
  const navigate = useNavigate();
  const { addScore, addBadge, addKnowledgeCard } = useGameStore();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'result'>('menu');
  const [currentScene, setCurrentScene] = useState(0);
  const [foundBad, setFoundBad] = useState<string[]>([]);
  const [foundGood, setFoundGood] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showFeedback, setShowFeedback] = useState<{type: 'good' | 'bad', text: string} | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  const scene = scenes[currentScene];
  const totalItems = 3; // 每关找3个好习惯和3个坏习惯
  const allHabits = habits.slice(0, 6);

  const startGame = (sceneIndex: number) => {
    setCurrentScene(sceneIndex);
    setFoundBad([]);
    setFoundGood([]);
    setScore(0);
    setTimeLeft(30);
    setGameState('playing');
  };

  const handleFindGood = (habitId: string) => {
    if (foundGood.includes(habitId) || foundBad.includes(habitId)) return;
    
    setFoundGood(prev => [...prev, habitId]);
    setScore(prev => prev + 20);
    setShowFeedback({ type: 'good', text: '太好了！找到好习惯！' });
    setTimeout(() => setShowFeedback(null), 1000);
    
    // 检查是否完成
    if (foundGood.length + 1 >= totalItems && foundBad.length >= totalItems) {
      endRound();
    }
  };

  const handleFindBad = (habitId: string) => {
    if (foundGood.includes(habitId) || foundBad.includes(habitId)) return;
    
    setFoundBad(prev => [...prev, habitId]);
    setScore(prev => Math.max(0, prev - 10));
    setShowFeedback({ type: 'bad', text: '这是坏习惯！-10分' });
    setTimeout(() => setShowFeedback(null), 1000);
    
    // 检查是否完成
    if (foundGood.length >= totalItems && foundBad.length + 1 >= totalItems) {
      endRound();
    }
  };

  const endRound = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const bonus = timeLeft * 2;
    setScore(prev => prev + bonus);
    
    if (currentScene < scenes.length - 1) {
      setTimeout(() => startGame(currentScene + 1), 1500);
    } else {
      setGameState('result');
    }
  };

  useEffect(() => {
    if (gameState === 'playing') {
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
  }, [gameState]);

  const handleGameEnd = () => {
    addScore(score);
    if (score >= 100) {
      addBadge({
        id: 'habit-master',
        name: '习惯达人',
        icon: '🎯',
      });
    }
    navigate('/');
  };

  const getSceneHabits = () => {
    return allHabits.map((habit, index) => {
      const isGood = index < 3;
      return {
        ...habit,
        isGood,
        found: isGood ? foundGood.includes(habit.id) : foundBad.includes(habit.id)
      };
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 via-pink-50 to-rose-100">
      <header className="bg-white/80 backdrop-blur-sm shadow-lg sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full font-bold text-xl shadow-lg flex items-center gap-2">
            <Eye className="w-5 h-5" />
            {score} 分
          </div>
          {gameState === 'playing' && (
            <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-4 py-2 rounded-full font-bold shadow-lg">
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
              <p className="text-gray-600">找出场景中的好习惯和坏习惯！</p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 mb-6">
              <h3 className="font-bold text-purple-700 mb-3 flex items-center gap-2">
                <span className="text-xl">🎯</span> 游戏规则
              </h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>点击<span className="text-green-600 font-bold">绿色区域</span>找好习惯 <span className="text-green-500 font-bold">+20分</span></span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>点击<span className="text-red-600 font-bold">红色区域</span>找坏习惯 <span className="text-red-500 font-bold">-10分</span></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-2xl flex-shrink-0">⏱️</span>
                  <span>剩余时间越多，奖励分数越高！</span>
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
                  className={`bg-gradient-to-br ${s.background} rounded-2xl p-4 shadow-lg hover:scale-105 active:scale-95 transition-all`}
                >
                  <div className="text-4xl mb-2">{s.emoji}</div>
                  <div className="text-white font-bold">{s.name}</div>
                  <div className="text-white/70 text-xs mt-1">{s.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="p-4">
          <div className={`bg-gradient-to-br ${scene.background} rounded-3xl p-4 shadow-xl mb-4`}>
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">{scene.emoji}</div>
              <h3 className="text-xl font-bold text-white">{scene.name}</h3>
              <p className="text-white/80 text-sm">{scene.description}</p>
            </div>

            {/* 进度指示 */}
            <div className="flex justify-center gap-4 mb-4">
              <div className="bg-white/20 rounded-full px-4 py-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span className="text-white font-bold">{foundGood.length}/{totalItems}</span>
              </div>
              <div className="bg-white/20 rounded-full px-4 py-2 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-300" />
                <span className="text-white font-bold">{foundBad.length}/{totalItems}</span>
              </div>
            </div>

            {/* 反馈提示 */}
            {showFeedback && (
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl px-6 py-4 shadow-2xl z-30 animate-bounce ${
                showFeedback.type === 'good' ? 'border-4 border-green-400' : 'border-4 border-red-400'
              }`}>
                <div className={`text-2xl font-bold ${showFeedback.type === 'good' ? 'text-green-600' : 'text-red-600'}`}>
                  {showFeedback.text}
                </div>
              </div>
            )}

            {/* 习惯卡片网格 */}
            <div className="grid grid-cols-2 gap-3">
              {getSceneHabits().map((habit) => (
                <div
                  key={habit.id}
                  onClick={() => habit.isGood ? handleFindGood(habit.id) : handleFindBad(habit.id)}
                  className={`relative rounded-2xl p-4 transition-all cursor-pointer hover:scale-102 active:scale-98 ${
                    habit.found
                      ? habit.isGood
                        ? 'bg-green-100 border-4 border-green-400 opacity-80'
                        : 'bg-red-100 border-4 border-red-400 opacity-80'
                      : habit.isGood
                        ? 'bg-green-50 border-4 border-green-200 hover:border-green-400 hover:bg-green-100'
                        : 'bg-red-50 border-4 border-red-200 hover:border-red-400 hover:bg-red-100'
                  }`}
                >
                  {habit.found && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                      {habit.isGood ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                    </div>
                  )}
                  
                  <div className="text-center">
                    <div className="text-3xl mb-2">{habit.icon}</div>
                    <div className="text-4xl mb-2">{habit.isGood ? habit.good.emoji : habit.bad.emoji}</div>
                    <div className={`font-bold text-sm ${habit.isGood ? 'text-green-700' : 'text-red-700'}`}>
                      {habit.isGood ? habit.good.title : habit.bad.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {habit.isGood ? habit.good.desc : habit.bad.desc}
                    </div>
                    {habit.isGood && (
                      <div className="text-xs text-green-600 font-bold mt-2">✓ 好习惯</div>
                    )}
                    {!habit.isGood && (
                      <div className="text-xs text-red-600 font-bold mt-2">✗ 坏习惯</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
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
                {score >= 100 && (
                  <div className="text-center">
                    <div className="text-3xl">🎯</div>
                    <div className="text-xs text-gray-600">习惯达人</div>
                  </div>
                )}
                {score >= 200 && (
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
