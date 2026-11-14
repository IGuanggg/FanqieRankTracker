# 看板改版说明（2026-11-14）

本次只改本地克隆 `/workspace/FanqieRankTracker`，没有 git commit / push，也没有改 GitHub Actions 抓取逻辑，没有回写 `data/fanqie_female_new_ranks_*.json` 历史快照。

## 改了哪些文件

- `scripts/build_latest.py`：对比时为每本书补齐变动字段，生成首页洞察
- `data/latest_ranks.json`、`data/insights.json`、`data/market_summary.json`、`data/trends/2026-11-14.json`、`data/dates.json`、`api/lastest/*`：由构建脚本根据已有快照重新生成
- `index.html`、`js/app.js`、`css/style.css`：首页总览、KPI、分类工具栏与卡片信息
- `trend.html`、`js/trend.js`：风向标图表与 GitHub 链接
- `book.html`、`js/book.js`：GitHub 链接，详情页补充较上次名次/在读变化
- `shorts.html`：仅将 GitHub 链接改为 `https://github.com/IGuanggg/FanqieRankTracker`
- `README.md`：在功能概览中补充总览、筛选和图表说明

## 新增数据字段

书籍（保留原 title / author / reads / intro / cover / url）：

- `rank`：当日 1-based 名次
- `prev_rank`：前一日名次，新上榜为 `null`
- `rank_change`：整数，正数表示名次上升
- `is_new`：是否新上榜
- `reads_value`：阅读量数值（沿用 `parse_reads`）
- `reads_change`：阅读增量，未知为 0
- `reads_change_text`：如 `+3000` / `+3.2万`
- `days_on_list`：最近最多 30 日快照中，同一分类内按作品页 ID 或「书名+作者」统计的在榜天数（只写入 latest 视图）

分类趋势补充：

- `reads_growth_total`：该分类全部书籍阅读增量合计
- `rank_changes`：全部有名次变化的书 `[{title, change}]`（原 `top_risers` / `top_fallers` 仍只保留前 3）

`data/insights.json` 同时嵌在 `latest_ranks.insights` 里，首页只需一次拉取即可渲染总览。主要结构：

- `kpis`：在榜数、新上榜、掉榜、阅读增量合计、涨幅最大作品、最热分类
- `dark_horses`：名次不在前 5、但阅读增量靠前的跨分类黑马（最多 8 本）
- `new_entries` / `reads_growth_top` / `theme_shift` / `category_board`

历史日期不回填 200+ 份趋势文件。前端会额外请求前一日快照，在浏览器里算出同样的名次和阅读增量；若没有前一日快照，再回退到该日趋势文件里的新上榜 / 涨跌前几名。

## 如何本地预览

在仓库根目录执行：

```bash
python -m http.server 8000
```

然后打开：

- http://127.0.0.1:8000/index.html
- http://127.0.0.1:8000/trend.html

重新生成 latest 数据（不会重爬站点，也不会改历史快照）：

```bash
python scripts/build_latest.py
```

未配置 `API_BASE_URL` / `API_KEY` / `API_MODEL` 时，分类 AI 总结会保留已有文本；全站热点若原先是规则文案，会按新的黑马和题材升降规则重写。
