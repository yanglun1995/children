import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { knowledgeCards } from '@/data/questions';
import { ArrowLeft, Stethoscope, Thermometer, Pill, Heart, Star, CheckCircle, BookOpen, FlaskConical } from 'lucide-react';

interface Patient {
  id: number;
  name: string;
  emoji: string;
  age: string;
  symptoms: string[];
  temperature: number;
  diagnosis: string;
  correctTools: string[];
  correctMedicine: string;
  advice: string;
}

const patients: Patient[] = [
  {
    id: 1,
    name: '小明的玩具熊',
    emoji: '🧸',
    age: '3岁',
    symptoms: ['流鼻涕', '咳嗽', '有点发烧'],
    temperature: 37.8,
    diagnosis: '普通感冒',
    correctTools: ['thermometer', 'stethoscope'],
    correctMedicine: 'medicine',
    advice: '多喝温水，多休息，按时吃药，过几天就会好起来的！'
  },
  {
    id: 2,
    name: '小红的小兔兔',
    emoji: '🐰',
    age: '5岁',
    symptoms: ['发烧', '喉咙痛', '没精神'],
    temperature: 38.6,
    diagnosis: '轻微发热',
    correctTools: ['thermometer', 'stethoscope'],
    correctMedicine: 'medicine',
    advice: '吃退烧药，多喝温水，用温毛巾擦身体降温，如果还不舒服一定要告诉大人哦！'
  },
  {
    id: 3,
    name: '小强的恐龙先生',
    emoji: '🦖',
    age: '4岁',
    symptoms: ['肚子痛', '不想吃饭'],
    temperature: 36.8,
    diagnosis: '消化不良',
    correctTools: ['thermometer'],
    correctMedicine: 'syrup',
    advice: '最近是不是吃太多零食啦？要按时吃饭，少吃垃圾食品，多吃蔬菜水果哦！'
  }
];

const tools = [
  { id: 'thermometer', name: '体温计', emoji: '🌡️', description: '测量体温' },
  { id: 'stethoscope', name: '听诊器', emoji: '🩺', description: '听心跳和呼吸' },
  { id: 'syringe', name: '注射器', emoji: '💉', description: '打针（这个要小心哦！）' }
];

const medicines = [
  { id: 'medicine', name: '药片', emoji: '💊', description: '治疗感冒发烧' },
  { id: 'syrup', name: '药水', emoji: '🧪', description: '甜甜的药水' },
  { id: 'bandage', name: '创可贴', emoji: '🩹', description: '处理小伤口' }
];

