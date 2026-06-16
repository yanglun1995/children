import { Link } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';

const LOGO_IMG = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20kawaii%20chibi%20child%20explorer%20adventurer%20with%20safari%20hat%20binoculars%20backpack%20flat%20illustration%20colorful%20white%20background&image_size=square_hd';

const games = [
  {
    id: 'run', name: '超级马里奥', emoji: '🍄', path: '/game/run', badge: '🔥 热门', desc: '跑酷冒险',
    bg: 'linear-gradient(135deg, #22c55e 0%, #10b981 50%, #14b8a6 100%)',
    accent: '#86efac',
    img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20chibi%20super%20mario%20character%20jumping%20on%20green%20pipe%20flat%20vector%20illustration%20kawaii%20game%20style%20simple%20clean&image_size=square',
  },
  {
    id: 'fruit-slice', name: '切水果', emoji: '🍎', path: '/game/fruit-slice', badge: null, desc: '手速挑战',
    bg: 'linear-gradient(135deg, #ef4444 0%, #f43f5e 50%, #ec4899 100%)',
    accent: '#fca5a5',
    img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20chibi%20fruit%20ninja%20slicing%20watermelon%20and%20apple%20with%20katana%20flat%20vector%20illustration%20kawaii%20game%20style%20simple%20clean&image_size=square',
  },
  {
    id: 'quiz', name: '知识擂台', emoji: '⚔️', path: '/game/quiz', badge: null, desc: '知识对决',
    bg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6366f1 100%)',
    accent: '#c4b5fd',
    img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20chibi%20kids%20quiz%20battle%20with%20lightning%20and%20books%20flat%20vector%20illustration%20kawaii%20game%20style%20simple%20clean&image_size=square',
  },
  {
    id: 'doctor', name: '小医生', emoji: '👨‍⚕️', path: '/game/doctor', badge: null, desc: '诊断达人',
    bg: 'linear-gradient(135deg, #3b82f6 0%, #0ea5e9 50%, #06b6d4 100%)',
    accent: '#93c5fd',
    img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20chibi%20child%20doctor%20with%20stethoscope%20and%20first%20aid%20kit%20flat%20vector%20illustration%20kawaii%20game%20style%20simple%20clean&image_size=square',
  },
  {
    id: 'miner', name: '黄金矿工', emoji: '⛏️', path: '/game/miner', badge: null, desc: '挖宝答题',
    bg: 'linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%)',
    accent: '#fde68a',
    img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20chibi%20gold%20miner%20with%20pickaxe%20diamond%20and%20gold%20nugget%20flat%20vector%20illustration%20kawaii%20game%20style%20simple%20clean&image_size=square',
  },
  {
    id: 'matching', name: '连连看', emoji: '🔗', path: '/game/matching', badge: null, desc: '配对挑战',
    bg: 'linear-gradient(135deg, #14b8a6 0%, #10b981 50%, #22c55e 100%)',
    accent: '#99f6e4',
    img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20chibi%20matching%20game%20with%20colorful%20memory%20cards%20flat%20vector%20illustration%20kawaii%20game%20style%20simple%20clean&image_size=square',
  },
  {
    id: 'puzzle', name: '拼拼图', emoji: '🧩', path: '/game/puzzle', badge: null, desc: '拼图益智',
    bg: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
    accent: '#c7d2fe',
    img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20chibi%20jigsaw%20puzzle%20pieces%20colorful%20flat%20vector%20illustration%20kawaii%20game%20style%20simple%20clean&image_size=square',
  },
  {
    id: 'hammer', name: '打地鼠', emoji: '🔨', path: '/game/hammer', badge: null, desc: '反应速度',
    bg: 'linear-gradient(135deg, #f97316 0%, #ef4444 50%, #dc2626 100%)',
    accent: '#fed7aa',
    img: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20chibi%20whack%20a%20mole%20game%20with%20hammer%20and%20funny%20mole%20flat%20vector%20illustration%20kawaii%20game%20style%20simple%20clean&image_size=square',
  },
];

