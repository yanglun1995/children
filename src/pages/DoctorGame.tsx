import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { ArrowLeft, Stethoscope, Thermometer, Heart, CheckCircle, Star } from 'lucide-react';

interface Patient {
  id: number;
  name: string;
  emoji: string;
  symptoms: string[];
  temperature: number;
  needsStethoscope: boolean;
  needsThermometer: boolean;
  diagnosis: string;
  treatment: string;
}

const patients: Patient[] = [
  {
    id: 1,
    name: '小明的玩偶',
    emoji: '🧸',
    symptoms: ['流鼻涕', '咳嗽'],
    temperature: 37.2,
    needsStethoscope: true,
    needsThermometer: true,
    diagnosis: '普通感冒',
    treatment: '多喝水，多休息，很快就会好起来！',
  },
  {
    id: 2,
    name: '小红的玩偶',
    emoji: '🐰',
    symptoms: ['发烧', '喉咙痛'],
    temperature: 38.5,
    needsStethoscope: true,
    needsThermometer: true,
    diagnosis: '轻微发烧',
    treatment: '需要降温，多喝水，如果持续发烧要看医生哦！',
  },
  {
    id: 3,
    name: '小亮的玩偶',
    emoji: '🐻',
    symptoms: ['肚子疼'],
    temperature: 36.8,
    needsStethoscope: false,
    needsThermometer: true,
    diagnosis: '消化不良',
    treatment: '可能是吃太多了，记得按时吃饭，不要暴饮暴食！',
  },
];

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: string;
}

