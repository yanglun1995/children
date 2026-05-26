import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Star, Medal, BookOpen, RotateCcw } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';

export default function Profile() {
  const navigate = useNavigate();
  const { user, resetProgress } = useGameStore();

  const levelNames = ['健康小宝宝', '健康小达人', '健康小卫士', '健康小英雄', '健康小博士'];
  const currentLevelName = levelNames[Math.min(user.level - 1, levelNames.length - 1)] || levelNames[0];

  const handleReset = () => {
    if (window.confirm('确定要重置所有进度吗？')) {
      resetProgress();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-orange-50">
      <header className="bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">👤 个人中心</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-4xl shadow-lg">
              🌟
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{currentLevelName}</h2>
              <p className="text-gray-600">等级 {user.level}</p>
              <div className="flex items-center gap-1 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < user.level ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl p-4 text-center">
              <Trophy className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-gray-800">{user.totalScore}</p>
              <p className="text-sm text-gray-600">总积分</p>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-4 text-center">
              <Medal className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-gray-800">{user.badges.length}</p>
              <p className="text-sm text-gray-600">勋章数</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            <Medal className="w-6 h-6 text-purple-500" />
            我的勋章
          </h3>
          {user.badges.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-5xl mb-3">🏅</div>
              <p>还没有获得勋章</p>
              <p className="text-sm">完成游戏可以获得勋章哦！</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {user.badges.map((badge) => (
                <div key={badge.id} className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-2 shadow-lg">
                    {badge.icon}
                  </div>
                  <p className="text-sm font-medium text-gray-800">{badge.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-500" />
            知识卡片
          </h3>
          {user.knowledgeCards.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-5xl mb-3">📚</div>
              <p>还没有收集知识卡片</p>
              <p className="text-sm">玩游戏可以获得知识卡片哦！</p>
            </div>
          ) : (
            <div className="space-y-3">
              {user.knowledgeCards.map((card) => (
                <div key={card.id} className="bg-emerald-50 rounded-2xl p-4">
                  <h4 className="font-bold text-gray-800">{card.title}</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">{card.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleReset}
          className="w-full bg-gray-100 text-gray-600 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          重置进度
        </button>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>健康小卫士 v1.0</p>
          <p className="mt-1">让每个孩子都成为健康小卫士！</p>
        </div>
      </main>
    </div>
  );
}
