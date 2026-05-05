import { create } from 'zustand';

export interface TalentInfo {
  rarity: string;
  name: string;
  desc: string;
}

export interface WorldData {
  id: string;
  name: string;
  mark: string;
  tag: string;
  tagEn: string;
  code: string;
  brief: string;
  desc: string;
  description: string;
  tags: string[];
  chips: string[];
  detailDesc: string;
  configOptions: string[];
  talentPool: TalentInfo[];
  isCustom?: boolean;
}

const EARTH_TALENTS: TalentInfo[] = [
  { rarity: 'Rare / 稀有', name: '早慧之眼', desc: '学习、推理与理解速度提升。少年期更易触发知识节点，也更容易看见选择背后的长期代价。' },
  { rarity: 'Epic / 史诗', name: '命硬如石', desc: '遭遇重大危机时，获得一次额外转机判定。你不会轻易被一次失败击倒，但命运会记住这次偏移。' },
  { rarity: 'Rare / 稀有', name: '人群回声', desc: '更容易与他人形成长期羁绊。贵人、朋友与敌人都会更早出现，也更容易卷入他人的因果。' },
  { rarity: 'Epic / 史诗', name: '迟来的天命', desc: '前期平凡甚至受挫，但中后期更容易出现翻盘节点。越晚觉醒，回响越猛烈。' },
  { rarity: 'Rare / 稀有', name: '不合时宜的善良', desc: '你做出的善举更容易获得长期回报，但短期往往要付出更高代价，甚至改变原本安全的路线。' },
  { rarity: 'Legend / 传说', name: '因果旁观者', desc: '更容易察觉隐藏因果与关键伏笔。干预越多，命运反噬越强，但也可能改写原定终局。' },
  { rarity: 'Rare / 稀有', name: '社畜本能', desc: '在重复性工作中效率极高，但创造力逐渐衰退，难以跳出舒适圈。' },
  { rarity: 'Rare / 稀有', name: '社交通感', desc: '能敏锐察觉他人情绪变化，但容易被他人负面情绪感染，精神内耗严重。' },
  { rarity: 'Rare / 稀有', name: '草根韧性', desc: '出身越低，前期成长速度越快，但触及阶层天花板后难以突破。' },
  { rarity: 'Rare / 稀有', name: '信息茧房', desc: '在熟悉领域判断力精准，但面对全新事物时适应性较差。' },
  { rarity: 'Rare / 稀有', name: '拖延顿悟', desc: 'deadline临近时效率暴涨，但长期健康和精神状态持续受损。' },
  { rarity: 'Epic / 史诗', name: '斜杠人生', desc: '可同时发展多条职业路线，但每条路线的上限都会降低。' },
  { rarity: 'Epic / 史诗', name: '创业冲动', desc: '更容易发现商业机会，但失败的代价也比常人更高。' },
  { rarity: 'Epic / 史诗', name: '学区房宿命', desc: '子女教育投资回报率极高，但为此要牺牲大量个人生活质量。' },
  { rarity: 'Legend / 传说', name: '风口之子', desc: '总能提前半步感知时代风向，但每踩中一次风口就会树敌无数。' },
];

const CULTIVATION_TALENTS: TalentInfo[] = [
  { rarity: 'Rare / 稀有', name: '伪灵根', desc: '修炼速度-20%，但突破瓶颈时额外获得一次判定机会。' },
  { rarity: 'Epic / 史诗', name: '剑骨', desc: '剑类功法威力+30%，天生亲和剑道。' },
  { rarity: 'Legend / 传说', name: '天灵根', desc: '单一属性灵根纯度极高，对应属性功法修炼速度翻倍。' },
  { rarity: 'Rare / 稀有', name: '丹心', desc: '炼丹成功率提升，但炼器时容易失败。' },
  { rarity: 'Epic / 史诗', name: '御兽灵觉', desc: '更容易与妖兽建立契约，但契约反噬也更强烈。' },
  { rarity: 'Rare / 稀有', name: '散修意志', desc: '没有宗门庇护时修炼效率+15%，但获取资源更困难。' },
  { rarity: 'Rare / 稀有', name: '药童体质', desc: '培育灵药成功率+20%，但自身修炼速度受影响，境界提升缓慢。' },
  { rarity: 'Rare / 稀有', name: '符箓亲和', desc: '绘制符箓效率提升，但绘制时消耗更多神识，容易疲劳。' },
  { rarity: 'Rare / 稀有', name: '阵法直觉', desc: '布阵速度加快，但破阵能力薄弱，陷入他人阵法时难以自救。' },
  { rarity: 'Rare / 稀有', name: '灵宠共鸣', desc: '可同时契约更多灵兽，但灵兽受伤时你会分担部分痛苦。' },
  { rarity: 'Rare / 稀有', name: '凡尘执念', desc: '牵挂世俗亲人时修炼受阻，但斩断尘缘前每段因果都有额外收益。' },
  { rarity: 'Epic / 史诗', name: '双修奇才', desc: '与道侣共同修炼时双方效率倍增，但道侣陨落后修为可能倒退。' },
  { rarity: 'Epic / 史诗', name: '雷劫引体', desc: '天劫威力增加但渡劫后获得额外好处，更容易被天道注视。' },
  { rarity: 'Epic / 史诗', name: '遗迹感应', desc: '更容易发现上古遗迹位置，但遗迹中的禁制对你伤害加倍。' },
  { rarity: 'Legend / 传说', name: '道心通明', desc: '修炼瓶颈突破概率大幅提升，但心魔入侵时反噬也更为猛烈。' },
];

