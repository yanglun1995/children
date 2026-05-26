import { Link } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { BookOpen, Trophy, Star, Medal, Sparkles } from 'lucide-react';

const games = [
  {
    id: 'run',
    name: '地铁跑酷大作战',
    icon: '🏃',
    color: 'from-emerald-500 to-green-400',
    description: '跑酷躲避垃圾食品！',
    path: '/game/run',
  },
  {
    id: 'fruit-slice',
    name: '切水果大战细菌',
    icon: '🍎',
    color: 'from-red-500 to-orange-400',
    description: '切割水果，躲避细菌！',
    path: '/game/fruit-slice',
  },
  {
    id: 'quiz',
    name: '疾病防控小擂台',
    icon: '⚔️',
    color: 'from-purple-500 to-pink-400',
    description: '知识问答战斗！',
    path: '/game/quiz',
  },
  {
    id: 'doctor',
    name: '医生角色扮演',
    icon: '👨‍⚕️',
    color: 'from-blue-500 to-cyan-400',
    description: '体验医生的工作！',
    path: '/game/doctor',
  },
  {
    id: 'miner',
    name: '黄金矿工问答',
    icon: '⛏️',
    color: 'from-amber-500 to-yellow-400',
    description: '知识问答大挑战！',
    path: '/game/miner',
  },
  {
    id: 'matching',
    name: '健康连连看',
    icon: '🔗',
    color: 'from-teal-500 to-cyan-400',
    description: '配对健康知识！',
    path: '/game/matching',
  },
  {
    id: 'puzzle',
    name: '健康拼图挑战',
    icon: '🧩',
    color: 'from-indigo-500 to-purple-400',
    description: '拼出健康生活！',
    path: '/game/puzzle',
  },
  {
    id: 'hammer',
    name: '打地鼠健康问答',
    icon: '🔨',
    color: 'from-amber-600 to-yellow-500',
    description: '敲打地鼠学知识！',
    path: '/game/hammer',
  },
];

export default function Home() {
  const { user } = useGameStore();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-teal-50 to-cyan-50 overflow-auto pb-24">
      <header className="bg-white/90 backdrop-blur-sm shadow-md sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
              <Medal className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-emerald-800">健康小超人</h1>
              <p className="text-[10px] text-emerald-500">儿童传染病防控科普</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/encyclopedia"
              className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
            >
              <BookOpen className="w-5 h-5 text-white" />
            </Link>
            <Link
              to="/profile"
              className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1.5 rounded-full shadow-md hover:scale-105 transition-transform flex items-center gap-1.5"
            >
              <Trophy className="w-4 h-4" />
              <span className="font-bold text-sm">{user.totalScore}</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="px-4 pt-5 pb-3">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 text-7xl opacity-20">🦸</div>
          <h2 className="text-xl font-bold text-white mb-1">欢迎回来，健康小超人！</h2>
          <p className="text-emerald-100 text-sm mb-3">
            {user.badges.length > 0
              ? `已获得 ${user.badges.length} 个勋章，继续加油！`
              : '完成游戏收集勋章，学习健康知识！'}
          </p>
          <div className="flex gap-2">
            <div className="bg-white/20 rounded-xl px-3 py-1.5 text-center">
              <div className="text-white font-bold text-lg">{user.level}</div>
              <div className="text-emerald-100 text-[10px]">等级</div>
            </div>
            <div className="bg-white/20 rounded-xl px-3 py-1.5 text-center">
              <div className="text-white font-bold text-lg">{user.totalScore}</div>
              <div className="text-emerald-100 text-[10px]">总分</div>
            </div>
            <div className="bg-white/20 rounded-xl px-3 py-1.5 text-center">
              <div className="text-white font-bold text-lg">{user.badges.length}</div>
              <div className="text-emerald-100 text-[10px]">勋章</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-2 flex items-center justify-between">
        <h3 className="font-bold text-gray-700 text-base flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          游戏中心
        </h3>
        <p className="text-gray-400 text-xs">共 {games.length} 个游戏</p>
      </div>

      <div className="px-4 grid grid-cols-2 gap-3">
        {games.map((game) => (
          <Link
            key={game.id}
            to={game.path}
            className={`bg-gradient-to-br ${game.color} rounded-2xl p-4 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all`}
          >
            <div className="text-4xl mb-2">{game.icon}</div>
            <h3 className="text-white font-bold text-sm mb-0.5">{game.name}</h3>
            <p className="text-white/75 text-[10px]">{game.description}</p>
          </Link>
        ))}
      </div>

      <div className="px-4 mt-5">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100">
          <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-1.5">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            健康小贴士
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">🧼</div>
              <h4 className="font-bold text-gray-700 text-xs mb-0.5">勤洗手</h4>
              <p className="text-gray-400 text-[10px]">至少洗20秒</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">🏃</div>
              <h4 className="font-bold text-gray-700 text-xs mb-0.5">多运动</h4>
              <p className="text-gray-400 text-[10px]">每天30分钟</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">😴</div>
              <h4 className="font-bold text-gray-700 text-xs mb-0.5">睡好觉</h4>
              <p className="text-gray-400 text-[10px]">小学生9-10小时</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-5 text-center text-gray-400 text-[10px]">
        <p>💡 玩游戏可以解锁知识卡片和勋章哦！</p>
      </div>
    </div>
  );
}