const TOKEN_USAGE_KEY = "ai_token_usage";
const TOKEN_LIMIT_KEY = "ai_token_limit";

export const TokenManager = {
  /**
   * Get current total token usage
   * @returns {number}
   */
  getUsage: () => {
    return parseInt(localStorage.getItem(TOKEN_USAGE_KEY) || "0", 10);
  },

  /**
   * Get current token limit
   * @returns {number}
   */
  getLimit: () => {
    return 10000;
  },

  /**
   * Set new token limit
   */
  setLimit: () => {
    // Limit is fixed at 10000
  },

  /**
   * Add tokens to usage count
   * @param {object} usage - Usage object from OpenAI API { total_tokens, ... }
   */
  addUsage: (usage) => {
    if (!usage || typeof usage.total_tokens !== "number") return;
    const current = TokenManager.getUsage();
    const newUsage = current + usage.total_tokens;
    localStorage.setItem(TOKEN_USAGE_KEY, newUsage.toString());
    console.log(
      `[TokenManager] Usage updated: ${newUsage} / ${TokenManager.getLimit()}`,
    );
  },

  /**
   * Check if usage is within limit
   * @returns {boolean}
   */
  checkLimit: () => {
    const current = TokenManager.getUsage();
    const limit = TokenManager.getLimit();
    return current < limit;
  },

  /**
   * Reset usage counter
   */
  resetUsage: () => {
    localStorage.setItem(TOKEN_USAGE_KEY, "0");
  },
};
