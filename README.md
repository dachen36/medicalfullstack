# Medical FullStack Project / 医疗全栈项目

English | 中文

This repository is a full-stack medical system composed of two main modules:

- AlertSys: frontend application for medical alerts and case management
- Backend: backend service with image processing, OCR, and AI/ML capabilities

本仓库是一个由两个主要模块组成的医疗全栈系统：

- AlertSys：用于医疗告警与病例管理的前端应用
- Backend：具备图像处理、OCR 和 AI/ML 能力的后端服务

---

## 1. Project Overview / 项目概览

### English
This project combines a modern React frontend with a Bun + Elysia backend to support medical alert workflows, data visualization, and AI-assisted medical analysis. It is designed to help users manage alert cases, process medical images, and analyze relevant document data.

### 中文
该项目将现代 React 前端与 Bun + Elysia 后端结合起来，用于支持医疗告警工作流、数据可视化和 AI 辅助的医学分析。它旨在帮助用户管理告警病例、处理医学影像，并分析相关文档数据。

---

## 2. Repository Structure / 仓库结构

```text
medicalfullstack/
├── AlertSys/           # Frontend / 前端
├── Backend/            # Backend / 后端
├── README.md           # Project documentation / 项目文档
└── ...
```

---

## 3. Frontend: AlertSys / 前端：AlertSys

### 3.1 Brief Introduction / 简介

### English
`AlertSys` is the frontend part of the project. It is built using React + TypeScript + Vite and provides a responsive, interactive interface for medical alert management, case visualization, and export functions.

### 中文
`AlertSys` 是项目的前端部分，使用 React + TypeScript + Vite 构建，提供响应式、交互式的界面，用于医疗告警管理、病例可视化和导出功能。

### 3.2 Tech Stack / 技术栈

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- html2pdf.js
- xlsx

### 3.3 Main Features / 主要功能

### English
- Medical alert case display and interaction
- Data visualization and dashboard UI
- Export as PDF or Excel
- Responsive UI for desktop and tablet usage
- TypeScript-based codebase for maintainability

### 中文
- 医疗告警病例展示与交互
- 数据可视化与仪表板界面
- 支持导出为 PDF 或 Excel
- 适配桌面端和平板端的响应式界面
- TypeScript 编写，便于维护和扩展

### 3.4 Folder Structure / 目录结构

```text
AlertSys/
├── public/
├── src/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── cases.json
├── testData.xlsx
├── bun.lock
└── package-lock.json
```

### 3.5 Running the Frontend / 运行前端

#### Install dependencies / 安装依赖

```bash
cd AlertSys
npm install
# or
bun install
```

#### Start development server / 启动开发服务器

```bash
npm run dev
# or
bun run dev
```

Default local address: `http://localhost:5173`
默认本地地址：`http://localhost:5173`

#### Build production version / 构建生产版本

```bash
npm run build
# or
bun run build
```

---

## 4. Backend: Backend / 后端：Backend

### 4.1 Brief Introduction / 简介

### English
`Backend` is the API service of the project. Built with Bun and Elysia, it supports medical image processing, OCR, database access, and AI-related inference tasks. It serves as the business and data layer for the full-stack application.

### 中文
`Backend` 是项目的 API 服务，基于 Bun 和 Elysia 构建，支持医学影像处理、OCR、数据库访问以及 AI 相关推理任务。它是整个全栈应用的业务层和数据层。

### 4.2 Tech Stack / 技术栈

- Bun
- Elysia
- TypeScript
- Drizzle ORM
- Sharp
- Tesseract.js
- image-size
- @xenova/transformers
- onnxruntime-node and onnxruntime-web
- PNG.js
- SQLite (clinic.db)

### 4.3 Main Features / 主要功能

### English
- API server for frontend communication
- Medical image processing and upload support
- OCR recognition for text extraction
- AI/ML inference pipeline
- Data persistence using SQLite with Drizzle ORM
- Static file serving and CORS support

