# 🍺 AI 酒馆聊天

一个优雅的 AI 角色聊天应用，支持自定义角色、流式对话、AI 生成背景故事。

## 快速开始

```bash
# 一键启动
./start.sh

# 或指定端口
./start.sh 3000
```

然后打开浏览器访问 http://localhost:8080

## 配置

首次使用需要在设置页面填入 OpenRouter API Key：

1. 点击右上角 ⚙️ 图标
2. 输入你的 OpenRouter API Key
3. 开始聊天！

### 获取 API Key

1. 访问 [OpenRouter](https://openrouter.ai/)
2. 注册并获取 API Key
3. 推荐模型：`deepseek/deepseek-chat`（性价比高）

## 功能

- ✅ 自定义角色（名称、性别、性格、背景）
- ✅ AI 生成角色背景故事和自我介绍
- ✅ 流式对话（打字机效果）
- ✅ 多角色支持
- ✅ 本地存储（数据保存在浏览器）
- ✅ 直连 OpenRouter（无需代理）

## 技术栈

- 纯前端：HTML + CSS + JavaScript
- 无需后端：直连 OpenRouter API
- 本地存储：LocalStorage

## 目录结构

```
tavern-chat/
├── index.html      # 主页面
├── start.sh        # 启动脚本
├── css/
│   └── style.css   # 样式
├── js/
│   ├── app.js      # 主逻辑
│   ├── api.js      # API 封装
│   └── storage.js  # 本地存储
└── assets/         # 资源文件
```

## 开发

无需构建，直接修改文件后刷新浏览器即可。

## License

MIT