const MARTIAL_TALENTS: TalentInfo[] = [
  { rarity: 'Rare / 稀有', name: '铁布衫', desc: '体魄训练效果+20%，但悟性学习效率-10%。' },
  { rarity: 'Epic / 史诗', name: '独孤意', desc: '独处时武学领悟速度翻倍，但团队配合时效率下降。' },
  { rarity: 'Legend / 传说', name: '武道天眼', desc: '战斗中可看穿对手招式破绽，但过度使用会损伤视力。' },
  { rarity: 'Rare / 稀有', name: '血气方刚', desc: '年轻时期战斗力极强，但年老后衰退更快。' },
  { rarity: 'Epic / 史诗', name: '暗器精通', desc: '远程偷袭成功率极高，但正面交锋时处于劣势。' },
  { rarity: 'Rare / 稀有', name: '江湖声望', desc: '更容易获得江湖人士帮助，但也更容易被仇家盯上。' },
  { rarity: 'Rare / 稀有', name: '金钟罩', desc: '抗击打能力极强，但身法灵活性下降，容易被速度型对手克制。' },
  { rarity: 'Rare / 稀有', name: '醉拳意境', desc: '饮酒后战斗力波动极大，时强时弱，难以稳定发挥。' },
  { rarity: 'Rare / 稀有', name: '医者仁心', desc: '可治疗自身与他人伤势，但每次出手救人都会削弱自身杀意。' },
  { rarity: 'Rare / 稀有', name: '轻功绝顶', desc: '身法速度远超同辈，但下盘根基不稳，正面硬拼处于劣势。' },
  { rarity: 'Rare / 稀有', name: '兵器精通', desc: '使用任何兵器都能发挥八成威力，但专一修炼某种兵器时反而受限。' },
  { rarity: 'Epic / 史诗', name: '剑意内敛', desc: '平时不显露锋芒，爆发时剑意凌厉无匹，但爆发间隔较长。' },
  { rarity: 'Epic / 史诗', name: '断情绝爱', desc: '斩断情感纠葛后武学精进神速，但心中有情时境界停滞不前。' },
  { rarity: 'Epic / 史诗', name: '以战养战', desc: '实战中进步极快，但长期不战斗实力会自然衰退。' },
  { rarity: 'Legend / 传说', name: '天人合一', desc: '战斗中可短暂借助天地之力，但每次使用都会折损自身根基。' },
];

const MYTH_TALENTS: TalentInfo[] = [
  { rarity: 'Rare / 稀有', name: '神裔血脉', desc: '体内流淌着稀薄神血，可使用部分神术，但会引起邪神注意。' },
  { rarity: 'Epic / 史诗', name: '理智壁垒', desc: '接触古神知识时理智损耗减半，但灵感接收也相应减弱。' },
  { rarity: 'Legend / 传说', name: '旧神眷族', desc: '可直接与沉睡的旧神沟通，获得禁忌知识，但每次沟通都会侵蚀灵魂。' },
  { rarity: 'Rare / 稀有', name: '秘仪直觉', desc: '更容易发现并解读古代秘仪，但误读时后果更严重。' },
  { rarity: 'Epic / 史诗', name: '神性共鸣', desc: '靠近神迹时能力增强，但远离后迅速衰弱。' },
  { rarity: 'Rare / 稀有', name: '调查员本能', desc: '发现隐藏线索的概率提升，但也更容易卷入危险事件。' },
  { rarity: 'Rare / 稀有', name: '血脉压制', desc: '面对低等神裔时有天然威压，但面对真神时威压反噬自身。' },
  { rarity: 'Rare / 稀有', name: '古物解读', desc: '阅读古老文献速度极快，但每读完一本理智都会小幅下降。' },
  { rarity: 'Rare / 稀有', name: '预言碎片', desc: '偶尔获得未来片段，但无法判断片段发生的具体时间。' },
  { rarity: 'Rare / 稀有', name: '献祭捷径', desc: '通过献祭可快速获得神力，但献祭次数越多身体越接近崩溃。' },
  { rarity: 'Rare / 稀有', name: '遗物绑定', desc: '与神话遗物绑定后能力大增，但遗物损毁时灵魂会受到重创。' },
  { rarity: 'Epic / 史诗', name: '神格碎片', desc: '体内残留神格碎片，可使用神术，但碎片会吸引其他神明觊觎。' },
  { rarity: 'Epic / 史诗', name: '疯狂灵感', desc: '理智越低创造力越强，但理智归零后将彻底丧失自我意识。' },
  { rarity: 'Epic / 史诗', name: '信仰收割', desc: '可从信徒处汲取力量，但信徒背叛时你会遭受双倍反噬。' },
  { rarity: 'Legend / 传说', name: '时间观测者', desc: '可短暂观测时间长河，但每次观测都会在时间线上留下印记。' },
];

const DOOMSDAY_TALENTS: TalentInfo[] = [
  { rarity: 'Rare / 稀有', name: '免疫体质', desc: '对病毒感染有一定抗性，但体能恢复速度较慢。' },
  { rarity: 'Epic / 史诗', name: '拾荒专家', desc: '在废墟中发现有用物资的概率翻倍，但容易忽略危险信号。' },
  { rarity: 'Legend / 传说', name: '病毒共生', desc: '体内携带活体病毒，可获得特殊能力，但随时可能彻底变异。' },
  { rarity: 'Rare / 稀有', name: '围墙守卫', desc: '防守战时战斗力+30%，但野外生存能力较弱。' },
  { rarity: 'Epic / 史诗', name: '黑市嗅觉', desc: '总能找到地下交易渠道，但更容易被诈骗或背叛。' },
  { rarity: 'Rare / 稀有', name: '迁徙本能', desc: '长途跋涉时体力消耗减半，但定居后容易感到焦躁。' },
  { rarity: 'Rare / 稀有', name: '噪音敏感', desc: '能提前感知丧尸群动向，但对突发噪音反应过度，容易暴露位置。' },
  { rarity: 'Rare / 稀有', name: '物资囤积', desc: '收集资源效率极高，但携带过多物资时移动速度大幅下降。' },
  { rarity: 'Rare / 稀有', name: '医疗知识', desc: '可治疗感染初期伤员，但治疗过程中自身感染风险增加。' },
  { rarity: 'Rare / 稀有', name: '夜行习性', desc: '夜间行动能力增强，但白天精神萎靡，需要更多休息时间。' },
  { rarity: 'Rare / 稀有', name: '陷阱大师', desc: '布置陷阱成功率极高，但自己触发陷阱的概率也比常人更高。' },
  { rarity: 'Epic / 史诗', name: '领袖魅力', desc: '更容易组建幸存者团队，但团队成员死亡时你会陷入极度自责。' },
  { rarity: 'Epic / 史诗', name: '变异适应', desc: '身体逐渐适应病毒环境，但外貌与行为越来越接近丧尸。' },
  { rarity: 'Epic / 史诗', name: '冷核聚变', desc: '可利用废墟中的能源核心，但核心过载时爆炸范围极大。' },
  { rarity: 'Legend / 传说', name: '文明火种', desc: '重建秩序时效率翻倍，但肩负重任后个人自由完全丧失。' },
];

