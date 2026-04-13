import img00 from '../assets/cards/00.jpg';
import img01 from '../assets/cards/01.jpg';
import img02 from '../assets/cards/02.jpg';
import img03 from '../assets/cards/03.jpg';
import img04 from '../assets/cards/04.jpg';
import img05 from '../assets/cards/05.jpg';
import img06 from '../assets/cards/06.jpg';
import img07 from '../assets/cards/07.jpg';
import img08 from '../assets/cards/08.jpg';
import img09 from '../assets/cards/09.jpg';
import img10 from '../assets/cards/10.jpg';
import img11 from '../assets/cards/11.jpg';
import img12 from '../assets/cards/12.jpg';
import img13 from '../assets/cards/13.jpg';
import img14 from '../assets/cards/14.jpg';
import img15 from '../assets/cards/15.jpg';
import img16 from '../assets/cards/16.jpg';
import img17 from '../assets/cards/17.jpg';
import img18 from '../assets/cards/18.jpg';
import img19 from '../assets/cards/19.jpg';
import img20 from '../assets/cards/20.jpg';
import img21 from '../assets/cards/21.jpg';

const cards = [
  {
    id: 0,
    name: '愚者',
    symbol: '🃏',
    image: img00,
    upright: '自由、冒険、無限の可能性、純粋さ、新たな旅立ち',
    reversed: '無計画、無責任、愚かさ、軽率な行動',
  },
  {
    id: 1,
    name: '魔術師',
    symbol: '🪄',
    image: img01,
    upright: '創造力、自信、スキル、意志の力、新たな始まり',
    reversed: '詐欺、トリック、未熟さ、才能の浪費',
  },
  {
    id: 2,
    name: '女教皇',
    symbol: '🌙',
    image: img02,
    upright: '直感、神秘、内なる声、知恵、潜在意識',
    reversed: '秘密、表面的な知識、直感の無視',
  },
  {
    id: 3,
    name: '女帝',
    symbol: '👑',
    image: img03,
    upright: '豊穣、母性、美、自然、繁栄、愛情',
    reversed: '過保護、依存、創造力の停滞',
  },
  {
    id: 4,
    name: '皇帝',
    symbol: '🏛️',
    image: img04,
    upright: '権威、安定、リーダーシップ、秩序、父性',
    reversed: '独裁、支配、頑固さ、柔軟性の欠如',
  },
  {
    id: 5,
    name: '教皇',
    symbol: '✝️',
    image: img05,
    upright: '伝統、信仰、導き、教育、精神的な助言',
    reversed: '形式主義、独断、偏狭な考え',
  },
  {
    id: 6,
    name: '恋人',
    symbol: '💕',
    image: img06,
    upright: '愛、調和、選択、パートナーシップ、価値観の一致',
    reversed: '不調和、誘惑、誤った選択、価値観の対立',
  },
  {
    id: 7,
    name: '戦車',
    symbol: '⚔️',
    image: img07,
    upright: '勝利、前進、意志の力、克服、決断力',
    reversed: '暴走、方向喪失、自制心の欠如',
  },
  {
    id: 8,
    name: '力',
    symbol: '🦁',
    image: img08,
    upright: '内なる強さ、勇気、忍耐、慈悲、自制',
    reversed: '弱さ、自信喪失、怒り、衝動的',
  },
  {
    id: 9,
    name: '隠者',
    symbol: '🏔️',
    image: img09,
    upright: '内省、孤独、探求、知恵、導きの光',
    reversed: '孤立、引きこもり、偏屈、拒絶',
  },
  {
    id: 10,
    name: '運命の輪',
    symbol: '☸️',
    image: img10,
    upright: '転機、運命、チャンス、サイクル、幸運',
    reversed: '不運、抵抗、変化への恐れ',
  },
  {
    id: 11,
    name: '正義',
    symbol: '⚖️',
    image: img11,
    upright: '公正、真実、因果応報、バランス、責任',
    reversed: '不公正、偏見、不正、責任逃れ',
  },
  {
    id: 12,
    name: '吊るされた男',
    symbol: '🔮',
    image: img12,
    upright: '試練、忍耐、新たな視点、手放すこと、犠牲',
    reversed: '無駄な犠牲、停滞、執着、利己主義',
  },
  {
    id: 13,
    name: '死神',
    symbol: '💀',
    image: img13,
    upright: '終わりと始まり、変容、再生、手放し',
    reversed: '変化への抵抗、停滞、腐敗',
  },
  {
    id: 14,
    name: '節制',
    symbol: '🏺',
    image: img14,
    upright: '調和、バランス、節度、忍耐、癒し',
    reversed: '不均衡、過剰、焦り、衝突',
  },
  {
    id: 15,
    name: '悪魔',
    symbol: '😈',
    image: img15,
    upright: '誘惑、束縛、執着、物質主義、欲望',
    reversed: '解放、束縛からの脱出、自覚',
  },
  {
    id: 16,
    name: '塔',
    symbol: '⚡',
    image: img16,
    upright: '崩壊、衝撃、啓示、解放、突然の変化',
    reversed: '変化への恐怖、回避、破滅の先延ばし',
  },
  {
    id: 17,
    name: '星',
    symbol: '⭐',
    image: img17,
    upright: '希望、インスピレーション、再生、平和、信仰',
    reversed: '失望、悲観、希望の喪失',
  },
  {
    id: 18,
    name: '月',
    symbol: '🌕',
    image: img18,
    upright: '幻想、不安、潜在意識、直感、夢',
    reversed: '混乱の解消、真実の発見、恐怖の克服',
  },
  {
    id: 19,
    name: '太陽',
    symbol: '☀️',
    image: img19,
    upright: '成功、喜び、活力、明晰さ、幸福',
    reversed: '一時的な暗さ、延期、自信過剰',
  },
  {
    id: 20,
    name: '審判',
    symbol: '📯',
    image: img20,
    upright: '復活、覚醒、許し、決断、新たな段階',
    reversed: '自己批判、後悔、決断の先送り',
  },
  {
    id: 21,
    name: '世界',
    symbol: '🌍',
    image: img21,
    upright: '完成、達成、統合、旅の終わり、成就',
    reversed: '未完成、遅延、目標の未達成',
  },
];

export default cards;
