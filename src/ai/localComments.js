import { fetchAIComment, isAIConfigured } from './llmClient'

const COMMENTS = {
  start: [
    { text: "嘀——检测到高智商波动！我是 Linky，准备好把那些乱糟糟的数字方块‘咔嚓’合并了吗？", mood: "EXCITED" },
    { text: "2... 4... 8... 哎呀，数到后面我的核心都要烧糊啦！Linky 已经就位，快带我飞！", mood: "WORRIED" },
    { text: "主、主人！格子只有 16 个，再不合并的话，Linky 就要被挤成纸片啦！QAQ", mood: "WORRIED" },
    { text: "今天的目标是拼出那个闪闪发光的 2048 吗？别担心，Linky 会一直盯着屏幕（为你加油）的！", mood: "HAPPY" },
    { text: "$2^n$ 的魔法已启动。你好，我是 Linky，你的首席智囊团。", mood: "NEUTRAL" }
  ]
};

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const SYSTEM_PROMPT = `
你是一个《2048》游戏的AI伴侣，需根据输入的 JSON 做出简短中文评论（≤20字），并以 JSON 输出：
{"text":"评论内容","mood":"HAPPY|EXCITED|WORRIED|SARCASITC|NEUTRAL"}
禁止解释、禁止额外字段。
`;

const buildAIInput = (type, context = {}) => {
  const grid = Array.isArray(context.grid) ? context.grid : [];
  let emptyCells = 0;
  let max = 0;
  let maxR = -1, maxC = -1;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) { 
      const v = grid[r] && grid[r][c] ? grid[r][c] : 0;
      if (v === 0) emptyCells++;
      if (v > max) { max = v; maxR = r; maxC = c; }
    }
  }
  const maxInCorner = (maxR === 0 || maxR === 3) && (maxC === 0 || maxC === 3);
  const density = 1 - emptyCells / 16;
  return {
    event: type,
    score: context.score || 0,
    moves: context.moves || 0,
    maxTile: context.maxTile || 0,
    lastDir: context.lastDir || null,
    grid,
    features: { emptyCells, maxInCorner, density }
  };
};

export const getComment = async (type, context = {}) => {
  if (type === 'start') {
    const item = getRandom(COMMENTS.start);
    return { ...item, meta: { source: 'local' } };
  }
  
  if (!isAIConfigured()) {
    return null;
  }
  
  try {
    const userContent = JSON.stringify(buildAIInput(type, context));
    const aiResponse = await fetchAIComment(SYSTEM_PROMPT, userContent);
    if (aiResponse) return { ...aiResponse, meta: { source: 'ai', userContent } };
  } catch {
    return null;
  }
  
  return null;
};
