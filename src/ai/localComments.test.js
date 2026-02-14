import { describe, it, expect, vi } from 'vitest'

vi.mock('./llmClient', () => {
  return {
    fetchAIComment: vi.fn(async () => ({ text: 'AI评论示例', mood: 'NEUTRAL' })),
    isAIConfigured: vi.fn(() => true),
  }
})

import { getComment } from './localComments'
import { fetchAIComment, isAIConfigured } from './llmClient'

describe('getComment', () => {
  const ctx = {
    grid: [
      [2, 0, 0, 2],
      [4, 4, 0, 0],
      [0, 8, 16, 0],
      [0, 0, 0, 0],
    ],
    score: 1234,
    moves: 42,
    maxTile: 256,
    lastDir: 'left',
  }

  it('returns local start comments for type start', async () => {
    const res = await getComment('start', ctx)
    expect(res).toBeTruthy()
    expect(typeof res.text).toBe('string')
    expect(typeof res.mood).toBe('string')
  })

  it('calls AI for non-start types with composed userContent', async () => {
    const res = await getComment('merge_large', ctx)
    expect(res).toEqual({ text: 'AI评论示例', mood: 'NEUTRAL' })
    expect(fetchAIComment).toHaveBeenCalledTimes(1)
    const args = fetchAIComment.mock.calls[0]
    expect(typeof args[0]).toBe('string')
    expect(typeof args[1]).toBe('string')
    expect(args[1]).toContain('事件:merge_large')
    expect(args[1]).toContain('分数:1234')
    expect(args[1]).toContain('最大方块:256')
    expect(args[1]).toContain('步数:42')
    expect(args[1]).toContain('上一步:left')
    expect(args[1]).toContain('棋盘:[')
  })

  it('returns null when AI is not configured', async () => {
    isAIConfigured.mockReturnValueOnce(false)
    const res = await getComment('merge_large', ctx)
    expect(res).toBeNull()
  })
})
