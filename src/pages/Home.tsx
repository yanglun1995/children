import { Link } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { BookOpen, Trophy, Star, Heart, Zap, Shield } from 'lucide-react';

const games = [
  {
    id: 'fruit-slice',
    name: '切水果大战细菌',
    icon: '🍎',
    color: 'from-red-400 to-orange-400',
    description: '切割水果，躲避细菌！',
    path: '/game/fruit-slice',
  },
  {
    id: 'run',
    name: '地铁跑酷大作战',
    icon: '🏃',
    color: 'from-green-400 to-emerald-400',
    description: '跑酷躲避垃圾食品！',
    path: '/game/run',
  },
  {
    id: 'quiz',
    name: '疾病防控小擂台',
    icon: '⚔️',
    color: 'from-purple-400 to-pink-400',
    description: '知识问答战斗！',
    path: '/game/quiz',
  },
  {
    id: 'doctor',
    name: '医生角色扮演',
    icon: '👨‍⚕️',
    color: 'from-blue-400 to-cyan-400',
    description: '体验医生的工作！',
    path: '/game/doctor',
  },
  {
    id: 'miner',
    name: '黄金矿工问答',
    icon: '⛏️',
    color: 'from-amber-400 to-yellow-400',
    description: '知识问答大挑战！',
    path: '/game/miner',
  },
  {
    id: 'matching',
    name: '健康连连看',
    icon: '🔗',
    color: 'from-teal-400 to-cyan-400',
    description: '配对健康知识！',
    path: '/game/matching',
  },
  {
    id: 'puzzle',
    name: '健康拼图挑战',
    icon: '🧩',
    color: 'from-indigo-400 to-purple-400',
    description: '拼出健康生活！',
    path: '/game/puzzle',
  },
  {
    id: 'memory',
    name: '健康记忆卡牌',
    icon: '🎴',
    color: 'from-pink-400 to-rose-400',
    description: '翻牌配对游戏！',
    path: '/game/memory',
  },
];

export default function Home() {
  const { user } = useGameStore();

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-blue-50 to-purple-50 overflow-auto pb-20">
      <header className="bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">健康小卫士</h1>
              <p className="text-xs text-gray-500">儿童传染病防控科普</p>
            </div>
          </div>
          <Link
            to="/profile"
            className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-full shadow-lg hover:scale-105 transition-transform"
          >
            <Trophy className="w-5 h-5" />
            <span className="font-bold">{user.totalScore}</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            👋 欢迎来到健康小卫士！
          </h2>
          <p className="text-gray-600">选择你喜欢的游戏，开始学习健康知识吧！</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 mb-8">
          {games.map((game) => (
            <Link
              key={game.id}
              to={game.path}
              className={`bg-gradient-to-br ${game.color} rounded-3xl p-6 shadow-xl hover:scale-105 transition-all hover:shadow-2xl`}
            >
              <div className="text-5xl mb-3">{game.icon}</div>
              <h3 className="text-white font-bold text-lg mb-1">{game.name}</h3>
              <p className="text-white/80 text-sm">{game.description}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/encyclopedia"
            className="bg-gradient-to-r from-emerald-400 to-green-500 rounded-3xl p-6 shadow-xl hover:scale-102 transition-all flex items-center gap-4"
          >
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div className="text-white">
              <h3 className="font-bold text-xl mb-1">📚 知识百科</h3>
              <p className="text-white/80">学习更多健康小知识</p>
            </div>
          </Link>

          <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl p-6 shadow-xl flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Star className="w-8 h-8 text-white" />
            </div>
            <div className="text-white">
              <h3 className="font-bold text-xl mb-1">我的成就</h3>
              <p className="text-white/80">
                已收集 {user.badges.length} 个勋章 | 等级 {user.level}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-3xl p-6 shadow-xl">
          <h3 className="font-bold text-xl text-gray-800 mb-4 flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-400" />
            健康小贴士
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-cyan-50 rounded-2xl p-4">
              <div className="text-3xl mb-2">🧼</div>
              <h4 className="font-bold text-gray-800 mb-1">勤洗手</h4>
              <p className="text-sm text-gray-600">每次洗手至少20秒</p>
            </div>
            <div className="bg-orange-50 rounded-2xl p-4">
              <div className="text-3xl mb-2">🏃</div>
              <h4 className="font-bold text-gray-800 mb-1">多运动</h4>
              <p className="text-sm text-gray-600">每天运动30分钟</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-4">
              <div className="text-3xl mb-2">😴</div>
              <h4 className="font-bold text-gray-800 mb-1">睡好觉</h4>
              <p className="text-sm text-gray-600">小学生需要9-10小时</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>💡 提示：完成游戏可以获得知识卡片和勋章哦！</p>
        </div>
      </main>
    </div>
  );
}
