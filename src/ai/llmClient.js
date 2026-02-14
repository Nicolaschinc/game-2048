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
      temperature: 1.0,
      max_tokens: 60,
    })

    // Track usage
    if (completion.usage) {
      TokenManager.addUsage(completion.usage)
    }

    const content = completion.choices[0].message.content?.trim()
    try {
      const parsed = JSON.parse(content)
      if (parsed && typeof parsed.text === 'string') {
        return { text: parsed.text, mood: parsed.mood || 'NEUTRAL' }
      }
    } catch {
      /* noop */
    }
    return { text: content || '', mood: 'NEUTRAL' }
  } catch (error) {
    console.error('DeepSeek API call failed:', error)
    return null
  }
}

export const isAIConfigured = () => !!openai && TokenManager.checkLimit()
