import OpenAI from 'openai'
import { TokenManager } from './tokenManager'

// 使用 VITE_ 前缀的环境变量，以便在前端代码中访问
const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY
const baseURL = import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com'

let openai = null

if (apiKey) {
  openai = new OpenAI({
    baseURL,
    apiKey,
    dangerouslyAllowBrowser: true // 允许在前端使用（注意：生产环境建议通过后端转发）
  })
}

/**
 * 调用 DeepSeek API 生成评论
 * @param {string} systemPrompt - 系统预设人设
 * @param {string} userContent - 用户当前的游戏状态描述
 * @returns {Promise<{text: string, mood: string}>}
 */
export const fetchAIComment = async (systemPrompt, userContent) => {
  if (!openai) {
    console.warn('OpenAI client not initialized. Missing API Key.')
    return null
  }

  // Check token limit
  if (!TokenManager.checkLimit()) {
    console.warn('AI Token limit exceeded. AI features disabled.')
    return {
      text: "（AI 能量耗尽，请联系管理员充值或调整限额）",
      mood: "WORRIED"
    }
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
      model: "deepseek-chat",
      temperature: 1.3, // 稍微调高温度，增加趣味性
      max_tokens: 60,   // 限制回复长度，避免啰嗦
    })

    // Track usage
    if (completion.usage) {
      TokenManager.addUsage(completion.usage)
    }

    const content = completion.choices[0].message.content
    // 简单的解析逻辑：假设 AI 返回格式为 "Mood: 评论内容" 或直接返回内容
    // 这里我们先简单处理，默认 mood 为 NEUTRAL，后续可以让 AI 按 JSON 格式返回
    return {
      text: content,
      mood: 'NEUTRAL' // 暂时默认，后续优化 Prompt 让 AI 返回情绪
    }
  } catch (error) {
    console.error('DeepSeek API call failed:', error)
    return null
  }
}

export const isAIConfigured = () => !!openai && TokenManager.checkLimit()
