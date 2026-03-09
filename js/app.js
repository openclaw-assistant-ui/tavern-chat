// app.js - 主应用逻辑

const App = {
  state: {
    currentPage: 'home',
    characters: [],
    currentCharacter: null,
    chatHistory: {},
    filters: {
      search: '',
      tags: []
    },
    editingCharacterId: null
  },

  // 初始化
  init() {
    this.loadCharacters();
    this.bindEvents();
    this.showPage('home');
    this.checkApiKey();
  },

  // 检查 API Key
  checkApiKey() {
    const apiKey = API.getApiKey();
    if (!apiKey) {
      setTimeout(() => {
        const key = prompt('请输入阿里百炼 API Key：');
        if (key) {
          API.setApiKey(key);
          Utils.showToast('API Key 已保存', 'success');
        }
      }, 1000);
    }
  },

  // 加载角色
  loadCharacters() {
    this.state.characters = Storage.getCharacters();
    this.renderCharacterList();
  },

  // 绑定事件
  bindEvents() {
    // 导航
    document.getElementById('create-btn').addEventListener('click', () => this.showCreatePage());
    document.getElementById('back-from-create').addEventListener('click', () => this.showPage('home'));
    document.getElementById('back-from-chat').addEventListener('click', () => this.showPage('home'));
    document.getElementById('cancel-create').addEventListener('click', () => this.showPage('home'));

    // 搜索
    document.getElementById('search-input').addEventListener('input', Utils.debounce((e) => {
      this.state.filters.search = e.target.value;
      this.renderCharacterList();
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
        
        this.renderCharacterList();
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

  // 渲染角色列表
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
      return;
    }

    emptyEl.style.display = 'none';
    
    listEl.innerHTML = characters.map(char => `
      <div class="character-card" data-id="${char.id}">
        <div class="character-avatar">${char.avatar || '🧑'}</div>
        <div class="character-info">
          <div class="character-name">${Utils.escapeHtml(char.name)}</div>
          <div class="character-tags">
            ${(char.personality || []).map(t => `<span class="tag">${t}</span>`).join('')}
          </div>
          <div class="character-meta">点击开始聊天</div>
        </div>
        <div class="character-actions">
          <button class="btn-secondary btn-edit" data-id="${char.id}">编辑</button>
          <button class="btn-secondary btn-delete" data-id="${char.id}">删除</button>
        </div>
      </div>
    `).join('');

    // 绑定卡片事件
    listEl.querySelectorAll('.character-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('btn-edit') && !e.target.classList.contains('btn-delete')) {
          this.openChat(card.dataset.id);
        }
      });
    });

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