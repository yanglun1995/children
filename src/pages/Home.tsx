import { Link } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';

const LOGO_IMG = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20kawaii%20chibi%20child%20explorer%20adventurer%20with%20safari%20hat%20binoculars%20backpack%20flat%20illustration%20colorful%20white%20background&image_size=square_hd';

const games = [
  { id: 'run', name: '超级马里奥', emoji: '🍄', path: '/game/run', badge: '🔥', desc: '跑酷冒险', color: 'from-green-400 to-emerald-500' },
  { id: 'fruit-slice', name: '切水果', emoji: '🍎', path: '/game/fruit-slice', badge: null, desc: '手速挑战', color: 'from-red-400 to-orange-500' },
  { id: 'quiz', name: '知识擂台', emoji: '⚔️', path: '/game/quiz', badge: null, desc: '知识对决', color: 'from-purple-400 to-violet-500' },
  { id: 'doctor', name: '小医生', emoji: '👨‍⚕️', path: '/game/doctor', badge: null, desc: '诊断达人', color: 'from-blue-400 to-cyan-500' },
  { id: 'habit', name: '陋习找茬', emoji: '🔍', path: '/game/habit', badge: null, desc: '辨别习惯', color: 'from-amber-400 to-orange-500' },
  { id: 'matching', name: '连连看', emoji: '🔗', path: '/game/matching', badge: null, desc: '配对挑战', color: 'from-teal-400 to-green-500' },
  { id: 'puzzle', name: '拼拼图', emoji: '🧩', path: '/game/puzzle', badge: null, desc: '拼图益智', color: 'from-indigo-400 to-purple-500' },
  { id: 'hammer', name: '打地鼠', emoji: '🔨', path: '/game/hammer', badge: null, desc: '反应速度', color: 'from-orange-400 to-red-500' },
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
    <div className="min-h-dvh bg-gradient-to-b from-sky-50 via-emerald-50 to-amber-50 overflow-auto pb-20 safe-bottom">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <img 
              src={LOGO_IMG} 
              alt="logo" 
              className="w-10 h-10 rounded-xl shadow-md object-cover" 
            />
            <div>
              <h1 className="text-base font-bold text-sky-600">小小健康探险家</h1>
              <p className="text-[9px] text-sky-400 -mt-0.5">玩出健康好习惯</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/encyclopedia"
              className="w-10 h-10 bg-gradient-to-br from-sky-100 to-emerald-100 rounded-xl flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all"
            >
              <span className="text-lg">📚</span>
            </Link>
            <Link
              to="/profile"
              className="bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 px-4 py-2 rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span className="text-lg">🏆</span>
              <span className="font-bold text-white text-sm">{user.totalScore}</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-4 mt-4">
        <div className="relative bg-gradient-to-br from-sky-400 via-emerald-400 to-teal-500 rounded-3xl px-5 py-5 overflow-hidden shadow-xl">
          <div className="absolute -top-10 -right-8 text-8xl opacity-15 select-none">🧭</div>
          <div className="absolute -bottom-6 -left-6 text-7xl opacity-10 select-none">🗺️</div>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="text-4xl animate-bounce">{currentTitle.emoji}</div>
            <div>
              <div className={`font-bold ${currentTitle.color}`}>{currentTitle.title}</div>
              <div className="text-sky-100 text-[10px]">Lv.{user.level} {getLevelTitle(user.level)}</div>
            </div>
          </div>
          
          <div className="flex gap-2.5">
            {[
              { label: '等级', value: user.level, color: 'bg-white/20' },
              { label: '总分', value: user.totalScore, color: 'bg-white/20' },
              { label: '勋章', value: user.badges.length, color: 'bg-white/20' },
            ].map((item) => (
              <div key={item.label} className={`${item.color} rounded-xl px-3 py-2 text-center min-w-[65px] backdrop-blur-sm`}>
                <div className="text-white font-bold text-lg">{item.value}</div>
                <div className="text-white/70 text-[9px]">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-4 mt-4">
        <div className="flex items-center gap-3">
          <Link
            to="/titles"
            className="flex-1 bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 rounded-2xl p-4 shadow-md hover:scale-[1.02] active:scale-[0.97] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="text-3xl">🏆</div>
              <div className="text-white">
                <div className="font-bold text-sm">称号系统</div>
                <div className="text-xs opacity-80">查看你的称号！</div>
              </div>
            </div>
          </Link>
          <Link
            to="/badges"
            className="flex-1 bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-400 rounded-2xl p-4 shadow-md hover:scale-[1.02] active:scale-[0.97] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="text-3xl">🏅</div>
              <div className="text-white">
                <div className="font-bold text-sm">勋章墙</div>
                <div className="text-xs opacity-80">收集更多勋章！</div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div className="mx-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sky-700 flex items-center gap-2">
            <span className="text-xl">🎮</span> 游戏乐园
          </h3>
          <span className="text-xs text-gray-400">{games.length}个游戏</span>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {games.map((game) => (
            <Link
              key={game.id}
              to={game.path}
              className="relative bg-gradient-to-br rounded-2xl p-3 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 group"
              style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
            >
              {game.badge && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                  {game.badge}
                </span>
              )}
              <div className={`bg-gradient-to-br ${game.color} rounded-xl p-3 mb-2 text-center group-hover:scale-110 transition-transform`}>
                <div className="text-2xl">{game.emoji}</div>
              </div>
              <div className="text-center">
                <h4 className="font-bold text-gray-700 text-xs leading-tight">{game.name}</h4>
                <p className="text-gray-400 text-[9px] mt-0.5">{game.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-4 mt-5">
        <Link
          to="/encyclopedia"
          className="flex items-center gap-3 bg-white rounded-2xl px-4 py-4 shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center text-3xl">📚</div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-800">📖 知识集卡册</h4>
            <p className="text-xs text-gray-500">收集健康知识卡片，成为健康探险家！</p>
          </div>
          <div className="text-gray-400 text-xl">›</div>
        </Link>
      </div>

      <div className="mx-4 mt-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-4 shadow-sm">
          <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-1.5">
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
                className="flex-shrink-0 bg-gradient-to-br from-sky-50 to-emerald-50 rounded-xl px-3 py-2.5 text-center min-w-[70px] hover:scale-105 transition-all"
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
