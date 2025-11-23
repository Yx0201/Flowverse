# Flowverse

<div align="center">

![Flowverse Logo](https://img.shields.io/badge/Flowverse-AI%20Canvas%20System-blue?style=for-the-badge&logo=react)

**无限画布中的AI对话与知识管理系统**

基于ReactFlow的下一代AI对话界面，将传统AI对话转化为无限画布中的可视化节点网络

[![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19+-blue?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)

[English](#english-documentation) | [中文](#中文文档)

</div>

## ✨ 核心特性

### 🎨 无限画布设计
- **可视化对话流程**：将AI对话转化为无限画布中的节点网络
- **思维导图式交互**：用户可以在无限空间中自由导航和组织对话
- **实时流式更新**：AI回复以流式方式实时展示在画布上

### 🤖 智能对话系统
- **流式AI对话**：支持实时流式AI回复
- **思考过程可视化**：展示AI的思考过程和工作流程
- **历史记录管理**：所有对话以节点形式永久保存在画布中

### 🔧 高级功能
- **节点化知识管理**：每个对话都是可检索的知识节点
- **自定义工作流**：支持创建复杂的AI工作流程
- **RAG知识库集成**：结合本地知识库进行智能问答
- **Agent工作流**：创建和配置自定义AI Agent

## 🚀 技术栈

- **前端框架**：Next.js 15 + React 19
- **UI组件**：Ant Design + ReactFlow 12+
- **开发语言**：TypeScript
- **状态管理**：React Hooks + Context API
- **样式方案**：SCSS Modules
- **AI集成**：Ollama + Local LLM

## 📦 安装使用

### 环境要求
- Node.js 18+
- npm / pnpm / yarn
- Ollama (可选，用于本地AI模型)

### 快速开始

1. **克隆项目**
```bash
git clone https://github.com/YOUR_USERNAME/Flowverse.git
cd Flowverse
```

2. **安装依赖**
```bash
npm install
# 或
pnpm install
# 或
yarn install
```

3. **环境配置**
```bash
cp .env.local.example .env.local
# 编辑 .env.local 文件，配置你的AI服务
```

4. **启动开发服务器**
```bash
npm run dev
# 或
pnpm dev
```

5. **访问应用**
打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 环境配置

在 `.env.local` 文件中配置以下变量：

```env
# 应用配置
NEXT_PUBLIC_APP_NAME=Flowverse
NEXT_PUBLIC_DEBUG=true

# AI服务配置
NEXT_PUBLIC_OLLAMA_URL=http://localhost:11434
```

## 🎯 核心理念

### 无限画布思维
传统的线性对话界面限制了思维的自由流动。Flowverse将每次对话都视为画布上的一个节点，用户可以在无限空间中：

- 🔄 **非线性思维**：自由跳转和连接不同对话主题
- 📊 **可视化关系**：直观看到知识点之间的关联
- 🎨 **个性化布局**：按照自己的思维方式组织信息

### 知识节点化
每个对话不仅仅是文字记录，更是：

- 💎 **知识碎片**：可检索、可引用的知识单元
- 🌐 **网络节点**：与其他对话形成知识网络
- 🔄 **动态更新**：AI工作流可以持续丰富节点内容

### 工作流驱动
未来将支持：

- 🤖 **自定义Agent**：创建专门的AI工作流程
- 📚 **RAG集成**：结合本地知识库进行智能问答
- ⚡ **自动化流程**：设置节点间的自动触发和更新

## 🏗️ 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── (api)/             # API路由
│   │   └── chat/          # 聊天API
│   └── (cilent)/          # 客户端页面
│       ├── components/    # 组件
│       │   ├── Flow/      # ReactFlow组件
│       │   ├── SysNav/    # 导航组件
│       │   └── SysInput/  # 输入组件
│       ├── hook/          # 自定义Hooks
│       └── lib/           # 工具库
├── service/               # 服务层
└── lib/                  # 核心库
```

## 🔧 开发指南

### 本地AI模型配置

1. **安装Ollama**
```bash
# macOS
brew install ollama

# 其他平台请参考 https://ollama.com/
```

2. **下载模型**
```bash
ollama pull qwen2.5:8b
# 或其他你喜欢的模型
```

3. **启动Ollama服务**
```bash
ollama serve
```

### 自定义开发

项目采用现代化的开发工具链：

- **React Compiler**：自动优化组件渲染
- **TypeScript严格模式**：类型安全
- **ESLint + Prettier**：代码规范
- **SCSS Modules**：样式隔离

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 开发规范

- 遵循现有代码风格
- 添加必要的类型注解
- 编写清晰的提交信息
- 更新相关文档

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [ReactFlow](https://reactflow.dev/) - 强大的流程图组件库
- [Next.js](https://nextjs.org/) - 全栈React框架
- [Ant Design](https://ant.design/) - 企业级UI设计语言
- [Ollama](https://ollama.com/) - 本地AI模型运行环境

## 🌟 Star History

如果这个项目对你有帮助，请给一个⭐️！

---

<div align="center">
<p>Made with ❤️ by the Flowverse Team</p>
</div>