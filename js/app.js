document.addEventListener('DOMContentLoaded', () => {
    const categoryList = document.getElementById('category-list');
    const waterfall = document.getElementById('books-waterfall');
    const updateDate = document.getElementById('update-date');
    const categoryTitle = document.getElementById('current-category-title');
    const aiContent = document.getElementById('ai-content');
    const trendPanel = document.getElementById('trend-panel');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const dateDisplay = document.getElementById('date-display');
    const datePickerBtn = document.getElementById('date-picker-btn');
    const dateInput = document.getElementById('date-input');
    const datePrevBtn = document.getElementById('date-prev');
    const dateNextBtn = document.getElementById('date-next');
    const mainContent = document.getElementById('main-content');
    const kpiStrip = document.getElementById('kpi-strip');
    const overviewPanel = document.getElementById('overview-panel');
    const categoryView = document.getElementById('category-view');
    const moversPanel = document.getElementById('movers-panel');
    const bookSearchInput = document.getElementById('book-search');
    const bookSortSelect = document.getElementById('book-sort');
    const bookFilters = document.getElementById('book-filters');

    const OVERVIEW_KEY = '__all__';
    const MARKET_KEYWORDS = [
        '重生', '穿书', '快穿', '系统', '空间', '团宠', '萌宝', '幼崽', '女配', '炮灰',
        '反派', '权臣', '宅斗', '宫斗', '和离', '替嫁', '逃荒', '种田', '美食', '经商',
        '年代', '七零', '八零', '军婚', '豪门', '总裁', '真假千金', '先婚后爱', '追妻',
        '甜宠', '双洁', '强制爱', '无CP', '末世', '废土', '天灾', '囤货', '异能',
        '国运', '星际', '修仙', '玄学', '无限流', '悬疑', '直播', '综艺', '娱乐圈',
        '校园', '暗恋', '青梅竹马', '民国', '兽世', '远古', '基建'
    ];
    const GENRE_GROUPS = [
        { name: '古风言情', categories: ['古风世情', '古言脑洞', '宫斗宅斗', '种田'] },
        { name: '现代言情', categories: ['现言脑洞', '豪门总裁', '职场婚恋', '青春甜宠'] },
        { name: '幻想言情', categories: ['玄幻言情', '科幻末世', '悬疑脑洞', '女频悬疑'] },
        { name: '快穿衍生', categories: ['快穿', '女频衍生'] },
        { name: '年代民国', categories: ['年代', '民国言情'] },
        { name: '娱乐星光', categories: ['星光璀璨'] },
        { name: '游戏体育', categories: ['游戏体育'] },
    ];

    let allData = null;
    let marketSummaryData = null;
    let availableDates = [];
    let currentDateIndex = -1;
    let currentCategory = OVERVIEW_KEY;
    let bookQuery = '';
    let bookSort = 'rank';
    let bookFilter = 'all';

    const cacheBuster = `v=${Math.floor(Date.now() / 600000)}`;

    const copyToast = document.createElement('div');
    copyToast.className = 'copy-toast';
    copyToast.textContent = '书本信息已复制';
    document.body.appendChild(copyToast);
    let toastTimer = null;

    function showCopyToast() {
        if (toastTimer) clearTimeout(toastTimer);
        copyToast.classList.add('show');
        toastTimer = setTimeout(() => copyToast.classList.remove('show'), 1800);
    }

    function copyBookInfo(e, book) {
        e.preventDefault();
        e.stopPropagation();
        const text = `${book.title}\n作者：${book.author}\n阅读量：${book.reads}\n简介：${book.intro || '无'}\n链接：${book.url || '无'}`;
        navigator.clipboard.writeText(text).then(() => {
            const btn = e.currentTarget;
            btn.classList.add('copied');
            btn.textContent = '已复制';
            showCopyToast();
            setTimeout(() => {
                btn.classList.remove('copied');
                btn.textContent = '复制信息';
            }, 1500);
        }).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showCopyToast();
        });
    }

    let overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('show');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
    });

    function closeMobileSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
    }

    function updateDateNav() {
        const isLatest = currentDateIndex === availableDates.length - 1;
        const isFirst = currentDateIndex <= 0;

        datePrevBtn.disabled = isFirst;
        dateNextBtn.disabled = isLatest;

        const currentDate = availableDates[currentDateIndex];
        dateDisplay.textContent = currentDate || '加载中...';

        if (isLatest) {
            datePickerBtn.classList.remove('is-historical');
        } else {
            datePickerBtn.classList.add('is-historical');
        }

        updatePresetButtons();
    }

    const presetBtns = document.querySelectorAll('.preset-btn');

    function updatePresetButtons() {
        const isLatest = currentDateIndex === availableDates.length - 1;
        const isYesterday = availableDates.length >= 2 && currentDateIndex === availableDates.length - 2;

        presetBtns.forEach(btn => {
            const preset = btn.dataset.preset;
            if (preset === 'latest' && isLatest) {
                btn.classList.add('active');
            } else if (preset === 'yesterday' && isYesterday) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.dataset.preset;
            if (preset === 'latest' && availableDates.length > 0) {
                currentDateIndex = availableDates.length - 1;
                loadDateData(availableDates[currentDateIndex]);
            } else if (preset === 'yesterday' && availableDates.length >= 2) {
                currentDateIndex = availableDates.length - 2;
                loadDateData(availableDates[currentDateIndex]);
            }
        });
    });

    datePrevBtn.addEventListener('click', () => {
        if (currentDateIndex > 0) {
            currentDateIndex--;
            loadDateData(availableDates[currentDateIndex]);
        }
    });

    dateNextBtn.addEventListener('click', () => {
        if (currentDateIndex < availableDates.length - 1) {
            currentDateIndex++;
            loadDateData(availableDates[currentDateIndex]);
        }
    });

    datePickerBtn.addEventListener('click', () => {
        dateInput.showPicker ? dateInput.showPicker() : dateInput.click();
    });

    dateInput.addEventListener('change', () => {
        const selected = dateInput.value;
        if (!selected) return;
        const idx = availableDates.indexOf(selected);
        if (idx !== -1) {
            currentDateIndex = idx;
            loadDateData(selected);
        } else {
            const nearest = availableDates.reduce((prev, curr) =>
                Math.abs(new Date(curr) - new Date(selected)) < Math.abs(new Date(prev) - new Date(selected)) ? curr : prev
            );
            const nearIdx = availableDates.indexOf(nearest);
            currentDateIndex = nearIdx;
            loadDateData(nearest);
            showToast(`${selected} 无数据，已跳转至最近的 ${nearest}`);
        }
    });

    bookSearchInput.addEventListener('input', () => {
        bookQuery = bookSearchInput.value.trim();
        if (currentCategory !== OVERVIEW_KEY) rerenderCurrentBooks();
    });

    bookSortSelect.addEventListener('change', () => {
        bookSort = bookSortSelect.value;
        if (currentCategory !== OVERVIEW_KEY) rerenderCurrentBooks();
    });

    bookFilters.addEventListener('click', ev => {
        const btn = ev.target.closest('.filter-btn');
        if (!btn) return;
        bookFilter = btn.dataset.filter || 'all';
        bookFilters.querySelectorAll('.filter-btn').forEach(el => {
            el.classList.toggle('active', el === btn);
        });
        if (currentCategory !== OVERVIEW_KEY) rerenderCurrentBooks();
    });

    function resetBookToolbar() {
        bookQuery = '';
        bookSort = 'rank';
        bookFilter = 'all';
        bookSearchInput.value = '';
        bookSortSelect.value = 'rank';
        bookFilters.querySelectorAll('.filter-btn').forEach(el => {
            el.classList.toggle('active', el.dataset.filter === 'all');
        });
    }

    fetch(`data/dates.json?${cacheBuster}`)
        .then(r => r.ok ? r.json() : Promise.reject('No dates.json'))
        .then(idx => {
            availableDates = idx.dates || [];
            if (availableDates.length > 0) {
                dateInput.min = availableDates[0];
                dateInput.max = availableDates[availableDates.length - 1];
            }
            return loadLatestData();
        })
        .catch(() => {
            console.warn('dates.json not found, falling back to latest only');
            loadLatestData();
        });

    fetch(`data/market_summary.json?${cacheBuster}`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null)
        .then(data => {
            marketSummaryData = data;
            if (allData && currentCategory === OVERVIEW_KEY) {
                renderOverview();
            }
        });

    function loadLatestData() {
        return fetch(`data/latest_ranks.json?${cacheBuster}`)
            .then(r => {
                if (!r.ok) throw new Error('Network error');
                return r.json();
            })
            .then(data => {
                allData = data;
                const latestDate = data.date;
                currentDateIndex = availableDates.indexOf(latestDate);
                if (currentDateIndex === -1) {
                    availableDates.push(latestDate);
                    availableDates.sort();
                    currentDateIndex = availableDates.indexOf(latestDate);
                }
                applyData(data);
            })
            .catch(err => {
                console.error(err);
                waterfall.innerHTML = '<p style="color:#f87171;padding:20px;">数据加载失败，请刷新重试。</p>';
                overviewPanel.innerHTML = '<p class="muted-line">数据加载失败，请刷新重试。</p>';
            });
    }

    function loadDateData(dateStr) {
        const fileDateStr = dateStr.replace(/-/g, '');
        const isLatest = currentDateIndex === availableDates.length - 1;

        if (isLatest) {
            loadLatestData();
            return;
        }

        waterfall.innerHTML = '<p style="color:var(--text-muted);padding:20px;">加载中...</p>';
        overviewPanel.innerHTML = '<p class="muted-line">加载中...</p>';

        const snapshotUrl = `data/fanqie_female_new_ranks_${fileDateStr}.json?${cacheBuster}`;
        const trendUrl = `data/trends/${dateStr}.json?${cacheBuster}`;
        const prevDate = currentDateIndex > 0 ? availableDates[currentDateIndex - 1] : null;
        const prevUrl = prevDate
            ? `data/fanqie_female_new_ranks_${prevDate.replace(/-/g, '')}.json?${cacheBuster}`
            : null;

        Promise.all([
            fetch(snapshotUrl).then(r => r.ok ? r.json() : Promise.reject('No snapshot')),
            fetch(trendUrl).then(r => r.ok ? r.json() : null).catch(() => null),
            prevUrl
                ? fetch(prevUrl).then(r => r.ok ? r.json() : null).catch(() => null)
                : Promise.resolve(null)
        ]).then(([snapshot, trendData, prevSnapshot]) => {
            const combined = {
                date: snapshot.date,
                prev_date: (prevSnapshot && prevSnapshot.date) || (trendData && trendData.prev_date) || '',
                categories: (snapshot.categories || []).map(cat => ({
                    name: cat.name,
                    trend: trendData && trendData.trends ? (trendData.trends[cat.name] || {}) : {},
                    books: (cat.books || []).map(book => Object.assign({}, book))
                }))
            };
            enrichHistoricalCategories(combined, prevSnapshot);
            combined.insights = computeInsights(combined);
            allData = combined;
            applyData(combined);
        }).catch(err => {
            console.error('Failed to load historical data:', err);
            const failedDate = availableDates[currentDateIndex];
            const nearest = findNearestAvailableDate(failedDate);
            if (nearest && nearest !== failedDate) {
                showToast(`${failedDate} 数据不可用，已跳转至 ${nearest}`);
                currentDateIndex = availableDates.indexOf(nearest);
                loadDateData(nearest);
            } else {
                waterfall.innerHTML = `<div class="empty-state">
                    <p>📭 该日期（${failedDate}）暂无数据</p>
                    <p class="empty-hint">可尝试切换到其他日期查看</p>
                </div>`;
                overviewPanel.innerHTML = `<div class="empty-state">
                    <p>📭 该日期（${failedDate}）暂无数据</p>
                </div>`;
                updateDateNav();
            }
        });
    }

    function findNearestAvailableDate(targetDate) {
        if (availableDates.length === 0) return null;
        return availableDates.reduce((prev, curr) =>
            Math.abs(new Date(curr) - new Date(targetDate)) < Math.abs(new Date(prev) - new Date(targetDate)) ? curr : prev
        );
    }

    function showToast(msg) {
        copyToast.textContent = msg;
        if (toastTimer) clearTimeout(toastTimer);
        copyToast.classList.add('show');
        toastTimer = setTimeout(() => {
            copyToast.classList.remove('show');
            copyToast.textContent = '书本信息已复制';
        }, 2500);
    }

    function applyData(data) {
        const prevInfo = data.prev_date ? ` (对比 ${data.prev_date})` : '';
        updateDate.textContent = `${data.date}${prevInfo}`;
        updateDateNav();

        const savedCategory = currentCategory;
        renderCategories();

        const categoryExists = savedCategory
            && savedCategory !== OVERVIEW_KEY
            && data.categories.some(c => c.name === savedCategory);
        if (categoryExists) {
            selectCategory(savedCategory, { keepToolbar: true });
            document.querySelectorAll('#category-list li').forEach(el => {
                el.classList.toggle('active', el.dataset.category === savedCategory);
            });
        } else {
            selectOverview();
            document.querySelectorAll('#category-list li').forEach(el => {
                el.classList.toggle('active', el.dataset.category === OVERVIEW_KEY);
            });
        }
    }

    function renderCategories() {
        categoryList.innerHTML = '';

        const overviewLi = document.createElement('li');
        overviewLi.dataset.category = OVERVIEW_KEY;
        overviewLi.className = 'cat-overview';
        const overviewName = document.createElement('span');
        overviewName.className = 'cat-name';
        overviewName.textContent = '全部分类';
        overviewLi.appendChild(overviewName);
        if (currentCategory === OVERVIEW_KEY) overviewLi.classList.add('active');
        overviewLi.addEventListener('click', () => {
            document.querySelectorAll('#category-list li').forEach(el => el.classList.remove('active'));
            overviewLi.classList.add('active');
            selectOverview();
            closeMobileSidebar();
        });
        categoryList.appendChild(overviewLi);

        allData.categories.forEach(cat => {
            const li = document.createElement('li');
            li.dataset.category = cat.name;

            const main = document.createElement('div');
            main.className = 'cat-row-main';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'cat-name';
            nameSpan.textContent = cat.name;
            main.appendChild(nameSpan);

            const growth = getCategoryGrowth(cat);
            if (growth) {
                const hint = document.createElement('span');
                hint.className = 'cat-hint' + (parseReads(growth) < 0 ? ' down' : '');
                hint.textContent = `阅读 ${growth}`;
                main.appendChild(hint);
            }
            li.appendChild(main);

            const trend = cat.trend || {};
            if (trend.new_count > 0) {
                const badge = document.createElement('span');
                badge.className = 'cat-badge new';
                badge.textContent = `+${trend.new_count}`;
                li.appendChild(badge);
            }

            if (currentCategory && cat.name === currentCategory) {
                li.classList.add('active');
            }

            li.addEventListener('click', () => {
                document.querySelectorAll('#category-list li').forEach(el => el.classList.remove('active'));
                li.classList.add('active');
                selectCategory(cat.name);
                closeMobileSidebar();
            });

            categoryList.appendChild(li);
        });
    }

    function getCategoryGrowth(cat) {
        const trend = cat.trend || {};
        if (typeof trend.reads_growth_total === 'number' && trend.reads_growth_total !== 0) {
            return formatReadsChange(trend.reads_growth_total);
        }
        const sum = (cat.books || []).reduce((acc, book) => acc + Number(book.reads_change || 0), 0);
        return sum ? formatReadsChange(sum) : '';
    }

    function selectOverview() {
        currentCategory = OVERVIEW_KEY;
        categoryTitle.textContent = '全部分类';
        mainContent.classList.add('is-overview');
        overviewPanel.hidden = false;
        categoryView.hidden = true;
        if (kpiStrip) kpiStrip.hidden = true;
        renderOverview();
    }

    function selectCategory(categoryName, options) {
        currentCategory = categoryName;
        categoryTitle.textContent = categoryName;
        mainContent.classList.remove('is-overview');
        overviewPanel.hidden = true;
        categoryView.hidden = false;
        if (kpiStrip) kpiStrip.hidden = true;
        const cat = allData.categories.find(c => c.name === categoryName);
        if (!cat) return;
        if (!options || !options.keepToolbar) resetBookToolbar();
        if (!options || !options.keepToolbar) window.scrollTo({ top: 0 });
        renderTrend(cat);
        renderMovers(cat);
        renderBooks(cat);
    }

    function rerenderCurrentBooks() {
        const cat = allData.categories.find(c => c.name === currentCategory);
        if (cat) renderBooks(cat);
    }

    function currentInsights() {
        const insights = allData && allData.insights;
        if (insights && (!insights.date || insights.date === allData.date)) return insights;
        return computeInsights(allData);
    }

    function renderKpis() {
        const insights = currentInsights();
        const kpis = (insights && insights.kpis) || {};
        const top = kpis.top_growth_book || {};
        const items = [
            { label: '在榜', value: String(kpis.book_count ?? '—'), hint: '当日在榜作品' },
            { label: '新上榜', value: String(kpis.new_count ?? '—'), hint: '较前日新增', tone: 'up' },
            { label: '掉榜', value: String(kpis.dropped_count ?? '—'), hint: '较前日掉出', tone: 'down' },
            { label: '阅读增量', value: formatReadsChange(kpis.reads_growth_total || 0), hint: '全部分类合计', tone: 'accent' },
            {
                label: '涨幅最大',
                value: top.growth_text || '—',
                hint: top.title ? `《${top.title}》 · ${top.category || ''}` : '暂无对比数据',
                tone: 'accent'
            }
        ];
        kpiStrip.innerHTML = items.map(item => `
            <article class="kpi-card${item.tone ? ` is-${item.tone}` : ''}">
                <span class="kpi-label">${escapeHtml(item.label)}</span>
                <strong class="kpi-value">${escapeHtml(item.value)}</strong>
                <small class="kpi-hint">${escapeHtml(item.hint)}</small>
            </article>
        `).join('');
    }

    function renderOverview() {
        if (!allData) return;
        const insights = currentInsights();
        const isLatest = currentDateIndex === availableDates.length - 1;
        const period = isLatest ? getMarketPeriod('7') : null;
        const genres = (period && period.hot_genres) || deriveHotGenres(insights);
        const types = (period && period.hot_types) || deriveHotTypes(insights);
        const themes = (period && period.hot_themes) || deriveHotThemes();
        const summary = (period && period.summary) || buildFallbackOverviewText(insights, genres, types, themes);
        const sourceLabel = period
            ? `${period.source === 'ai' ? 'AI 总结' : '规则统计'} · ${period.period || '近 7 日'}`
            : '按当日榜单统计';
        const kpis = insights.kpis || {};
        const themeShift = (insights.theme_shift && insights.theme_shift.up) || [];
        const risingThemes = themeShift.length ? themeShift : themes.slice(0, 8).map(item => ({ name: item.name, change: item.count }));
        const hotTypes = types.slice(0, 8);

        overviewPanel.innerHTML = `
            <article class="topic-brief">
                <div class="topic-brief-head">
                    <div>
                        <span class="panel-kicker">选题方向</span>
                        <p class="overview-summary">${escapeHtml(summary)}</p>
                        <small class="market-source">${escapeHtml(sourceLabel)}</small>
                    </div>
                    <div class="topic-stats">
                        <span>新上榜 <strong>${kpis.new_count ?? '—'}</strong></span>
                        <span>掉榜 <strong>${kpis.dropped_count ?? '—'}</strong></span>
                        <span>阅读增量 <strong>${escapeHtml(formatReadsChange(kpis.reads_growth_total || 0))}</strong></span>
                        <span>最热 <strong>${escapeHtml((kpis.hottest_category && kpis.hottest_category.name) || (hotTypes[0] && hotTypes[0].name) || '—')}</strong></span>
                    </div>
                </div>
                <div class="topic-row">
                    <span class="topic-label">上升题材</span>
                    <div class="theme-cloud">
                        ${risingThemes.length ? risingThemes.slice(0, 8).map(item => `
                            <span class="theme-chip" title="${item.change ? '较前一窗口 +' + item.change : '高频题材'}">
                                ${escapeHtml(item.name)}${item.change ? ` <small>+${item.change}</small>` : ''}
                            </span>
                        `).join('') : '<span class="muted-line">暂无题材变化</span>'}
                    </div>
                </div>
                <div class="topic-row">
                    <span class="topic-label">热门分类</span>
                    <div class="theme-cloud">
                        ${hotTypes.length ? hotTypes.map(item => `
                            <button type="button" class="theme-chip is-button" data-jump-category="${escapeAttr(item.name)}">
                                ${escapeHtml(item.name)}
                                <small>${escapeHtml(formatReadsChange(item.read_growth_total || item.reads_growth_total || 0))}</small>
                            </button>
                        `).join('') : '<span class="muted-line">暂无分类数据</span>'}
                    </div>
                </div>
            </article>
            <p class="waterfall-heading">封面速览 · 黑马、新上榜与阅读增量</p>
        `;

        overviewPanel.querySelectorAll('[data-jump-category]').forEach(el => {
            el.addEventListener('click', () => jumpToCategory(el.dataset.jumpCategory));
        });
        renderBooks({ name: '全部分类', books: collectTopicBooks(insights) });
    }

    function collectTopicBooks(insights) {
        const catalog = [];
        (allData.categories || []).forEach(cat => {
            (cat.books || []).forEach((book, index) => {
                catalog.push({ book, category: cat.name, index });
            });
        });
        const seen = new Set();
        const out = [];
        const add = (item, badge) => {
            if (!item || !item.title) return;
            const key = item.url || (item.title + '|' + (item.author || ''));
            if (seen.has(key)) return;
            seen.add(key);
            const hit = catalog.find(entry =>
                (item.url && entry.book.url === item.url) ||
                (entry.book.title === item.title && entry.book.author === item.author)
            );
            const base = hit ? { ...hit.book } : { ...item };
            out.push({
                ...base,
                ...item,
                cover: item.cover || base.cover,
                intro: base.intro || item.intro || '',
                topicBadge: badge,
                category: item.category || (hit && hit.category) || ''
            });
        };
        (insights.dark_horses || []).forEach(item => add(item, '黑马'));
        (insights.reads_growth_top || []).forEach(item => add(item, '增量'));
        (insights.new_entries || []).forEach(item => add(item, '新上榜'));
        (allData.categories || []).forEach(cat => {
            if (cat.books && cat.books[0]) add({ ...cat.books[0], category: cat.name }, '榜首');
        });
        return out;
    }

    function getMarketPeriod(key) {
        if (!marketSummaryData || !marketSummaryData.periods) return null;
        const item = marketSummaryData.periods[key];
        return item || null;
    }

    function deriveHotTypes(insights) {
        return (insights.category_board || [])
            .filter(item => Number(item.reads_growth_total || 0) > 0)
            .slice()
            .sort((a, b) => (b.reads_growth_total || 0) - (a.reads_growth_total || 0));
    }

    function deriveHotGenres(insights) {
        const typeMap = new Map((insights.category_board || []).map(item => [item.name, item]));
        return GENRE_GROUPS.map(group => {
            const matched = group.categories
                .map(name => typeMap.get(name))
                .filter(Boolean);
            const readGrowthTotal = matched.reduce((sum, item) => sum + Number(item.reads_growth_total || 0), 0);
            return {
                name: group.name,
                read_growth_total: readGrowthTotal,
                new_count: matched.reduce((sum, item) => sum + Number(item.new_count || 0), 0),
            };
        }).filter(item => item.read_growth_total > 0)
            .sort((a, b) => b.read_growth_total - a.read_growth_total);
    }

    function deriveHotThemes() {
        const scoreMap = new Map();
        (allData.categories || []).forEach(cat => {
            (cat.books || []).forEach(book => {
                extractThemes(book).forEach(name => {
                    const current = scoreMap.get(name) || { name, count: 0 };
                    current.count += 1;
                    scoreMap.set(name, current);
                });
            });
        });
        return Array.from(scoreMap.values()).sort((a, b) => b.count - a.count).slice(0, 14);
    }

    function buildFallbackOverviewText(insights, genres, types, themes) {
        const topGenres = genres.slice(0, 2).map(item => item.name).join('、');
        const topTypes = types.slice(0, 3).map(item => item.name).join('、');
        const topThemes = themes.slice(0, 6).map(item => item.name).join('、');
        const kpis = insights.kpis || {};
        const parts = [`当日在榜 ${kpis.book_count || 0} 本，新上榜 ${kpis.new_count || 0} 本，掉榜 ${kpis.dropped_count || 0} 本，阅读增量 ${formatReadsChange(kpis.reads_growth_total || 0)}。`];
        if (topGenres || topTypes) {
            parts.push(`${topGenres || topTypes} 增长更强，具体分类以 ${topTypes || '各类型'} 更集中。`);
        }
        if (topThemes) parts.push(`题材上 ${topThemes} 更高频。`);
        return parts.join('');
    }

    function renderBarList(items, labelFn, valueFn, textFn, options) {
        const list = (items || []).slice(0, 6);
        if (!list.length) return '<p class="muted-line">暂无数据。</p>';
        const max = Math.max(...list.map(item => Math.abs(valueFn(item))), 1);
        return `<div class="bar-list">${list.map((item, index) => {
            const label = labelFn(item);
            const value = valueFn(item);
            const pct = Math.max(2, Math.round(Math.abs(value) / max * 100));
            const tag = options && options.clickable
                ? `button type="button" class="bar-row is-button" data-jump-category="${escapeAttr(label)}"`
                : 'div class="bar-row"';
            const close = options && options.clickable ? 'button' : 'div';
            return `
                <${tag}>
                    <span class="bar-index">${index + 1}</span>
                    <span class="bar-label">${escapeHtml(label)}</span>
                    <span class="bar-track"><span class="bar-fill" style="width:${pct}%"></span></span>
                    <span class="bar-value">${escapeHtml(textFn(item))}</span>
                </${close}>
            `;
        }).join('')}</div>`;
    }

    function renderOverviewList(title, kicker, items, valueFn, metaFn) {
        const rows = (items || []).slice(0, 8);
        const body = rows.length ? rows.map(item => {
            const bookId = extractBookId(item.url);
            const href = bookId
                ? `book.html?id=${encodeURIComponent(bookId)}`
                : `book.html?title=${encodeURIComponent(item.title)}`;
            return `
                <a class="compact-row compact-row-link" href="${href}">
                    <div>
                        <strong>${escapeHtml(item.title)}</strong>
                        <small>${escapeHtml(metaFn(item) || '')}</small>
                    </div>
                    <span>${escapeHtml(valueFn(item) || '')}</span>
                </a>
            `;
        }).join('') : '<p class="muted-line">暂无明显信号。</p>';
        return `
            <article class="overview-card">
                <span class="panel-kicker">${escapeHtml(kicker)}</span>
                <h3>${escapeHtml(title)}</h3>
                <div class="compact-list">${body}</div>
            </article>
        `;
    }

    function renderCategoryBoard(board) {
        const rows = board || [];
        if (!rows.length) return '<p class="muted-line">暂无分类对比数据。</p>';
        const max = Math.max(...rows.map(item => Math.abs(Number(item.reads_growth_total || 0))), 1);
        return `
            <div class="category-board-head">
                <span>分类</span>
                <span>新上榜</span>
                <span>掉榜</span>
                <span>阅读增量</span>
            </div>
            ${rows.map(item => {
                const growth = Number(item.reads_growth_total || 0);
                const pct = Math.max(2, Math.round(Math.abs(growth) / max * 100));
                const riser = item.top_riser ? `领涨《${item.top_riser.title}》${item.top_riser.change}` : '';
                return `
                    <button type="button" class="category-board-row" data-jump-category="${escapeAttr(item.name)}">
                        <span class="board-name">
                            <strong>${escapeHtml(item.name)}</strong>
                            <small>${escapeHtml(riser)}</small>
                        </span>
                        <span class="board-new">${item.new_count || 0}</span>
                        <span class="board-drop">${item.dropped_count || 0}</span>
                        <span class="board-growth">
                            <span class="bar-track"><span class="bar-fill" style="width:${pct}%"></span></span>
                            <em>${escapeHtml(formatReadsChange(growth))}</em>
                        </span>
                    </button>
                `;
            }).join('')}
        `;
    }

    function jumpToCategory(name) {
        if (!name || !allData.categories.some(cat => cat.name === name)) return;
        document.querySelectorAll('#category-list li').forEach(el => {
            el.classList.toggle('active', el.dataset.category === name);
        });
        selectCategory(name);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function renderTrend(cat) {
        const trend = cat.trend || {};
        const summary = trend.summary || '';
        if (!summary) {
            aiContent.innerHTML = '<span class="ai-loading">暂无分析数据</span>';
            return;
        }
        aiContent.innerHTML = renderMarkdown(summary);
    }

    function renderMovers(cat) {
        const trend = cat.trend || {};
        const books = cat.books || [];
        const newBooks = books.filter(book => book.is_new)
            .map(book => book.title)
            .concat((trend.new_books || []).filter(title => !books.some(book => book.is_new && book.title === title)));
        const uniqueNew = Array.from(new Set(newBooks));
        const risers = (trend.rank_changes || [])
            .filter(item => item.change > 0)
            .map(item => ({ title: item.title, change: `+${item.change}` }));
        const fallers = (trend.rank_changes || [])
            .filter(item => item.change < 0)
            .map(item => ({ title: item.title, change: String(item.change) }));
        const displayRisers = risers.length ? risers : (trend.top_risers || []);
        const displayFallers = fallers.length ? fallers : (trend.top_fallers || []);
        const growth = books
            .filter(book => Number(book.reads_change || 0) !== 0)
            .sort((a, b) => Number(b.reads_change || 0) - Number(a.reads_change || 0))
            .map(book => ({ title: book.title, growth: book.reads_change_text }));
        const displayGrowth = growth.length ? growth : (trend.reads_growth || []);

        const groups = [
            { title: '新上榜', items: uniqueNew.map(title => ({ title, value: 'NEW' })), tone: 'new' },
            { title: '上涨', items: displayRisers.map(item => ({ title: item.title, value: item.change })), tone: 'up' },
            { title: '下跌', items: displayFallers.map(item => ({ title: item.title, value: item.change })), tone: 'down' },
            { title: '阅读增量', items: displayGrowth.map(item => ({ title: item.title, value: item.growth })), tone: 'accent' },
        ];

        moversPanel.innerHTML = groups.map(group => `
            <div class="mover-col">
                <h4>${escapeHtml(group.title)} <small>${group.items.length}</small></h4>
                <div class="mover-chips">
                    ${group.items.length ? group.items.slice(0, 3).map(item => `
                        <span class="mover-chip ${group.tone}">
                            <em>${escapeHtml(item.title)}</em>
                            <strong>${escapeHtml(item.value)}</strong>
                        </span>
                    `).join('') : '<span class="muted-line">暂无</span>'}
                </div>
            </div>
        `).join('');
    }

    function renderMarkdown(text) {
        let html = escapeHtml(text);
        html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:1.05rem; margin:1em 0 0.5em; color:var(--text-primary);">$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2 style="font-size:1.15rem; margin:1em 0 0.5em; color:var(--text-primary);">$1</h2>');
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        html = html.replace(/《(.+?)》/g, '<span style="color:var(--accent);font-weight:500">《$1》</span>');
        html = html.replace(/^[-*] (.+)$/gm, '<span style="display:block;padding-left:1em;text-indent:-0.6em">• $1</span>');
        html = html.replace(/^(\d+)\. (.+)$/gm, '<span style="display:block;padding-left:1em;text-indent:-0.6em">$1. $2</span>');
        return html;
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');
    }

    function renderBooks(cat) {
        waterfall.innerHTML = '';
        const books = getFilteredBooks(cat);

        if ((cat.books || []).length === 0) {
            waterfall.innerHTML = '<p style="color:var(--text-muted);padding:20px;">该分类暂无书籍。</p>';
            return;
        }

        if (books.length === 0) {
            waterfall.innerHTML = '<p style="color:var(--text-muted);padding:20px;">没有符合筛选条件的作品。</p>';
            return;
        }

        const fragment = document.createDocumentFragment();

        books.forEach(book => {
            const rank = book.rank || 0;
            const card = document.createElement('a');
            const bookId = extractBookId(book.url);
            card.href = bookId ? `book.html?id=${encodeURIComponent(bookId)}` : 'javascript:void(0)';
            card.rel = 'noopener';
            card.className = 'book-card';

            let rankCls = '';
            if (rank === 1) rankCls = 'rank-1';
            else if (rank === 2) rankCls = 'rank-2';
            else if (rank === 3) rankCls = 'rank-3';

            let changeHtml = '';
            if (book.topicBadge) {
                changeHtml = `<span class="book-change topic">${escapeHtml(book.topicBadge)}</span>`;
            } else if (book.is_new) {
                changeHtml = '<span class="book-change new">NEW</span>';
            } else if (book.rank_change > 0) {
                changeHtml = `<span class="book-change up">↑+${book.rank_change}</span>`;
            } else if (book.rank_change < 0) {
                changeHtml = `<span class="book-change down">↓${Math.abs(book.rank_change)}</span>`;
            }

            const coverHtml = book.cover
                ? `<div class="book-cover"><img src="${book.cover}" alt="${escapeAttr(book.title)}" loading="lazy"></div>`
                : `<div class="book-cover"><div class="no-cover">暂无封面</div></div>`;

            const readsChange = book.reads_change_text
                ? `<span class="book-reads-change${Number(book.reads_change) < 0 ? ' down' : ''}">${escapeHtml(book.reads_change_text)}</span>`
                : '';
            const daysText = book.days_on_list
                ? `<span class="book-days">在榜 ${book.days_on_list} 日</span>`
                : '';
            const themes = extractThemes(book, 3);
            const themeHtml = themes.length
                ? `<div class="book-themes">${themes.map(name => `<span class="theme-chip tight">${escapeHtml(name)}</span>`).join('')}</div>`
                : '';

            card.innerHTML = `
                <span class="book-rank ${rankCls}">${rank}</span>
                ${changeHtml}
                ${coverHtml}
                <div class="book-info">
                    <h3 class="book-title" title="${escapeAttr(book.title)}">${escapeHtml(book.title)}</h3>
                    <div class="book-meta">
                        <span class="book-author">${escapeHtml(book.author)}${book.category && currentCategory === OVERVIEW_KEY ? ' · ' + escapeHtml(book.category) : ''}</span>
                        <span class="book-reads-wrap">
                            <span class="book-reads">${escapeHtml(book.reads)}</span>
                            ${readsChange}
                        </span>
                    </div>
                    ${daysText}
                    ${themeHtml}
                    <p class="book-intro">${escapeHtml(book.intro)}</p>
                    <button class="book-copy-btn" type="button">复制信息</button>
                </div>
            `;

            const copyBtn = card.querySelector('.book-copy-btn');
            copyBtn.addEventListener('click', (e) => copyBookInfo(e, book));

            fragment.appendChild(card);
        });

        waterfall.appendChild(fragment);
    }

    function getFilteredBooks(cat) {
        const fallbackMap = buildPrevRankMap(cat.name);
        let books = (cat.books || []).map((book, index) => normalizeBook(book, index, fallbackMap));

        if (bookFilter === 'new') {
            books = books.filter(book => book.is_new);
        } else if (bookFilter === 'up') {
            books = books.filter(book => !book.is_new && book.rank_change > 0);
        } else if (bookFilter === 'down') {
            books = books.filter(book => !book.is_new && book.rank_change < 0);
        }

        if (bookQuery) {
            const q = bookQuery.toLowerCase();
            books = books.filter(book =>
                String(book.title || '').toLowerCase().includes(q)
                || String(book.author || '').toLowerCase().includes(q)
            );
        }

        const sorters = {
            rank: (a, b) => (a.rank || 0) - (b.rank || 0),
            rank_change: (a, b) => (b.rank_change || 0) - (a.rank_change || 0) || (a.rank || 0) - (b.rank || 0),
            reads_change: (a, b) => (b.reads_change || 0) - (a.reads_change || 0) || (a.rank || 0) - (b.rank || 0),
            reads: (a, b) => (b.reads_value || 0) - (a.reads_value || 0) || (a.rank || 0) - (b.rank || 0),
        };
        books.sort(sorters[bookSort] || sorters.rank);
        return books;
    }

    function normalizeBook(book, index, fallbackMap) {
        const next = Object.assign({}, book);
        next.rank = next.rank || (index + 1);
        next.reads_value = typeof next.reads_value === 'number' ? next.reads_value : parseReads(next.reads);
        next.reads_change = Number(next.reads_change || 0);
        if (typeof next.is_new === 'boolean' || typeof next.rank_change === 'number') {
            next.is_new = Boolean(next.is_new);
            next.rank_change = Number(next.rank_change || 0);
            return next;
        }
        const change = fallbackMap[next.title];
        if (change === 'new') {
            next.is_new = true;
            next.rank_change = 0;
        } else if (change) {
            next.is_new = false;
            next.rank_change = Number(String(change).replace('+', '')) || 0;
        } else {
            next.is_new = false;
            next.rank_change = 0;
        }
        return next;
    }

    function buildPrevRankMap(categoryName) {
        const cat = allData.categories.find(c => c.name === categoryName);
        if (!cat || !cat.trend) return {};

        const map = {};
        (cat.trend.new_books || []).forEach(title => {
            map[title] = 'new';
        });
        (cat.trend.top_risers || []).forEach(r => {
            map[r.title] = r.change;
        });
        (cat.trend.top_fallers || []).forEach(f => {
            map[f.title] = f.change;
        });
        (cat.trend.rank_changes || []).forEach(item => {
            if (item.change > 0) map[item.title] = `+${item.change}`;
            else if (item.change < 0) map[item.title] = String(item.change);
        });
        return map;
    }

    function enrichHistoricalCategories(data, prevSnapshot) {
        const prevIndex = {};
        if (prevSnapshot && prevSnapshot.categories) {
            prevSnapshot.categories.forEach(cat => {
                const urlMap = {};
                (cat.books || []).forEach((book, i) => {
                    if (!book.url) return;
                    urlMap[book.url] = { rank: i + 1, reads: book.reads };
                });
                prevIndex[cat.name] = urlMap;
            });
        }

        data.categories.forEach(cat => {
            const prevUrls = prevIndex[cat.name];
            let growthTotal = 0;
            const rankChanges = [];
            (cat.books || []).forEach((book, i) => {
                book.rank = i + 1;
                book.reads_value = parseReads(book.reads);
                if (prevUrls) {
                    const prev = prevUrls[book.url];
                    if (prev) {
                        book.prev_rank = prev.rank;
                        book.rank_change = prev.rank - book.rank;
                        book.is_new = false;
                        const prevReads = parseReads(prev.reads);
                        if (book.reads_value > 0 && prevReads > 0) {
                            book.reads_change = book.reads_value - prevReads;
                            book.reads_change_text = book.reads_change !== 0 ? formatReadsChange(book.reads_change) : '';
                            growthTotal += book.reads_change;
                        } else {
                            book.reads_change = 0;
                            book.reads_change_text = '';
                        }
                        if (book.rank_change !== 0) {
                            rankChanges.push({ title: book.title, change: book.rank_change });
                        }
                    } else {
                        book.prev_rank = null;
                        book.rank_change = 0;
                        book.is_new = true;
                        book.reads_change = 0;
                        book.reads_change_text = '';
                    }
                } else {
                    const fallback = buildTrendFallback(cat.trend, book.title);
                    book.prev_rank = fallback.prev_rank;
                    book.rank_change = fallback.rank_change;
                    book.is_new = fallback.is_new;
                    book.reads_change = fallback.reads_change;
                    book.reads_change_text = fallback.reads_change_text;
                    growthTotal += book.reads_change;
                    if (book.rank_change) rankChanges.push({ title: book.title, change: book.rank_change });
                }
            });
            cat.trend = cat.trend || {};
            if (typeof cat.trend.reads_growth_total !== 'number') {
                cat.trend.reads_growth_total = growthTotal;
            }
            if (!Array.isArray(cat.trend.rank_changes) || !cat.trend.rank_changes.length) {
                cat.trend.rank_changes = rankChanges.sort((a, b) => b.change - a.change);
            }
        });
    }

    function buildTrendFallback(trend, title) {
        const result = { prev_rank: null, rank_change: 0, is_new: false, reads_change: 0, reads_change_text: '' };
        if (!trend) return result;
        if ((trend.new_books || []).includes(title)) {
            result.is_new = true;
            return result;
        }
        const riser = (trend.top_risers || []).find(item => item.title === title);
        const faller = (trend.top_fallers || []).find(item => item.title === title);
        const growth = (trend.reads_growth || []).find(item => item.title === title);
        if (riser) result.rank_change = Number(String(riser.change).replace('+', '')) || 0;
        if (faller) result.rank_change = Number(String(faller.change).replace('+', '')) || 0;
        if (growth) {
            result.reads_change = parseReads(growth.growth);
            result.reads_change_text = growth.growth;
        }
        return result;
    }

    function computeInsights(data) {
        const categories = (data && data.categories) || [];
        let bookCount = 0;
        let newCount = 0;
        let droppedCount = 0;
        let readsGrowthTotal = 0;
        let topGrowthBook = null;
        let hottest = null;
        const darkHorses = [];
        const newEntries = [];
        const growthBooks = [];
        const categoryBoard = [];

        categories.forEach(cat => {
            const trend = cat.trend || {};
            const books = cat.books || [];
            bookCount += books.length;
            newCount += Number(trend.new_count || 0);
            droppedCount += Number(trend.dropped_count || 0);
            const catGrowth = books.reduce((sum, book) => sum + Number(book.reads_change || 0), 0)
                || Number(trend.reads_growth_total || 0);
            readsGrowthTotal += catGrowth;
            const risers = trend.top_risers || [];
            categoryBoard.push({
                name: cat.name,
                new_count: Number(trend.new_count || 0),
                dropped_count: Number(trend.dropped_count || 0),
                reads_growth_total: catGrowth,
                top_riser: risers[0] || null,
            });
            if (!hottest || catGrowth > hottest.reads_growth_total) {
                hottest = { name: cat.name, reads_growth_total: catGrowth };
            }
            books.forEach(book => {
                const payload = {
                    title: book.title,
                    author: book.author,
                    category: cat.name,
                    rank: book.rank,
                    reads: book.reads,
                    reads_value: book.reads_value || parseReads(book.reads),
                    reads_change: Number(book.reads_change || 0),
                    reads_change_text: book.reads_change_text || '',
                    url: book.url,
                    cover: book.cover,
                };
                if (payload.reads_change !== 0) {
                    growthBooks.push(payload);
                    if (!topGrowthBook || payload.reads_change > topGrowthBook.reads_change) {
                        topGrowthBook = payload;
                    }
                }
                if (!book.is_new && (book.rank || 0) > 5 && payload.reads_change > 0) {
                    darkHorses.push(payload);
                }
                if (book.is_new) newEntries.push(payload);
            });
        });

        darkHorses.sort((a, b) => b.reads_change - a.reads_change);
        newEntries.sort((a, b) => (b.reads_value || 0) - (a.reads_value || 0));
        growthBooks.sort((a, b) => b.reads_change - a.reads_change);

        return {
            date: data.date,
            prev_date: data.prev_date,
            kpis: {
                book_count: bookCount,
                new_count: newCount,
                dropped_count: droppedCount,
                reads_growth_total: readsGrowthTotal,
                top_growth_book: topGrowthBook ? {
                    title: topGrowthBook.title,
                    category: topGrowthBook.category,
                    growth_text: topGrowthBook.reads_change_text || formatReadsChange(topGrowthBook.reads_change),
                    reads_change: topGrowthBook.reads_change,
                } : null,
                hottest_category: hottest,
            },
            dark_horses: darkHorses.slice(0, 8),
            new_entries: newEntries.slice(0, 10),
            reads_growth_top: growthBooks.slice(0, 10),
            theme_shift: { up: [], down: [] },
            category_board: categoryBoard,
        };
    }

    function extractThemes(book, limit) {
        const source = `${book.title || ''} ${book.intro || ''}`;
        if (!source) return [];
        const hits = [];
        const sorted = MARKET_KEYWORDS.slice().sort((a, b) => b.length - a.length);
        sorted.forEach(keyword => {
            if (source.includes(keyword)) hits.push(keyword);
        });
        return typeof limit === 'number' ? hits.slice(0, limit) : hits;
    }

    function escapeAttr(str) {
        return String(str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function extractBookId(url) {
        const match = String(url || '').match(/\/page\/(\d+)/);
        return match ? match[1] : '';
    }

    function parseReads(reads) {
        const raw = String(reads || '').replace(/,/g, '').replace(/^\+/, '').trim();
        const num = parseFloat(raw);
        if (Number.isNaN(num)) return 0;
        return raw.includes('万') ? num * 10000 : num;
    }

    function formatReadsChange(diff) {
        const value = Number(diff || 0);
        if (!value) return '0';
        const sign = value > 0 ? '+' : '';
        if (Math.abs(value) >= 10000) return `${sign}${(value / 10000).toFixed(1)}万`;
        return `${sign}${Math.round(value)}`;
    }
});
