(() => {
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    /* ---------------------------------------------------------------
       Navigation: mobile menu, active section, scroll progress
       --------------------------------------------------------------- */
    function initNav() {
        const toggle = $('.nav__toggle');
        const menu = $('#menu');
        if (toggle && menu) {
            toggle.addEventListener('click', () => {
                const open = menu.classList.toggle('is-open');
                toggle.setAttribute('aria-expanded', String(open));
            });
            $$('a', menu).forEach((link) => link.addEventListener('click', () => {
                menu.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
            }));

            const links = $$('a[href^="#"]', menu);
            const sections = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
            const hero = $('#top');
            if (hero) sections.push(hero);
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) return;
                        links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`));
                    });
                }, { rootMargin: '-45% 0px -50% 0px' });
                sections.forEach((section) => observer.observe(section));
            }
        }

        const bar = $('.progress');
        if (bar) {
            let ticking = false;
            const update = () => {
                const max = document.documentElement.scrollHeight - window.innerHeight;
                bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
                ticking = false;
            };
            window.addEventListener('scroll', () => {
                if (!ticking) { requestAnimationFrame(update); ticking = true; }
            }, { passive: true });
            update();
        }
    }

    /* ---------------------------------------------------------------
       Pointer tilt: hero stage and illustrations lean toward the cursor
       --------------------------------------------------------------- */
    function initTilt() {
        if (reduceMotion || !finePointer) return;

        const hero = $('#top');
        const stage = $('#stage');
        if (hero && stage) {
            hero.addEventListener('pointermove', (e) => {
                const r = hero.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - 0.5;
                const y = (e.clientY - r.top) / r.height - 0.5;
                stage.style.transform = `perspective(1100px) rotateY(${x * 7}deg) rotateX(${-y * 6}deg)`;
            });
            hero.addEventListener('pointerleave', () => { stage.style.transform = ''; });
        }

        $$('.tilt').forEach((el) => {
            el.addEventListener('pointermove', (e) => {
                const r = el.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - 0.5;
                const y = (e.clientY - r.top) / r.height - 0.5;
                el.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.015)`;
            });
            el.addEventListener('pointerleave', () => { el.style.transform = ''; });
        });
    }

    /* ---------------------------------------------------------------
       Hero demo: a beam scans a sample report, fields turn into JSON
       --------------------------------------------------------------- */
    function initDemo() {
        const out = $('#jsonOut');
        const status = $('#jsonStatus');
        const replay = $('#replay');
        const scan = $('#scan');
        const fields = $$('.fld');
        if (!out || !fields.length) return;

        const STEP = 480;
        const FIX = 420;
        const items = fields.map((el) => ({
            el,
            original: el.textContent,
            key: el.dataset.key,
            value: el.dataset.json,
            fix: el.dataset.fix || null,
        }));
        const fixCount = items.filter((i) => i.fix).length;
        let runId = 0;

        const formatValue = (v) => (v.startsWith('"')
            ? `<span class="j-str">${escapeHtml(v)}</span>`
            : `<span class="j-num">${escapeHtml(v)}</span>`);

        function render(count) {
            const lines = items.slice(0, count).map((item, i) =>
                `  <span class="j-key">"${item.key}"</span>: ${formatValue(item.value)}${i < count - 1 ? ',' : ''}`);
            out.innerHTML = `{\n${lines.length ? lines.join('\n') + '\n' : ''}}`;
        }

        function reset() {
            items.forEach((item) => {
                item.el.classList.remove('is-hit');
                item.el.textContent = item.original;
            });
            status.textContent = '';
            scan?.classList.remove('is-scanning');
            render(0);
        }

        const finish = () => {
            status.textContent = `${fixCount} OCR fixes applied, all values passed range checks`;
        };

        async function run() {
            const id = ++runId;
            reset();

            if (reduceMotion) {
                items.forEach((item) => {
                    item.el.classList.add('is-hit');
                    if (item.fix) item.el.textContent = item.fix;
                });
                render(items.length);
                finish();
                return;
            }

            if (scan) {
                void scan.offsetWidth; // restart the CSS animation
                scan.style.setProperty('--beam', `${items.length * STEP + fixCount * FIX + 300}ms`);
                scan.classList.add('is-scanning');
            }

            for (let i = 0; i < items.length; i++) {
                await sleep(STEP);
                if (id !== runId) return;
                const item = items[i];
                item.el.classList.add('is-hit');
                if (item.fix) {
                    await sleep(FIX);
                    if (id !== runId) return;
                    item.el.textContent = item.fix;
                }
                render(i + 1);
            }
            finish();
        }

        replay?.addEventListener('click', run);
        setTimeout(run, 600);
    }

    /* ---------------------------------------------------------------
       Extractor playground: a small rule-based parser, live
       --------------------------------------------------------------- */
    function initPlayground() {
        const input = $('#pgInput');
        const mirror = $('#pgMirror');
        const json = $('#pgJson');
        const notes = $('#pgNotes');
        if (!input || !mirror || !json || !notes) return;

        const DEFAULT_TEXT = [
            'Sample ID: WQ-0417',
            'Collected: 14 Oct 2025',
            'pH 7.42',
            'Turbidity 3.8 NTU',
            'Dissolved O2 8.1 mg/L',
            'Nitrate 1.9 mg/L',
        ].join('\n');

        const LOOK = { O: '0', o: '0', l: '1', I: '1', Z: '2', S: '5', B: '8' };
        const REVERSE = { 0: 'O', 1: 'l', 2: 'Z', 5: 'S', 8: 'B' };
        const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

        const hasLookalike = (s) => /[OolIZSB]/.test(s);
        const repair = (s) => s.replace(/[OolIZSB]/g, (c) => LOOK[c]).replace(',', '.');
        const isNumeric = (t) => /^[0-9OolIZSB]+(?:[.,][0-9OolIZSB]+)?$/.test(t) && /[0-9]/.test(t);
        const snake = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

        function parse(text) {
            const fields = [];
            const warnings = [];
            let offset = 0;

            text.split('\n').forEach((line) => {
                const lineStart = offset;
                offset += line.length + 1;
                if (!line.trim()) return;

                const colon = line.indexOf(':');
                const label = colon > 0 ? line.slice(0, colon).trim() : null;
                const restStart = colon > 0 ? colon + 1 : 0;
                const rest = line.slice(restStart);

                const tokens = [];
                const re = /\S+/g;
                let m;
                while ((m = re.exec(rest))) tokens.push({ t: m[0], s: restStart + m.index });
                if (!tokens.length) return;

                // dates first, so "14 Oct 2025" is not read as the number 2025
                if (label) {
                    const trimmed = rest.trim();
                    const lead0 = rest.length - rest.trimStart().length;
                    const dStart = lineStart + restStart + lead0;
                    const dmy0 = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3})[A-Za-z]*\.?\s+(\d{4})$/);
                    if (dmy0 && MONTHS[dmy0[2].toLowerCase()]) {
                        const iso = `${dmy0[3]}-${String(MONTHS[dmy0[2].toLowerCase()]).padStart(2, '0')}-${dmy0[1].padStart(2, '0')}`;
                        fields.push({ key: snake(label), value: iso, kind: 'date', raw: trimmed, shown: iso, fixed: false, start: dStart, end: dStart + trimmed.length });
                        return;
                    }
                    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
                        fields.push({ key: snake(label), value: trimmed, kind: 'date', raw: trimmed, shown: trimmed, fixed: false, start: dStart, end: dStart + trimmed.length });
                        return;
                    }
                }

                // numeric value: last token, or the one before a trailing unit
                let valueIdx = -1;
                const last = tokens.length - 1;
                if (isNumeric(tokens[last].t)) valueIdx = last;
                else if (last >= 1 && isNumeric(tokens[last - 1].t) && /^[A-Za-z%°/]/.test(tokens[last].t)) valueIdx = last - 1;

                if (valueIdx >= 0) {
                    const name = label || tokens.slice(0, valueIdx).map((t) => t.t).join(' ');
                    if (!name) return;
                    const valueTok = tokens[valueIdx];
                    const unit = tokens[valueIdx + 1] ? tokens[valueIdx + 1].t : null;
                    const value = parseFloat(repair(valueTok.t));
                    if (Number.isNaN(value)) return;
                    const field = {
                        key: snake(name) + (unit ? `_${snake(unit)}` : ''),
                        value,
                        kind: 'number',
                        raw: valueTok.t,
                        shown: String(value),
                        fixed: hasLookalike(valueTok.t),
                        start: lineStart + valueTok.s,
                        end: lineStart + valueTok.s + valueTok.t.length,
                    };
                    if (snake(name) === 'ph' && (value < 0 || value > 14)) {
                        warnings.push(`pH should be between 0 and 14, so ${value} needs a human look.`);
                    }
                    fields.push(field);
                    return;
                }

                if (label) {
                    const lead = rest.length - rest.trimStart().length;
                    const text2 = rest.trim();
                    if (!text2) return;
                    const start = lineStart + restStart + lead;
                    const end = start + text2.length;
                    const key = snake(label);

                    const id = text2.match(/^([A-Za-z]{1,6}[-_]?)([0-9OolIZSB]{2,})$/);
                    if (id) {
                        const repaired = id[1] + repair(id[2]);
                        fields.push({ key, value: repaired, kind: 'id', raw: text2, shown: repaired, fixed: repaired !== text2, start, end });
                        return;
                    }
                    const dmy = text2.match(/^(\d{1,2})\s+([A-Za-z]{3})[A-Za-z]*\.?\s+(\d{4})$/);
                    if (dmy && MONTHS[dmy[2].toLowerCase()]) {
                        const iso = `${dmy[3]}-${String(MONTHS[dmy[2].toLowerCase()]).padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
                        fields.push({ key, value: iso, kind: 'date', raw: text2, shown: iso, fixed: false, start, end });
                        return;
                    }
                    if (/^\d{4}-\d{2}-\d{2}$/.test(text2)) {
                        fields.push({ key, value: text2, kind: 'date', raw: text2, shown: text2, fixed: false, start, end });
                        return;
                    }
                    fields.push({ key, value: text2, kind: 'text', raw: text2, shown: text2, fixed: false, start, end });
                }
            });

            return { fields, warnings };
        }

        function render() {
            const text = input.value;
            const { fields, warnings } = parse(text);

            // highlight layer behind the textarea
            const ranges = fields.map((f) => ({ start: f.start, end: f.end, fixed: f.fixed })).sort((a, b) => a.start - b.start);
            let html = '';
            let cursor = 0;
            ranges.forEach((r) => {
                if (r.start < cursor) return;
                html += escapeHtml(text.slice(cursor, r.start));
                html += `<mark class="${r.fixed ? 'pg-fixed' : 'pg-hit'}">${escapeHtml(text.slice(r.start, r.end))}</mark>`;
                cursor = r.end;
            });
            html += escapeHtml(text.slice(cursor)) + '\n ';
            mirror.innerHTML = html;

            // JSON output
            const seen = new Map();
            const lines = fields.map((f) => {
                let key = f.key || 'field';
                const n = (seen.get(key) || 0) + 1;
                seen.set(key, n);
                if (n > 1) key = `${key}_${n}`;
                const literal = typeof f.value === 'number' ? String(f.value) : JSON.stringify(f.value);
                const cls = typeof f.value === 'number' ? 'j-num' : 'j-str';
                return `  <span class="j-key">"${escapeHtml(key)}"</span>: <span class="${cls}">${escapeHtml(literal)}</span>`;
            });
            json.innerHTML = lines.length ? `{\n${lines.join(',\n')}\n}` : '{\n}';

            // notes
            notes.innerHTML = '';
            const addNote = (message, warn) => {
                const li = document.createElement('li');
                li.textContent = message;
                if (warn) li.className = 'is-warn';
                notes.appendChild(li);
            };
            fields.filter((f) => f.fixed).forEach((f) => addNote(`Read "${f.raw}" as ${f.shown}`));
            warnings.forEach((w) => addNote(w, true));
            if (!fields.length) addNote('No fields found yet. Try a line like "Nitrate 1.9 mg/L" or "Sample ID: WQ-0417".', true);
            else if (!notes.children.length) addNote('Every value read cleanly. Press the garble button to break a few.');

            // grow the textarea so the highlight layer stays aligned
            input.style.height = 'auto';
            input.style.height = `${input.scrollHeight}px`;
        }

        function garble() {
            const { fields } = parse(input.value);
            let text = input.value;
            const targets = fields.filter((f) => f.kind === 'number' || f.kind === 'id').sort((a, b) => b.start - a.start);
            let changed = false;
            targets.forEach((f) => {
                const seg = text.slice(f.start, f.end);
                let out = seg.replace(/[0-9]/g, (c) => (REVERSE[c] && Math.random() < 0.45 ? REVERSE[c] : c));
                if (!/[0-9]/.test(out)) out = seg; // keep one real digit so the value stays readable
                if (out !== seg) changed = true;
                text = text.slice(0, f.start) + out + text.slice(f.end);
            });
            if (!changed) {
                for (const f of targets) {
                    const seg = text.slice(f.start, f.end);
                    const idx = [...seg].findIndex((c) => REVERSE[c]);
                    if (idx >= 0) {
                        text = text.slice(0, f.start) + seg.slice(0, idx) + REVERSE[seg[idx]] + seg.slice(idx + 1) + text.slice(f.end);
                        break;
                    }
                }
            }
            input.value = text;
            render();
        }

        input.value = DEFAULT_TEXT;
        input.addEventListener('input', render);
        $('#pgGarble')?.addEventListener('click', garble);
        $('#pgReset')?.addEventListener('click', () => { input.value = DEFAULT_TEXT; render(); });
        window.addEventListener('resize', render);
        render();
    }

    /* ---------------------------------------------------------------
       Skill filter: dims roles and projects that don't use the skill
       --------------------------------------------------------------- */
    function initFilter() {
        const chips = $('#filterChips');
        const count = $('#filterCount');
        if (!chips) return;

        const skills = [
            ['all', 'All'],
            ['java', 'Java'],
            ['python', 'Python'],
            ['llm', 'LLMs and agents'],
            ['ml', 'ML'],
            ['cloud', 'Cloud and DevOps'],
            ['data', 'Data and SQL'],
            ['web', 'Web'],
        ];
        const roles = $$('.role[data-tags]');
        const projects = $$('.feature[data-tags], .early__item[data-tags]');

        const apply = (key) => {
            const matches = (el) => key === 'all' || el.dataset.tags.split(' ').includes(key);
            [...roles, ...projects].forEach((el) => el.classList.toggle('is-dim', !matches(el)));
            $$('.fchip', chips).forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.key === key)));
            if (count) {
                count.textContent = key === 'all'
                    ? ''
                    : `${roles.filter(matches).length} roles, ${projects.filter(matches).length} projects`;
            }
        };

        skills.forEach(([key, label]) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'fchip';
            button.dataset.key = key;
            button.textContent = label;
            button.addEventListener('click', () => apply(key));
            chips.appendChild(button);
        });
        apply('all');
    }

    /* ---------------------------------------------------------------
       Reveal: headings get a marker swipe, numbers get boxed and count up
       --------------------------------------------------------------- */
    function countUp(el) {
        const finalText = el.textContent;
        const m = finalText.match(/[\d,]+(?:\.\d+)?/);
        if (!m) return;
        const target = parseFloat(m[0].replace(/,/g, ''));
        const decimals = (m[0].split('.')[1] || '').length;
        const grouped = m[0].includes(',');
        const duration = 900;
        const start = performance.now();
        el.style.minWidth = `${el.getBoundingClientRect().width}px`;

        function tick(now) {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            const v = target * eased;
            let s = decimals ? v.toFixed(decimals) : String(Math.round(v));
            if (grouped) s = Number(s).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
            el.textContent = finalText.replace(m[0], s);
            if (p < 1) requestAnimationFrame(tick);
            else el.textContent = finalText;
        }
        requestAnimationFrame(tick);
    }

    function initReveal() {
        const targets = $$('.role, .feature, .band h2');
        targets.forEach((el) => el.classList.add('reveal'));
        if (reduceMotion || !('IntersectionObserver' in window)) {
            targets.forEach((el) => el.classList.add('is-seen'));
            return;
        }
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                el.classList.add('is-seen');
                $$('.hit', el).forEach((hit, i) => setTimeout(() => countUp(hit), 250 + i * 120));
                observer.unobserve(el);
            });
        }, { threshold: 0.25 });
        targets.forEach((el) => observer.observe(el));
    }

    /* ---------------------------------------------------------------
       Questions people ask: written answers, shown as a chat
       --------------------------------------------------------------- */
    function initAsk() {
        const chips = $('#askChips');
        const thread = $('#askThread');
        if (!chips || !thread) return;

        const qa = [
            {
                q: 'What did you build at 365 Retail Markets?',
                a: 'LangChain AI agents and an MCP server that lets an LLM call tools, taken from prototype to production in agile sprints. I also shipped Java microservices that process 10,000+ daily vending transactions (throughput up 30%, API response time down 22%) and tuned PostgreSQL on AWS Aurora, cutting query time by 40%.',
            },
            {
                q: 'What kind of role are you looking for?',
                a: 'Full-time software engineering or applied ML roles starting after I graduate in May 2027. I want to write backend code, work with ML and LLMs, and see it run in production.',
            },
            {
                q: 'Which project should I look at first?',
                a: 'Start with the RAG chatbot for LLM work and API design, then the delivery dispatch service for backend fundamentals: algorithms, tests, and Docker.',
            },
            {
                q: 'What is your machine learning background?',
                a: 'Two years at Metamorphosys Technologies building an AutoML framework for insurance fraud detection (85% accuracy, 80% less model build time) with MLOps on Docker, Kubernetes, and Airflow. Before that, an IEEE-published face recognition paper, and now applied ML research on water-quality data at Syracuse.',
            },
            {
                q: 'How do I reach you?',
                a: 'Email hmav01@syr.edu. I also answer messages on LinkedIn.',
            },
        ];

        let token = 0;

        async function ask(item, button) {
            const id = ++token;
            $$('.chip', chips).forEach((c) => c.setAttribute('aria-pressed', String(c === button)));

            thread.innerHTML = '';
            const question = document.createElement('div');
            question.className = 'bubble bubble--q';
            question.textContent = item.q;
            const answer = document.createElement('div');
            answer.className = 'bubble bubble--a';
            thread.append(question, answer);

            if (reduceMotion) {
                answer.textContent = item.a;
                return;
            }

            answer.innerHTML = '<span class="typing" aria-hidden="true"><span></span><span></span><span></span></span>';
            await sleep(550);
            if (id !== token) return;
            answer.textContent = '';
            const words = item.a.split(' ');
            for (let i = 0; i < words.length; i++) {
                answer.textContent += (i ? ' ' : '') + words[i];
                await sleep(28);
                if (id !== token) return;
            }
        }

        qa.forEach((item) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'chip';
            button.textContent = item.q;
            button.setAttribute('aria-pressed', 'false');
            button.addEventListener('click', () => ask(item, button));
            chips.appendChild(button);
        });
    }

    /* ---------------------------------------------------------------
       Writing: latest Medium posts (falls back to a link)
       --------------------------------------------------------------- */
    async function loadPosts() {
        const list = $('#posts');
        if (!list) return;

        const mediumFeed = 'https://medium.com/feed/@harsita-mav';
        const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(mediumFeed)}`;

        const showFallback = () => {
            list.innerHTML = '';
            const p = document.createElement('p');
            p.className = 'posts__note';
            p.append('My articles are on ');
            const a = document.createElement('a');
            a.className = 'link';
            a.href = 'https://harsita-mav.medium.com/';
            a.target = '_blank';
            a.rel = 'noopener';
            a.textContent = 'Medium';
            p.append(a, '.');
            list.appendChild(p);
        };

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);
            const response = await fetch(endpoint, { signal: controller.signal });
            clearTimeout(timeout);
            const data = await response.json();
            if (data.status !== 'ok' || !data.items || !data.items.length) throw new Error('No posts');

            list.innerHTML = '';
            data.items.slice(0, 6).forEach((post) => {
                const text = new DOMParser().parseFromString(post.description || '', 'text/html').body.textContent.trim();
                const snippet = text.length > 150 ? `${text.slice(0, 150).trimEnd()}...` : text;
                const date = new Date(post.pubDate.replace(' ', 'T') + 'Z')
                    .toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

                const article = document.createElement('article');
                article.className = 'post';

                const time = document.createElement('p');
                time.className = 'post__date';
                time.textContent = date;

                const body = document.createElement('div');
                const h3 = document.createElement('h3');
                const link = document.createElement('a');
                link.href = post.link;
                link.target = '_blank';
                link.rel = 'noopener';
                link.textContent = post.title;
                h3.appendChild(link);
                const p = document.createElement('p');
                p.textContent = snippet;
                body.append(h3, p);

                article.append(time, body);
                list.appendChild(article);
            });
        } catch (error) {
            showFallback();
        }
    }

    /* ---------------------------------------------------------------
       Images: if the images folder is missing, look beside index.html
       --------------------------------------------------------------- */
    function initImageFallback() {
        $$('img[src^="images/"]').forEach((img) => {
            const flat = img.getAttribute('src').replace(/^images\//, '');
            const swap = () => {
                if (img.dataset.fallback) return;
                img.dataset.fallback = '1';
                img.src = flat;
            };
            img.addEventListener('error', swap);
            if (img.complete && img.naturalWidth === 0) swap();
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initImageFallback();
        initNav();
        initTilt();
        initDemo();
        initPlayground();
        initFilter();
        initReveal();
        initAsk();
        loadPosts();
        const year = $('#year');
        if (year) year.textContent = new Date().getFullYear();
    });
})();
