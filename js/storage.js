// storage.js - localStorage 封装

const Storage = {
  KEYS: {
    CHARACTERS: 'tavern_characters',
    CHAT_HISTORY: 'tavern_chat_history'
  },

  // 获取所有用户角色
  getCharacters() {
    try {
      const data = localStorage.getItem(this.KEYS.CHARACTERS);
      let chars = data ? JSON.parse(data) : [];
      
      // Backfill missing fields for legacy user characters
      chars = chars.map(c => ({
        ...c,
        source: c.source || 'user',
        isOfficial: c.isOfficial !== undefined ? c.isOfficial : false,
        createdBy: c.createdBy || null
      }));
      
      return chars;
    } catch (e) {
      console.error('Failed to get characters:', e);
      return [];
    }
  },

  // 获取所有官方角色
  getOfficialCharacters() {
    return window.OFFICIAL_CHARACTERS || [];
  },

  // 获取所有角色（官方 + 用户）
  getAllCharacters() {
    const user = this.getCharacters();
    const official = this.getOfficialCharacters();
    return [...official, ...user];
  },

  // 保存所有角色
  saveCharacters(characters) {
    try {
      localStorage.setItem(this.KEYS.CHARACTERS, JSON.stringify(characters));
      return true;
    } catch (e) {
      console.error('Failed to save characters:', e);
      return false;
    }
  },

  // 添加角色
  addCharacter(character) {
    const characters = this.getCharacters();
    character.id = Utils.generateId();
    character.createdAt = Date.now();
    character.updatedAt = Date.now();
    characters.push(character);
    this.saveCharacters(characters);
    return character;
  },

  // 更新角色
  updateCharacter(id, updates) {
    const characters = this.getCharacters();
    const index = characters.findIndex(c => c.id === id);
    if (index !== -1) {
      characters[index] = {
        ...characters[index],
        ...updates,
        updatedAt: Date.now()
      };
      this.saveCharacters(characters);
      return characters[index];
    }
    return null;
  },

  // 删除角色
  deleteCharacter(id) {
    const characters = this.getCharacters();
    const filtered = characters.filter(c => c.id !== id);
    this.saveCharacters(filtered);
    
    // 同时删除聊天历史
    this.deleteChatHistory(id);
    
    return true;
  },

  // 获取单个角色（支持用户和官方角色）
  getCharacter(id) {
    // 先从用户角色中查找
    const characters = this.getCharacters();
    let char = characters.find(c => c.id === id);
    if (char) return char;
    
    // 如果没找到，从官方角色中查找
    const official = this.getOfficialCharacters();
    return official.find(c => c.id === id) || null;
  },

  // 搜索角色
  searchCharacters(query, tags = []) {
    let characters = this.getCharacters();
    
    // 名称搜索
    if (query) {
      const lowerQuery = query.toLowerCase();
      characters = characters.filter(c => 
        c.name.toLowerCase().includes(lowerQuery)
      );
    }
    
    // 标签筛选
    if (tags.length > 0) {
      characters = characters.filter(c => 
        tags.some(tag => c.personality && c.personality.includes(tag))
      );
    }
    
    return characters;
  },

  // 获取聊天历史
  getChatHistory(characterId) {
    try {
      const data = localStorage.getItem(this.KEYS.CHAT_HISTORY);
      const history = data ? JSON.parse(data) : {};
      return history[characterId] || [];
    } catch (e) {
      console.error('Failed to get chat history:', e);
      return [];
    }
  },

  // 保存聊天历史
  saveChatHistory(characterId, messages) {
    try {
      const data = localStorage.getItem(this.KEYS.CHAT_HISTORY);
      const history = data ? JSON.parse(data) : {};
      
      // 限制历史条数（最多保留 100 条）
      history[characterId] = messages.slice(-100);
      
      localStorage.setItem(this.KEYS.CHAT_HISTORY, JSON.stringify(history));
      return true;
    } catch (e) {
      console.error('Failed to save chat history:', e);
      return false;
    }
  },

  // 添加消息
  addMessage(characterId, message) {
    const messages = this.getChatHistory(characterId);
    messages.push({
      ...message,
      timestamp: Date.now()
    });
    this.saveChatHistory(characterId, messages);
    return messages;
  },

  // 删除聊天历史
  deleteChatHistory(characterId) {
    try {
      const data = localStorage.getItem(this.KEYS.CHAT_HISTORY);
      const history = data ? JSON.parse(data) : {};
      delete history[characterId];
      localStorage.setItem(this.KEYS.CHAT_HISTORY, JSON.stringify(history));
      return true;
    } catch (e) {
      console.error('Failed to delete chat history:', e);
      return false;
    }
  },

  // 清空所有数据
  clearAll() {
    localStorage.removeItem(this.KEYS.CHARACTERS);
    localStorage.removeItem(this.KEYS.CHAT_HISTORY);
  }
};