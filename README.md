# Talent

数字人才调研问卷发布项目。

## 当前问卷

- 贵州省交通运输厅数据治理专题培训调查问卷

## 使用方式

打开 `index.html` 即可查看移动端友好的问卷页面。页面为纯静态实现，适合部署到 GitHub Pages。

当前版本支持：

- 手机端访问和填写
- 必填项校验
- 第 9 题多选至少选择 1 项
- 用户提交成功后显示关闭页面提示
- 集中存储 API 配置：`config.js`
- 未配置 API 时，退回浏览器本地保存
- 独立分析仪表盘：`dashboard.html`
- 汇总分析、提交明细、删除测试明细、Excel 工作簿导出

## 集中存储

手机端和电脑端不是同一个浏览器，本地存储无法跨设备同步。要让电脑端 Dashboard 看到所有手机提交的数据，需要配置集中存储 API。

项目已提供两个后端模板：

- 推荐：`backend/cloudflare-worker.js`，适合作为网页 API，支持跨域、提交、查询、删除。
- 备选：`backend/google-apps-script.gs`，适合落到 Google Sheet，但跨域访问环境可能需要额外处理。

Cloudflare Worker 配置方式：

1. 创建 Cloudflare Worker。
2. 创建 KV 命名空间，并绑定到 Worker，变量名为 `SURVEY_KV`。
3. 设置 Worker 环境变量 `ADMIN_TOKEN`，值为一个足够长的随机字符串。
4. 粘贴 `backend/cloudflare-worker.js` 并部署。
5. 将 Worker URL 填入 `config.js` 的 `apiUrl`。
6. 管理员打开 Dashboard 时使用 `dashboard.html?token=你的ADMIN_TOKEN`。

Google Apps Script 配置方式：

配置方式：

1. 新建一个 Google Sheet。
2. 在 Apps Script 中粘贴 `backend/google-apps-script.gs`。
3. 将脚本中的 `SPREADSHEET_ID` 改为表格 ID。
4. 将 `ADMIN_TOKEN` 改为一个足够长的随机字符串。
5. 部署为 Web App，访问权限选择 Anyone。
6. 将 Web App URL 填入 `config.js` 的 `apiUrl`。
7. 管理员打开 Dashboard 时使用 `dashboard.html?token=你的ADMIN_TOKEN`。

普通问卷页只执行提交，不展示任何他人数据。Dashboard 读取和删除明细需要管理员 token。
