#!/bin/bash
# AI 酒馆聊天 - 一键启动脚本
# 使用 Python 内置 HTTP 服务器

PORT=${1:-8080}

echo "🍺 AI 酒馆聊天启动中..."
echo "📍 地址: http://localhost:$PORT"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

# 切换到脚本所在目录
cd "$(dirname "$0")"

# 尝试使用 Python 3，失败则使用 Python 2
if command -v python3 &> /dev/null; then
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer $PORT
else
    echo "❌ 错误: 需要安装 Python"
    echo "   macOS: brew install python3"
    echo "   或使用: npx serve ."
    exit 1
fi