### 中文
- 面向前端的 API 服务
- 医学图像处理与上传支持
- OCR 文字识别与文本提取
- AI/ML 推理处理流程
- 使用 SQLite + Drizzle ORM 进行数据持久化
- 静态文件服务与 CORS 跨域支持

### 4.4 Folder Structure / 目录结构

```text
Backend/
├── src/
├── uploads/
├── clinic.db
├── chi_sim.traineddata
├── package.json
├── tsconfig.json
├── bun.lock
├── README.md
└── ...
```

### 4.5 Running the Backend / 运行后端

#### Install dependencies / 安装依赖

```bash
cd Backend
bun install
```

#### Start server / 启动服务

```bash
bun run dev
```

Default local address: `http://localhost:3000`
默认本地地址：`http://localhost:3000`

---

## 5. Frontend and Backend Integration / 前后端集成

### English
The frontend sends requests to the backend API, while the backend handles business logic, data processing, image analysis, and result return. This separation keeps the UI layer and logic layer independent and easier to maintain.

### 中文
前端向后端 API 发起请求，而后端负责处理业务逻辑、数据处理、图像分析和结果返回。这种分层结构使 UI 层与逻辑层保持独立，并更便于维护和扩展。

Typical integration flow:
- User interacts with the frontend
- Frontend sends requests to backend endpoints
- Backend processes files and data
- Results are returned and displayed in the UI

典型集成流程：
- 用户在前端进行交互
- 前端向后端接口发送请求
- 后端处理文件与数据
- 结果返回并在界面中展示

---

## 6. Quick Start / 快速开始

### English
```bash
git clone https://github.com/dachen36/medicalfullstack.git
cd medicalfullstack

# Start backend
cd Backend
bun install
bun run dev

# Start frontend in another terminal
cd ../AlertSys
npm install
npm run dev
```

### 中文
```bash
git clone https://github.com/dachen36/medicalfullstack.git
cd medicalfullstack

# 启动后端
cd Backend
bun install
bun run dev

# 在另一个终端中启动前端
cd ../AlertSys
npm install
npm run dev
```

---

## 7. Notes / 说明

### English
- `AlertSys` is the frontend interface for user interaction.
- `Backend` is responsible for image processing, OCR, and AI tasks.
- The project is suitable for demo, prototype, and medical workflow research.
- Some dependencies and model assets are included in the backend for OCR and analysis.

### 中文
- `AlertSys` 是面向用户交互的前端界面。
- `Backend` 负责图像处理、OCR 和 AI 相关任务。
- 该项目适合用于演示、原型开发和医疗流程研究。
- 后端包含一些 OCR 和分析所需的依赖与模型资源。

---

## 8. Recommended Development Workflow / 推荐开发流程

### English
1. Initialize dependencies for both frontend and backend.
2. Run backend first to ensure API service is available.
3. Run frontend and test the interaction flow.
4. Validate data upload and processing logic.
5. Build and test before deployment.

### 中文
1. 安装前后端依赖。
2. 先启动后端，确保 API 服务可用。
3. 启动前端并测试交互流程。
4. 验证数据上传和处理逻辑。
5. 在部署前进行构建和测试。

---

## 9. Summary / 总结

### English
This repository provides a practical full-stack medical application structure that clearly separates frontend and backend responsibilities. The frontend provides user-facing interaction, while the backend handles processing and AI services. It is a strong starting point for healthcare-related projects and can be expanded with more medical modules.

### 中文
这个仓库提供了一个实际可用的全栈医疗应用结构，明确区分了前端与后端职责。前端负责用户交互，后端负责处理和 AI 服务，是一个适合作为医疗类项目起点的良好基础，可以在此基础上扩展更多医疗模块。

---

## 10. Author / 作者

GitHub: `dachen36`

---

## 11. License / 许可证

This project is currently provided as-is for learning, development, and research purposes.

本项目目前按“原样提供”，用于学习、开发和研究用途。
