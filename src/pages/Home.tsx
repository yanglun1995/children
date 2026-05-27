import { Link } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';

const games = [
  {
    id: 'run',
    name: '地铁跑酷',
    emoji: '🏃',
    bg: 'from-emerald-300 to-emerald-400',
    badge: '🔥 热门',
    path: '/game/run',
  },
  {
    id: 'fruit-slice',
    name: '切水果',
    emoji: '🍎',
    bg: 'from-red-300 to-orange-400',
    badge: null,
    path: '/game/fruit-slice',
  },
  {
    id: 'quiz',
    name: '知识擂台',
    emoji: '⚔️',
    bg: 'from-purple-300 to-pink-400',
    badge: null,
    path: '/game/quiz',
  },
  {
    id: 'doctor',
    name: '小医生',
    emoji: '👨‍⚕️',
    bg: 'from-blue-300 to-cyan-400',
    badge: null,
    path: '/game/doctor',
  },
  {
    id: 'miner',
    name: '黄金矿工',
    emoji: '⛏️',
    bg: 'from-amber-300 to-yellow-400',
    badge: null,
    path: '/game/miner',
  },
  {
    id: 'matching',
    name: '连连看',
    emoji: '🔗',
    bg: 'from-teal-300 to-cyan-400',
    badge: null,
    path: '/game/matching',
  },
  {
    id: 'puzzle',
    name: '拼拼图',
    emoji: '🧩',
    bg: 'from-indigo-300 to-purple-400',
    badge: null,
    path: '/game/puzzle',
  },
  {
    id: 'hammer',
    name: '打地鼠',
    emoji: '🔨',
    bg: 'from-amber-300 to-orange-400',
    badge: null,
    path: '/game/hammer',
  },
];

export default function Home() {
  const { user } = useGameStore();

  return (
    <div className="min-h-dvh bg-gradient-to-b from-emerald-50 via-green-50 to-yellow-50 overflow-auto pb-24 safe-bottom">
      {/* ===== Top Header ===== */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-xl flex items-center justify-center shadow float-anim">
              <span className="text-lg">🦸</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-emerald-700 font-cute">健康小超人</h1>
              <p className="text-[9px] text-emerald-400 -mt-0.5">玩出健康好习惯</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              to="/encyclopedia"
              className="w-9 h-9 bg-gradient-to-br from-emerald-200 to-teal-200 rounded-xl flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all"
            >
              <span className="text-lg">📚</span>
            </Link>
            <Link
              to="/profile"
              className="bg-gradient-to-r from-amber-400 to-orange-400 px-3 py-2 rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
            >
              <span className="text-lg">🏆</span>
              <span className="font-bold text-white text-sm">{user.totalScore}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ===== Hero Banner ===== */}
      <div className="mx-4 mt-4 mb-3">
        <div className="relative bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 rounded-3xl px-5 py-6 overflow-hidden shadow-lg">
          <div className="absolute -top-6 -right-4 text-8xl opacity-20 select-none">🦸</div>
          <div className="absolute -bottom-4 -left-4 text-7xl opacity-10 select-none">💪</div>
          <div className="text-3xl mb-1">🦸</div>
          <h2 className="text-lg font-bold text-white font-cute mb-1">
            {user.totalScore > 0 ? '太棒了，继续加油！' : '欢迎来到健康小超人！'}
          </h2>
          <p className="text-emerald-100 text-xs mb-3 leading-relaxed">
            {user.badges.length > 0
              ? `你已经获得 ${user.badges.length} 个勋章，真厉害！`
              : '快来玩游戏，学习健康知识，收集勋章吧！'}
          </p>
          <div className="flex gap-2">
            {[
              { label: '等级', value: user.level, color: 'bg-emerald-200/30' },
              { label: '总分', value: user.totalScore, color: 'bg-amber-200/30' },
              { label: '勋章', value: user.badges.length, color: 'bg-pink-200/30' },
            ].map((item) => (
              <div key={item.label} className={`${item.color} rounded-xl px-3 py-1.5 text-center min-w-[64px]`}>
                <div className="text-white font-bold text-base">{item.value}</div>
                <div className="text-white/80 text-[9px]">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Game Category ===== */}
      <div className="px-4 mb-3">
        <div className="flex items-center justify-between">
          <h3 className="font-cute text-base text-emerald-700">
            ✨ 游戏乐园
          </h3>
          <span className="text-xs text-gray-400">{games.length}个游戏</span>
        </div>
      </div>

      {/* ===== Game Grid ===== */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-3">
          {games.map((game, i) => (
            <Link
              key={game.id}
              to={game.path}
              className={`relative bg-gradient-to-br ${game.bg} rounded-2xl p-4 shadow-md hover:scale-[1.02] active:scale-[0.97] transition-all duration-150`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {game.badge && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-400 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                  {game.badge}
                </span>
              )}
              <div className="text-3xl mb-1.5">{game.emoji}</div>
              <h4 className="text-white font-bold text-sm font-cute">{game.name}</h4>
            </Link>
          ))}
        </div>
      </div>

      {/* ===== Knowledge Entry ===== */}
      <div className="mx-4 mt-4">
        <Link
          to="/encyclopedia"
          className="flex items-center gap-3 bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-200 rounded-2xl px-4 py-3.5 shadow-sm hover:scale-[1.01] active:scale-[0.98] transition-all"
        >
          <div className="w-12 h-12 bg-white/60 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
            📚
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-cute text-sm text-emerald-700">📖 知识集卡册</h4>
            <p className="text-xs text-emerald-500 truncate">收集健康知识卡片，成为健康小达人！</p>
          </div>
          <div className="text-emerald-400 text-xl">›</div>
        </Link>
      </div>

      {/* ===== Health Tips ===== */}
      <div className="mx-4 mt-4">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl px-4 py-3.5 shadow-sm border border-emerald-100">
          <h4 className="font-cute text-sm text-emerald-600 mb-2.5 flex items-center gap-1.5">
            <span>⭐</span> 健康小贴士
          </h4>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1">
            {[
              { icon: '🧼', title: '勤洗手', desc: '至少20秒' },
              { icon: '🏃', title: '多运动', desc: '每天半小时' },
              { icon: '😴', title: '睡好觉', desc: '每天9-10小时' },
              { icon: '🍎', title: '吃水果', desc: '每天都要吃' },
              { icon: '💧', title: '多喝水', desc: '每天6-8杯' },
            ].map((tip) => (
              <div
                key={tip.title}
                className="flex-shrink-0 bg-gradient-to-b from-emerald-50 to-white rounded-xl px-3 py-2 text-center min-w-[72px] border border-emerald-100"
              >
                <div className="text-xl mb-0.5">{tip.icon}</div>
                <div className="font-bold text-gray-700 text-[10px]">{tip.title}</div>
                <div className="text-gray-400 text-[8px]">{tip.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Footer ===== */}
      <div className="text-center mt-5 text-gray-400 text-[10px] px-4">
        <p>💪 玩游戏学知识，做个健康小超人！</p>
      </div>
    </div>
  );
}