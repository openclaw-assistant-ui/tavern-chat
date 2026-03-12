// app.js - 主应用逻辑

const App = {
  state: {
    currentPage: 'home',
    currentTab: 'home', // 'home' or 'marketplace' or 'discover'
    characters: [],
    allCharacters: [],
    currentCharacter: null,
    chatHistory: {},
    filters: {
      search: '',
      tags: [],
      marketplace: 'all' // 'all' | 'official' | 'mine'
    },
    editingCharacterId: null,
    // 推荐页状态
    discoverQueue: [],
    currentDiscover: null,
    nextDiscover: null
  },

  // 初始化
  async init() {
    this.initTheme();
    await this.loadOfficialCharacters();
    this.loadCharacters();
    this.bindEvents();
    this.showPage('home');
    this.checkApiKey();
  },

  // 初始化主题
  initTheme() {
    const saved = localStorage.getItem('tavern-chat-theme');
    const isDark = saved ? saved === 'dark' : true; // 默认暗色
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    this.updateThemeButton(isDark);
  },

  // 切换主题
  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('tavern-chat-theme', next);
    this.updateThemeButton(next === 'dark');
  },

  // 更新主题按钮图标
  updateThemeButton(isDark) {
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.textContent = isDark ? '🌙' : '☀️';
    }
  },

  // 加载官方角色
  async loadOfficialCharacters() {
    try {
      const response = await fetch('data/official-characters.json');
      if (response.ok) {
        const data = await response.json();
        window.OFFICIAL_CHARACTERS = data;
        this.state.allCharacters = data;
      } else {
        console.error('Failed to load official characters');
        window.OFFICIAL_CHARACTERS = [];
        this.state.allCharacters = [];
      }
    } catch (e) {
      console.error('Error loading official characters:', e);
      window.OFFICIAL_CHARACTERS = [];
      this.state.allCharacters = [];
    }
  },

  // 检查 API Key（仅检查，不弹窗）
  checkApiKey() {
    // 不再自动弹出 prompt，改为用户手动在设置中配置
  },

  // 显示设置弹窗
  showSettings() {
    const modal = document.getElementById('settings-modal');
    const apiKeyInput = document.getElementById('api-key');
    const baseUrlInput = document.getElementById('base-url');

    // 填充当前配置
    apiKeyInput.value = API.getApiKey() || '';
    baseUrlInput.value = API.getBaseUrl() || API.config.defaultBaseUrl;

    modal.classList.add('show');
  },

  // 隐藏设置弹窗
  hideSettings() {
    const modal = document.getElementById('settings-modal');
    modal.classList.remove('show');
  },

  // 显示帮助弹窗
  showHelp() {
    const modal = document.getElementById('help-modal');
    if (modal) {
      modal.classList.add('show');
    }
  },

  // 隐藏帮助弹窗
  hideHelp() {
    const modal = document.getElementById('help-modal');
    if (modal) {
      modal.classList.remove('show');
    }
  },

  // 保存设置
  saveSettings() {
    const apiKey = document.getElementById('api-key').value.trim();
    const baseUrl = document.getElementById('base-url').value.trim();

    if (apiKey) {
      API.setApiKey(apiKey);
    }
    if (baseUrl) {
      API.setBaseUrl(baseUrl);
    }

    this.hideSettings();
    Utils.showToast('设置已保存', 'success');
  },

  // 检查配置并在无效时提示
  checkConfigAndPrompt() {
    if (!API.hasValidConfig()) {
      Utils.showToast('请先配置 API Key', 'error');
      this.showSettings();
      return false;
    }
    return true;
  },

  // 加载角色
  loadCharacters() {
    this.state.characters = Storage.getCharacters();
    this.state.allCharacters = Storage.getAllCharacters();
    this.renderCharacterList();
  },

  // 切换 Tab
  switchTab(tabName) {
    this.state.currentTab = tabName;
    
    // 更新 tab 按钮状态
    document.querySelectorAll('.nav-tabs .tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tabName);
    });
    
    // 显示/隐藏来源筛选
    const sourceFilter = document.querySelector('.source-filter');
    if (sourceFilter) {
      sourceFilter.style.display = tabName === 'marketplace' ? 'flex' : 'none';
    }
    
    // 渲染对应的列表
    if (tabName === 'home') {
      this.renderCharacterList();
    } else if (tabName === 'marketplace') {
      this.renderMarketplace();
    } else if (tabName === 'discover') {
      this.showPage('discover');
      this.initDiscover();
    }
  },

  // ========== 推荐页功能 ==========
  
  // 初始化推荐页
  initDiscover() {
    if (!this.state.discoverQueue || this.state.discoverQueue.length === 0) {
      this.state.discoverQueue = this.shuffleArray([...Storage.getAllCharacters()]);
    }
    this.state.currentDiscover = this.state.discoverQueue.shift();
    this.state.nextDiscover = this.state.discoverQueue[0];
    this.renderDiscoverCards();
    this.bindDiscoverEvents();
  },

  // 渲染推荐卡片
  renderDiscoverCards() {
    const current = this.state.currentDiscover;
    const next = this.state.nextDiscover;
    
    const currentCard = document.getElementById('current-card');
    const previewCard = document.getElementById('preview-card');
    
    if (current) {
      currentCard.querySelector('.card-avatar').textContent = current.avatar || '🎭';
      currentCard.querySelector('.card-name').textContent = current.name;
      currentCard.querySelector('.card-tags').innerHTML = (current.personality || [])
        .map(t => `<span class="tag">${t}</span>`).join('');
      currentCard.querySelector('.card-desc').textContent = current.description || current.backstory || '';
    }
    
    if (next) {
      previewCard.querySelector('.card-avatar').textContent = next.avatar || '🎭';
      previewCard.querySelector('.card-name').textContent = next.name;
      previewCard.querySelector('.card-tags').innerHTML = (next.personality || [])
        .map(t => `<span class="tag">${t}</span>`).join('');
    }
  },

  // 绑定推荐页事件
  bindDiscoverEvents() {
    const currentCard = document.getElementById('current-card');
    const startBtn = document.getElementById('start-discover-chat');
    const skipBtn = document.getElementById('skip-agent');
    
    if (!currentCard || currentCard.dataset.bound === 'true') return;
    currentCard.dataset.bound = 'true';
    
    // 触摸滑动
    let startX = 0;
    let currentX = 0;
    
    currentCard.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      currentCard.style.transition = 'none';
    });
    
    currentCard.addEventListener('touchmove', (e) => {
      currentX = e.touches[0].clientX;
      const diff = currentX - startX;
      currentCard.style.transform = `translateX(${diff}px) rotate(${diff * 0.05}deg)`;
    });
    
    currentCard.addEventListener('touchend', (e) => {
      const diff = currentX - startX;
      currentCard.style.transition = 'transform 0.3s ease';
      
      if (diff > 100) {
        // 右滑 - 开始聊天
        this.startDiscoverChat();
      } else if (diff < -100) {
        // 左滑 - 跳过
        this.skipDiscoverAgent();
      } else {
        // 回弹
        currentCard.style.transform = '';
      }
    });
    
    // 开始聊天按钮
    startBtn?.addEventListener('click', () => this.startDiscoverChat());
    
    // 跳过按钮
    skipBtn?.addEventListener('click', () => this.skipDiscoverAgent());
  },

  // 开始推荐聊天
  startDiscoverChat() {
    const current = this.state.currentDiscover;
    if (!current) return;
    
    // 设置当前角色并打开聊天页
    this.state.currentCharacter = current;
    this.state.chatHistory[current.id] = []; // 新对话
    
    document.getElementById('chat-avatar').textContent = current.avatar || '🧑';
    document.getElementById('chat-name').textContent = current.name;
    this.renderMessages([]);
    
    this.showPage('chat');
    document.getElementById('message-input').focus();
  },

  // 跳过当前推荐
  skipDiscoverAgent() {
    const currentCard = document.getElementById('current-card');
    currentCard.classList.add('swiping-left');
    
    setTimeout(() => {
      // 获取下一个
      if (this.state.discoverQueue.length === 0) {
        this.state.discoverQueue = this.shuffleArray([...Storage.getAllCharacters()]);
      }
      this.state.currentDiscover = this.state.discoverQueue.shift();
      this.state.nextDiscover = this.state.discoverQueue[0];
      
      currentCard.classList.remove('swiping-left');
      currentCard.style.transform = '';
      this.renderDiscoverCards();
    }, 300);
  },

  // 数组随机排序
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  },

  // 渲染广场
  renderMarketplace() {
    const characters = this.getFilteredMarketplaceCharacters();
    const listEl = document.getElementById('character-list');
    const emptyEl = document.getElementById('empty-state');

    if (characters.length === 0) {
      listEl.innerHTML = '';
      emptyEl.style.display = 'block';
      emptyEl.querySelector('p').textContent = '没有找到符合条件的角色';
      return;
    }

    emptyEl.style.display = 'none';
    
    listEl.innerHTML = characters.map(char => this.renderCharacterCard(char, true)).join('');
    this.bindCharacterCardEvents(listEl, true);
  },

  // 获取过滤后的广场角色
  getFilteredMarketplaceCharacters() {
    let chars = Storage.getAllCharacters();
    
    // 来源筛选
    const src = this.state.filters.marketplace;
    if (src === 'official') {
      chars = chars.filter(c => c.isOfficial);
    } else if (src === 'mine') {
      chars = chars.filter(c => !c.isOfficial);
    }
    
    // 搜索
    if (this.state.filters.search) {
      const q = this.state.filters.search.toLowerCase();
      chars = chars.filter(c => c.name.toLowerCase().includes(q));
    }
    
    // 标签筛选
    if (this.state.filters.tags.length > 0) {
      chars = chars.filter(c => 
        this.state.filters.tags.some(tag => c.personality && c.personality.includes(tag))
      );
    }
    
    return chars;
  },

  // 渲染单个角色卡片
  renderCharacterCard(char, isMarketplace = false) {
    // 徽章逻辑
    let badgeHtml = '';
    if (char.isOfficial) {
      badgeHtml = '<span class="badge official-badge">🏛️ 官方</span>';
    } else if (!isMarketplace) {
      badgeHtml = '<span class="badge mine-badge">👤 我的</span>';
    }
    
    // 操作按钮：仅在主页且为用户角色时显示
    let actionsHtml = '';
    if (!isMarketplace && !char.isOfficial) {
      actionsHtml = `
        <div class="character-actions">
          <button class="btn-secondary btn-edit" data-id="${char.id}">编辑</button>
          <button class="btn-secondary btn-delete" data-id="${char.id}">删除</button>
        </div>
      `;
    }
    
    return `
      <div class="character-card" data-id="${char.id}">
        ${badgeHtml}
        <div class="character-avatar">${char.avatar || '🧑'}</div>
        <div class="character-info">
          <div class="character-name">${Utils.escapeHtml(char.name)}</div>
          <div class="character-tags">
            ${(char.personality || []).map(t => `<span class="tag">${t}</span>`).join('')}
          </div>
          <div class="character-meta">点击开始聊天</div>
        </div>
        ${actionsHtml}
      </div>
    `;
  },

  // 绑定角色卡片事件
  bindCharacterCardEvents(listEl, isMarketplace = false) {
    listEl.querySelectorAll('.character-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('btn-edit') && !e.target.classList.contains('btn-delete')) {
          this.openChat(card.dataset.id);
        }
      });
    });

    if (!isMarketplace) {
      listEl.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.showCreatePage(btn.dataset.id);
        });
      });

      listEl.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm('确定要删除这个角色吗？聊天记录也会被删除。')) {
            Storage.deleteCharacter(btn.dataset.id);
            this.loadCharacters();
            Utils.showToast('角色已删除', 'success');
          }
        });
      });
    }
  },

  // 绑定事件
  bindEvents() {
    // 导航
    document.getElementById('create-btn').addEventListener('click', () => this.showCreatePage());
    document.getElementById('back-from-create').addEventListener('click', () => this.showPage('home'));
    document.getElementById('back-from-chat').addEventListener('click', () => this.showPage('home'));
    document.getElementById('cancel-create').addEventListener('click', () => this.showPage('home'));

    // 主题切换
    document.getElementById('theme-toggle')?.addEventListener('click', () => this.toggleTheme());

    // Tab 切换
    document.querySelectorAll('.nav-tabs').forEach(container => {
      container.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab')) {
          this.switchTab(e.target.dataset.tab);
        }
      });
    });

    // 来源筛选（广场）
    const sourceFilter = document.querySelector('.source-filter');
    if (sourceFilter) {
      sourceFilter.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag')) {
          this.state.filters.marketplace = e.target.dataset.filter;
          sourceFilter.querySelectorAll('.tag').forEach(t => {
            t.classList.toggle('active', t.dataset.filter === this.state.filters.marketplace);
          });
          this.renderMarketplace();
        }
      });
    }

    // 设置弹窗
    document.getElementById('settings-btn').addEventListener('click', () => this.showSettings());
    document.getElementById('close-settings').addEventListener('click', () => this.hideSettings());
    document.getElementById('cancel-settings').addEventListener('click', () => this.hideSettings());
    document.getElementById('save-settings').addEventListener('click', () => this.saveSettings());

    // 帮助弹窗
    document.getElementById('help-btn')?.addEventListener('click', () => this.showHelp());
    document.getElementById('close-help')?.addEventListener('click', () => this.hideHelp());
    document.getElementById('help-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'help-modal') {
        this.hideHelp();
      }
    });

    // ESC 键关闭弹窗
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideSettings();
        this.hideHelp();
      }
    });

    // 点击弹窗背景关闭
    document.getElementById('settings-modal').addEventListener('click', (e) => {
      if (e.target.id === 'settings-modal') {
        this.hideSettings();
      }
    });

    // 搜索
    document.getElementById('search-input').addEventListener('input', Utils.debounce((e) => {
      this.state.filters.search = e.target.value;
      if (this.state.currentTab === 'marketplace') {
        this.renderMarketplace();
      } else {
        this.renderCharacterList();
      }
    }, 300));

    // 标签筛选
    document.getElementById('tag-filters').addEventListener('click', (e) => {
      if (e.target.classList.contains('tag')) {
        const tag = e.target.dataset.tag;
        const index = this.state.filters.tags.indexOf(tag);
        
        if (index === -1) {
          this.state.filters.tags.push(tag);
          e.target.classList.add('active');
        } else {
          this.state.filters.tags.splice(index, 1);
          e.target.classList.remove('active');
        }
        
        if (this.state.currentTab === 'marketplace') {
          this.renderMarketplace();
        } else {
          this.renderCharacterList();
        }
      }
    });

    // 头像上传
    document.getElementById('upload-avatar-btn').addEventListener('click', () => {
      document.getElementById('avatar-input').click();
    });

    document.getElementById('avatar-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          document.getElementById('avatar-preview').innerHTML = `<img src="${event.target.result}" alt="avatar">`;
        };
        reader.readAsDataURL(file);
      }
    });

    // 预设头像
    document.getElementById('preset-avatars').addEventListener('click', (e) => {
      if (e.target.classList.contains('preset-avatar')) {
        const emoji = e.target.dataset.emoji;
        document.getElementById('avatar-preview').textContent = emoji;
      }
    });

    // 性格标签选择
    document.getElementById('personality-select').addEventListener('click', (e) => {
      if (e.target.classList.contains('tag')) {
        e.target.classList.toggle('active');
      }
    });

    // AI 生成
    document.getElementById('gen-backstory').addEventListener('click', () => this.generateBackstory());
    document.getElementById('gen-description').addEventListener('click', () => this.generateDescription());

    // 保存角色
    document.getElementById('save-character').addEventListener('click', () => this.saveCharacter());

    // 发送消息
    document.getElementById('send-message').addEventListener('click', () => this.sendMessage());
    document.getElementById('message-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });

    // 编辑角色
    document.getElementById('edit-character').addEventListener('click', () => {
      if (this.state.currentCharacter) {
        this.showCreatePage(this.state.currentCharacter.id);
      }
    });
  },

  // 显示页面
  showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');
    this.state.currentPage = page;
  },

  // 显示创建页
  showCreatePage(editId = null) {
    this.state.editingCharacterId = editId;
    
    if (editId) {
      const character = Storage.getCharacter(editId);
      if (character) {
        document.getElementById('create-title').textContent = '编辑角色';
        document.getElementById('char-name').value = character.name;
        document.querySelector(`input[name="gender"][value="${character.gender}"]`).checked = true;
        document.getElementById('avatar-preview').textContent = character.avatar || '📷';
        document.getElementById('char-backstory').value = character.backstory || '';
        document.getElementById('char-description').value = character.description || '';
        
        // 设置性格标签
        document.querySelectorAll('#personality-select .tag').forEach(tag => {
          if (character.personality?.includes(tag.dataset.tag)) {
            tag.classList.add('active');
          } else {
            tag.classList.remove('active');
          }
        });
      }
    } else {
      document.getElementById('create-title').textContent = '创建角色';
      this.clearCreateForm();
    }
    
    this.showPage('create');
  },

  // 清空创建表单
  clearCreateForm() {
    document.getElementById('char-name').value = '';
    document.querySelectorAll('input[name="gender"]').forEach(r => r.checked = false);
    document.getElementById('avatar-preview').textContent = '📷';
    document.getElementById('avatar-preview').innerHTML = '📷';
    document.getElementById('char-backstory').value = '';
    document.getElementById('char-description').value = '';
    document.querySelectorAll('#personality-select .tag').forEach(t => t.classList.remove('active'));
    this.state.editingCharacterId = null;
  },

  // 渲染角色列表（主页）
  renderCharacterList() {
    const characters = Storage.searchCharacters(
      this.state.filters.search,
      this.state.filters.tags
    );

    const listEl = document.getElementById('character-list');
    const emptyEl = document.getElementById('empty-state');

    if (characters.length === 0) {
      listEl.innerHTML = '';
      emptyEl.style.display = 'block';
      emptyEl.querySelector('p').textContent = '还没有角色，点击右上角创建一个吧！';
      return;
    }

    emptyEl.style.display = 'none';
    
    listEl.innerHTML = characters.map(char => this.renderCharacterCard(char, false)).join('');
    this.bindCharacterCardEvents(listEl, false);
  },

  // 保存角色
  saveCharacter() {
    const name = document.getElementById('char-name').value.trim();
    const gender = document.querySelector('input[name="gender"]:checked')?.value;
    const personality = Array.from(document.querySelectorAll('#personality-select .tag.active'))
      .map(t => t.dataset.tag);
    const backstory = document.getElementById('char-backstory').value.trim();
    const description = document.getElementById('char-description').value.trim();
    
    // 头像
    const avatarEl = document.getElementById('avatar-preview');
    const avatar = avatarEl.querySelector('img')?.src || avatarEl.textContent;

    if (!name) {
      Utils.showToast('请输入角色名字', 'error');
      return;
    }

    if (!gender) {
      Utils.showToast('请选择性别', 'error');
      return;
    }

    if (personality.length === 0) {
      Utils.showToast('请至少选择一个性格标签', 'error');
      return;
    }

    const characterData = { name, gender, personality, backstory, description, avatar };

    if (this.state.editingCharacterId) {
      Storage.updateCharacter(this.state.editingCharacterId, characterData);
      Utils.showToast('角色已更新', 'success');
    } else {
      Storage.addCharacter(characterData);
      Utils.showToast('角色已创建', 'success');
    }

    this.loadCharacters();
    this.showPage('home');
  },

  // 生成背景故事
  async generateBackstory() {
    // 检查配置
    if (!this.checkConfigAndPrompt()) return;

    const name = document.getElementById('char-name').value.trim();
    const gender = document.querySelector('input[name="gender"]:checked')?.value;
    const personality = Array.from(document.querySelectorAll('#personality-select .tag.active'))
      .map(t => t.dataset.tag);

    if (!name || !gender || personality.length === 0) {
      Utils.showToast('请先填写名字、性别和性格', 'error');
      return;
    }

    const btn = document.getElementById('gen-backstory');
    btn.disabled = true;
    btn.textContent = '生成中...';

    try {
      const backstory = await API.generateBackstory(name, gender, personality);
      document.getElementById('char-backstory').value = backstory;
      Utils.showToast('背景故事已生成', 'success');
    } catch (error) {
      Utils.showToast(error.message || '生成失败', 'error');
    }

    btn.disabled = false;
    btn.textContent = '✨ AI 生成';
  },

  // 生成自身描述
  async generateDescription() {
    // 检查配置
    if (!this.checkConfigAndPrompt()) return;

    const name = document.getElementById('char-name').value.trim();
    const gender = document.querySelector('input[name="gender"]:checked')?.value;
    const personality = Array.from(document.querySelectorAll('#personality-select .tag.active'))
      .map(t => t.dataset.tag);
    const backstory = document.getElementById('char-backstory').value.trim();

    if (!name || !gender || personality.length === 0) {
      Utils.showToast('请先填写名字、性别和性格', 'error');
      return;
    }

    const btn = document.getElementById('gen-description');
    btn.disabled = true;
    btn.textContent = '生成中...';

    try {
      const description = await API.generateDescription(name, gender, personality, backstory);
      document.getElementById('char-description').value = description;
      Utils.showToast('描述已生成', 'success');
    } catch (error) {
      Utils.showToast(error.message || '生成失败', 'error');
    }

    btn.disabled = false;
    btn.textContent = '✨ AI 生成';
  },

  // 打开聊天
  openChat(characterId) {
    const character = Storage.getCharacter(characterId);
    if (!character) {
      Utils.showToast('角色不存在', 'error');
      return;
    }

    this.state.currentCharacter = character;
    
    // 更新聊天页头部
    document.getElementById('chat-avatar').textContent = character.avatar || '🧑';
    document.getElementById('chat-name').textContent = character.name;

    // 加载聊天历史
    const messages = Storage.getChatHistory(characterId);
    this.state.chatHistory[characterId] = messages;
    this.renderMessages(messages);

    this.showPage('chat');
    
    // 聚焦输入框
    document.getElementById('message-input').focus();
  },

  // 渲染消息
  renderMessages(messages) {
    const container = document.getElementById('chat-messages');
    
    if (messages.length === 0) {
      container.innerHTML = `
        <div class="message ai">
          <div class="message-avatar">${this.state.currentCharacter?.avatar || '🧑'}</div>
          <div class="message-content">你好呀~ 今天想聊点什么？</div>
        </div>
      `;
      return;
    }

    container.innerHTML = messages.map(msg => `
      <div class="message ${msg.role}">
        <div class="message-avatar">${msg.role === 'user' ? '👤' : (this.state.currentCharacter?.avatar || '🧑')}</div>
        <div class="message-content">${Utils.escapeHtml(msg.content)}</div>
      </div>
    `).join('');

    // 滚动到底部
    container.scrollTop = container.scrollHeight;
  },

  // 发送消息
  async sendMessage() {
    // 检查配置
    if (!this.checkConfigAndPrompt()) return;

    const input = document.getElementById('message-input');
    const content = input.value.trim();

    if (!content) return;
    if (!this.state.currentCharacter) return;

    // 清空输入框
    input.value = '';
    
    // 添加用户消息
    const characterId = this.state.currentCharacter.id;
    const messages = this.state.chatHistory[characterId] || [];
    messages.push({ role: 'user', content });
    this.state.chatHistory[characterId] = messages;
    
    // 立即渲染用户消息
    this.renderMessages(messages);
    
    // 添加 AI 消息占位
    messages.push({ role: 'assistant', content: '' });
    this.renderMessages(messages);
    
    // 禁用发送按钮
    document.getElementById('send-message').disabled = true;
    input.disabled = true;

    // 调用 API
    await API.streamChat(
      this.state.currentCharacter,
      messages.slice(0, -1), // 不包含空的 AI 消息
      (chunk, fullContent) => {
        // 更新最后一条消息
        messages[messages.length - 1].content = fullContent;
        this.renderMessages(messages);
      },
      (fullContent) => {
        // 完成
        messages[messages.length - 1].content = fullContent;
        Storage.saveChatHistory(characterId, messages);
        document.getElementById('send-message').disabled = false;
        input.disabled = false;
        input.focus();
      },
      (error) => {
        // 错误
        messages.pop(); // 移除空的 AI 消息
        this.renderMessages(messages);
        Utils.showToast(error, 'error');
        document.getElementById('send-message').disabled = false;
        input.disabled = false;
        input.focus();
      }
    );
  }
};

// 启动应用
document.addEventListener('DOMContentLoaded', () => App.init());