const getTitle = (score: number) => {
  const titles = [
    { minScore: 0, title: '健康小新手', emoji: '🌱', color: 'text-gray-500' },
    { minScore: 100, title: '健康小卫士', emoji: '🛡️', color: 'text-green-500' },
    { minScore: 300, title: '健康小达人', emoji: '⭐', color: 'text-yellow-500' },
    { minScore: 500, title: '健康小专家', emoji: '🎓', color: 'text-blue-500' },
    { minScore: 800, title: '健康守护者', emoji: '💂', color: 'text-purple-500' },
    { minScore: 1200, title: '健康小英雄', emoji: '🦸', color: 'text-red-500' },
    { minScore: 1800, title: '健康超级英雄', emoji: '🌟', color: 'text-amber-500' },
    { minScore: 2500, title: '健康王者', emoji: '👑', color: 'text-yellow-400' },
  ];
  let currentTitle = titles[0];
  for (const title of titles) {
    if (score >= title.minScore) currentTitle = title;
  }
  return currentTitle;
};

const getLevelTitle = (level: number) => {
  const levelTitles = ['幼苗', '小苗', '青芽', '嫩枝', '树苗', '小树', '大树', '古树', '参天树', '神树'];
  return levelTitles[Math.min(level - 1, levelTitles.length - 1)];
};

