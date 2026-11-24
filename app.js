    // =========================================================================
    // APP STATE
    // =========================================================================
    const state = {
      activeTab: 'lab',
      labBahr: 'الكل',
      labQuery: '',
      labIndex: 0,
      labStep: 0,
      fcBahr: 'الكل',
      fcDeck: [],
      fcPos: 0,
      fcFlipped: false,
      fcShowHint: false,
      simTafilah: 'مَفَاعِيْلُنْ',
      simTransformIdx: 0,
      simBahr: 'الهزج',
      simOptA: false,
      simOptB: false,
      dairahIdx: 0,
      examQuestions: [],
      examIdx: 0,
      examScore: 0,
      examWrong: [],
      examAnswered: false
    };

    // =========================================================================
    // THEME TOGGLE (LIGHT / DARK)
    // =========================================================================
    function initTheme() {
      let saved = 'light';
      try { saved = localStorage.getItem('arudh_theme') || 'light'; } catch (e) {}
      applyTheme(saved === 'dark');
    }

    function applyTheme(isDark) {
      document.documentElement.classList.toggle('dark', isDark);
      document.getElementById('themeIcon').textContent = isDark ? '☀️' : '🌙';
      document.getElementById('themeLabel').textContent = isDark ? 'الوضع النهاري' : 'الوضع الليلي';
      try { localStorage.setItem('arudh_theme', isDark ? 'dark' : 'light'); } catch (e) {}
    }

    document.getElementById('themeToggleBtn').addEventListener('click', () => {
      applyTheme(!document.documentElement.classList.contains('dark'));
    });

    // =========================================================================
    // TAB NAVIGATION
    // =========================================================================
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        state.activeTab = tab;
        document.querySelectorAll('.nav-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('hidden', p.id !== 'tab-' + tab));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // =========================================================================
    // MODULE 1: LAB (معمل التقطيع التدريجي)
    // =========================================================================
    function getFilteredLabItems() {
      const q = state.labQuery.trim();
      return SHAWAHID.filter(item => {
        const matchBahr = state.labBahr === 'الكل' || item.bahr === state.labBahr;
        if (!matchBahr) return false;
        if (!q) return true;
        const hay = `${item.title} ${item.sadr} ${item.ajuz} ${item.baitType} ${item.note} ${item.bahr}`;
        return hay.includes(q);
      });
    }

    function renderLabFilters() {
      const wrap = document.getElementById('labBahrFilters');
      wrap.innerHTML = '';
      BAHR_LIST.forEach(b => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pill ui-font' + (state.labBahr === b ? ' active' : '');
        btn.textContent = b;
        btn.addEventListener('click', () => {
          state.labBahr = b;
          state.labIndex = 0;
          state.labStep = 0;
          renderLab();
        });
        wrap.appendChild(btn);
      });
    }

    function buildTaqtiTableHtml(label, feet, step) {
      const r1 = feet.map(f => `<td>${f[0]}</td>`).join('');
      const r2 = feet.map(f => `<td><span class="sym" dir="rtl">${f[1]}</span></td>`).join('');
      const r3 = feet.map(f => `<td><strong>${f[2]}</strong></td>`).join('');
      const r4 = feet.map(f => `<td class="halah-text">${f[3]}</td>`).join('');
      return `
        <div class="overflow-x-auto">
          <table class="taqti-table">
            <tbody>
              <tr class="${step >= 1 ? '' : 'hidden-row'}"><th>${label}</th>${r1}</tr>
              <tr class="${step >= 2 ? '' : 'hidden-row'}"><th>الرموز</th>${r2}</tr>
              <tr class="${step >= 3 ? '' : 'hidden-row'}"><th>التفعيلة</th>${r3}</tr>
              <tr class="${step >= 4 ? '' : 'hidden-row'}"><th>الحالة</th>${r4}</tr>
            </tbody>
          </table>
        </div>
      `;
    }

    function renderLab() {
      renderLabFilters();
      const items = getFilteredLabItems();
      const counter = document.getElementById('labCounter');
      const jump = document.getElementById('labJumpSelect');
      const container = document.getElementById('labCardContainer');

      if (!items.length) {
        counter.textContent = 'لا توجد نتائج مطابقة للبحث';
        jump.innerHTML = '';
        container.innerHTML = '<p class="text-center py-8" style="color:var(--muted);">لم يُعثر على شاهد يطابق كلمة البحث.</p>';
        return;
      }

      if (state.labIndex >= items.length) state.labIndex = 0;
      if (state.labIndex < 0) state.labIndex = items.length - 1;
      const item = items[state.labIndex];

      counter.textContent = `الشاهد ${state.labIndex + 1} من ${items.length} • بحر ${item.bahr} (ص ${item.pageRef})`;

      jump.innerHTML = items.map((it, i) =>
        `<option value="${i}" ${i === state.labIndex ? 'selected' : ''}>${i + 1}. [${it.bahr}] ${it.title}</option>`
      ).join('');

      const verseHtml = item.ajuz
        ? `<div class="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-5 text-center text-lg sm:text-xl font-bold py-3 px-4 rounded-xl" style="background: var(--card-soft);">
             <span>${item.sadr}</span>
             <span style="color:var(--accent);" class="text-sm">***</span>
             <span>${item.ajuz}</span>
           </div>`
        : `<div class="text-center text-lg sm:text-xl font-bold py-3 px-4 rounded-xl" style="background: var(--card-soft);">${item.sadr}</div>`;

      const stepBadges = ['١. الكتابة', '٢. الرموز', '٣. التفعيلة', '٤. الحالة والشرح'].map((lbl, idx) => {
        const active = state.labStep >= idx + 1;
        return `<span class="px-2.5 py-1 rounded-full text-xs ui-font font-semibold" style="background:${active ? 'var(--ok-soft)' : 'var(--card-soft)'}; color:${active ? 'var(--ok)' : 'var(--muted)'}; border:1px solid var(--border);">${lbl}</span>`;
      }).join('');

      let tablesHtml = '';
      if (state.labStep === 0) {
        tablesHtml = `<div class="text-center py-6 rounded-xl border border-dashed" style="border-color:var(--border); color:var(--muted);">
          حاول تقطيع البيت ذهنياً أو على ورقة، ثم اضغط <strong>«اكشف الخطوة التالية»</strong> للتحقق تدريجياً.
        </div>`;
      } else {
        tablesHtml = buildTaqtiTableHtml(item.feetAjuz.length ? 'الصدر' : 'الكتابة', item.feetSadr, state.labStep);
        if (item.feetAjuz.length) {
          tablesHtml += '<div class="mt-2.5">' + buildTaqtiTableHtml('العجز', item.feetAjuz, state.labStep) + '</div>';
        }
      }

      const metaHtml = state.labStep >= 4 ? `
        <div class="card-soft p-3.5 text-sm space-y-1.5 border-r-4" style="border-right-color: var(--accent);">
          <div><strong style="color:var(--primary);">نوع البيت:</strong> ${item.baitType}</div>
          <div><strong style="color:var(--primary);">الشرح والتوضيح:</strong> ${item.note}</div>
        </div>
      ` : '';

      container.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b" style="border-color: var(--border);">
          <h3 class="ui-font font-bold text-sm sm:text-base" style="color: var(--primary);">${item.title}</h3>
          <span class="px-2.5 py-0.5 rounded-lg text-xs ui-font font-bold" style="background: var(--accent-soft); color: var(--accent);">${item.bahr} • ص ${item.pageRef}</span>
        </div>
        ${verseHtml}
        <div class="flex flex-wrap gap-1.5">${stepBadges}</div>
        ${tablesHtml}
        ${metaHtml}
      `;

      const stepBtn = document.getElementById('labStepBtn');
      const labels = ['١. اكشف الكتابة العروضية', '٢. اكشف الرموز (/ o)', '٣. اكشف التفعيلات', '٤. اكشف الحالة والشرح', 'اكتمل الكشف ✓'];
      stepBtn.textContent = labels[Math.min(state.labStep, 4)];
    }

    document.getElementById('labSearchInput').addEventListener('input', (e) => {
      state.labQuery = e.target.value;
      state.labIndex = 0;
      state.labStep = 0;
      renderLab();
    });
    document.getElementById('labJumpSelect').addEventListener('change', (e) => {
      state.labIndex = parseInt(e.target.value, 10) || 0;
      state.labStep = 0;
      renderLab();
    });
    document.getElementById('labStepBtn').addEventListener('click', () => {
      if (state.labStep < 4) { state.labStep += 1; renderLab(); }
    });
    document.getElementById('labRevealAllBtn').addEventListener('click', () => {
      state.labStep = 4; renderLab();
    });
    document.getElementById('labHideAllBtn').addEventListener('click', () => {
      state.labStep = 0; renderLab();
    });
    document.getElementById('labPrevBtn').addEventListener('click', () => {
      state.labIndex -= 1; state.labStep = 0; renderLab();
    });
    document.getElementById('labNextBtn').addEventListener('click', () => {
      state.labIndex += 1; state.labStep = 0; renderLab();
    });

    // =========================================================================
    // MODULE 2: FLASHCARDS (البطاقات السريعة)
    // =========================================================================
    function shuffleArray(arr) {
      const copy = arr.slice();
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    function resetFlashcards(doShuffle = false) {
      const base = state.fcBahr === 'الكل' ? SHAWAHID : SHAWAHID.filter(s => s.bahr === state.fcBahr);
      state.fcDeck = doShuffle ? shuffleArray(base) : base.slice();
      state.fcPos = 0;
      state.fcFlipped = false;
      renderFlashcards();
    }

    function renderFlashcardFilters() {
      const wrap = document.getElementById('fcBahrFilters');
      wrap.innerHTML = '';
      BAHR_LIST.forEach(b => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pill ui-font' + (state.fcBahr === b ? ' active' : '');
        btn.textContent = b;
        btn.addEventListener('click', () => {
          state.fcBahr = b;
          resetFlashcards(false);
        });
        wrap.appendChild(btn);
      });
    }

    function renderFlashcards() {
      renderFlashcardFilters();
      const card = document.getElementById('fcCard');
      const counter = document.getElementById('fcCounter');
      const hintBtn = document.getElementById('fcHintToggleBtn');
      hintBtn.textContent = state.fcShowHint ? 'إخفاء تلميح البحر' : 'إظهار تلميح البحر';

      if (!state.fcDeck.length) {
        counter.textContent = '';
        card.innerHTML = '<p class="text-center" style="color:var(--muted);">لا توجد بطاقات.</p>';
        return;
      }
      if (state.fcPos >= state.fcDeck.length) state.fcPos = 0;
      const item = state.fcDeck[state.fcPos];
      counter.textContent = `بطاقة ${state.fcPos + 1} من ${state.fcDeck.length}`;

      const verseLine = item.ajuz
        ? `<div class="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-5 text-center text-xl sm:text-2xl font-bold">
             <span>${item.sadr}</span>
             <span style="color:var(--accent);" class="text-sm">***</span>
             <span>${item.ajuz}</span>
           </div>`
        : `<div class="text-center text-xl sm:text-2xl font-bold">${item.sadr}</div>`;

      if (!state.fcFlipped) {
        const hintHtml = state.fcShowHint
          ? `<span class="px-3 py-1 rounded-full text-xs ui-font font-bold" style="background:var(--accent-soft); color:var(--accent);">تلميح: بحر ${item.bahr}</span>`
          : `<span class="text-xs ui-font" style="color:var(--muted);">ما البحر؟ وما نوع البيت؟ وما الزحاف أو العلة فيه؟</span>`;
        card.innerHTML = `
          <div class="flex items-center justify-between text-xs ui-font" style="color:var(--muted);">
            <span>الوجه الأمامي (السؤال)</span>
            <span>ص ${item.pageRef}</span>
          </div>
          <div class="py-8 space-y-4 flex flex-col items-center justify-center">
            ${verseLine}
            ${hintHtml}
          </div>
          <div class="text-center text-xs ui-font font-semibold" style="color:var(--primary);">اضغط على البطاقة لرؤية الإجابة والتقطيع</div>
        `;
      } else {
        const tSadr = item.feetSadr.map(f => `${f[2]} (${f[3]})`).join(' / ');
        const tAjuz = item.feetAjuz.length ? item.feetAjuz.map(f => `${f[2]} (${f[3]})`).join(' / ') : '';
        card.innerHTML = `
          <div class="flex items-center justify-between text-xs ui-font">
            <span class="font-bold" style="color:var(--ok);">الإجابة النموذجية</span>
            <span class="px-2.5 py-0.5 rounded-lg font-bold" style="background:var(--accent-soft); color:var(--accent);">بحر ${item.bahr} • ص ${item.pageRef}</span>
          </div>
          <div class="space-y-3 py-2">
            <div class="text-center font-bold text-base sm:text-lg" style="color:var(--primary);">${item.title}</div>
            <div class="card-soft p-3 text-sm space-y-1.5">
              <div><strong>الصدر:</strong> ${tSadr}</div>
              ${tAjuz ? `<div><strong>العجز:</strong> ${tAjuz}</div>` : ''}
            </div>
            <div class="text-sm space-y-1">
              <div><strong style="color:var(--primary);">نوع البيت:</strong> ${item.baitType}</div>
              <div><strong style="color:var(--primary);">الشرح:</strong> ${item.note}</div>
            </div>
          </div>
          <div class="text-center text-xs ui-font" style="color:var(--muted);">اضغط على البطاقة للعودة إلى البيت</div>
        `;
      }
    }

    document.getElementById('fcCard').addEventListener('click', () => {
      state.fcFlipped = !state.fcFlipped;
      renderFlashcards();
    });
    document.getElementById('fcFlipBtn').addEventListener('click', () => {
      state.fcFlipped = !state.fcFlipped;
      renderFlashcards();
    });
    document.getElementById('fcNextBtn').addEventListener('click', () => {
      state.fcPos = (state.fcPos + 1) % state.fcDeck.length;
      state.fcFlipped = false;
      renderFlashcards();
    });
    document.getElementById('fcRequeueBtn').addEventListener('click', () => {
      if (state.fcDeck.length > 1) {
        const cur = state.fcDeck[state.fcPos];
        state.fcDeck.push(cur);
        state.fcPos += 1;
        state.fcFlipped = false;
        renderFlashcards();
      }
    });
    document.getElementById('fcHintToggleBtn').addEventListener('click', () => {
      state.fcShowHint = !state.fcShowHint;
      renderFlashcards();
    });
    document.getElementById('fcShuffleBtn').addEventListener('click', () => {
      resetFlashcards(true);
    });

    // =========================================================================
    // MODULE 3: ZIHAF, ILLAH & MU'AQABAH SIMULATOR
    // =========================================================================
    function renderSimulator() {
      const tafTabs = document.getElementById('simTafilahTabs');
      tafTabs.innerHTML = '';
      Object.keys(TAFILAT_LAB).forEach(k => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pill ui-font' + (state.simTafilah === k ? ' active' : '');
        btn.textContent = k;
        btn.addEventListener('click', () => {
          state.simTafilah = k;
          state.simTransformIdx = 0;
          renderSimulator();
        });
        tafTabs.appendChild(btn);
      });

      const taf = TAFILAT_LAB[state.simTafilah];
      const trWrap = document.getElementById('simTransformBtns');
      trWrap.innerHTML = '';
      taf.transforms.forEach((tr, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-soft px-3 py-1.5 text-xs sm:text-sm ui-font';
        if (i === state.simTransformIdx) {
          btn.style.borderColor = 'var(--accent)';
          btn.style.background = 'var(--accent-soft)';
          btn.style.color = 'var(--accent)';
        }
        btn.textContent = tr.name;
        btn.addEventListener('click', () => {
          state.simTransformIdx = i;
          renderSimulator();
        });
        trWrap.appendChild(btn);
      });

      const tr = taf.transforms[state.simTransformIdx];
      const boxes = taf.letters.map((ch, idx) => {
        let cls = 'char-box';
        let tag = idx + 1;
        if (tr.dropped.includes(idx)) cls += ' dropped';
        else if (tr.changed.includes(idx)) cls += ' changed';
        return `<div class="${cls}"><span>${ch}</span><span class="text-[10px] font-normal" style="color:var(--muted);">${tag}</span></div>`;
      }).join('') + tr.added.map(ch =>
        `<div class="char-box added"><span>${ch}</span><span class="text-[10px] font-normal">زيادة</span></div>`
      ).join('');

      document.getElementById('simTafilahOutput').innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-2 text-xs ui-font" style="color:var(--muted);">
          <span>تُستخدم في: <strong style="color:var(--text);">${taf.buhur}</strong></span>
          <span>الأصل: <strong>${taf.base}</strong> (<span class="sym" dir="rtl">${taf.sym}</span>)</span>
        </div>
        <div class="flex flex-wrap gap-2 justify-center py-2">${boxes}</div>
        <div class="flex flex-wrap items-center justify-center gap-4 text-base sm:text-lg font-bold">
          <span>الناتج: <span style="color:var(--primary);">${tr.result}</span></span>
          <span>الرموز: <span class="sym" dir="rtl">${tr.sym}</span></span>
        </div>
        <p class="text-sm text-center" style="color:var(--text);">${tr.desc}</p>
      `;

      const bTabs = document.getElementById('simBahrTabs');
      bTabs.innerHTML = '';
      Object.keys(BAHR_CARDS).forEach(b => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pill ui-font' + (state.simBahr === b ? ' active' : '');
        btn.textContent = 'بحر ' + b;
        btn.addEventListener('click', () => {
          state.simBahr = b;
          state.simOptA = false;
          state.simOptB = false;
          renderSimulator();
        });
        bTabs.appendChild(btn);
      });

      const card = BAHR_CARDS[state.simBahr];
      const t = card.tester;
      let statusHtml = '';
      if (state.simOptA && state.simOptB) {
        const bg = t.bothAllowed ? 'var(--ok-soft)' : 'var(--danger-soft)';
        const col = t.bothAllowed ? 'var(--ok)' : 'var(--danger)';
        statusHtml = `<div class="p-3 rounded-xl text-sm font-bold" style="background:${bg}; color:${col}; border:1px solid ${col};">${t.bothMsg}</div>`;
      } else if (state.simOptA) {
        statusHtml = `<div class="p-3 rounded-xl text-sm font-semibold" style="background:var(--ok-soft); color:var(--ok);">${t.onlyAMsg}</div>`;
      } else if (state.simOptB) {
        statusHtml = `<div class="p-3 rounded-xl text-sm font-semibold" style="background:var(--ok-soft); color:var(--ok);">${t.onlyBMsg}</div>`;
      } else {
        statusHtml = `<div class="p-3 rounded-xl text-sm" style="background:var(--card); color:var(--muted); border:1px solid var(--border);">${t.noneMsg}</div>`;
      }

      document.getElementById('simBahrDetail').innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div class="card-soft p-3.5 space-y-1.5">
            <div><strong style="color:var(--primary);">الوزن:</strong> ${card.weight}</div>
            <div><strong style="color:var(--primary);">الأعاريض والأضرب:</strong> ${card.counts}</div>
            <div><strong style="color:var(--primary);">الزحافات:</strong> ${card.zihaf}</div>
          </div>
          <div class="card-soft p-3.5 space-y-1.5">
            <div><strong style="color:var(--primary);">العلل:</strong> ${card.illal}</div>
            <div><strong style="color:var(--danger);">الاستثناءات:</strong> ${card.exceptions}</div>
            <div><strong style="color:var(--accent);">الحكم:</strong> ${card.relationType}</div>
          </div>
        </div>
        <div class="card-soft p-4 space-y-3 border-r-4" style="border-right-color: var(--primary);">
          <div class="text-sm font-bold ui-font" style="color:var(--primary);">${t.prompt}</div>
          <div class="flex flex-wrap gap-2">
            <button id="testerBtnA" type="button" class="pill ui-font ${state.simOptA ? 'active' : ''}">${t.optA}</button>
            <button id="testerBtnB" type="button" class="pill ui-font ${state.simOptB ? 'active' : ''}">${t.optB}</button>
          </div>
          ${statusHtml}
        </div>
      `;

      document.getElementById('testerBtnA').addEventListener('click', () => {
        state.simOptA = !state.simOptA; renderSimulator();
      });
      document.getElementById('testerBtnB').addEventListener('click', () => {
        state.simOptB = !state.simOptB; renderSimulator();
      });
    }

    // =========================================================================
    // MODULE 4: INTERACTIVE DAIRAT AL-MUSHTABIH
    // =========================================================================
    function renderDairah() {
      const btnWrap = document.getElementById('dairahBtns');
      btnWrap.innerHTML = '';
      DAIRAH_FAKK.forEach((d, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pill ui-font' + (state.dairahIdx === idx ? ' active' : '');
        btn.textContent = d.label;
        btn.addEventListener('click', () => {
          state.dairahIdx = idx;
          renderDairah();
        });
        btnWrap.appendChild(btn);
      });

      const cur = DAIRAH_FAKK[state.dairahIdx];
      const outerStroke = cur.ringHighlight === 'outer' ? '#b45309' : '#1b4332';
      const outerW = cur.ringHighlight === 'outer' ? '4.5' : '2';
      const midStroke = cur.ringHighlight === 'middle' ? '#b45309' : '#2d6a4f';
      const midW = cur.ringHighlight === 'middle' ? '4.5' : '2';
      const inStroke = cur.ringHighlight === 'inner' ? '#b45309' : '#64748b';
      const inW = cur.ringHighlight === 'inner' ? '4.5' : '2';

      document.getElementById('dairahSvgWrap').innerHTML = `
        <svg viewBox="0 0 320 320" class="w-full max-w-[300px] h-auto" xmlns="http://www.w3.org/2000/svg">
          <circle cx="160" cy="160" r="142" fill="none" stroke="${outerStroke}" stroke-width="${outerW}"/>
          <circle cx="160" cy="160" r="102" fill="none" stroke="${midStroke}" stroke-width="${midW}"/>
          <circle cx="160" cy="160" r="62" fill="none" stroke="${inStroke}" stroke-width="${inW}"/>
          <text x="160" y="34" text-anchor="middle" font-size="12" font-weight="700" fill="${outerStroke}">الهَزَج (مفاعيلن × ٦)</text>
          <text x="160" y="75" text-anchor="middle" font-size="12" font-weight="700" fill="${midStroke}">الرَّجَز (مستفعلن × ٦)</text>
          <text x="160" y="114" text-anchor="middle" font-size="11.5" font-weight="700" fill="${inStroke}">الرَّمَل (فاعلاتن × ٦)</text>
          <text x="160" y="158" text-anchor="middle" font-size="14" font-weight="700" fill="currentColor">دائرة المُشْتَبِه</text>
          <text x="160" y="178" text-anchor="middle" font-size="11" fill="#b45309">نقطة الفك: «${cur.cutPoint}»</text>
        </svg>
      `;

      document.getElementById('dairahExplainWrap').innerHTML = `
        <div class="card-soft p-4 space-y-2.5">
          <div class="text-sm font-bold ui-font" style="color:var(--accent);">${cur.label}</div>
          <p class="text-sm">${cur.rule}</p>
          <div class="text-sm space-y-1 pt-1 border-t" style="border-color:var(--border);">
            <div><strong>الأصل (${cur.fromBahr}):</strong> ${cur.fromTaf}</div>
            <div><strong>موضع البداية:</strong> <span class="px-2 py-0.5 rounded font-bold" style="background:var(--accent-soft); color:var(--accent);">${cur.cutPoint}</span></div>
            <div><strong>البحر الناتج (${cur.toBahr}):</strong> ${cur.toTaf}</div>
          </div>
        </div>
        <div class="card-soft p-3.5 text-sm space-y-1">
          <div class="font-bold ui-font text-xs" style="color:var(--primary);">تطبيق على بيت الفكّ من الكتاب:</div>
          <div class="font-bold">${cur.verse}</div>
          <div style="color:var(--muted);">${cur.shiftDemo}</div>
        </div>
      `;
    }

    // =========================================================================
    // MODULE 5: EXAM SIMULATOR (محاكي الامتحان)
    // =========================================================================
    function buildExamPool(bahrFilter, qType) {
      const pool = [];
      const bahrNames = ['الهزج', 'الرجز', 'الرمل', 'السريع', 'المنسرح'];

      if (qType === 'mixed' || qType === 'verses') {
        const eligible = SHAWAHID.filter(s => s.bahr !== 'دائرة المشتبه' && (bahrFilter === 'الكل' || s.bahr === bahrFilter));
        eligible.forEach(s => {
          const verseText = s.ajuz ? `${s.sadr} *** ${s.ajuz}` : s.sadr;
          if (bahrFilter === 'الكل') {
            const others = shuffleArray(bahrNames.filter(b => b !== s.bahr)).slice(0, 3);
            const opts = shuffleArray([s.bahr, ...others]);
            pool.push({
              kind: 'تحديد البحر',
              prompt: `ما بحر هذا الشاهد؟\n«${verseText}»`,
              opts,
              ans: opts.indexOf(s.bahr),
              exp: `بحر ${s.bahr} (ص ${s.pageRef}) — ${s.baitType}`
            });
          } else {
            const distractors = shuffleArray(eligible.filter(x => x.id !== s.id && x.baitType !== s.baitType)).slice(0, 3).map(x => x.baitType);
            if (distractors.length >= 2) {
              const opts = shuffleArray([s.baitType, ...distractors]);
              pool.push({
                kind: 'نوع البيت والشاهد',
                prompt: `ما الوصف الصحيح لهذا الشاهد من بحر ${s.bahr}؟\n«${verseText}»`,
                opts,
                ans: opts.indexOf(s.baitType),
                exp: `${s.title} (ص ${s.pageRef}) — ${s.note}`
              });
            }
          }
        });
      }

      if (qType === 'mixed' || qType === 'tf') {
        STATIC_TF.filter(x => bahrFilter === 'الكل' || x.bahr === bahrFilter).forEach(x => {
          pool.push({
            kind: 'صح وخطأ',
            prompt: x.q,
            opts: ['صح', 'خطأ'],
            ans: x.ans ? 0 : 1,
            exp: x.exp
          });
        });
      }

      if (qType === 'mixed' || qType === 'mcq') {
        STATIC_MCQ.filter(x => bahrFilter === 'الكل' || x.bahr === bahrFilter).forEach(x => {
          pool.push({
            kind: 'اختيار من متعدد',
            prompt: x.q,
            opts: x.opts,
            ans: x.ans,
            exp: x.exp
          });
        });
      }

      return shuffleArray(pool);
    }

    function startExam(customList = null) {
      const bahr = document.getElementById('examBahrSelect').value;
      const qType = document.getElementById('examTypeSelect').value;
      const count = parseInt(document.getElementById('examCountSelect').value, 10) || 10;

      const list = customList || buildExamPool(bahr, qType).slice(0, count);
      state.examQuestions = list;
      state.examIdx = 0;
      state.examScore = 0;
      state.examWrong = [];
      state.examAnswered = false;

      document.getElementById('examSetup').classList.add('hidden');
      document.getElementById('examSummary').classList.add('hidden');
      document.getElementById('examActive').classList.remove('hidden');
      renderExamQuestion();
    }

    function renderExamQuestion() {
      if (state.examIdx >= state.examQuestions.length) {
        renderExamSummary();
        return;
      }
      const q = state.examQuestions[state.examIdx];
      document.getElementById('examProgressText').textContent = `السؤال ${state.examIdx + 1} من ${state.examQuestions.length}`;
      document.getElementById('examScoreLive').textContent = `النتيجة: ${state.examScore}`;

      const card = document.getElementById('examQuestionCard');
      card.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="px-2.5 py-0.5 rounded-full text-xs ui-font font-bold" style="background:var(--accent-soft); color:var(--accent);">${q.kind}</span>
        </div>
        <div class="text-base sm:text-lg font-bold whitespace-pre-line leading-relaxed">${q.prompt}</div>
        <div id="examOptsWrap" class="grid grid-cols-1 gap-2.5"></div>
        <div id="examFeedbackWrap" class="hidden"></div>
      `;

      const optsWrap = document.getElementById('examOptsWrap');
      q.opts.forEach((optText, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-soft text-right px-4 py-3 text-sm sm:text-base';
        btn.textContent = optText;
        btn.addEventListener('click', () => handleExamAnswer(i));
        optsWrap.appendChild(btn);
      });
    }

    function handleExamAnswer(chosenIdx) {
      if (state.examAnswered) return;
      state.examAnswered = true;
      const q = state.examQuestions[state.examIdx];
      const isRight = chosenIdx === q.ans;
      if (isRight) state.examScore += 1;
      else state.examWrong.push(q);

      const btns = document.querySelectorAll('#examOptsWrap button');
      btns.forEach((btn, i) => {
        btn.disabled = true;
        if (i === q.ans) {
          btn.style.background = 'var(--ok-soft)';
          btn.style.borderColor = 'var(--ok)';
          btn.style.color = 'var(--ok)';
        } else if (i === chosenIdx && !isRight) {
          btn.style.background = 'var(--danger-soft)';
          btn.style.borderColor = 'var(--danger)';
          btn.style.color = 'var(--danger)';
        }
      });

      const fb = document.getElementById('examFeedbackWrap');
      fb.classList.remove('hidden');
      fb.innerHTML = `
        <div class="p-3.5 rounded-xl text-sm space-y-2" style="background:${isRight ? 'var(--ok-soft)' : 'var(--danger-soft)'}; border:1px solid ${isRight ? 'var(--ok)' : 'var(--danger)'};">
          <div class="font-bold ui-font" style="color:${isRight ? 'var(--ok)' : 'var(--danger)'};">${isRight ? 'إجابة صحيحة ✓' : 'إجابة غير صحيحة ✗'}</div>
          <div>${q.exp}</div>
        </div>
        <div class="mt-3 flex justify-end">
          <button id="examNextQBtn" type="button" class="btn-primary px-5 py-2 text-sm ui-font">
            ${state.examIdx + 1 < state.examQuestions.length ? 'السؤال التالي' : 'عرض النتيجة النهائية'}
          </button>
        </div>
      `;
      document.getElementById('examScoreLive').textContent = `النتيجة: ${state.examScore}`;
      document.getElementById('examNextQBtn').addEventListener('click', () => {
        state.examIdx += 1;
        state.examAnswered = false;
        renderExamQuestion();
      });
    }

    function renderExamSummary() {
      document.getElementById('examActive').classList.add('hidden');
      const sum = document.getElementById('examSummary');
      sum.classList.remove('hidden');
      const total = state.examQuestions.length || 1;
      const pct = Math.round((state.examScore / total) * 100);
      const retryWrongBtn = state.examWrong.length
        ? `<button id="examRetryWrongBtn" type="button" class="btn-primary px-5 py-2.5 text-sm ui-font">إعادة الأسئلة الخاطئة فقط (${state.examWrong.length})</button>`
        : '';

      sum.innerHTML = `
        <div class="text-3xl sm:text-4xl font-bold ui-font" style="color:var(--primary);">${state.examScore} / ${total} (${pct}%)</div>
        <p class="text-sm sm:text-base" style="color:var(--muted);">
          ${pct >= 85 ? 'ممتاز! مستواك جاهز جداً للامتحان.' : pct >= 60 ? 'جيد جداً، راجع الأسئلة الخاطئة لتثبيت القواعد.' : 'تحتاج إلى مراجعة سريعة في معمل التقطيع ثم أعد الاختبار.'}
        </p>
        <div class="flex flex-wrap justify-center gap-2.5 pt-2">
          ${retryWrongBtn}
          <button id="examRestartNewBtn" type="button" class="btn-soft px-5 py-2.5 text-sm ui-font">اختبار جديد</button>
        </div>
      `;

      if (state.examWrong.length) {
        document.getElementById('examRetryWrongBtn').addEventListener('click', () => {
          startExam(shuffleArray(state.examWrong));
        });
      }
      document.getElementById('examRestartNewBtn').addEventListener('click', () => {
        sum.classList.add('hidden');
        document.getElementById('examSetup').classList.remove('hidden');
      });
    }

    document.getElementById('examStartBtn').addEventListener('click', () => startExam(null));
    document.getElementById('examQuitBtn').addEventListener('click', () => {
      document.getElementById('examActive').classList.add('hidden');
      document.getElementById('examSetup').classList.remove('hidden');
    });

    // =========================================================================
    // INIT ALL MODULES
    // =========================================================================
    initTheme();
    renderLab();
    resetFlashcards(false);
    renderSimulator();
    renderDairah();