export default function DoctorGame() {
  const navigate = useNavigate();
  const { addScore, addBadge, addKnowledgeCard } = useGameStore();
  const [gamePhase, setGamePhase] = useState<'menu' | 'playing' | 'complete'>('menu');
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [score, setScore] = useState(0);
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [patientIndex, setPatientIndex] = useState(0);

  const knowledgeTips = [
    {
      title: '为什么要看医生？',
      content: '医生可以帮助我们了解身体出了什么问题，然后给出正确的治疗方法。不要害怕看医生哦！',
    },
    {
      title: '生病时要注意什么？',
      content: '生病时要好好休息，多喝水，按时吃药。不要逞强，要告诉爸爸妈妈自己不舒服。',
    },
    {
      title: '疫苗的作用',
      content: '疫苗就像给身体的小卫兵发送情报，让身体提前知道敌人长什么样，这样遇到真正的敌人时就能快速打败它们！',
    },
  ];

  const startGame = () => {
    setCurrentPatient(patients[0]);
    setTasks([
      { id: 'temp', title: '测量体温', description: '使用体温计测量体温', completed: false, icon: '🌡️' },
      { id: 'steth', title: '听诊检查', description: '使用听诊器检查心肺', completed: false, icon: '🩺' },
      { id: 'diagnose', title: '给出诊断', description: '根据症状给出诊断', completed: false, icon: '📋' },
    ]);
    setScore(0);
    setShowDiagnosis(false);
    setPatientIndex(0);
    setGamePhase('playing');
  };

  const completeTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, completed: true } : task))
    );

    const taskBonus = taskId === 'diagnose' ? 30 : 20;
    setScore((prev) => prev + taskBonus);

    if (taskId === 'diagnose') {
      setShowDiagnosis(true);
    }
  };

  const nextPatient = () => {
    if (patientIndex < patients.length - 1) {
      const nextIndex = patientIndex + 1;
      setPatientIndex(nextIndex);
      setCurrentPatient(patients[nextIndex]);
      setTasks([
        { id: 'temp', title: '测量体温', description: '使用体温计测量体温', completed: false, icon: '🌡️' },
        { id: 'steth', title: '听诊检查', description: '使用听诊器检查心肺', completed: false, icon: '🩺' },
        { id: 'diagnose', title: '给出诊断', description: '根据症状给出诊断', completed: false, icon: '📋' },
      ]);
      setShowDiagnosis(false);
    } else {
      finishGame();
    }
  };

  const finishGame = () => {
    setGamePhase('complete');
    addScore(score);
    if (score >= 150) {
      addBadge({
        id: 'doctor-expert',
        name: '小医生',
        icon: '👨‍⚕️',
      });
    }
    if (score >= 90) {
      const randomTip = knowledgeTips[Math.floor(Math.random() * knowledgeTips.length)];
      addKnowledgeCard({
        id: `doctor-k${Date.now()}`,
        title: randomTip.title,
        content: randomTip.content,
        unlockedAt: new Date().toISOString(),
      });
    }
  };

  const allTasksCompleted = tasks.every((task) => task.completed);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-cyan-50">
      <header className="bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">医生角色扮演</h1>
          <div className="bg-gradient-to-r from-blue-400 to-cyan-400 text-white px-4 py-1 rounded-full font-bold">
            {score} 分
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {gamePhase === 'menu' && (
          <div className="max-w-md mx-auto text-center">
            <div className="text-8xl mb-6">👨‍⚕️</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">医生角色扮演</h2>
            <p className="text-gray-600 mb-6">
              你是小医生！<br />
              帮助玩偶们检查身体<br />
              学会看医生的小知识
            </p>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl p-4">
                <div className="text-3xl mb-2">🧸</div>
                <p className="text-sm text-gray-700">玩偶患者</p>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl p-4">
                <div className="text-3xl mb-2">🩺</div>
                <p className="text-sm text-gray-700">检查身体</p>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl p-4">
                <div className="text-3xl mb-2">💊</div>
                <p className="text-sm text-gray-700">给出治疗</p>
              </div>
            </div>
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-blue-400 to-cyan-400 text-white font-bold py-4 px-12 rounded-full shadow-lg hover:scale-105 transition-transform text-xl"
            >
              开始扮演
            </button>
          </div>
        )}

        {gamePhase === 'playing' && currentPatient && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-red-100 rounded-full flex items-center justify-center text-5xl">
                  {currentPatient.emoji}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{currentPatient.name}</h3>
                  <p className="text-gray-600">患者 #{currentPatient.id}</p>
                  <div className="flex gap-2 mt-2">
                    {currentPatient.symptoms.map((symptom, i) => (
                      <span key={i} className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs">
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="ml-auto text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {patientIndex + 1}/{patients.length}
                  </div>
                  <p className="text-xs text-gray-500">患者编号</p>
                </div>
              </div>

              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                任务清单
              </h4>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => !task.completed && completeTask(task.id)}
                    disabled={task.completed}
                    className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                      task.completed
                        ? 'bg-green-50 border-green-300 opacity-75'
                        : 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{task.icon}</span>
                      <div className="flex-1">
                        <h5 className="font-bold text-gray-800">{task.title}</h5>
                        <p className="text-sm text-gray-600">{task.description}</p>
                      </div>
                      {task.completed && (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {showDiagnosis && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl shadow-xl p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-6 h-6 text-yellow-500" />
                  <h4 className="font-bold text-gray-800">诊断结果</h4>
                </div>
                <div className="bg-white rounded-2xl p-4 mb-4">
                  <p className="text-lg font-bold text-gray-800 mb-2">
                    诊断：{currentPatient.diagnosis}
                  </p>
                  <p className="text-gray-600">{currentPatient.treatment}</p>
                </div>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 bg-white rounded-2xl p-4 text-center">
                    <Thermometer className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-800">{currentPatient.temperature}°C</p>
                    <p className="text-xs text-gray-600">体温</p>
                  </div>
                  <div className="flex-1 bg-white rounded-2xl p-4 text-center">
                    <Heart className="w-8 h-8 text-pink-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-800">正常</p>
                    <p className="text-xs text-gray-600">心肺</p>
                  </div>
                </div>
                <button
                  onClick={nextPatient}
                  className="w-full bg-gradient-to-r from-blue-400 to-cyan-400 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transition-transform"
                >
                  {patientIndex < patients.length - 1 ? '下一位患者 →' : '完成诊断'}
                </button>
              </div>
            )}
          </div>
        )}

        {gamePhase === 'complete' && (
          <div className="max-w-md mx-auto text-center">
            <div className="text-8xl mb-6">🏆</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">太棒了！</h2>
            <p className="text-gray-600 mb-4">你完成了所有患者的诊断！</p>
            <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-6">
              {score} 分
            </div>
            <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
              <h3 className="font-bold text-gray-800 mb-4">学到的知识</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💉</span>
                  <p className="text-sm text-gray-600">医生会使用体温计、听诊器等工具来检查身体</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💊</span>
                  <p className="text-sm text-gray-600">不同的症状需要不同的治疗方法</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">❤️</span>
                  <p className="text-sm text-gray-600">生病时要好好休息，多喝水</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-blue-400 to-cyan-400 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transition-transform"
              >
                再玩一次
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-gray-100 text-gray-700 font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transition-transform"
              >
                返回首页
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
