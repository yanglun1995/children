export interface Question {
  id: string;
  category: 'hygiene' | 'vaccine' | 'disease' | 'immunity';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export const questions: Question[] = [
  {
    id: 'q1',
    category: 'hygiene',
    difficulty: 'easy',
    question: '什么时候需要洗手？',
    options: ['只在饭前', '只在便后', '饭前便后都要', '不需要洗手'],
    correctAnswer: 2,
    explanation: '饭前便后都要洗手，这样可以把手上的细菌和病毒冲走，保持手部清洁！',
  },
  {
    id: 'q2',
    category: 'hygiene',
    difficulty: 'easy',
    question: '正确洗手的步骤有几个？',
    options: ['3步', '5步', '7步', '10步'],
    correctAnswer: 2,
    explanation: '正确的洗手方法有7步：内、外、夹、弓、大、立、腕。每一步都要认真做哦！',
  },
  {
    id: 'q3',
    category: 'hygiene',
    difficulty: 'medium',
    question: '打喷嚏时应该怎么做？',
    options: ['对着人打', '用手捂住口鼻', '用纸巾或手肘遮挡', '不用管'],
    correctAnswer: 2,
    explanation: '打喷嚏时要用纸巾或弯曲的手肘遮挡，这样可以防止细菌传播给他人！',
  },
  {
    id: 'q4',
    category: 'hygiene',
    difficulty: 'easy',
    question: '每天应该刷几次牙？',
    options: ['1次', '2次', '3次', '不用刷牙'],
    correctAnswer: 1,
    explanation: '每天早晚各刷一次牙，每次刷2分钟以上，可以保护牙齿健康！',
  },
  {
    id: 'q5',
    category: 'vaccine',
    difficulty: 'easy',
    question: '疫苗有什么作用？',
    options: ['没有任何作用', '让身体变弱', '帮助身体产生抵抗力', '会让人生病'],
    correctAnswer: 2,
    explanation: '疫苗可以帮助我们的身体产生抵抗力，就像给身体安装了一个小盾牌，保护我们不被病毒攻击！',
  },
  {
    id: 'q6',
    category: 'vaccine',
    difficulty: 'medium',
    question: '接种疫苗后要注意什么？',
    options: ['马上剧烈运动', '多喝水、多休息', '不吃饭', '不用管'],
    correctAnswer: 1,
    explanation: '接种疫苗后要多喝水、多休息，让身体有时间产生抵抗力。如果有不舒服要告诉爸爸妈妈！',
  },
  {
    id: 'q7',
    category: 'disease',
    difficulty: 'easy',
    question: '感冒是通过什么传播的？',
    options: ['水', '空气和接触', '食物', '阳光'],
    correctAnswer: 1,
    explanation: '感冒主要通过空气中的飞沫和接触传播。所以要戴口罩、勤洗手哦！',
  },
  {
    id: 'q8',
    category: 'disease',
    difficulty: 'medium',
    question: '发烧时应该怎么做？',
    options: ['穿很多衣服捂汗', '多喝水、好好休息', '剧烈运动出汗', '不吃饭'],
    correctAnswer: 1,
    explanation: '发烧时要多喝水、好好休息，让身体有时间打败病毒。如果高烧不退要去看医生！',
  },
  {
    id: 'q9',
    category: 'immunity',
    difficulty: 'easy',
    question: '怎么做可以增强抵抗力？',
    options: ['熬夜玩游戏', '不运动', '多吃蔬菜水果、多运动、睡好觉', '只吃肉'],
    correctAnswer: 2,
    explanation: '多吃蔬菜水果、多运动、保证充足的睡眠，这些都可以帮助我们增强抵抗力！',
  },
  {
    id: 'q10',
    category: 'immunity',
    difficulty: 'medium',
    question: '什么情况下需要戴口罩？',
    options: ['一直都要戴', '感冒时、去人多的地方', '只在睡觉时戴', '不用戴'],
    correctAnswer: 1,
    explanation: '感冒时或者去人多的地方要戴口罩，这样可以保护自己也保护别人！',
  },
];

export const knowledgeCards = [
  {
    id: 'k1',
    title: '七步洗手法',
    content: '第一步：掌心相对，手指并拢相互搓擦\n第二步：手心对手背，沿指缝相互搓擦\n第三步：掌心相对，双手交叉沿指缝相互搓擦\n第四步：弯曲手指关节，在另一掌心旋转搓擦\n第五步：一手握另一手大拇指，旋转搓擦\n第六步：指尖在另一掌心旋转搓擦\n第七步：握住手腕，旋转搓擦',
  },
  {
    id: 'k2',
    title: '正确戴口罩',
    content: '1. 先洗手，保持手部清洁\n2. 口罩有颜色的一面向外\n3. 有金属条的一边向上\n4. 口罩要完全覆盖口、鼻和下巴\n5. 用手指按压金属条，使其贴合鼻梁\n6. 不要用手触摸口罩正面',
  },
  {
    id: 'k3',
    title: '健康饮食金字塔',
    content: '1. 底层：谷物类（米饭、面包等）-要多吃\n2. 第二层：蔬菜水果 - 要多吃\n3. 第三层：鱼肉蛋豆 - 适量吃\n4. 第四层：奶制品 - 每天要喝\n5. 顶层：油盐糖 - 少吃',
  },
  {
    id: 'k4',
    title: '为什么需要睡眠？',
    content: '1. 睡眠让身体休息和恢复\n2. 帮助大脑记住学到的东西\n3. 让免疫系统更强壮\n4. 小学生需要每天睡9-10小时\n5. 睡前不要玩手机或看电视',
  },
  {
    id: 'k5',
    title: '运动的好处',
    content: '1. 让身体更强壮\n2. 帮助长高\n3. 让心情更愉快\n4. 提高免疫力\n5. 每天运动30分钟以上\n6. 可以跑步、跳绳、踢球等',
  },
  {
    id: 'k6',
    title: '预防传染病',
    content: '1. 勤洗手、正确洗手\n2. 戴口罩防护\n3. 打喷嚏要遮挡\n4. 不与他人共用餐具\n5. 保持环境卫生\n6. 接种疫苗\n7. 多运动增强体质',
  },
];