const CYBER_TALENTS: TalentInfo[] = [
  { rarity: 'Rare / 稀有', name: '神经适配', desc: '义体排斥反应降低，可装载更多改造件。' },
  { rarity: 'Epic / 史诗', name: '黑客直觉', desc: '入侵系统时成功率+40%，但被发现后追踪更快。' },
  { rarity: 'Legend / 传说', name: '数字飞升', desc: '可将意识短暂上传至网络，但肉体在此期间毫无防备。' },
  { rarity: 'Rare / 稀有', name: '功德感知', desc: '能察觉他人的功德债务，但也会被他人的业障影响。' },
  { rarity: 'Epic / 史诗', name: '神龛共鸣', desc: '靠近数字神龛时能力增强，可借用神力，但会被神祇记录行踪。' },
  { rarity: 'Rare / 稀有', name: '反神权意识', desc: '对神力干扰有抗性，但无法获得任何神术加持。' },
  { rarity: 'Rare / 稀有', name: '义眼扫描', desc: '可透视部分障碍物，但长时间使用会导致头痛和视觉疲劳。' },
  { rarity: 'Rare / 稀有', name: '数据残留', desc: '死后意识可在网络中短暂留存，但留存期间可能被黑客捕获。' },
  { rarity: 'Rare / 稀有', name: '信用透支', desc: '可超额借贷功德或货币，但债务利息随时间呈指数增长。' },
  { rarity: 'Rare / 稀有', name: '加密思维', desc: '他人难以读取你的思想，但你也无法接受直接的精神传输。' },
  { rarity: 'Rare / 稀有', name: '黑市医生', desc: '可在地下诊所进行非法改造，但手术失败率比正规渠道高。' },
  { rarity: 'Epic / 史诗', name: '云端备份', desc: '记忆可定期上传云端，但上传的记忆可能被公司审查或删除。' },
  { rarity: 'Epic / 史诗', name: '神经加速', desc: '反应速度提升至常人三倍，但加速时身体老化速度也同步提升。' },
  { rarity: 'Epic / 史诗', name: '赛博幽灵', desc: '可在网络中隐形穿梭，但长时间脱离肉身会导致肉体脑死亡。' },
  { rarity: 'Legend / 传说', name: '系统管理员', desc: '对城市基础设施有最高权限，但每一次越权操作都会被系统记录。' },
];

const STELLAR_TALENTS: TalentInfo[] = [
  { rarity: 'Rare / 稀有', name: '零重力适应', desc: '在失重环境下行动自如，但重力环境下体能下降。' },
  { rarity: 'Epic / 史诗', name: '星图记忆', desc: '可凭记忆在星海中导航，但过度依赖会导致路痴。' },
  { rarity: 'Legend / 传说', name: '外星共鸣', desc: '可与部分外星生物进行思维交流，但精神污染风险极高。' },
  { rarity: 'Rare / 稀有', name: '殖民者意志', desc: '在陌生星球上生存能力+25%，但思乡情绪更强烈。' },
  { rarity: 'Epic / 史诗', name: '跃迁耐受', desc: '可承受更频繁的空间跃迁，但每次跃迁后短暂失忆。' },
  { rarity: 'Rare / 稀有', name: '外交直觉', desc: '与外星文明谈判时更容易达成共识，但容易低估对方敌意。' },
  { rarity: 'Rare / 稀有', name: '真空生存', desc: '可在短真空中存活，但返回正常气压环境后需要时间适应。' },
  { rarity: 'Rare / 稀有', name: '矿物辨识', desc: '可快速识别稀有矿物，但长期接触矿物会导致慢性中毒。' },
  { rarity: 'Rare / 稀有', name: '星舰维修', desc: '可修复大部分舰船故障，但维修时忽略自身安全防护。' },
  { rarity: 'Rare / 稀有', name: '冬眠适应', desc: '长期冬眠后恢复较快，但短期冬眠后反而精神错乱。' },
  { rarity: 'Rare / 稀有', name: '外星贸易', desc: '与外星种族交易时获利更多，但违反交易规则会遭到跨星系追杀。' },
  { rarity: 'Epic / 史诗', name: '心灵感应', desc: '可与船员建立心灵链接，但链接对象死亡时你会受到精神创伤。' },
  { rarity: 'Epic / 史诗', name: '虫洞直觉', desc: '可感知附近虫洞位置，但靠近虫洞时会产生强烈眩晕感。' },
  { rarity: 'Epic / 史诗', name: '基因改造', desc: '可植入外星基因片段，但基因排斥反应会周期性发作。' },
  { rarity: 'Legend / 传说', name: '星域领主', desc: '在己方殖民星域内能力全面强化，但离开领域后实力大打折扣。' },
];

const WILDERNESS_TALENTS: TalentInfo[] = [
  { rarity: 'Rare / 稀有', name: '野兽亲和', desc: '更容易驯服野生动物，但被驯服的野兽忠诚度有限。' },
  { rarity: 'Epic / 史诗', name: '图腾觉醒', desc: '可激活图腾之力获得临时强化，但使用后进入虚弱期。' },
  { rarity: 'Legend / 传说', name: '万族之血', desc: '体内流淌着多种族血脉，可同时使用多种族能力，但血脉冲突会导致周期性痛苦。' },
  { rarity: 'Rare / 稀有', name: '追踪专家', desc: '在野外追踪猎物或敌人时效率极高，但城市环境中方向感极差。' },
  { rarity: 'Epic / 史诗', name: '部落领袖', desc: '领导部落时全体成员战斗力+20%，但独自行动时信心下降。' },
  { rarity: 'Rare / 稀有', name: '荒原生存', desc: '极端环境下存活能力极强，但舒适环境中变得懒散。' },
  { rarity: 'Rare / 稀有', name: '野外烹饪', desc: '可将任何野兽肉转化为营养来源，但对精致食物完全无法下咽。' },
  { rarity: 'Rare / 稀有', name: '毒物抗性', desc: '对自然毒素有天然抗性，但解毒能力弱，中毒后恢复极慢。' },
  { rarity: 'Rare / 稀有', name: '洞穴探索', desc: '在地底和洞穴中感知敏锐，但在开阔地带方向感极差。' },
  { rarity: 'Rare / 稀有', name: '雨季行者', desc: '雨季时战斗力和恢复力增强，但旱季时体力持续衰退。' },
  { rarity: 'Rare / 稀有', name: '掠夺本能', desc: '击败敌人后可夺取部分能力，但每次掠夺都会在灵魂留下印记。' },
  { rarity: 'Epic / 史诗', name: '先祖召唤', desc: '可召唤先祖虚灵助战，但召唤后自身会进入虚弱状态。' },
  { rarity: 'Epic / 史诗', name: '兽魂融合', desc: '可与野兽灵魂短暂融合获得能力，但融合过久会失去人性。' },
  { rarity: 'Epic / 史诗', name: '自然祭司', desc: '可借助自然之力治愈与攻击，但破坏自然后会遭受反噬。' },
  { rarity: 'Legend / 传说', name: '法则领悟', desc: '可短暂借用荒原法则之力，但法则排斥外来者，使用后身体崩解。' },
];

