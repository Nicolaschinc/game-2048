import React, { useState, useEffect } from 'react'
import './AIAssistant.scss'
import { TokenManager } from '../ai/tokenManager'

const MOOD_EMOJIS = {
  HAPPY: '😊',
  EXCITED: '🤩',
  WORRIED: '😰',
  SARCASITC: '😏',
  NEUTRAL: '😐'
}

const AIAssistant = ({ message, mood, aiEnabled, onToggle, lastInput, lastOutput }) => {
  const [showConfig, setShowConfig] = useState(false)
  const [tokenUsage, setTokenUsage] = useState(() => TokenManager.getUsage())
  // We keep tokenLimit in state to reflect the initial load, though it is now fixed.
  // Using a state variable is fine for display purposes.
  const [tokenLimit] = useState(() => TokenManager.getLimit())

  useEffect(() => {
    // Simple polling to update usage display (since we don't have global state for this)
    const interval = setInterval(() => {
      setTokenUsage(TokenManager.getUsage())
    }, 2000)
    
    return () => clearInterval(interval)
  }, [])

  const handleReset = (e) => {
      e.stopPropagation();
      TokenManager.resetUsage();
      setTokenUsage(0);
  }

  // Determine animation class based on mood
  const getAnimClass = () => {
    if (!aiEnabled) return '';
    switch(mood) {
      case 'HAPPY': return 'anim-happy';
      case 'EXCITED': return 'anim-excited';
      case 'WORRIED': return 'anim-worried';
      case 'SARCASITC': return 'anim-sarcastic'; // Typo in original code 'SARCASITC'
      case 'NEUTRAL': return 'anim-neutral';
      default: return '';
    }
  };

  return (
    <div className={`ai-assistant ${aiEnabled ? 'active' : 'inactive'}`}>
      <div className="ai-character-wrapper">
        <div 
          className="ai-character" 
          onClick={onToggle} 
          title={aiEnabled ? "点击关闭AI" : "点击开启AI"} 
          style={{ cursor: 'pointer' }}
          onContextMenu={(e) => { e.preventDefault(); setShowConfig(!showConfig); }}
        >
          <div className="ai-avatar">
            <span role="img" aria-label="mood" className={getAnimClass()}>
              {aiEnabled ? (MOOD_EMOJIS[mood] || '🤖') : '😴'}
            </span>
          </div>
        </div>
        
        {showConfig && (
           <div className="ai-config-panel">
              <div className="config-row">
                <span>Token: {tokenUsage} / {tokenLimit}</span>
              </div>
              <button className="reset-btn" onClick={handleReset}>重置</button>
              <div className="config-tip">右键头像切换设置</div>
              {aiEnabled && (
                <>
                  <div className="config-row"><span>入参: {lastInput || '-'}</span></div>
                  <div className="config-row"><span>返回: {lastOutput || '-'}</span></div>
                </>
              )}
            </div>
        )}
      </div>
      
      {aiEnabled && message && (
        <div className="ai-bubble">
          {message}
        </div>
      )}
    </div>
  )
}


export default AIAssistant
