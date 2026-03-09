// api.js - API 调用封装

const API = {
  // API 配置 - 使用阿里百炼 GLM-5
  config: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    model: 'glm-5',
    apiKey: null // 将在运行时从配置或环境获取
  },

  // 初始化 API
  init() {
    // 尝试从 localStorage 获取 API Key
    const savedKey = localStorage.getItem('tavern_api_key');
    if (savedKey) {
      this.config.apiKey = savedKey;
    }
  },

  // 设置 API Key
  setApiKey(key) {
    this.config.apiKey = key;
    localStorage.setItem('tavern_api_key', key);
  },

  // 获取 API Key
  getApiKey() {
    return this.config.apiKey;
  },

  // 构建角色 System Prompt
  buildSystemPrompt(character) {
    const genderText = {
      male: '男性',
      female: '女性',
      other: '神秘'
    };

    return `你是${character.name}，一个${genderText[character.gender] || '神秘'}虚拟角色。

【性格】
${character.personality ? character.personality.join('、') : '未知'}

【背景故事】
${character.backstory || '暂无'}

【自我描述】
${character.description || '暂无'}

请以第一人称回应，保持角色一致性。不要出戏，不要提及自己是AI。回复要自然、生动，符合角色性格。`;
  },

  // 流式调用 API
  async streamChat(character, messages, onChunk, onComplete, onError) {
    if (!this.config.apiKey) {
      onError('请先设置 API Key');
      return;
    }

    const systemPrompt = this.buildSystemPrompt(character);
    
    // 构建消息数组（限制最近 20 条）
    const recentMessages = messages.slice(-20);
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...recentMessages.map(m => ({
        role: m.role,
        content: m.content
      }))
    ];

    try {
      const response = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: apiMessages,
          stream: true,
          temperature: 0.8,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API 错误: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const json = JSON.parse(data);
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                onChunk(content, fullContent);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      onComplete(fullContent);
    } catch (error) {
      console.error('API Error:', error);
      onError(error.message || '网络错误，请重试');
    }
  },

  // 生成背景故事
  async generateBackstory(name, gender, personality) {
    if (!this.config.apiKey) {
      throw new Error('请先设置 API Key');
    }

    const genderText = { male: '男性', female: '女性', other: '神秘' };
    const prompt = `请为一位名叫"${name}"的${genderText[gender] || '神秘'}角色生成一段简短的背景故事（100-200字）。
性格特点：${personality.join('、')}
要求：有趣、有深度，符合角色性格。直接输出故事内容，不要其他说明。`;

    const response = await fetch(this.config.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error('生成失败');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  },

  // 生成自身描述
  async generateDescription(name, gender, personality, backstory) {
    if (!this.config.apiKey) {
      throw new Error('请先设置 API Key');
    }

    const genderText = { male: '男性', female: '女性', other: '神秘' };
    const prompt = `请为一位名叫"${name}"的${genderText[gender] || '神秘'}角色生成一段自我介绍（50-100字）。
性格特点：${personality.join('、')}
背景故事：${backstory || '暂无'}
要求：以第一人称，生动有趣，符合角色性格。直接输出内容，不要其他说明。`;

    const response = await fetch(this.config.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      throw new Error('生成失败');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }
};

// 初始化
API.init();