import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { ArrowLeft } from 'lucide-react';

const titles = [
  { minScore: 0, title: '健康小新手', emoji: '🌱', color: 'text-gray-500', desc: '刚开始探索健康知识的小朋友，继续加油！' },
  { minScore: 100, title: '健康小卫士', emoji: '🛡️', color: 'text-green-500', desc: '已经掌握一些基础健康知识了，很棒！' },
  { minScore: 300, title: '健康小达人', emoji: '⭐', color: 'text-yellow-500', desc: '健康知识掌握得不错，继续保持！' },
  { minScore: 500, title: '健康小专家', emoji: '🎓', color: 'text-blue-500', desc: '对健康知识有一定了解了，很不错！' },
  { minScore: 800, title: '健康守护者', emoji: '💂', color: 'text-purple-500', desc: '健康知识掌握得很全面，厉害！' },
  { minScore: 1200, title: '健康小英雄', emoji: '🦸', color: 'text-red-500', desc: '健康知识专家级别了，真棒！' },
  { minScore: 1800, title: '健康超级英雄', emoji: '🌟', color: 'text-amber-500', desc: '健康知识大师级别！' },
  { minScore: 2500, title: '健康王者', emoji: '👑', color: 'text-yellow-400', desc: '健康知识王者级别，无人能敌！' },
];

export default function TitlesPage() {
  const navigate = useNavigate();
  const { user } = useGameStore();

  const getCurrentTitle = () => {
    let current = titles[0];
    for (const t of titles) {
      if (user.totalScore >= t.minScore) {
        current = t;
      }
    }
    return current;
  };

  const currentTitle = getCurrentTitle();

  return (
    <div className="min-h-dvh bg-gradient-to-b from-purple-50 via-pink-50 to-yellow-50">
      <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 font-cute">🏆 称号系统</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="bg-gradient-to-br from-amber-100 via-yellow-100 to-orange-100 rounded-3xl p-6 mb-6 shadow-lg border border-amber-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4 font-cute flex items-center gap-2">
            <span className="text-2xl">🎯</span> 当前称号
          </h2>
          <div className="flex items-center gap-4 bg-white/70 rounded-2xl p-4">
            <div className="text-5xl animate-bounce-subtle">{currentTitle.emoji}</div>
            <div className="flex-1">
              <h3 className={`text-2xl font-bold ${currentTitle.color} font-cute`}>{currentTitle.title}</h3>
              <p className="text-gray-600 text-sm mt-1">{currentTitle.desc}</p>
              <div className="mt-2 text-amber-600 font-bold">
                当前分数：{user.totalScore} 分
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {titles.map((t, index) => {
            const isUnlocked = user.totalScore >= t.minScore;
            const isCurrent = t === currentTitle;
            
            return (
              <div
                key={index}
                className={`bg-white rounded-2xl p-4 shadow-md border-2 transition-all ${
                  isUnlocked 
                    ? isCurrent 
                      ? 'border-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50' 
                      : 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50' 
                    : 'border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl relative ${
                    isUnlocked 
                      ? 'bg-gradient-to-br from-amber-200 to-yellow-300' 
                      : 'bg-gray-200 grayscale opacity-70'
                  }`}>
                    {t.emoji}
                    {!isUnlocked && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center shadow-sm border border-white">
                        <span className="text-xs">🔒</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-bold ${isUnlocked ? t.color : 'text-gray-400'} font-cute`}>
                      {t.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">{t.desc}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="text-xs text-gray-500">
                        需要 {t.minScore} 分
                      </div>
                      {!isUnlocked && (
                        <div className="text-xs text-orange-500 font-medium">
                          还差 {Math.max(0, t.minScore - user.totalScore)} 分
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    {isUnlocked ? (
                      <span className="text-2xl">✅</span>
                    ) : (
                      <span className="text-2xl opacity-50">❌</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>💪 多玩游戏、收集知识卡片来获得更多称号！</p>
          <p className="mt-1">每一个称号都是你健康成长的见证！</p>
        </div>
      </div>
    </div>
  );
}