const ACADEMY_TALENTS: TalentInfo[] = [
  { rarity: 'Rare / 稀有', name: '异能觉醒', desc: '觉醒时获得的能力比常人更强，但控制能力较差。' },
  { rarity: 'Epic / 史诗', name: '能力共鸣', desc: '与其他异能者配合时效果倍增，但单独作战时能力减弱。' },
  { rarity: 'Legend / 传说', name: '多元觉醒', desc: '可同时觉醒多种能力，但每种能力的上限较低。' },
  { rarity: 'Rare / 稀有', name: '实战直觉', desc: '战斗中反应速度极快，但理论学习能力较弱。' },
  { rarity: 'Epic / 史诗', name: '精神屏障', desc: '对他人精神攻击有天然抗性，但情感表达能力受限。' },
  { rarity: 'Rare / 稀有', name: '毕业诅咒', desc: '考核时超常发挥，但考核后短期内能力大幅下降。' },
  { rarity: 'Rare / 稀有', name: '学霸光环', desc: '理论知识学习速度翻倍，但实战应用时常常犹豫不决。' },
  { rarity: 'Rare / 稀有', name: '宿舍情谊', desc: '与室友共同训练时效率提升，但单独考核时容易紧张失常。' },
  { rarity: 'Rare / 稀有', name: '能力伪装', desc: '可隐藏真实能力等级，但过度伪装会导致能力暂时性衰退。' },
  { rarity: 'Rare / 稀有', name: '体能透支', desc: '关键时刻可爆发超越极限的力量，但透支后需长时间休养。' },
  { rarity: 'Rare / 稀有', name: '老师缘', desc: '更容易获得导师青睐和指导，但导师的敌人也会将你视为目标。' },
  { rarity: 'Epic / 史诗', name: '异能融合', desc: '可将两种能力临时融合产生新效果，但融合失败时两种能力都会受损。' },
  { rarity: 'Epic / 史诗', name: '领域展开', desc: '战斗中可展开个人领域，但领域维持时消耗巨大体力和精神力。' },
  { rarity: 'Epic / 史诗', name: '觉醒回溯', desc: '能力觉醒时可重新选择方向，但回溯后原有能力彻底消失。' },
  { rarity: 'Legend / 传说', name: '规则改写', desc: '可短暂改写局部范围内的物理规则，但改写规则后自身会遭受反噬。' },
];

const KINGDOM_TALENTS: TalentInfo[] = [
  { rarity: 'Rare / 稀有', name: '贵族礼仪', desc: '宫廷社交中更容易获得好感，但平民面前显得高高在上。' },
  { rarity: 'Epic / 史诗', name: '密谋直觉', desc: '更容易察觉他人阴谋，但过度怀疑会伤害真正忠诚的人。' },
  { rarity: 'Legend / 传说', name: '王权血脉', desc: '可激活血脉中的王权之力号令他人，但使用过度会缩短寿命。' },
  { rarity: 'Rare / 稀有', name: '联姻价值', desc: '政治联姻中能获得更大利益，但个人情感常被牺牲。' },
  { rarity: 'Epic / 史诗', name: '暗杀感知', desc: '对暗杀有本能预警，但预警时短暂僵直。' },
  { rarity: 'Rare / 稀有', name: '继承权斗争', desc: '在权力争夺中更容易占据上风，但兄弟阋墙的概率大增。' },
  { rarity: 'Rare / 稀有', name: '财政直觉', desc: '管理领地财政时收益提升，但个人开销也水涨船高难以节制。' },
  { rarity: 'Rare / 稀有', name: '骑士荣耀', desc: '在正面决斗中胜率极高，但暗中袭击时心软难以致命。' },
  { rarity: 'Rare / 稀有', name: '情报网络', desc: '可收集到大量宫廷情报，但情报越多越难分辨真伪。' },
  { rarity: 'Rare / 稀有', name: '演讲天赋', desc: '公开演讲时极具煽动性，但私下交流时反而显得虚伪做作。' },
  { rarity: 'Rare / 稀有', name: '外交辞令', desc: '谈判时更容易达成有利协议，但过度使用辞令会失去他人信任。' },
  { rarity: 'Epic / 史诗', name: '双面间谍', desc: '可同时为多方势力服务，但一旦暴露将被所有人追杀。' },
  { rarity: 'Epic / 史诗', name: '毒药免疫', desc: '对常见毒药有抗性，但对未知毒素的敏感性反而加倍。' },
  { rarity: 'Epic / 史诗', name: '封地繁荣', desc: '治理封地时经济快速增长，但繁荣会引起王室猜忌和削藩。' },
  { rarity: 'Legend / 传说', name: '天命所归', desc: '继承王位时获得全民拥戴，但登上王位后所有亲近之人都会疏远。' },
];

