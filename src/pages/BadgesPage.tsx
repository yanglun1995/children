import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { ArrowLeft } from 'lucide-react';

const allBadges = [
  { id: 'fruit', emoji: '🍎', name: '水果达人', desc: '在切水果游戏中获得高分！' },
  { id: 'run', emoji: '🏃', name: '跑酷冠军', desc: '在马里奥跑酷中收集大量水果！' },
  { id: 'quiz', emoji: '⚔️', name: '知识王者', desc: '在知识擂台中连战连胜！' },
  { id: 'doctor', emoji: '👨‍⚕️', name: '白衣天使', desc: '在医生角色扮演中帮助患者！' },
  { id: 'miner', emoji: '⛏️', name: '挖矿专家', desc: '在黄金矿工中答对大量问题！' },
  { id: 'matching', emoji: '🔗', name: '连连高手', desc: '在健康连连看中快速完成！' },
  { id: 'puzzle', emoji: '🧩', name: '拼图大师', desc: '在健康拼图挑战中快速完成！' },
  { id: 'hammer', emoji: '🔨', name: '打鼠英雄', desc: '在打地鼠健康问答中快速反应！' },
];

export default function BadgesPage() {
  const navigate = useNavigate();
  const { user } = useGameStore();

  const unlockedBadgeIds = new Set(user.badges.map(b => b.id));

  return (
    <div className="min-h-dvh bg-gradient-to-b from-blue-50 via-cyan-50 to-green-50">
      <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 font-cute">🏅 勋章墙</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="bg-gradient-to-br from-blue-100 via-cyan-100 to-emerald-100 rounded-3xl p-6 mb-6 shadow-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-1 font-cute">勋章收集进度</h2>
              <p className="text-gray-600 text-sm">已收集 {user.badges.length} / {allBadges.length} 枚勋章</p>
            </div>
            <div className="text-4xl">
              {user.badges.length === allBadges.length ? '🎉' : '✨'}
            </div>
          </div>
          <div className="mt-4 h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${(user.badges.length / allBadges.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {allBadges.map((badge) => {
            const isUnlocked = unlockedBadgeIds.has(badge.id);
            
            return (
              <div
                key={badge.id}
                className={`bg-white rounded-2xl p-5 shadow-md border-2 transition-all ${
                  isUnlocked 
                    ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50 hover:scale-105' 
                    : 'border-gray-200 opacity-60'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-3 transition-all relative ${
                    isUnlocked 
                      ? 'bg-gradient-to-br from-amber-200 via-yellow-200 to-orange-200 shadow-lg' 
                      : 'bg-gray-200'
                  }`}>
                    {badge.emoji}
                    {!isUnlocked && (
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                        <span className="text-sm">🔒</span>
                      </div>
                    )}
                    {isUnlocked && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  <h3 className={`text-lg font-bold ${
                    isUnlocked ? 'text-amber-700' : 'text-gray-500'
                  } font-cute`}>
                    {badge.name}
                  </h3>
                  <p className={`text-sm mt-1 ${
                    isUnlocked ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {isUnlocked ? badge.desc : '继续探索以解锁！'}
                  </p>
                  {isUnlocked && (
                    <div className="mt-3 text-amber-500 text-xs font-medium">
                      ✅ 已获得
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-md border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-3 font-cute flex items-center gap-2">
            <span>💡</span> 如何获得勋章
          </h3>
          <ul className="space-y-2 text-gray-600 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-500">•</span>
              <span>多玩游戏，每个游戏都有专属勋章</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">•</span>
              <span>完成挑战，解锁隐藏勋章</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">•</span>
              <span>收集知识卡片，获得特殊勋章</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">•</span>
              <span>连续玩游戏，获得坚持勋章</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>🎮 每一枚勋章都记录着你成长的足迹！</p>
          <p className="mt-1">继续加油，收集所有勋章！</p>
        </div>
      </div>
    </div>
  );
}
