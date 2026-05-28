import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, CheckCircle, X } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';

interface KnowledgeCard {
  id: string;
  emoji: string;
  title: string;
  content: string;
  category: string;
  categoryLabel: string;
  unlocked: boolean;
}

const DEFAULT_UNLOCKED_IDS = ['h1', 'h4', 'n1', 'i4', 'n4', 'l1'];

const ALL_CARDS: KnowledgeCard[] = [
  // ===== 🧼 卫生习惯 (hygiene) =====
  {
    id: 'h1', emoji: '🧼', title: '七步洗手法',
    content: '正确的洗手方法有7步，每一步都要认真做：\n\n1. 掌心相对，手指并拢相互搓擦\n2. 手心对手背，沿指缝相互搓擦\n3. 掌心相对，双手交叉沿指缝相互搓擦\n4. 弯曲手指关节，在另一掌心旋转搓擦\n5. 一手握另一手大拇指，旋转搓擦\n6. 指尖在另一掌心旋转搓擦\n7. 握住手腕，旋转搓擦\n\n每次洗手至少20秒，相当于唱两遍"生日快乐歌"的时间！',
    category: 'hygiene', categoryLabel: '🧼 卫生习惯', unlocked: false,
  },
  {
    id: 'h2', emoji: '🪥', title: '正确刷牙方法',
    content: '每天早晚各刷一次牙，每次刷2分钟以上。\n\n正确刷牙步骤：\n1. 牙刷斜45度对准牙齿和牙龈交界处\n2. 上下刷（不是左右来回刷）\n3. 每颗牙齿的内外侧都要刷到\n4. 最后刷一下舌苔，去除细菌\n\n牙刷每2-3个月要换一次，刷毛变形了要提前换！',
    category: 'hygiene', categoryLabel: '🧼 卫生习惯', unlocked: false,
  },
  {
    id: 'h3', emoji: '✂️', title: '定期剪指甲',
    content: '指甲缝里容易藏细菌和脏东西，所以要定期剪指甲！\n\n剪指甲注意事项：\n1. 每周剪一次指甲\n2. 不要剪得太短，留1-2毫米\n3. 剪完后用指甲锉磨平边缘\n4. 不要咬指甲，会把细菌吃进肚子里\n5. 使用专用的儿童指甲剪更安全',
    category: 'hygiene', categoryLabel: '🧼 卫生习惯', unlocked: false,
  },
  {
    id: 'h4', emoji: '😷', title: '正确戴口罩',
    content: '正确佩戴口罩的步骤：\n\n1. 先洗手，保持手部清洁\n2. 口罩有颜色的一面向外\n3. 有金属条的一边向上\n4. 口罩要完全覆盖口、鼻和下巴\n5. 用手指按压金属条，使其贴合鼻梁\n6. 不要用手触摸口罩正面\n7. 口罩潮湿或脏了要立即更换\n\n每个口罩使用时间不超过4-8小时！',
    category: 'hygiene', categoryLabel: '🧼 卫生习惯', unlocked: false,
  },
  {
    id: 'h5', emoji: '🚿', title: '洗澡的重要性',
    content: '每天或隔天洗一次澡，保持身体清洁！\n\n洗澡的好处：\n1. 清除皮肤上的细菌和汗渍\n2. 预防皮肤病的发生\n3. 让身体感到清爽舒适\n4. 帮助放松身心，改善睡眠\n\n洗澡水温不要太高，37-40℃最合适。洗澡时间控制在10-15分钟。',
    category: 'hygiene', categoryLabel: '🧼 卫生习惯', unlocked: false,
  },
  {
    id: 'h6', emoji: '🤧', title: '打喷嚏礼仪',
    content: '打喷嚏时要注意文明礼仪，防止细菌传播：\n\n1. 用纸巾或弯曲的手肘遮挡口鼻\n2. 不要用手掌直接遮挡\n3. 打完喷嚏后要洗手\n4. 如果用了纸巾，要丢进垃圾桶\n5. 打喷嚏时不要对着人\n\n一个喷嚏可以喷出大量细菌，所以正确的遮挡非常重要！',
    category: 'hygiene', categoryLabel: '🧼 卫生习惯', unlocked: false,
  },
  {
    id: 'h7', emoji: '🏠', title: '外出回家先洗手',
    content: '外出回家后第一件事就是洗手！\n\n为什么要先洗手：\n1. 外面的细菌和病毒很多\n2. 会沾到门把手、扶手等公共设施\n3. 手摸了脏东西后可能把细菌带回家\n4. 保护家人和自己的健康\n\n外出回家后要先洗手再做其他事情，这是保护健康的好习惯！',
    category: 'hygiene', categoryLabel: '🧼 卫生习惯', unlocked: false,
  },
  {
    id: 'h8', emoji: '🚽', title: '公共厕所卫生',
    content: '使用公共厕所要注意卫生：\n\n1. 用纸巾隔开厕所门把手\n2. 便后认真洗手（7步洗手法）\n3. 使用烘手机或纸巾擦干手\n4. 不要用手直接触碰冲水按钮\n5. 不要在厕所里玩手机\n\n公共厕所细菌多，注意卫生可以保护自己！',
    category: 'hygiene', categoryLabel: '🧼 卫生习惯', unlocked: false,
  },
  {
    id: 'h9', emoji: '🖐️', title: '手部卫生常识',
    content: '什么时候需要洗手？\n\n1. 饭前便后\n2. 外出回家后\n3. 接触公共设施后\n4. 咳嗽或打喷嚏后\n5. 接触动物后\n6. 处理食物前\n7. 照顾病人前后\n8. 玩完玩具后\n\n用肥皂或洗手液洗手比只用清水洗得更干净！',
    category: 'hygiene', categoryLabel: '🧼 卫生习惯', unlocked: false,
  },
  {
    id: 'h10', emoji: '🧴', title: '个人卫生用品不共用',
    content: '以下个人用品不能共用：\n\n1. 牙刷 - 口腔细菌会传播\n2. 毛巾 - 容易传播皮肤病菌\n3. 梳子 - 可能传播头虱\n4. 水杯 - 口腔细菌交换\n5. 餐具 - 病菌通过唾液传播\n6. 指甲剪 - 可能传播真菌\n\n每个人都要用自己的个人卫生用品，这是保护健康的基本原则！',
    category: 'hygiene', categoryLabel: '🧼 卫生习惯', unlocked: false,
  },

  // ===== 💉 疫苗知识 (vaccine) =====
  {
    id: 'v1', emoji: '💉', title: '疫苗的作用',
    content: '疫苗是预防疾病的好帮手！\n\n疫苗的工作原理：\n1. 疫苗中含有弱化或灭活的病毒/细菌\n2. 接种后身体会产生抗体（抵抗力）\n3. 下次遇到真正的病毒时，身体能快速识别并消灭它\n4. 就像给身体安装了一个"小盾牌"\n\n疫苗是世界上最伟大的医学发明之一，每年挽救了数百万人的生命！',
    category: 'vaccine', categoryLabel: '💉 疫苗知识', unlocked: false,
  },
  {
    id: 'v2', emoji: '🌡️', title: '流感疫苗',
    content: '流感疫苗需要每年接种！\n\n为什么每年都要接种：\n1. 流感病毒会不断变异（变化）\n2. 去年的疫苗可能对今年的新病毒无效\n3. 疫苗的保护力会随时间减弱\n4. 每年9-11月是接种流感疫苗的最佳时间\n\n流感疫苗可以大大降低感染流感的风险，即使感染了症状也会更轻！',
    category: 'vaccine', categoryLabel: '💉 疫苗知识', unlocked: false,
  },
  {
    id: 'v3', emoji: '🛡️', title: '卡介苗',
    content: '卡介苗是预防结核病的疫苗。\n\n卡介苗小知识：\n1. 出生后就要接种\n2. 接种后手臂上会留下一个小疤\n3. 可以预防严重的结核病\n4. 是儿童计划免疫的重要疫苗\n5. 接种后要注意局部卫生，不要弄破\n\n卡介苗已经保护了全球数十亿人免受结核病的侵害！',
    category: 'vaccine', categoryLabel: '💉 疫苗知识', unlocked: false,
  },
  {
    id: 'v4', emoji: '📋', title: '接种疫苗注意事项',
    content: '接种疫苗前后的注意事项：\n\n接种前：\n1. 告诉医生自己是否有过敏史\n2. 发烧时要暂缓接种\n3. 穿宽松的衣服方便接种\n\n接种后：\n1. 在现场观察30分钟\n2. 多喝水、多休息\n3. 不要剧烈运动\n4. 接种部位不要碰水\n5. 有不适要告诉家长和医生',
    category: 'vaccine', categoryLabel: '💉 疫苗知识', unlocked: false,
  },
  {
    id: 'v5', emoji: '⭐', title: '疫苗为什么重要',
    content: '疫苗对个人和社会都非常重要：\n\n对个人的好处：\n1. 预防严重的传染病\n2. 降低患病风险和并发症\n3. 保护自己和家人\n\n对社会的好处：\n1. 形成群体免疫，保护不能接种的人\n2. 减少疾病传播\n3. 节约医疗资源\n\n接种疫苗不仅保护自己，也在保护他人！',
    category: 'vaccine', categoryLabel: '💉 疫苗知识', unlocked: false,
  },
  {
    id: 'v6', emoji: '📅', title: '疫苗接种时间表',
    content: '儿童计划免疫时间表（中国）：\n\n出生：卡介苗、乙肝疫苗第一针\n1个月：乙肝疫苗第二针\n2个月：脊髓灰质炎疫苗第一针\n3个月：百白破疫苗第一针\n6个月：乙肝疫苗第三针\n8个月：麻腮风疫苗\n1岁：乙脑疫苗\n1.5岁：百白破疫苗加强\n2岁：乙脑疫苗加强\n6岁：白破疫苗\n\n按时接种疫苗是保护健康的重要保障！',
    category: 'vaccine', categoryLabel: '💉 疫苗知识', unlocked: false,
  },
  {
    id: 'v7', emoji: '🔒', title: '疫苗的安全性',
    content: '疫苗是经过严格安全检测的！\n\n疫苗安全流程：\n1. 研发阶段：实验室研究\n2. 动物实验：验证安全性\n3. 临床试验：分三阶段测试\n4. 审批上市：国家严格审核\n5. 上市后监测：持续跟踪安全性\n\n疫苗的不良反应通常是轻微的（如局部红肿、低烧），严重不良反应非常罕见。接种疫苗的好处远远大于风险！',
    category: 'vaccine', categoryLabel: '💉 疫苗知识', unlocked: false,
  },
  {
    id: 'v8', emoji: '👥', title: '群体免疫',
    content: '群体免疫是指当足够多的人接种疫苗后，疾病就很难在人群中传播。\n\n群体免疫的意义：\n1. 保护了不能接种疫苗的人（如过敏者）\n2. 保护了免疫力弱的人（如老人）\n3. 阻断了疾病的传播链条\n4. 最终可能消灭某些疾病（如天花）\n\n每个人的接种都很重要，你的接种就是在保护他人！',
    category: 'vaccine', categoryLabel: '💉 疫苗知识', unlocked: false,
  },

  // ===== 🦠 疾病知识 (disease) =====
  {
    id: 'd1', emoji: '🤒', title: '感冒知多少',
    content: '感冒是最常见的疾病之一。\n\n感冒的症状：\n1. 流鼻涕、打喷嚏\n2. 喉咙痛、咳嗽\n3. 轻微发热\n4. 全身乏力\n\n感冒主要通过空气中的飞沫和接触传播。\n\n感冒了怎么办：\n1. 多喝水、多休息\n2. 清淡饮食\n3. 按时吃药（遵医嘱）\n4. 戴口罩，防止传染他人\n\n普通感冒一般7-10天会自行好转！',
    category: 'disease', categoryLabel: '🦠 疾病知识', unlocked: false,
  },
  {
    id: 'd2', emoji: '🔥', title: '流感与普通感冒的区别',
    content: '流感和普通感冒不是一回事！\n\n普通感冒：\n症状较轻：流鼻涕、打喷嚏为主\n发热不高或不发热\n一般7-10天好转\n\n流感：\n症状较重：高烧（39℃以上）\n全身酸痛、乏力明显\n咳嗽剧烈\n可能引发肺炎等并发症\n恢复需要1-2周\n\n流感季节要接种流感疫苗！',
    category: 'disease', categoryLabel: '🦠 疾病知识', unlocked: false,
  },
  {
    id: 'd3', emoji: '🖐️', title: '手足口病',
    content: '手足口病是常见的儿童传染病。\n\n主要症状：\n1. 发烧\n2. 手、足、口腔出现小疱疹\n3. 臀部也可能出现皮疹\n4. 口腔溃疡导致吃东西疼\n\n传播方式：接触传播\n\n预防方法：\n1. 勤洗手\n2. 不共用餐具和毛巾\n3. 保持家庭卫生\n4. 避免接触患病儿童',
    category: 'disease', categoryLabel: '🦠 疾病知识', unlocked: false,
  },
  {
    id: 'd4', emoji: '🫘', title: '水痘',
    content: '水痘是一种传染性很强的疾病。\n\n主要症状：\n1. 皮肤上出现红色小点\n2. 小红点变成水泡\n3. 水泡会非常痒\n4. 可能伴有发热\n5. 水泡结痂后脱落\n\n注意事项：\n1. 不要抓破水泡，会留疤\n2. 剪短指甲，避免抓伤\n3. 穿宽松的棉质衣服\n4. 告诉大人，及时就医\n5. 水痘疫苗可以有效预防！',
    category: 'disease', categoryLabel: '🦠 疾病知识', unlocked: false,
  },
  {
    id: 'd5', emoji: '🤢', title: '诺如病毒',
    content: '诺如病毒是引起急性胃肠炎的常见病毒。\n\n主要症状：\n1. 呕吐（儿童以呕吐为主）\n2. 腹泻\n3. 腹痛\n4. 可能伴有低烧\n\n传播方式：\n1. 吃了被污染的食物\n2. 接触被污染的物体\n3. 吸入呕吐物产生的气溶胶\n\n预防方法：\n1. 勤洗手\n2. 食物要煮熟\n3. 注意饮食卫生',
    category: 'disease', categoryLabel: '🦠 疾病知识', unlocked: false,
  },
  {
    id: 'd6', emoji: '🫃', title: '腮腺炎',
    content: '腮腺炎是一种由病毒引起的传染病。\n\n主要症状：\n1. 脸颊一侧或两侧肿起来\n2. 咀嚼或吞咽时疼痛\n3. 可能伴有发热\n4. 头痛、乏力\n\n传播方式：呼吸道飞沫传播\n\n注意事项：\n1. 及时就医，遵医嘱治疗\n2. 多喝水，吃流质食物\n3. 休息很重要\n4. 麻腮风疫苗可以预防！',
    category: 'disease', categoryLabel: '🦠 疾病知识', unlocked: false,
  },
  {
    id: 'd7', emoji: '👁️', title: '红眼病',
    content: '红眼病（结膜炎）是眼睛的常见传染病。\n\n主要症状：\n1. 眼睛发红\n2. 眼睛痒、有异物感\n3. 分泌物增多（眼屎多）\n4. 怕光、流泪\n\n传播方式：接触传播\n\n预防和注意事项：\n1. 不要用手揉眼睛\n2. 用自己的毛巾和脸盆\n3. 勤洗手\n4. 及时看医生\n5. 不要共用眼药水',
    category: 'disease', categoryLabel: '🦠 疾病知识', unlocked: false,
  },
  {
    id: 'd8', emoji: '🌡️', title: '发烧了怎么办',
    content: '发烧是身体在对抗病毒的信号。\n\n发烧时的正确做法：\n1. 多喝水，补充水分\n2. 好好休息，让身体恢复\n3. 体温38.5℃以下，物理降温（贴退热贴）\n4. 体温38.5℃以上，遵医嘱用药\n5. 穿宽松透气的衣服\n\n需要去医院的信号：\n1. 高烧不退（超过3天）\n2. 精神萎靡\n3. 呼吸急促\n4. 出现皮疹',
    category: 'disease', categoryLabel: '🦠 疾病知识', unlocked: false,
  },
  {
    id: 'd9', emoji: '💩', title: '腹泻的预防',
    content: '腹泻是儿童常见的消化问题。\n\n腹泻的常见原因：\n1. 吃了不干净的食物\n2. 病毒感染（如诺如病毒）\n3. 消化不良\n4. 食物过敏\n\n腹泻时怎么办：\n1. 多喝淡盐水或温开水\n2. 吃容易消化的食物（如粥）\n3. 注意休息\n4. 严重时看医生\n\n预防方法：\n1. 注意饮食卫生\n2. 饭前便后洗手\n3. 食物煮熟后再吃',
    category: 'disease', categoryLabel: '🦠 疾病知识', unlocked: false,
  },
  {
    id: 'd10', emoji: '🫁', title: '呼吸道传染病',
    content: '呼吸道传染病是通过空气传播的疾病。\n\n常见呼吸道传染病：\n1. 感冒\n2. 流感\n3. 新冠肺炎\n4. 麻疹\n5. 结核病\n\n传播方式：\n1. 咳嗽、打喷嚏的飞沫\n2. 接触被污染的物体\n\n预防方法：\n1. 戴口罩\n2. 勤通风\n3. 勤洗手\n4. 保持社交距离\n5. 接种相关疫苗',
    category: 'disease', categoryLabel: '🦠 疾病知识', unlocked: false,
  },
  {
    id: 'd11', emoji: '👄', title: '疱疹性咽峡炎',
    content: '疱疹性咽峡炎是一种由肠道病毒引起的传染病。\n\n主要症状：\n1. 突发高烧\n2. 喉咙痛\n3. 咽部出现小疱疹和溃疡\n4. 吃东西时疼痛\n5. 流口水增多\n\n传播方式：接触和飞沫传播\n\n注意事项：\n1. 多喝水，吃流质食物\n2. 避免吃热、酸、辣的食物\n3. 勤洗手，防止传播\n4. 在家休息，不要去学校',
    category: 'disease', categoryLabel: '🦠 疾病知识', unlocked: false,
  },
  {
    id: 'd12', emoji: '🔴', title: '猩红热',
    content: '猩红热是由A组溶血性链球菌引起的传染病。\n\n主要症状：\n1. 发热\n2. 喉咙痛、扁桃体红肿\n3. 全身出现红色皮疹（像砂纸一样）\n4. 草莓舌（舌头红肿）\n5. 退烧后皮肤脱皮\n\n传播方式：呼吸道飞沫传播\n\n注意事项：\n1. 及时就医，使用抗生素治疗\n2. 在家隔离，不要去学校\n3. 多喝水、多休息\n4. 按时服药，不要自行停药',
    category: 'disease', categoryLabel: '🦠 疾病知识', unlocked: false,
  },

  // ===== 💪 免疫力 (immunity) =====
  {
    id: 'i1', emoji: '🏃', title: '运动增强免疫力',
    content: '运动是增强免疫力的好方法！\n\n运动的好处：\n1. 促进血液循环\n2. 帮助免疫细胞更高效工作\n3. 减少压力激素\n4. 改善睡眠质量\n5. 保持健康体重\n\n推荐运动：\n每天运动30分钟以上\n跑步、跳绳、踢球、游泳、骑车\n\n记住：运动要适量，过度运动反而会降低免疫力！',
    category: 'immunity', categoryLabel: '💪 免疫力', unlocked: false,
  },
  {
    id: 'i2', emoji: '😴', title: '睡眠与免疫力',
    content: '充足的睡眠是免疫力的重要保障！\n\n睡眠的作用：\n1. 身体休息和修复\n2. 免疫系统在睡眠时更活跃\n3. 帮助产生抗菌蛋白\n4. 让大脑巩固记忆\n\n建议睡眠时间：\n小学生：9-10小时\n中学生：8-9小时\n\n睡前不要玩手机或看电视，蓝光会影响睡眠质量！',
    category: 'immunity', categoryLabel: '💪 免疫力', unlocked: false,
  },
  {
    id: 'i3', emoji: '🥗', title: '均衡饮食增强免疫力',
    content: '均衡饮食是免疫力的基础！\n\n增强免疫力的营养素：\n1. 维生素C - 柑橘、草莓、猕猴桃\n2. 维生素D - 晒太阳、鱼肝油\n3. 锌 - 瘦肉、坚果\n4. 蛋白质 - 鸡蛋、牛奶、鱼肉\n5. 益生菌 - 酸奶\n\n每天要吃够五类食物：谷物、蔬菜、水果、蛋白、奶制品！',
    category: 'immunity', categoryLabel: '💪 免疫力', unlocked: false,
  },
  {
    id: 'i4', emoji: '⚽', title: '运动的好处',
    content: '运动对身心都有很多好处！\n\n对身体的好处：\n1. 让身体更强壮\n2. 帮助长高\n3. 提高心肺功能\n4. 增强免疫力\n5. 预防肥胖\n\n对心理的好处：\n1. 让心情更愉快\n2. 减轻压力\n3. 提高注意力\n4. 培养团队合作精神\n\n找到你喜欢的运动，坚持每天运动吧！',
    category: 'immunity', categoryLabel: '💪 免疫力', unlocked: false,
  },
  {
    id: 'i5', emoji: '🍊', title: '维生素的作用',
    content: '维生素是身体不可缺少的营养素！\n\n主要维生素及其作用：\n\n维生素A：保护视力，来自胡萝卜、菠菜\n维生素B族：帮助能量代谢，来自全谷物、肉类\n维生素C：增强免疫力，来自水果蔬菜\n维生素D：促进钙吸收，来自晒太阳、鱼肝油\n维生素E：抗氧化，来自坚果、植物油\n\n最好的获取方式是通过均衡饮食，而不是依赖补充剂！',
    category: 'immunity', categoryLabel: '💪 免疫力', unlocked: false,
  },
  {
    id: 'i6', emoji: '☀️', title: '晒太阳的好处',
    content: '适当地晒太阳对身体有很多好处！\n\n晒太阳的好处：\n1. 帮助身体合成维生素D\n2. 促进钙的吸收，让骨骼更强壮\n3. 改善心情，缓解压力\n4. 调节生物钟，改善睡眠\n\n晒太阳的注意事项：\n1. 选择早晨或傍晚阳光温和时\n2. 每天15-30分钟即可\n3. 避免暴晒，尤其是中午\n4. 涂防晒霜保护皮肤\n\n室内隔着玻璃晒太阳效果不好哦！',
    category: 'immunity', categoryLabel: '💪 免疫力', unlocked: false,
  },
  {
    id: 'i7', emoji: '💧', title: '多喝水的好处',
    content: '水是生命之源，多喝水对身体非常重要！\n\n多喝水的好处：\n1. 帮助身体排出毒素\n2. 保持皮肤水润\n3. 帮助消化和吸收\n4. 调节体温\n5. 让大脑更清醒\n\n每天喝多少水：\n小学生每天6-8杯水\n运动后要适当增加\n\n小提示：不要等口渴了才喝水，要定时喝水！',
    category: 'immunity', categoryLabel: '💪 免疫力', unlocked: false,
  },
  {
    id: 'i8', emoji: '😊', title: '保持好心情',
    content: '好心情也是免疫力的一部分！\n\n积极心态的好处：\n1. 减少压力激素\n2. 增强免疫细胞活性\n3. 改善睡眠质量\n4. 让身体更健康\n\n保持好心情的方法：\n1. 和朋友一起玩耍\n2. 做自己喜欢的事情\n3. 学会分享和表达\n4. 遇到困难寻求帮助\n5. 每天笑一笑，快乐生活！',
    category: 'immunity', categoryLabel: '💪 免疫力', unlocked: false,
  },

  // ===== 🥗 营养饮食 (nutrition) =====
  {
    id: 'n1', emoji: '🥣', title: '为什么要吃早餐',
    content: '早餐是一天中最重要的一餐！\n\n吃早餐的好处：\n1. 给大脑提供能量，帮助集中注意力学习\n2. 维持血糖稳定\n3. 培养良好的生活习惯\n4. 预防肥胖\n5. 让新陈代谢正常运转\n\n健康早餐搭配：\n牛奶/酸奶 + 面包/馒头 + 鸡蛋 + 水果\n\n不吃早餐会让大脑变迟钝，还会影响长高！',
    category: 'nutrition', categoryLabel: '🥗 营养饮食', unlocked: false,
  },
  {
    id: 'n2', emoji: '🥦', title: '蔬菜水果的重要性',
    content: '每天要吃足够的蔬菜水果！\n\n蔬菜水果的好处：\n1. 富含维生素和矿物质\n2. 含有膳食纤维，帮助消化\n3. 增强免疫力\n4. 预防疾病\n5. 让皮肤更好\n\n每天建议摄入：\n蔬菜：300-500克\n水果：200-350克\n\n"彩虹饮食法"：每天吃不同颜色的蔬菜水果，营养更均衡！',
    category: 'nutrition', categoryLabel: '🥗 营养饮食', unlocked: false,
  },
  {
    id: 'n3', emoji: '🍎', title: '健康零食选择',
    content: '学会选择健康的零食！\n\n健康零食推荐：\n1. 新鲜水果（苹果、香蕉、橘子等）\n2. 原味坚果（核桃、杏仁等）\n3. 酸奶（无糖或低糖）\n4. 全麦饼干\n5. 蔬菜条（胡萝卜、黄瓜等）\n\n不健康的零食要少吃：\n薯片、糖果、巧克力、碳酸饮料\n\n吃零食要适量，不能影响正餐的食欲！',
    category: 'nutrition', categoryLabel: '🥗 营养饮食', unlocked: false,
  },
  {
    id: 'n4', emoji: '🥛', title: '为什么要喝牛奶',
    content: '牛奶是营养丰富的天然饮品！\n\n喝牛奶的好处：\n1. 富含钙质，帮助骨骼和牙齿发育\n2. 含有优质蛋白质\n3. 含有维生素B2，帮助能量代谢\n4. 促进长高\n\n每天建议量：\n儿童每天300-400毫升\n\n如果不喜欢牛奶，可以喝酸奶或吃奶酪。\n乳糖不耐受的人可以选择无乳糖牛奶或酸奶。',
    category: 'nutrition', categoryLabel: '🥗 营养饮食', unlocked: false,
  },
  {
    id: 'n5', emoji: '🍟', title: '少吃油炸食品',
    content: '油炸食品要尽量少吃！\n\n油炸食品的危害：\n1. 油脂多、热量高，容易发胖\n2. 含有反式脂肪酸，影响心血管健康\n3. 高温油炸会产生有害物质\n4. 影响食欲，让人不爱吃正餐\n\n偶尔吃一次没关系，但不能天天吃！\n\n想吃得香又健康，可以选择蒸、煮、烤的烹饪方式。',
    category: 'nutrition', categoryLabel: '🥗 营养饮食', unlocked: false,
  },
  {
    id: 'n6', emoji: '🏗️', title: '均衡饮食金字塔',
    content: '饮食金字塔告诉你该怎么吃：\n\n底层（最多吃）：\n谷物类 - 米饭、面条、面包、杂粮\n\n第二层（多吃）：\n蔬菜和水果\n\n第三层（适量吃）：\n鱼肉蛋豆类 - 鱼、鸡肉、鸡蛋、豆腐\n\n第四层（每天吃）：\n奶制品 - 牛奶、酸奶、奶酪\n\n顶层（最少吃）：\n油、盐、糖\n\n按照金字塔的比例来吃，身体会更健康！',
    category: 'nutrition', categoryLabel: '🥗 营养饮食', unlocked: false,
  },
  {
    id: 'n7', emoji: '🥤', title: '少喝含糖饮料',
    content: '含糖饮料对身体没有好处！\n\n含糖饮料的危害：\n1. 糖分高，容易发胖\n2. 增加蛀牙风险\n3. 影响食欲，不想吃正餐\n4. 长期喝增加糖尿病风险\n5. 让皮肤变差\n\n一瓶可乐含糖量相当于10块方糖！\n\n最好的饮品是白开水，也可以喝牛奶或自制果汁。',
    category: 'nutrition', categoryLabel: '🥗 营养饮食', unlocked: false,
  },
  {
    id: 'n8', emoji: '🍚', title: '吃饭要细嚼慢咽',
    content: '吃饭时要细嚼慢咽，不要狼吞虎咽！\n\n细嚼慢咽的好处：\n1. 帮助消化和吸收\n2. 减轻肠胃负担\n3. 更容易感到饱，不容易吃多\n4. 充分享受食物的味道\n\n每口饭咀嚼15-20次\n每顿饭吃20-30分钟\n\n电视、手机边吃边看会影响专注吃饭，不利于消化！',
    category: 'nutrition', categoryLabel: '🥗 营养饮食', unlocked: false,
  },
  {
    id: 'n9', emoji: '🧊', title: '饮食卫生',
    content: '注意饮食卫生，防止病从口入！\n\n饮食卫生要点：\n1. 饭前要洗手\n2. 食物要彻底煮熟\n3. 生熟食物要分开处理\n4. 不吃过期变质的食物\n5. 水果要洗净再吃\n6. 不喝生水\n7. 不吃路边摊的三无食品\n\n记住：干净的食材 + 干净的双手 = 安全的饮食！',
    category: 'nutrition', categoryLabel: '🥗 营养饮食', unlocked: false,
  },

  // ===== 📝 生活习惯 (habit) =====
  {
    id: 'l1', emoji: '👀', title: '如何保护眼睛',
    content: '保护眼睛非常重要！\n\n护眼方法：\n1. 保持正确的读写姿势（一尺一寸一拳）\n2. 每看20分钟书/屏幕，看远处20秒（20-20-20法则）\n3. 不要在太强或太弱的光线下看书\n4. 少看手机平板，多做户外活动\n5. 每天户外活动2小时\n\n护眼食物：\n胡萝卜、菠菜、蓝莓、玉米、蛋黄\n\n定期检查视力，早发现早干预！',
    category: 'habit', categoryLabel: '📝 生活习惯', unlocked: false,
  },
  {
    id: 'l2', emoji: '🌅', title: '早睡早起身体好',
    content: '养成早睡早起的好习惯！\n\n早睡早起的好处：\n1. 让身体得到充分休息\n2. 促进生长发育\n3. 让大脑更清醒，学习效率更高\n4. 心情更好\n5. 增强免疫力\n\n作息建议：\n晚上9点前入睡\n早上7点左右起床\n睡前1小时不看电子屏幕\n\n长期熬夜会影响身高和智力发育！',
    category: 'habit', categoryLabel: '📝 生活习惯', unlocked: false,
  },
  {
    id: 'l3', emoji: '📱', title: '电子产品使用规范',
    content: '合理使用电子产品，保护健康！\n\n使用规范：\n1. 每天使用不超过1小时\n2. 眼睛距离屏幕50-60厘米\n3. 保持正确坐姿，不要躺着看\n4. 光线要充足，避免反光\n5. 每20分钟休息一下\n\n睡前1小时不要玩手机/平板，蓝光会抑制褪黑素分泌，影响睡眠。\n\n多玩户外游戏，比玩电子产品更有趣！',
    category: 'habit', categoryLabel: '📝 生活习惯', unlocked: false,
  },
  {
    id: 'l4', emoji: '🤫', title: '咳嗽礼仪',
    content: '咳嗽时要有礼貌，防止细菌传播！\n\n正确咳嗽礼仪：\n1. 咳嗽时用纸巾或手肘内侧遮挡\n2. 不要用手掌直接遮挡\n3. 咳嗽后要洗手\n4. 使用过的纸巾立即丢进垃圾桶\n5. 咳嗽时不要对着人\n\n为什么要用手肘而不是手掌？\n因为手肘不会接触其他物品，减少细菌传播！\n\n保护他人，也是保护自己！',
    category: 'habit', categoryLabel: '📝 生活习惯', unlocked: false,
  },
  {
    id: 'l5', emoji: '🪑', title: '保持正确坐姿',
    content: '正确的坐姿对脊柱和眼睛都很重要！\n\n正确坐姿要点：\n1. 头正：头部保持正直，不歪斜\n2. 肩平：两肩放松，自然平直\n3. 背直：腰背挺直，不驼背\n4. 足安：双脚平放地面\n5. 一尺一寸一拳：\n   - 眼睛离书本一尺（33厘米）\n   - 胸口离桌子一拳\n   - 手指离笔尖一寸（3厘米）\n\n不良坐姿会导致近视、驼背、颈椎问题！',
    category: 'habit', categoryLabel: '📝 生活习惯', unlocked: false,
  },
  {
    id: 'l6', emoji: '🏁', title: '运动后的注意事项',
    content: '运动后要注意这些事项：\n\n1. 不要马上停下来\n   运动后要慢走几分钟，让心率慢慢恢复正常\n\n2. 不要马上喝冰水\n   喝常温的水，少量多次\n\n3. 不要马上洗澡\n   休息20-30分钟后再洗温水澡\n\n4. 不要马上吃东西\n   休息30分钟后再进食\n\n5. 做好拉伸放松\n   减少肌肉酸痛\n\n科学运动才能让身体更健康！',
    category: 'habit', categoryLabel: '📝 生活习惯', unlocked: false,
  },
  {
    id: 'l7', emoji: '🪟', title: '房间通风卫生',
    content: '保持房间通风是预防疾病的好方法！\n\n通风的重要性：\n1. 降低室内细菌和病毒浓度\n2. 保持空气新鲜\n3. 减少过敏原\n4. 调节室内湿度\n5. 让房间没有异味\n\n通风建议：\n每天开窗通风2-3次\n每次通风15-30分钟\n雾霾天可以少开一会儿\n\n定期打扫房间，保持整洁也很重要！',
    category: 'habit', categoryLabel: '📝 生活习惯', unlocked: false,
  },
  {
    id: 'l8', emoji: '⏰', title: '规律作息的重要性',
    content: '规律的作息是健康的基础！\n\n规律作息的好处：\n1. 让身体形成生物钟\n2. 提高学习效率\n3. 改善睡眠质量\n4. 增强免疫力\n5. 让心情更稳定\n\n推荐作息时间表：\n7:00 起床\n7:30 早餐\n8:00-12:00 学习活动\n12:00 午餐\n12:30-13:30 午休\n14:00-17:00 学习活动\n18:00 晚餐\n19:00-20:00 自由活动\n21:00 准备睡觉\n\n坚持21天可以养成一个好习惯！',
    category: 'habit', categoryLabel: '📝 生活习惯', unlocked: false,
  },
  {
    id: 'l9', emoji: '🏃', title: '运动前后要热身',
    content: '运动前后做好热身非常重要！\n\n热身运动的好处：\n1. 让身体慢慢进入运动状态\n2. 预防肌肉拉伤\n3. 提高运动效果\n4. 减少受伤风险\n\n热身运动：高抬腿、拉伸、活动关节\n运动后放松：慢走、深呼吸、拉伸肌肉\n\n每次热身时间5-10分钟就足够了！',
    category: 'habit', categoryLabel: '📝 生活习惯', unlocked: false,
  },
  {
    id: 'l10', emoji: '🧘', title: '学会放松心情',
    content: '放松心情对身心健康很重要！\n\n放松的方法：\n1. 深呼吸：慢慢吸气4秒，呼气6秒\n2. 听音乐：听舒缓的音乐可以放松\n3. 画画或做手工：专注做一件事可以让心情平静\n4. 和家人朋友聊天：倾诉可以减轻压力\n5. 出门散步：看看风景，呼吸新鲜空气\n\n每天留一点时间给自己放松吧！',
    category: 'habit', categoryLabel: '📝 生活习惯', unlocked: false,
  },
  {
    id: 'l11', emoji: '🤝', title: '学会与人交往',
    content: '良好的人际关系对身心健康很重要！\n\n与人交往的技巧：\n1. 微笑：微笑可以让人感到亲切\n2. 倾听：认真听别人说话\n3. 分享：分享自己的快乐和烦恼\n4. 帮助他人：帮助别人可以让自己快乐\n5. 尊重他人：尊重别人的想法和感受\n\n朋友是人生中宝贵的财富！',
    category: 'habit', categoryLabel: '📝 生活习惯', unlocked: false,
  },
  {
    id: 'l12', emoji: '🎯', title: '设定小目标',
    content: '设定小目标可以让生活更有方向！\n\n设定目标的好处：\n1. 让自己有努力的方向\n2. 提高自信心\n3. 培养自律能力\n4. 体验成就感\n\n目标要具体、可实现，比如：\n- 每天阅读10页书\n- 每周运动3次\n- 每天帮助别人一件小事\n\n完成目标后给自己一个小奖励！',
    category: 'habit', categoryLabel: '📝 生活习惯', unlocked: false,
  },
  {
    id: 'l13', emoji: '🧴', title: '防晒小知识',
    content: '防晒不只是大人的事，小朋友也需要！\n\n为什么要防晒：\n1. 紫外线会伤害皮肤\n2. 小朋友皮肤更娇嫩，更容易晒伤\n3. 多次晒伤会增加以后患皮肤病的风险\n\n防晒方法：\n1. 出门前15分钟涂抹防晒霜（SPF30以上）\n2. 每2小时补涂一次\n3. 戴帽子和太阳镜\n4. 中午11点到下午3点避免暴晒\n5. 穿长袖浅色衣服\n\n阴天也需要防晒，紫外线可以穿透云层！',
    category: 'habit', categoryLabel: '📝 生活习惯', unlocked: false,
  },
];