const URBAN_TALENTS: TalentInfo[] = [
  { rarity: 'Rare / 稀有', name: '阴阳眼', desc: '可看见灵体，但灵体也会更容易注意到你。' },
  { rarity: 'Epic / 史诗', name: '驱魔体质', desc: '对灵体攻击有天然抗性，但体质较弱，易被物理伤害。' },
  { rarity: 'Legend / 传说', name: '鬼蜮通行', desc: '可自由出入鬼蜮结界，但每次出入都会流失部分生气。' },
  { rarity: 'Rare / 稀有', name: '诅咒亲和', desc: '更容易施展诅咒，但诅咒反噬也更容易发生。' },
  { rarity: 'Epic / 史诗', name: '结界感知', desc: '可感知周围结界的存在和强度，但无法自主创建结界。' },
  { rarity: 'Rare / 稀有', name: '灵异磁场', desc: '更容易触发灵异事件，但身边亲友也更容易被波及。' },
  { rarity: 'Rare / 稀有', name: '纸人替身', desc: '可用纸人替死一次，但替身损毁后一个月内运势极低。' },
  { rarity: 'Rare / 稀有', name: '香火供奉', desc: '供奉鬼神可获得庇佑，但供奉中断后鬼神会先找你算账。' },
  { rarity: 'Rare / 稀有', name: '风水感知', desc: '可感知周围环境的风水吉凶，但无法改变坏风水只能避开。' },
  { rarity: 'Rare / 稀有', name: '通灵笔记', desc: '记录灵异事件后可获得经验，但记录越多越容易引来正主。' },
  { rarity: 'Rare / 稀有', name: '魇镇之术', desc: '可对敌人施加魇镇诅咒，但诅咒被破解时你会遭到双倍反噬。' },
  { rarity: 'Epic / 史诗', name: '百鬼夜行', desc: '可召唤周围灵体助战，但召唤后灵体可能反噬召唤者。' },
  { rarity: 'Epic / 史诗', name: '封印术式', desc: '可封印强大灵体，但封印期间你要持续消耗生命力维持。' },
  { rarity: 'Epic / 史诗', name: '往生引导', desc: '可超度亡灵获得功德，但超度失败时亡灵会缠上你。' },
  { rarity: 'Legend / 传说', name: '阴阳逆转', desc: '可短暂逆转阴阳两界规则，但逆转后你在人间存在感会逐渐稀薄。' },
];

const WASTELAND_TALENTS: TalentInfo[] = [
  { rarity: 'Rare / 稀有', name: '辐射耐受', desc: '可在高辐射区短暂停留，但长期暴露仍会损伤。' },
  { rarity: 'Epic / 史诗', name: '商路嗅觉', desc: '总能发现利润最高的贸易路线，但也会招来劫匪。' },
  { rarity: 'Legend / 传说', name: '废土之王', desc: '在完全荒芜之地能力全面强化，但在文明区域极度不适。' },
  { rarity: 'Rare / 稀有', name: '机械修复', desc: '可修复大部分废土机械，但新材料研发能力极弱。' },
  { rarity: 'Epic / 史诗', name: '水源感知', desc: '可在干涸之地感知地下水源，但雨季时能力完全消失。' },
  { rarity: 'Rare / 稀有', name: '护卫本能', desc: '保护商队时战斗力+30%，但独自行动时判断力下降。' },
  { rarity: 'Rare / 稀有', name: '改装专家', desc: '可将废弃零件改装为可用装备，但改装品故障率比原厂高。' },
  { rarity: 'Rare / 稀有', name: '讨价还价', desc: '交易中总能压到最低价，但过度压价会激怒对方导致冲突。' },
  { rarity: 'Rare / 稀有', name: '辐射汲取', desc: '可吸收少量辐射转化为能量，但吸收过量会导致基因崩溃。' },
  { rarity: 'Rare / 稀有', name: '载具驾驭', desc: '驾驶任何载具都如鱼得水，但步行时体力和耐力极差。' },
  { rarity: 'Rare / 稀有', name: '风向判断', desc: '可预测辐射风暴和沙暴来临，但预测频繁后精神持续紧绷。' },
  { rarity: 'Epic / 史诗', name: '商会盟主', desc: '组建商队联盟后利润倍增，但联盟内部尔虞我诈需要不断制衡。' },
  { rarity: 'Epic / 史诗', name: '据点建设', desc: '建设庇护所时效率极高，但建成后你很难离开自己的据点。' },
  { rarity: 'Epic / 史诗', name: '废土传说', desc: '名声在废土上传播极快，但成名后赏金猎人和强盗都会盯上你。' },
  { rarity: 'Legend / 传说', name: '新秩序缔造者', desc: '可建立废土新规则，但每制定一条规则都要付出相应代价。' },
];

const OCEAN_TALENTS: TalentInfo[] = [
  { rarity: 'Rare / 稀有', name: '潮汐感知', desc: '可预测潮汐变化，但旱季时精神萎靡。' },
  { rarity: 'Epic / 史诗', name: '深海呼吸', desc: '可在水下长时间活动，但上岸后需要更长时间恢复。' },
  { rarity: 'Legend / 传说', name: '海怪契约', desc: '可与深海巨兽建立契约，但契约代价是部分记忆。' },
  { rarity: 'Rare / 稀有', name: '航海直觉', desc: '无星无月时也能辨别方向，但陆地上容易迷路。' },
  { rarity: 'Epic / 史诗', name: '沉船寻宝', desc: '更容易发现海底宝藏，但宝藏往往伴随着诅咒。' },
  { rarity: 'Rare / 稀有', name: '岛民亲和', desc: '与群岛居民交流时更容易获得信任，但大陆人对你保持警惕。' },
  { rarity: 'Rare / 稀有', name: '渔获丰收', desc: '捕鱼和采集海产时收获翻倍，但过度捕捞会激怒海中生灵。' },
  { rarity: 'Rare / 稀有', name: '风暴预感', desc: '可提前感知海上风暴，但预感来临时会剧烈头痛影响行动。' },
  { rarity: 'Rare / 稀有', name: '沉船考古', desc: '探索海底遗迹时效率极高，但每次下潜都会加深对深海的恐惧。' },
  { rarity: 'Rare / 稀有', name: '海岛建设', desc: '开发岛屿资源时速度加快，但岛屿生态破坏后会遭遇海啸。' },
  { rarity: 'Rare / 稀有', name: '船匠手艺', desc: '修船和造船效率提升，但新船下水时你必在船上，无法避险。' },
  { rarity: 'Epic / 史诗', name: '海妖之歌', desc: '可用歌声迷惑海洋生物，但歌声也会吸引更强大的深海掠食者。' },
  { rarity: 'Epic / 史诗', name: '洋流驾驭', desc: '可借助洋流快速航行，但逆流时航行速度减半。' },
  { rarity: 'Epic / 史诗', name: '深渊凝视', desc: '可窥探深海秘密，但每次窥探后都会在梦中见到恐怖景象。' },
  { rarity: 'Legend / 传说', name: '海神血脉', desc: '在海中能力全面强化，但长时间离开海水会逐渐虚弱直至昏迷。' },
];

