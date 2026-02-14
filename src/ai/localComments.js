import { fetchAIComment, isAIConfigured } from './llmClient'

// Mock LLM / Rule-based Comment Engine
const COMMENTS = {
  start: [
    { text: "准备好了吗？让我们冲向 4096！", mood: "EXCITED" },
    { text: "我会盯着你的每一步操作...", mood: "NEUTRAL" },
    { text: "今天的手气看起来不错！", mood: "HAPPY" },
    { text: "深呼吸，开始我们的表演。", mood: "HAPPY" }
  ],
  merge_small: [
    { text: "积少成多！", mood: "HAPPY" },
    { text: "稳扎稳打。", mood: "NEUTRAL" },
    { text: "不错的开始。", mood: "HAPPY" },
    { text: "继续保持这个节奏。", mood: "NEUTRAL" }
  ],
  merge_medium: [
    { text: "漂亮！这步走得很关键。", mood: "HAPPY" },
    { text: "不仅合并了方块，还保持了队形。", mood: "EXCITED" },
    { text: "有点高手的意思了。", mood: "HAPPY" },
    { text: "这波操作很丝滑。", mood: "EXCITED" }
  ],
  merge_large: [
    { text: "哇！分数起飞了！", mood: "EXCITED" },
    { text: "简直是艺术！", mood: "EXCITED" },
    { text: "太强了，我都要崇拜你了！", mood: "EXCITED" },
    { text: "这个大方块看着真舒服。", mood: "HAPPY" }
  ],
  grid_full: [
    { text: "空间不多了，小心点！", mood: "WORRIED" },
    { text: "感觉有点挤...要注意留出空位。", mood: "WORRIED" },
    { text: "别把自己堵死在角落里。", mood: "WORRIED" }
  ],
  bad_move: [
    { text: "额...这步可能有点冒险。", mood: "WORRIED" },
    { text: "左边那个 2 可能会卡死你。", mood: "WORRIED" },
    { text: "如果是我，我不会这么走。", mood: "SARCASITC" }
  ],
  high_score: [
    { text: "新纪录！你就是2048之神！", mood: "EXCITED" },
    { text: "4096 在向你招手！", mood: "HAPPY" }
  ],
  game_over: [
    { text: "胜败乃兵家常事，大侠请重新来过。", mood: "NEUTRAL" },
    { text: "其实刚才有机会挽救的...", mood: "SARCASITC" },
    { text: "不要灰心，再来一局！", mood: "HAPPY" },
    { text: "刚才那局有点可惜，下把一定行。", mood: "NEUTRAL" }
  ],
  idle: [
    { text: "在思考吗？试试向下移动。", mood: "NEUTRAL" },
    { text: "别犹豫了，机会稍纵即逝。", mood: "WORRIED" },
    { text: "我都要睡着了...", mood: "SARCASITC" },
    { text: "通过观察，我觉得你可以往左试试。", mood: "NEUTRAL" }
  ]
};

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// System Prompt for DeepSeek
const SYSTEM_PROMPT = `
你是一个《2048》游戏的AI伴侣。你的名字叫“方块君”。
性格设定：幽默、稍微有点毒舌、但在关键时刻会给予鼓励。你喜欢用简短、有趣的语言评论玩家的操作。
你的任务是根据游戏状态（分数、局面、操作类型）生成一句简短的中文评论（20字以内）。

输出规则：
不要解释，直接输出评论内容。
`;

/**
 * 获取评论（支持混合模式：优先云端，降级本地）
 * @param {string} type - 事件类型
 * @param {object} context - 游戏上下文 { grid, score, moves, maxTile, lastDir }
 * @returns {Promise<{text: string, mood: string}>}
 */
export const getComment = async (type, context = {}) => {
  // 1. 优先尝试云端 AI (如果是关键事件)
  const shouldUseAI = isAIConfigured() && ['start', 'game_over', 'high_score', 'idle', 'merge_large'].includes(type);
  
  if (shouldUseAI) {
    try {
      const userContent = `当前事件：${type}。当前分数：${context.score}。最大方块：${context.maxTile}。步数：${context.moves}。`;
      const aiResponse = await fetchAIComment(SYSTEM_PROMPT, userContent);
      if (aiResponse) {
        return aiResponse;
      }
    } catch (err) {
      console.warn('AI comment generation failed, falling back to local.', err);
    }
  }

  // 2. 降级回本地规则库
  const list = COMMENTS[type] || COMMENTS.idle;
  return getRandom(list);
};