const CATEGORIES = [
  { key: 'all', label: '📚 全部', color: 'from-blue-400 to-purple-400' },
  { key: 'hygiene', label: '🧼 卫生习惯', color: 'from-cyan-400 to-blue-400' },
  { key: 'vaccine', label: '💉 疫苗知识', color: 'from-indigo-400 to-purple-400' },
  { key: 'disease', label: '🦠 疾病知识', color: 'from-red-400 to-pink-400' },
  { key: 'immunity', label: '💪 免疫力', color: 'from-green-400 to-emerald-400' },
  { key: 'nutrition', label: '🥗 营养饮食', color: 'from-orange-400 to-yellow-400' },
  { key: 'habit', label: '📝 生活习惯', color: 'from-teal-400 to-cyan-400' },
];

const STARS = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  top: Math.random() * 100,
  size: Math.random() * 12 + 8,
  delay: Math.random() * 3,
  duration: Math.random() * 3 + 3,
}));

export default function Encyclopedia() {
  const navigate = useNavigate();
  const { user, addKnowledgeCard } = useGameStore();
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedCard, setSelectedCard] = useState<KnowledgeCard | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    DEFAULT_UNLOCKED_IDS.forEach((id) => {
      const card = ALL_CARDS.find((c) => c.id === id);
      if (card && !user.knowledgeCards.some((c) => c.id === id)) {
        addKnowledgeCard({
          id: card.id,
          title: card.title,
          content: card.content,
          unlockedAt: new Date().toISOString(),
        });
      }
    });
  }, []);

  const isCardUnlocked = (cardId: string) => {
    if (DEFAULT_UNLOCKED_IDS.includes(cardId)) return true;
    return user.knowledgeCards.some((c) => c.id === cardId);
  };

  const cardsWithStatus = useMemo(() => {
    return ALL_CARDS.map((card) => ({
      ...card,
      unlocked: isCardUnlocked(card.id),
    }));
  }, [user.knowledgeCards]);

  const filteredCards = useMemo(() => {
    if (activeCategory === 'all') return cardsWithStatus;
    return cardsWithStatus.filter((c) => c.category === activeCategory);
  }, [cardsWithStatus, activeCategory]);

  const unlockedCount = cardsWithStatus.filter((c) => c.unlocked).length;
  const totalCount = ALL_CARDS.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, { unlocked: number; total: number }> = {};
    CATEGORIES.forEach((cat) => {
      if (cat.key === 'all') return;
      const categoryCards = ALL_CARDS.filter((c) => c.category === cat.key);
      counts[cat.key] = {
        total: categoryCards.length,
        unlocked: categoryCards.filter((c) => isCardUnlocked(c.id)).length,
      };
    });
    return counts;
  }, [user.knowledgeCards]);

  useEffect(() => {
    if (progressPercent === 100) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [progressPercent]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-yellow-50 via-pink-50 to-blue-50">
      {STARS.map((star) => (
        <div
          key={star.id}
          className="absolute pointer-events-none text-yellow-300/30 animate-float-star"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            fontSize: `${star.size}px`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        >
          ✨
        </div>
      ))}

      <header className="bg-white/70 backdrop-blur-md shadow-lg border-b border-white/50 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm border border-gray-200/50"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-pink-500 to-purple-500">
            📚 知识集卡册
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl relative z-10">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-6 border border-white/60">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800">
              收集进度
            </h2>
            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">
              {unlockedCount}
              <span className="text-gray-400 text-lg"> / {totalCount}</span>
            </span>
          </div>
          <div className="w-full h-5 bg-gray-200/70 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-400 via-amber-400 to-green-400 transition-all duration-1000 ease-out relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 -mr-1 text-sm">
                {progressPercent >= 30 && '🌟'}
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">
            {progressPercent < 30
              ? '🌟 继续加油，收集更多知识卡片吧！'
              : progressPercent < 60
              ? '🎉 不错哦，已经集齐了一大半！'
              : progressPercent < 100
              ? '🏆 太棒了，马上就要集齐了！'
              : '🎊🎊 恭喜你集齐了所有知识卡片！你是健康小达人！🎊🎊'}
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide -mx-2 px-2">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.key;
            const catCount = cat.key === 'all'
              ? null
              : categoryCounts[cat.key];
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${
                  isActive
                    ? `bg-gradient-to-r ${cat.color} text-white shadow-lg scale-105 shadow-md`
                    : 'bg-white/80 text-gray-600 hover:bg-white hover:shadow-md shadow-sm border border-gray-200/60 hover:scale-102'
                }`}
              >
                <span className="whitespace-nowrap">
                  {cat.label}
                  {catCount && (
                    <span className={`ml-1.5 text-xs ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                      {catCount.unlocked}/{catCount.total}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredCards.map((card) => (
            card.unlocked ? (
              <div
                key={card.id}
                className="relative h-44 sm:h-48 cursor-pointer group"
                onClick={() => setSelectedCard(card)}
              >
                <div className="w-full h-full bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border-2 border-amber-300 shadow-lg p-4 flex flex-col items-center justify-center text-center overflow-hidden group-hover:shadow-xl group-hover:scale-[1.03] transition-all duration-300 relative card-sparkle">
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="text-4xl mb-2 group-hover:animate-bounce-subtle">{card.emoji}</div>
                  <h3 className="font-bold text-sm text-gray-800 leading-tight mb-1.5 line-clamp-2">
                    {card.title}
                  </h3>
                  <span className="inline-block text-[10px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium border border-amber-200">
                    {card.categoryLabel.split(' ')[1] || card.categoryLabel}
                  </span>
                </div>
              </div>
            ) : (
              <div
                key={card.id}
                className="relative h-44 sm:h-48"
              >
                <div className="w-full h-full bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-4 flex flex-col items-center justify-center text-center overflow-hidden">
                  <div className="text-4xl mb-2 opacity-40 grayscale">{card.emoji}</div>
                  <h3 className="font-bold text-sm text-gray-400 leading-tight mb-1.5 line-clamp-2">
                    {card.title}
                  </h3>
                  <span className="inline-block text-[10px] px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-400 font-medium border border-gray-200">
                    {card.categoryLabel.split(' ')[1] || card.categoryLabel}
                  </span>
                  <div className="absolute bottom-2 right-2 text-gray-300">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            )
          ))}
        </div>

        {filteredCards.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500 text-lg">该分类暂未收录知识卡片</p>
          </div>
        )}
      </main>

      {selectedCard && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-amber-200 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center text-2xl border border-amber-200">
                  {selectedCard.emoji}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{selectedCard.title}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                    {selectedCard.categoryLabel}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCard(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 mb-4 max-h-80 overflow-y-auto border border-amber-100">
              <pre className="whitespace-pre-wrap text-gray-700 text-sm font-sans leading-relaxed">
                {selectedCard.content}
              </pre>
            </div>
            <div className="flex items-center gap-2 text-xs text-amber-600 mb-3 justify-center">
              <CheckCircle className="w-4 h-4" />
              <span>已收集 · 知识卡片 #{ALL_CARDS.findIndex((c) => c.id === selectedCard.id) + 1}</span>
            </div>
            <button
              onClick={() => setSelectedCard(null)}
              className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold py-3 rounded-full hover:from-amber-500 hover:to-orange-500 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              知道了！
            </button>
          </div>
        </div>
      )}

      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-6xl animate-celebration">
            🎊🎉🎊
          </div>
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="absolute text-2xl animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-5%',
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${Math.random() * 2 + 2}s`,
                }}
              >
                {['🎉', '🎊', '⭐', '🌟', '✨', '🏆', '💪', '🎯'][i % 8]}
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .group:hover .group-hover\\:animate-bounce-subtle {
          animation: bounce-subtle 0.5s ease-in-out;
        }
        @keyframes float-star {
          0%, 100% {
            opacity: 0.3;
            transform: translateY(0) rotate(0deg);
          }
          50% {
            opacity: 0.8;
            transform: translateY(-20px) rotate(180deg);
          }
        }
        .animate-float-star {
          animation: float-star ease-in-out infinite;
        }
        @keyframes celebration {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
          25% { transform: scale(1.3) rotate(-5deg); opacity: 1; }
          50% { transform: scale(1.5) rotate(5deg); opacity: 0.9; }
          75% { transform: scale(1.3) rotate(-3deg); opacity: 1; }
        }
        .animate-celebration {
          animation: celebration 1s ease-in-out infinite;
        }
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti ease-in forwards;
        }
        @keyframes sparkle-shine {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        .card-sparkle::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            105deg,
            transparent 30%,
            rgba(255, 215, 0, 0.15) 45%,
            rgba(255, 215, 0, 0.25) 50%,
            rgba(255, 215, 0, 0.15) 55%,
            transparent 70%
          );
          background-size: 200% 100%;
          animation: sparkle-shine 3s ease-in-out infinite;
          pointer-events: none;
          border-radius: 0.75rem;
        }
      `}</style>
    </div>
  );
}