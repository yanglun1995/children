import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, ChevronRight, CheckCircle } from 'lucide-react';
import { knowledgeCards } from '@/data/questions';
import { useGameStore } from '@/stores/gameStore';

export default function Encyclopedia() {
  const navigate = useNavigate();
  const { user } = useGameStore();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const categories = [
    {
      id: 'hygiene',
      name: '🧼 卫生习惯',
      icon: '🧼',
      color: 'from-cyan-400 to-blue-400',
      cards: knowledgeCards.filter((c) => ['k1', 'k2'].includes(c.id)),
    },
    {
      id: 'lifestyle',
      name: '🌿 生活方式',
      icon: '🌿',
      color: 'from-green-400 to-emerald-400',
      cards: knowledgeCards.filter((c) => ['k3', 'k4', 'k5'].includes(c.id)),
    },
    {
      id: 'prevention',
      name: '🛡️ 疾病预防',
      icon: '🛡️',
      color: 'from-purple-400 to-pink-400',
      cards: knowledgeCards.filter((c) => ['k6'].includes(c.id)),
    },
  ];

  const isCardUnlocked = (cardId: string) => {
    return user.knowledgeCards.some((c) => c.id === cardId) || user.totalScore > 0;
  };

  const selectedCardData = knowledgeCards.find((c) => c.id === selectedCard);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50">
      <header className="bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">📚 知识百科</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">学习健康小知识</h2>
          <p className="text-gray-600">点击卡片了解详细内容</p>
        </div>

        {categories.map((category) => (
          <div key={category.id} className="mb-8">
            <h3 className={`inline-block bg-gradient-to-r ${category.color} text-white px-4 py-2 rounded-full font-bold mb-4`}>
              {category.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.cards.map((card) => {
                const isUnlocked = isCardUnlocked(card.id);
                return (
                  <button
                    key={card.id}
                    onClick={() => isUnlocked && setSelectedCard(card.id)}
                    className={`rounded-3xl p-6 shadow-xl transition-all ${
                      isUnlocked
                        ? 'bg-white hover:scale-102 hover:shadow-2xl'
                        : 'bg-gray-200 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center text-3xl`}>
                        {category.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-bold text-gray-800 mb-1">{card.title}</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {isUnlocked ? card.content.split('\n')[0] : '完成游戏解锁此知识'}
                        </p>
                        {isUnlocked && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-2">
                            <CheckCircle className="w-4 h-4" /> 已解锁
                          </span>
                        )}
                      </div>
                      {isUnlocked && <ChevronRight className="w-5 h-5 text-gray-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-3xl p-6 mt-8">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-8 h-8 text-orange-500" />
            <h3 className="font-bold text-gray-800 text-lg">小提示</h3>
          </div>
          <p className="text-gray-700">
            💡 完成游戏可以获得更多知识卡片哦！每完成一个游戏，都会解锁新的健康知识。
            让我们一起学习，做一个健康小卫士！
          </p>
        </div>
      </main>

      {selectedCard && selectedCardData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedCard(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 mb-4">{selectedCardData.title}</h3>
            <div className="bg-gray-50 rounded-2xl p-4 mb-4 max-h-64 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-gray-700 text-sm font-sans">
                {selectedCardData.content}
              </pre>
            </div>
            <button
              onClick={() => setSelectedCard(null)}
              className="w-full bg-gradient-to-r from-emerald-400 to-teal-400 text-white font-bold py-3 rounded-full"
            >
              知道了！
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
