/* global __APP_VERSION__ */

export const initVersion = () => {
  // __APP_VERSION__ is injected by Vite at build time
  const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'unknown';
  
  if (typeof window !== 'undefined') {
    // 1. Expose current version
    window.APP_VERSION = version;
    
    // 2. Manage Version History
    const HISTORY_KEY = 'app_version_history';
    let history = [];
    
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      history = stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to parse version history', e);
    }

    // Check if this is a new version
    const lastEntry = history.length > 0 ? history[history.length - 1] : null;
    
    if (!lastEntry || lastEntry.version !== version) {
      const newEntry = {
        version,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };
      
      history.push(newEntry);
      
      // Keep history size reasonable (e.g., last 50 updates)
      if (history.length > 50) {
        history = history.slice(-50);
      }
      
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        console.log(`%c New Version Detected: ${version} `, 'background: #4caf50; color: #fff; padding: 2px 5px; border-radius: 3px;');
      } catch (e) {
        console.error('Failed to save version history', e);
      }
    }

    // 3. Expose history on window for inspection
    window.VERSION_HISTORY = history;

    // 4. Log current version to console
    console.log(
      `%c 2048 Game %c v${version} `,
      'padding: 2px 5px; border-radius: 3px 0 0 3px; color: #fff; background: #35495e;',
      'padding: 2px 5px; border-radius: 0 3px 3px 0; color: #fff; background: #ed8936;'
    );
  }
};