const MECHANICAL_TALENTS: TalentInfo[] = [
  { rarity: 'Rare / 稀有', name: '齿轮之心', desc: '对机械结构有天生理解，但生物相关知识薄弱。' },
  { rarity: 'Epic / 史诗', name: '蒸汽共鸣', desc: '靠近大型蒸汽机械时能力增强，但远离后迅速衰弱。' },
  { rarity: 'Legend / 传说', name: '机械飞升', desc: '可将部分器官替换为机械，获得超凡能力，但人性逐渐流失。' },
  { rarity: 'Rare / 稀有', name: '钟表预知', desc: '通过精密计算可短暂预见未来几秒，但计算时无法行动。' },
  { rarity: 'Epic / 史诗', name: '神殿祝福', desc: '在机械神殿内获得全方位强化，但离开后祝福消退。' },
  { rarity: 'Rare / 稀有', name: '工匠之魂', desc: '制造机械时成功率+30%，但创新设计能力有限。' },
  { rarity: 'Rare / 稀有', name: '蒸汽亲和', desc: '靠近蒸汽动力源时精力充沛，但蒸汽不足时昏昏欲睡难以集中。' },
  { rarity: 'Rare / 稀有', name: '精密计算', desc: '可快速解决复杂机械问题，但面对简单事务时反而过度思考。' },
  { rarity: 'Rare / 稀有', name: '发条生命', desc: '可为机械注入临时生命力，但注入生命力的机械会获得自主意识。' },
  { rarity: 'Rare / 稀有', name: '管道穿梭', desc: '可在城市管道系统中快速移动，但管道中的毒气对你伤害加倍。' },
  { rarity: 'Rare / 稀有', name: '炼金调和', desc: '可调配特殊燃料提升机械性能，但调配失误时容易引发爆炸。' },
  { rarity: 'Epic / 史诗', name: '蓝图记忆', desc: '可记忆任何机械蓝图，但记忆的蓝图越多大脑负荷越重。' },
  { rarity: 'Epic / 史诗', name: '时间调校', desc: '可微调局部时间流速，但调校失误时你自己也会被困在时间乱流中。' },
  { rarity: 'Epic / 史诗', name: '机械军团', desc: '可指挥大量机械仆从，但仆从失控时会优先攻击主人。' },
  { rarity: 'Legend / 传说', name: '永恒齿轮', desc: '身体与机械完美融合，不老不死，但逐渐丧失人类情感和记忆。' },
];

const DREAM_TALENTS: TalentInfo[] = [
  { rarity: 'Rare / 稀有', name: '清醒梦', desc: '在梦中保持清醒意识，但深度睡眠时无法恢复体力。' },
  { rarity: 'Epic / 史诗', name: '梦魇猎手', desc: '可进入他人梦境猎杀梦魇，但自身梦境更容易被入侵。' },
  { rarity: 'Legend / 传说', name: '梦境编织', desc: '可创造并操控梦境世界，但梦境与现实的界限会逐渐模糊。' },
  { rarity: 'Rare / 稀有', name: '边界行者', desc: '可在梦境与现实之间短暂穿行，但穿行后会短暂失忆。' },
  { rarity: 'Epic / 史诗', name: '意识凝结', desc: '可将意识碎片凝聚为实体物品，但碎片不足时会损伤记忆。' },
  { rarity: 'Rare / 稀有', name: '梦兆预知', desc: '梦境中偶尔会出现未来预兆，但无法分辨真假。' },
  { rarity: 'Rare / 稀有', name: '浅睡警戒', desc: '睡眠中保持警觉，可感知外界危险，但深度睡眠恢复效果减半。' },
  { rarity: 'Rare / 稀有', name: '梦境印记', desc: '可在他人梦境中留下标记，但标记过多时会混淆现实记忆。' },
  { rarity: 'Rare / 稀有', name: '催眠暗示', desc: '可对他人施加微弱暗示，但暗示被抵抗时你会陷入短暂昏睡。' },
  { rarity: 'Rare / 稀有', name: '记忆宫殿', desc: '可在梦中整理和检索记忆，但整理过程中会遗忘部分不重要的现实。' },
  { rarity: 'Rare / 稀有', name: '失眠灵感', desc: '熬夜时创造力爆棚，但长期失眠会导致现实感知出现偏差。' },
  { rarity: 'Epic / 史诗', name: '多重梦境', desc: '可同时存在于多层梦境中，但迷失在深层梦境后极难返回现实。' },
  { rarity: 'Epic / 史诗', name: '情绪实体化', desc: '可将强烈情绪转化为梦境中的实体力量，但情绪失控时力量反噬。' },
  { rarity: 'Epic / 史诗', name: '梦境交易', desc: '可在梦中与他人交易记忆和能力，但交易后双方都会遗忘交易过程。' },
  { rarity: 'Legend / 传说', name: '现实扭曲', desc: '可将梦境中的改变短暂带入现实，但扭曲现实后梦境边界彻底破碎。' },
];