export default function Home() {
  const { user } = useGameStore();
  const currentTitle = getTitle(user.totalScore);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-amber-50 via-orange-50 to-rose-50 overflow-auto pb-24 safe-bottom">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img src={LOGO_IMG} alt="logo" className="w-10 h-10 rounded-xl shadow-lg object-cover" />
            <div>
              <h1 className="text-base font-bold text-amber-700 font-cute">小小健康探险家</h1>
              <p className="text-[9px] text-amber-400 -mt-0.5">玩出健康好习惯</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/encyclopedia"
              className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all"
            >
              <span className="text-lg">📚</span>
            </Link>
            <Link
              to="/profile"
              className="bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 px-4 py-2 rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
            >
              <span className="text-lg">🏆</span>
              <span className="font-bold text-white text-sm">{user.totalScore}</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-4 mt-4 mb-3">
        <div className="relative bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 rounded-3xl px-5 py-6 overflow-hidden shadow-xl">
          <div className="absolute -top-8 -right-6 text-9xl opacity-20 select-none">🧭</div>
          <div className="absolute -bottom-6 -left-6 text-8xl opacity-10 select-none">🗺️</div>
          <div className="absolute top-2 right-8 text-2xl animate-float">✨</div>
          <div className="absolute bottom-8 right-4 text-xl animate-float" style={{ animationDelay: '0.5s' }}>⭐</div>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="text-4xl">{currentTitle.emoji}</div>
            <div>
              <div className={`font-cute text-sm font-bold ${currentTitle.color}`}>{currentTitle.title}</div>
              <div className="text-amber-100 text-[10px]">Lv.{user.level} {getLevelTitle(user.level)}</div>
            </div>
          </div>
          
          <h2 className="text-lg font-bold text-white font-cute mb-2">
            {user.totalScore > 0 ? '太棒了，继续探险！' : '欢迎来到小小健康探险家！'}
          </h2>
          <p className="text-amber-100 text-xs mb-4 leading-relaxed">
            {user.badges.length > 0 
              ? `你已经获得 ${user.badges.length} 枚勋章，真厉害！` 
              : '快来玩游戏，学习健康知识，收集勋章吧！'}
          </p>
          
          <div className="flex gap-2">
            {[
              { label: '等级', value: user.level, color: 'bg-amber-200/30', icon: '📊' },
              { label: '总分', value: user.totalScore, color: 'bg-yellow-200/30', icon: '⭐' },
              { label: '勋章', value: user.badges.length, color: 'bg-pink-200/30', icon: '🏅' },
            ].map((item) => (
              <div key={item.label} className={`${item.color} rounded-xl px-3 py-2 text-center min-w-[68px] backdrop-blur-sm`}>
                <div className="text-white font-bold text-lg">{item.icon} {item.value}</div>
                <div className="text-white/80 text-[9px]">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-4 mb-4 grid grid-cols-2 gap-3">
        <Link
          to="/titles"
          className="bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 rounded-2xl p-4 shadow-md hover:scale-[1.02] active:scale-[0.97] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="text-3xl">🏆</div>
            <div className="text-white">
              <div className="font-bold font-cute">称号系统</div>
              <div className="text-xs opacity-80 mt-1">查看你的称号！</div>
            </div>
          </div>
        </Link>
        <Link
          to="/badges"
          className="bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-400 rounded-2xl p-4 shadow-md hover:scale-[1.02] active:scale-[0.97] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="text-3xl">🏅</div>
            <div className="text-white">
              <div className="font-bold font-cute">勋章墙</div>
              <div className="text-xs opacity-80 mt-1">收集更多勋章！</div>
            </div>
          </div>
        </Link>
      </div>

      <div className="mx-4 mb-3">
        <div className="flex items-center justify-between">
          <h3 className="font-cute text-base text-amber-700 flex items-center gap-2">
            <span className="text-2xl">🎮</span> 游戏乐园
          </h3>
          <span className="text-xs text-gray-400">{games.length}个游戏</span>
        </div>
      </div>

      <div className="mx-4">
        <div className="grid grid-cols-2 gap-3">
          {games.map((game, i) => (
            <Link
              key={game.id}
              to={game.path}
              className="relative rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 group overflow-hidden"
              style={{ background: game.bg }}
            >
              {game.badge && (
                <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg animate-pulse z-20">
                  {game.badge}
                </span>
              )}
              
              <div className="absolute top-0 right-0 w-20 h-20 opacity-20 pointer-events-none">
                <div className="absolute top-2 right-2 w-16 h-16 rounded-full" style={{ background: game.accent }} />
              </div>

              <div className="absolute bottom-0 right-0 w-[72px] h-[72px] overflow-hidden">
                <img
                  src={game.img}
                  alt={game.name}
                  className="w-full h-full object-cover object-center opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, transparent 30%, ${game.accent}44 100%)` }} />
              </div>

              <div className="relative p-3 pb-3">
                <div className="text-2xl mb-1 group-hover:scale-110 transition-transform drop-shadow-lg">{game.emoji}</div>
                <h4 className="text-white font-bold text-[13px] font-cute drop-shadow-sm leading-tight">{game.name}</h4>
                <p className="text-white/60 text-[9px] mt-0.5">{game.desc}</p>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: game.accent, opacity: 0.6 }} />
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-4 mt-4">
        <Link
          to="/encyclopedia"
          className="flex items-center gap-3 bg-gradient-to-r from-amber-200 via-orange-200 to-rose-200 rounded-2xl px-4 py-3.5 shadow-sm hover:scale-[1.01] active:scale-[0.98] transition-all"
        >
          <div className="w-12 h-12 bg-white/70 rounded-2xl flex items-center justify-center text-3xl shadow-sm">📚</div>
          <div className="flex-1 min-w-0">
            <h4 className="font-cute text-sm text-amber-700">📖 知识集卡册</h4>
            <p className="text-xs text-amber-500 truncate">收集健康知识卡片，成为健康探险家！</p>
          </div>
          <div className="text-amber-400 text-xl">›</div>
        </Link>
      </div>

      <div className="mx-4 mt-4">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl px-4 py-3.5 shadow-md border border-amber-100">
          <h4 className="font-cute text-sm text-amber-600 mb-2.5 flex items-center gap-1.5">
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
                className="flex-shrink-0 bg-gradient-to-br from-amber-50 to-white rounded-xl px-3 py-2 text-center min-w-[72px] border border-amber-100 hover:scale-105 transition-all"
              >
                <div className="text-xl mb-0.5">{tip.icon}</div>
                <div className="font-bold text-gray-700 text-[10px]">{tip.title}</div>
                <div className="text-gray-400 text-[8px]">{tip.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center mt-6 text-gray-400 text-[10px] px-4">
        <p>🧭 探索健康知识，做个小小探险家！</p>
        <p className="mt-1">健康知识，从我做起！🌱</p>
      </div>
    </div>
  );
}