export default function DoctorGame() {
  const navigate = useNavigate();
  const { addScore, addBadge, addKnowledgeCard } = useGameStore();
  const [gamePhase, setGamePhase] = useState<'menu' | 'waiting' | 'diagnosis' | 'treatment' | 'advice' | 'complete'>('menu');
  const [currentPatientIndex, setCurrentPatientIndex] = useState(0);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');

  const currentPatient = patients[currentPatientIndex];

  const startGame = () => {
    setGamePhase('waiting');
    setCurrentPatientIndex(0);
    setScore(0);
    setSelectedTools([]);
    setSelectedMedicine(null);
    setTimeout(() => {
      setGamePhase('diagnosis');
      setMessage(`${currentPatient.name}来看病啦！`);
    }, 1000);
  };

  const toggleTool = (toolId: string) => {
    if (selectedTools.includes(toolId)) {
      setSelectedTools(prev => prev.filter(t => t !== toolId));
    } else {
      setSelectedTools(prev => [...prev, toolId]);
    }
  };

  const confirmDiagnosis = () => {
    const correctToolCount = currentPatient.correctTools.filter(t => selectedTools.includes(t)).length;
    if (correctToolCount === currentPatient.correctTools.length) {
      setScore(prev => prev + 50);
      setMessage('太棒了！检查很仔细！');
      setTimeout(() => {
        setGamePhase('treatment');
      }, 1000);
    } else {
      setMessage('好像漏了一些检查项目，再试试吧！');
    }
  };

  const selectMedicine = (medicineId: string) => {
    setSelectedMedicine(medicineId);
    if (medicineId === currentPatient.correctMedicine) {
      setScore(prev => prev + 50);
      setMessage('选对了！这是最合适的药！');
      setTimeout(() => {
        setGamePhase('advice');
      }, 1000);
    } else {
      setMessage('这个药不太对哦，再想想！');
    }
  };

  const nextPatient = () => {
    if (currentPatientIndex < patients.length - 1) {
      setCurrentPatientIndex(prev => prev + 1);
      setSelectedTools([]);
      setSelectedMedicine(null);
      setGamePhase('waiting');
      setTimeout(() => {
        setGamePhase('diagnosis');
        setMessage(`${patients[currentPatientIndex + 1].name}来看病啦！`);
      }, 1000);
    } else {
      setGamePhase('complete');
      finishGame();
    }
  };

  const finishGame = () => {
    addScore(score);
    if (score >= 200) {
      addBadge({
        id: 'doctor-expert',
        name: '小医生',
        icon: '👨‍⚕️',
      });
    }
    const randomCard = knowledgeCards[Math.floor(Math.random() * knowledgeCards.length)];
    addKnowledgeCard({
      id: randomCard.id,
      title: randomCard.title,
      content: randomCard.content,
      unlockedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-cyan-50 to-teal-50">
      <header className="bg-white/90 backdrop-blur-sm shadow-lg border-b-4 border-blue-400">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center hover:bg-blue-200 active:translate-y-1 transition-all shadow-md"
          >
            <ArrowLeft className="w-6 h-6 text-blue-700" />
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-blue-800">🏥 小小医院</h1>
            <p className="text-sm text-blue-600">医生角色扮演</p>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-5 py-2 rounded-2xl font-bold shadow-lg">
            ⭐ {score}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {gamePhase === 'menu' && (
          <div className="max-w-lg mx-auto">
            <div className="bg-gradient-to-br from-blue-400 to-cyan-500 rounded-3xl p-8 shadow-2xl border-4 border-cyan-300">
              <div className="text-center mb-6">
                <div className="text-8xl mb-4 animate-bounce">👨‍⚕️</div>
                <h1 className="text-3xl font-bold text-white mb-2" style={{ textShadow: '2px 2px 0 #1e40af' }}>
                  小小医院欢迎你！
                </h1>
                <p className="text-blue-100 text-lg">今天你是值班小医生！</p>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 mb-6 border-3 border-white/40">
                <h3 className="text-white font-bold text-xl mb-4 text-center flex items-center justify-center gap-2">
                  <BookOpen className="w-6 h-6" />
                  游戏说明
                </h3>
                <div className="space-y-3 text-white">
                  <p className="flex items-start gap-3">
                    <span className="text-2xl">🔍</span>
                    <span>使用正确的医疗工具检查病人</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-2xl">💊</span>
                    <span>选择合适的药品进行治疗</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-2xl">❤️</span>
                    <span>给出健康小建议</span>
                  </p>
                </div>
              </div>

              <button
                onClick={startGame}
                className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white text-2xl font-bold py-4 rounded-2xl border-4 border-green-300 hover:from-green-300 hover:to-emerald-400 active:translate-y-2 transition-all shadow-[0_6px_0_#047857]"
              >
                ✨ 开始接诊 ✨
              </button>
            </div>
          </div>
        )}

        {(gamePhase === 'waiting' || gamePhase === 'diagnosis' || gamePhase === 'treatment' || gamePhase === 'advice') && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border-4 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-bold text-gray-700">
                  患者 {currentPatientIndex + 1} / {patients.length}
                </div>
                <div className="flex gap-2">
                  {patients.map((_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full ${i === currentPatientIndex ? 'bg-blue-500' : i < currentPatientIndex ? 'bg-green-400' : 'bg-gray-300'}`}
                    />
                  ))}
                </div>
              </div>

              {gamePhase === 'waiting' && (
                <div className="text-center py-12">
                  <div className="text-7xl animate-pulse mb-4">⏳</div>
                  <p className="text-xl text-gray-600">等待下一位病人...</p>
                </div>
              )}

              {gamePhase !== 'waiting' && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200 mb-6">
                  <div className="flex items-center gap-6">
                    <div className="text-8xl">{currentPatient.emoji}</div>
                    <div>
                      <h2 className="text-2xl font-bold text-blue-800">{currentPatient.name}</h2>
                      <p className="text-gray-600">年龄：{currentPatient.age}</p>
                    </div>
                  </div>

                  <div className="mt-4 bg-white rounded-xl p-4">
                    <h3 className="font-bold text-red-600 mb-3 flex items-center gap-2">
                      🚨 症状：
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {currentPatient.symptoms.map((symptom, i) => (
                        <span key={i} className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-medium">
                          {symptom}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-gray-600">
                      🌡️ 体温：{currentPatient.temperature}°C
                    </p>
                  </div>
                </div>
              )}

              {message && (
                <div className="bg-yellow-50 border-3 border-yellow-300 rounded-2xl p-4 mb-6 text-center">
                  <p className="text-lg text-yellow-800 font-medium">{message}</p>
                </div>
              )}

              {gamePhase === 'diagnosis' && (
                <div>
                  <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
                    <Stethoscope className="w-6 h-6" />
                    第一步：检查身体
                  </h3>
                  <p className="text-gray-600 mb-4">选择需要的检查工具（多选）</p>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {tools.map(tool => (
                      <button
                        key={tool.id}
                        onClick={() => toggleTool(tool.id)}
                        className={`p-5 rounded-2xl border-4 transition-all hover:scale-105 ${
                          selectedTools.includes(tool.id)
                            ? 'bg-blue-100 border-blue-500 shadow-lg'
                            : 'bg-white border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        <div className="text-5xl mb-2">{tool.emoji}</div>
                        <p className="font-bold text-gray-800">{tool.name}</p>
                        <p className="text-xs text-gray-500">{tool.description}</p>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={confirmDiagnosis}
                    disabled={selectedTools.length === 0}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xl font-bold py-4 rounded-2xl border-4 border-blue-300 hover:from-blue-400 hover:to-cyan-400 active:translate-y-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ✓ 完成检查
                  </button>
                </div>
              )}

              {gamePhase === 'treatment' && (
                <div>
                  <div className="bg-green-50 border-3 border-green-300 rounded-2xl p-4 mb-6 text-center">
                    <p className="text-xl font-bold text-green-800 mb-2">
                      ✅ 诊断：{currentPatient.diagnosis}
                    </p>
                  </div>

                  <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
                    <FlaskConical className="w-6 h-6" />
                    第二步：开药治疗
                  </h3>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {medicines.map(medicine => (
                      <button
                        key={medicine.id}
                        onClick={() => selectMedicine(medicine.id)}
                        disabled={selectedMedicine !== null}
                        className={`p-5 rounded-2xl border-4 transition-all hover:scale-105 ${
                          selectedMedicine === medicine.id
                            ? medicine.id === currentPatient.correctMedicine
                              ? 'bg-green-100 border-green-500 shadow-lg'
                              : 'bg-red-100 border-red-500 shadow-lg'
                            : 'bg-white border-gray-300 hover:border-blue-400'
                        } ${selectedMedicine !== null ? 'opacity-70' : ''}`}
                      >
                        <div className="text-5xl mb-2">{medicine.emoji}</div>
                        <p className="font-bold text-gray-800">{medicine.name}</p>
                        <p className="text-xs text-gray-500">{medicine.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {gamePhase === 'advice' && (
                <div>
                  <div className="bg-green-50 border-3 border-green-300 rounded-2xl p-4 mb-6 text-center">
                    <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                    <p className="text-xl font-bold text-green-800">
                      ✅ 治疗完成！
                    </p>
                  </div>

                  <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
                    <Heart className="w-6 h-6" />
                    第三步：健康建议
                  </h3>

                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-3 border-orange-200 rounded-2xl p-6 mb-6">
                    <div className="text-5xl mb-4 text-center">💡</div>
                    <p className="text-lg text-gray-800 text-center leading-relaxed">
                      {currentPatient.advice}
                    </p>
                  </div>

                  <button
                    onClick={nextPatient}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl font-bold py-4 rounded-2xl border-4 border-green-300 hover:from-green-400 hover:to-emerald-500 active:translate-y-2 transition-all shadow-lg"
                  >
                    {currentPatientIndex < patients.length - 1 ? '➡️ 下一位病人' : '🎉 完成全部看诊'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {gamePhase === 'complete' && (
          <div className="max-w-lg mx-auto">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-8 shadow-2xl border-4 border-yellow-300">
              <div className="text-center mb-6">
                <div className="text-8xl mb-4">🎊</div>
                <h1 className="text-3xl font-bold text-white mb-2" style={{ textShadow: '2px 2px 0 #92400e' }}>
                  太棒了，小医生！
                </h1>
                <div className="text-5xl font-bold text-yellow-200 my-4">
                  {score} 分
                </div>
              </div>

              <div className="bg-black/20 rounded-2xl p-6 mb-6 border-3 border-white/30">
                <div className="flex items-center gap-4 mb-4">
                  {patients.map(patient => (
                    <div key={patient.id} className="text-4xl">
                      {patient.emoji}
                    </div>
                  ))}
                </div>
                <p className="text-white text-center text-lg">
                  你成功治疗了所有病人！
                </p>
              </div>

              <div className="bg-blue-50 rounded-2xl p-4 mb-6 border-2 border-blue-200">
                <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  获得知识卡片
                </h3>
                <p className="text-gray-600 text-sm">
                  完成游戏获得了健康知识卡片！去百科看看吧~
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={startGame}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xl font-bold py-4 rounded-2xl border-4 border-purple-300 hover:from-purple-400 hover:to-pink-500 active:translate-y-2 transition-all shadow-lg"
                >
                  🔄 再玩一次
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-600 text-white text-xl font-bold py-4 rounded-2xl border-4 border-gray-400 hover:bg-gray-500 active:translate-y-2 transition-all shadow-lg"
                >
                  🏠 返回首页
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
