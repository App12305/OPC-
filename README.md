# 电商运营工作台（全栈版 V1）

面向电商商家与团队的每日经营工作台，覆盖「推广获客 → 咨询接待 → 成交下单 → 发货履约 → 售后服务 → 客户复购」全闭环。本版为**可交付的全栈产品**，包含真实后端 API、持久化数据库与工程化前端，不再是单页 Demo。

## 技术栈

| 层 | 技术 | 说明 |
|----|------|------|
| 后端 | Node.js + Express + 内置 SQLite（`node:sqlite`）| 零原生编译依赖，数据真实落盘 |
| 鉴权 | JWT + bcrypt | 登录鉴权 + 角色权限（owner/ops/cs/content/wh）|
| 前端 | React 18 + TypeScript + Vite | 工程化构建，支持 dev / build |
| 部署 | 后端直接托管前端产物 | 生产环境单端口运行（:3001）|

## 目录结构

```
.
├── server/                # 后端（Express + SQLite）
│   ├── package.json
│   ├── data/app.db        # SQLite 数据库（首次启动自动建表+种子）
│   └── src/
│       ├── index.js       # 入口：路由挂载、静态托管、业务接口
│       ├── db.js          # 数据库连接、建表、种子数据
│       ├── crud.js        # 通用 REST 资源路由工厂
│       ├── auth.js        # JWT 登录、中间件、角色鉴权
│       └── seed-cli.js     # （预留）重置种子
└── web/                   # 前端（React + Vite + TS）
    ├── package.json
    ├── vite.config.ts     # dev 代理 /api → :3001
    └── src/
        ├── api.ts / auth.tsx     # API 客户端 + 鉴权上下文
        ├── components/           # Layout / Modal / 通用 CrudPage
        └── pages/                # 11 个业务页面
```

## 启动方式

### 方式一：开发模式（热更新，推荐体验）
```bash
# 终端 1：启动后端
cd server
npm install
npm start                # 监听 http://localhost:3001

# 终端 2：启动前端
cd web
npm install
npm run dev              # 监听 http://localhost:5173
```
浏览器打开 **http://localhost:5173** 即可。

### 方式二：生产模式（单端口，后端托管前端）
```bash
cd server && npm install
cd web  && npm install && npm run build
cd server && npm start
```
浏览器打开 **http://localhost:3001**（后端自动托管 `web/dist`）。

## 演示账号（密码均为 123456）
- `admin` 老板 / 负责人（owner，可管理成员）
- `ops` 运营、`cs` 客服、`content` 内容、`wh` 仓储

> 非 owner 账号调用成员管理接口会返回 403（后端已做角色鉴权）。

## 已完成功能（10 大模块均可用）

- **工作台首页**：角色视角今日工作、核心指标卡（订单/待发货/成交金额/异常）、库存与异常预警、常用入口。
- **商品与选品中心**：增删改、按名称/SKU 搜索、按渠道/状态筛选、成本/售价/自动利润、库存预警、关联供应商。
- **订单与履约中心**：增删改、搜索/筛选、状态流转、**发货动作**（填物流单号→状态联动为已发货）。
- **采购与库存中心**：库存预警、供应商管理、采购单、**入库动作**（自动增加对应商品可售库存，库存联动）。
- **售后服务中心**：退款/退货/换货/投诉/补发工单，分派与状态，**标记解决**（写入处理人与时间）。
- **客户经营中心**：客户档案、来源、标签、会员层级。
- **营销投放中心**：活动/优惠券/推广计划，关联商品与预算。
- **视频推广中心**：选题→发布全流程，记录播放/点击/咨询/订单/成交/成本（效果归因）。
- **客服聊天中心**：会话列表（未读/状态/渠道）、会话详情（演示数据，预留消息接入层）。
- **财务与经营分析**：销售额、商品成本、推广费、估算利润，按渠道/商品分布。
- **团队与平台管理**：成员与角色权限（owner）、多店铺/渠道配置、操作日志审计。
- **通用能力**：登录鉴权、401 拦截、角色权限、新增/编辑/搜索/筛选/删除均**真实持久化**到 SQLite，重启服务数据不丢。

## 主要 API（均以 `/api` 开头，需 Bearer Token）
- `POST /api/auth/login` 登录（免鉴权）
- `GET /api/products`、`/api/orders`、`/api/customers`、`/api/suppliers`、`/api/purchases`、`/api/campaigns`、`/api/videos`、`/api/chat_sessions`、`/api/shops`、`/api/aftersales` —— 通用 CRUD（支持 `?q=` 搜索与字段过滤）
- `POST /api/orders/:id/ship` 发货
- `POST /api/purchases/:id/receive` 采购入库（联动库存）
- `POST /api/aftersales/:id/resolve` 售后解决
- `GET /api/dashboard/stats` 工作台统计
- `GET /api/finance/summary` 财务汇总
- `GET|POST|PUT|DELETE /api/users`（仅 owner）、`GET /api/activity` 操作日志

## 业务联动（已实现）
- 商品 → 订单履约：订单关联商品，发货后状态联动。
- 库存预警 → 补货采购 → 入库 → 可售库存更新（采购入库自动加库存）。
- 售后工单关联客户 / 订单 / 商品；解决后记录处理人与时间。

## 假设与后续待确认 / 待开发
1. **数据来源**：当前为后端种子演示数据；接真实平台（淘宝/抖店/企微等）需对应开放平台资质与授权，在「团队与平台管理 → 接口管理」逐平台接入（已预留数据关联层）。
2. **多人协作**：已实现角色权限与操作日志；后续可加任务分派、审批流、实时协作。
3. **AI 能力**：视频脚本/字幕/配音、客服 AI 回复建议为占位，需接入外部 AI 服务。
4. **指标口径**：财务利润为「销售额−商品成本−推广费」的估算口径，后续按真实费用明细校准。
5. **运维**：当前为单机本地部署；如需云部署/多实例，可更换数据库为 PostgreSQL 并加 Redis 等（代码结构已分层，易于替换）。

## 重置演示数据
删除 `server/data/app.db` 后重启后端，将自动重新种子。