const PRESET_WORLDS: WorldData[] = [
  {
    id: 'earth', mark: 'Ⅰ', tag: 'Realistic Low Fantasy', tagEn: '推荐 / 长线', code: '地球 Online', name: '地球 Online',
    brief: '现实规则，低魔变量，命运常伪装成普通选择。',
    desc: '现代社会低魔环境。家庭、职业、阶层与偶然事件构成人生主变量。',
    description: '现代社会低魔环境。资源、阶层、教育、家庭与偶然事件将成为命运主变量。平凡日常中暗藏无数转折点，一次偶然的相遇、一次冲动的决定，都可能改写整个人生轨迹。',
    tags: ['现代', '低魔', '社会', '现实'],
    chips: ['现实成长', '家庭羁绊', '阶层跃迁', '都市异闻', '未来邮件'],
    detailDesc: '基础设定：现实成长、家庭压力、职业路线与少量异常事件。',
    configOptions: ['现代', '古代', '远古'],
    talentPool: EARTH_TALENTS,
  },
  {
    id: 'cultivation', mark: 'Ⅱ', tag: 'Cultivation Fate', tagEn: '高随机 / 高寿命', code: '修仙世界', name: '修仙世界',
    brief: '灵根、宗门、秘境、因果，凡骨亦可逆天。',
    desc: '灵根、宗门、秘境与天劫共同塑造一生。凡骨亦可逆天。',
    description: '灵根、宗门、因果与寿元交织。凡骨亦可逆天，天骄也会陨落。',
    tags: ['东方奇幻', '修仙', '宗门', '因果'],
    chips: ['灵根', '宗门', '秘境', '因果债', '飞升'],
    detailDesc: '基础设定：灵根、宗门、秘境、功法与天劫。',
    configOptions: ['宗门', '散修', '魔道'],
    talentPool: CULTIVATION_TALENTS,
  },
  {
    id: 'martial', mark: 'Ⅲ', tag: 'Martial Jianghu', tagEn: '战斗 / 声望', code: '真武世界', name: '真武世界',
    brief: '武馆、战场、家族与江湖声望塑造一生。',
    desc: '血气成炉，拳意入骨。武馆、边军、江湖声望决定成长轨迹。',
    description: '拳意入骨，血气成炉。家族、武馆、战场与江湖声望决定成长轨迹。',
    tags: ['武侠', '武道', '江湖', '家族'],
    chips: ['武馆', '江湖', '边军', '名声', '拳意'],
    detailDesc: '基础设定：武馆、江湖、边军、声望与武学突破。',
    configOptions: ['武馆', '军伍', '江湖'],
    talentPool: MARTIAL_TALENTS,
  },
  {
    id: 'myth', mark: 'Ⅳ', tag: 'Myth Awakening', tagEn: '神秘 / 现代', code: '神话复苏', name: '神话复苏',
    brief: '诸神黄昏后，旧神残响苏醒，信仰即力量。',
    desc: '现代神话实体逐步苏醒。神裔、调查员与旧神代理人开始出现。',
    description: '诸神黄昏之后，旧神残响重新苏醒，信仰即力量。',
    tags: ['神话', '信仰', '神迹', '预言'],
    chips: ['神裔', '调查局', '旧神', '献祭', '理智'],
    detailDesc: '基础设定：神裔、调查局、旧神、秘仪与理智污染。',
    configOptions: ['调查员', '神裔', '信徒'],
    talentPool: MYTH_TALENTS,
  },
  {
    id: 'doomsday', mark: 'Ⅴ', tag: 'Doomsday City', tagEn: '生存 / 高压', code: '末日丧尸', name: '末日丧尸',
    brief: '病毒撕裂文明，围墙内是人性，外是饥饿。',
    desc: '资源衰竭后的高墙城市。配给、感染与迁徙许可决定生路。',
    description: '病毒撕裂文明，围墙内是人性，围墙外是饥饿。',
    tags: ['末日', '丧尸', '生存', '人性'],
    chips: ['配给', '感染', '高墙', '黑市', '迁徙许可'],
    detailDesc: '基础设定：配给、感染、高墙、黑市与迁徙许可。',
    configOptions: ['拾荒', '墙卫', '医生'],
    talentPool: DOOMSDAY_TALENTS,
  },
  {
    id: 'cyber', mark: 'Ⅵ', tag: 'Cyber Spirit Dynasty', tagEn: '赛博 / 神权', code: '赛博灵朝', name: '赛博灵朝',
    brief: '义体与香火神权并存，功德债务绑定灵魂。',
    desc: '义体科技与香火神权并存。功德、债务与寿命都可交易。',
    description: '科技与香火神权并存的自定义世界。',
    tags: ['赛博朋克', '神权', '义体', '科技'],
    chips: ['义体', '神龛网络', '功德债', '数字香火'],
    detailDesc: '基础设定：义体、神龛网络、功德债务与数字香火。',
    configOptions: ['义体', '香火', '反神权'],
    talentPool: CYBER_TALENTS,
  },
  {
    id: 'stellar', mark: 'Ⅶ', tag: 'Stellar Colony', tagEn: '星际 / 殖民', code: '星海殖民纪', name: '星海殖民纪',
    brief: '星舰即国家，跃迁许可比血脉更珍贵。',
    desc: '星际联邦与殖民地的政治博弈，资源争夺在星海重演。',
    description: '星舰即国家，跃迁许可比血脉更珍贵。',
    tags: ['科幻', '星际', '殖民', '政治'],
    chips: ['跃迁', '殖民地', '星舰', '资源', '外交'],
    detailDesc: '基础设定：星际航行、殖民地建设、资源争夺与外星接触。',
    configOptions: ['殖民者', '联邦军官', '自由商船'],
    talentPool: STELLAR_TALENTS,
  },
  {
    id: 'wilderness', mark: 'Ⅷ', tag: 'Tribal Wilderness', tagEn: '蛮荒 / 部落', code: '万族荒原', name: '万族荒原',
    brief: '没有文明，只有部落与掠夺，生存即荣耀。',
    desc: '荒原上万族林立，弱肉强食是最基本的生存法则。',
    description: '没有文明，只有部落与掠夺，生存即荣耀。',
    tags: ['蛮荒', '部落', '生存', '万族'],
    chips: ['狩猎', '图腾', '部落战争', '荒原', '血脉'],
    detailDesc: '基础设定：部落生存、图腾信仰、荒原狩猎与万族争霸。',
    configOptions: ['猎人', '萨满', '战士'],
    talentPool: WILDERNESS_TALENTS,
  },
  {
    id: 'academy', mark: 'Ⅸ', tag: 'Super Academy', tagEn: '超能 / 学院', code: '超能学院', name: '超能学院',
    brief: '异能者在校园觉醒，考核即生死。',
    desc: '超能力学院中，每个学生都隐藏着未知的能力。',
    description: '异能者在校园觉醒，考核即生死。',
    tags: ['超能力', '学院', '觉醒', '考核'],
    chips: ['觉醒', '能力评级', '实战考核', '宿舍派系', '毕业试炼'],
    detailDesc: '基础设定：异能觉醒、能力评级、实战考核与派系斗争。',
    configOptions: ['战斗系', '辅助系', '特殊系'],
    talentPool: ACADEMY_TALENTS,
  },
  {
    id: 'kingdom', mark: 'Ⅹ', tag: 'Royal Intrigue', tagEn: '权谋 / 宫廷', code: '王国权谋', name: '王国权谋',
    brief: '王室血脉与阴谋共生，一封密信可换一座城。',
    desc: '宫廷深处，每一句话都可能是一把刀，每一个微笑背后都藏着毒。',
    description: '王室血脉与阴谋共生，一封密信可换一座城。',
    tags: ['权谋', '宫廷', '王国', '阴谋'],
    chips: ['密谋', '联姻', '暗杀', '封地', '继承权'],
    detailDesc: '基础设定：宫廷密谋、政治联姻、暗杀与继承权斗争。',
    configOptions: ['王室', '贵族', '平民'],
    talentPool: KINGDOM_TALENTS,
  },
  {
    id: 'urban', mark: 'Ⅺ', tag: 'Supernatural Urban', tagEn: '灵异 / 都市', code: '灵异都市', name: '灵异都市',
    brief: '现代都市中鬼蜮与人间重叠，阴阳眼是诅咒。',
    desc: '霓虹灯照不到的阴影里，存在着另一个世界的入口。',
    description: '现代都市中鬼蜮与人间重叠，阴阳眼是诅咒还是天赋。',
    tags: ['灵异', '都市', '阴阳', '鬼蜮'],
    chips: ['鬼魂', '驱魔', '阴阳眼', '结界', '诅咒'],
    detailDesc: '基础设定：都市灵异、驱魔师、阴阳眼与鬼蜮结界。',
    configOptions: ['驱魔师', '通灵者', '普通人'],
    talentPool: URBAN_TALENTS,
  },
  {
    id: 'wasteland', mark: 'Ⅻ', tag: 'Wasteland Trade', tagEn: '废土 / 商路', code: '废土商路', name: '废土商路',
    brief: '辐射废土上，商队比军队更有话语权。',
    desc: '文明崩塌后的世界里，商路成为最宝贵的资源。',
    description: '辐射废土上，商队比军队更有话语权。',
    tags: ['废土', '商队', '辐射', '贸易'],
    chips: ['商队', '辐射区', '据点', '交易', '护卫'],
    detailDesc: '基础设定：废土商队、辐射区探险、据点贸易与护卫雇佣。',
    configOptions: ['商人', '护卫', '拾荒者'],
    talentPool: WASTELAND_TALENTS,
  },
  {
    id: 'ocean', mark: 'ⅩⅢ', tag: 'Abyssal Isles', tagEn: '海洋 / 群岛', code: '海渊群岛', name: '海渊群岛',
    brief: '沉没大陆上的群岛文明，深海藏着旧日真相。',
    desc: '群岛上的居民世代以海为生，深海之下沉睡着远古文明的秘密。',
    description: '沉没大陆上的群岛文明，深海之下藏着旧日真相。',
    tags: ['海洋', '群岛', '深海', '远古'],
    chips: ['航海', '海怪', '沉船', '潮汐', '深海遗迹'],
    detailDesc: '基础设定：群岛航海、海怪遭遇、沉船探险与深海遗迹。',
    configOptions: ['水手', '海盗', '岛民'],
    talentPool: OCEAN_TALENTS,
  },
  {
    id: 'mechanical', mark: 'ⅩⅣ', tag: 'Mechanical Theocracy', tagEn: '机械 / 神国', code: '机械神国', name: '机械神国',
    brief: '信仰与机械融合，齿轮转动即祈祷。',
    desc: '蒸汽动力、齿轮传动、钟表结构，构成独特的机械美学。',
    description: '信仰与机械融合，齿轮转动即祈祷。',
    tags: ['蒸汽朋克', '机械', '信仰', '神国'],
    chips: ['蒸汽', '齿轮', '钟表', '神殿', '机械生命'],
    detailDesc: '基础设定：蒸汽机械、齿轮传动、钟表神殿与机械生命。',
    configOptions: ['工程师', '神职人员', '工人'],
    talentPool: MECHANICAL_TALENTS,
  },
  {
    id: 'dream', mark: 'ⅩⅤ', tag: 'Dream Border', tagEn: '梦境 / 边界', code: '梦境边境', name: '梦境边境',
    brief: '现实与梦境边界模糊，入梦即进入另一世界。',
    desc: '意识的碎片在梦境边境凝结成实体，迷失者可能再也无法醒来。',
    description: '现实与梦境边界模糊，入梦即进入另一个世界。',
    tags: ['梦境', '意识', '虚幻', '边界'],
    chips: ['梦境', '意识', '梦魇', '清醒', '边界'],
    detailDesc: '基础设定：梦境旅行、意识凝结、梦魇狩猎与边界探索。',
    configOptions: ['梦境编织者', '清醒者', '普通人'],
    talentPool: DREAM_TALENTS,
  },
];

function loadCustomWorlds(): WorldData[] {
  try {
    const saved = localStorage.getItem('custom_worlds');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // 忽略
  }
  return [];
}

function saveCustomWorlds(worlds: WorldData[]) {
  localStorage.setItem('custom_worlds', JSON.stringify(worlds));
}

interface WorldStore {
  presetWorlds: WorldData[];
  customWorlds: WorldData[];
  allWorlds: WorldData[];
  addCustomWorld: (world: WorldData) => void;
  removeCustomWorld: (id: string) => void;
}

function buildAllWorlds(presets: WorldData[], customs: WorldData[]): WorldData[] {
  return [...presets, ...customs];
}

export const useWorldStore = create<WorldStore>((set, get) => {
  const initialCustoms = loadCustomWorlds();
  return {
    presetWorlds: PRESET_WORLDS,
    customWorlds: initialCustoms,
    allWorlds: buildAllWorlds(PRESET_WORLDS, initialCustoms),
    addCustomWorld: (world) => {
      const nextCustoms = [...get().customWorlds, world];
      saveCustomWorlds(nextCustoms);
      set({
        customWorlds: nextCustoms,
        allWorlds: buildAllWorlds(get().presetWorlds, nextCustoms),
      });
    },
    removeCustomWorld: (id) => {
      const nextCustoms = get().customWorlds.filter((w) => w.id !== id);
      saveCustomWorlds(nextCustoms);
      set({
        customWorlds: nextCustoms,
        allWorlds: buildAllWorlds(get().presetWorlds, nextCustoms),
      });
    },
  };
});

export { PRESET_WORLDS };
