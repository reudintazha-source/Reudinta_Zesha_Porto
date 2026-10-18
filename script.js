/* GAME LAYER: XP, quests, collectibles. Add AFTER script.js. Content still lives in config.js. */
document.addEventListener('DOMContentLoaded', () => {
  const cfg = typeof SITE_CONFIG !== 'undefined' ? SITE_CONFIG : {};
  const KEY = 'zesha-quest-v1', PER = 150;
  const TITLES = ['Newcomer', 'Explorer', 'Insight Hunter', 'Chief Curious'];
  let S = { xp: 0, done: {}, flowers: 0, skills: {} };
  try { S = Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  const cat = document.getElementById('cat-mascot');
  const catOK = cat && getComputedStyle(cat).display !== 'none';
  const Q = [
    { id: 'exp', t: 'Read the journey', d: 'Scroll to Experience' },
    { id: 'case', t: 'Open a case study', d: 'Click any project card' },
    { id: 'lab', t: 'Enter the Lab', d: 'Open Lab & Experiments' },
    { id: 'flower', t: 'Catch 3 flowers', d: 'Click the floating flowers up top' },
    ...(catOK ? [{ id: 'cat', t: 'Pet the cat', d: 'Say hi in Experience' }] : []),
    { id: 'dark', t: 'Switch the mood', d: 'Toggle dark mode' },
    { id: 'end', t: 'Reach the portal', d: 'Scroll to the footer' }
  ];

  const hud = document.createElement('div');
  hud.id = 'xp-hud';
  hud.innerHTML = `<button id="xp-pill" type="button" aria-expanded="false"><span id="xp-lv"></span><span class="xp-meta"><b id="xp-title"></b><i id="xp-bar"><u></u></i></span><span id="xp-count"></span></button><div id="quest-panel" hidden></div>`;
  document.body.appendChild(hud);
  const stack = document.createElement('div');
  stack.id = 'toast-stack';
  document.body.appendChild(stack);
  const $ = (s) => hud.querySelector(s);
  const lvl = () => 1 + Math.floor(S.xp / PER);

  const toast = (html, ms = 2800) => {
    const t = document.createElement('div');
    t.className = 'toast'; t.innerHTML = html; stack.appendChild(t);
    setTimeout(() => t.classList.add('out'), ms);
    setTimeout(() => t.remove(), ms + 500);
  };
  const floatXp = (e, txt) => {
    const f = document.createElement('span');
    f.className = 'float-xp'; f.textContent = txt;
    f.style.left = e.clientX + 'px'; f.style.top = e.clientY + 'px';
    document.body.appendChild(f); setTimeout(() => f.remove(), 950);
  };
  const burst = (n = 26) => {
    const em = (cfg.flowerAnimation && cfg.flowerAnimation.emojis) || ['🌸', '✨'];
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.className = 'confetti'; s.textContent = em[i % em.length];
      s.style.cssText = `left:${50 + Math.random() * 30 - 15}%;--dx:${Math.random() * 80 - 40}vw;--dy:${-20 - Math.random() * 60}vh;--r:${Math.random() * 720 - 360}deg;animation-delay:${Math.random() * 0.2}s`;
      document.body.appendChild(s); setTimeout(() => s.remove(), 1900);
    }
  };

  const paint = () => {
    const doneN = Q.filter(q => S.done[q.id]).length;
    $('#xp-lv').textContent = lvl();
    $('#xp-title').textContent = TITLES[Math.min(lvl() - 1, TITLES.length - 1)];
    $('#xp-bar u').style.width = ((S.xp % PER) / PER * 100) + '%';
    $('#xp-count').textContent = `${doneN}/${Q.length}`;
    $('#quest-panel').innerHTML = `<h4>Quests · ${S.xp} XP</h4><ul>${Q.map(q =>
      `<li class="${S.done[q.id] ? 'ok' : ''}"><i>${S.done[q.id] ? '✓' : ''}</i><span><b>${q.t}</b><small>${q.d}</small></span></li>`).join('')}</ul>`;
  };
  const addXp = (n) => {
    const before = lvl(); S.xp += n;
    if (lvl() > before) { toast(`⭐ Level ${lvl()}: ${TITLES[Math.min(lvl() - 1, TITLES.length - 1)]}`); burst(14); }
    paint(); save();
  };
  const done = (id) => {
    const q = Q.find(x => x.id === id);
    if (!q || S.done[id]) return;
    S.done[id] = 1; addXp(100);
    toast(`✅ ${q.t}: +100 XP`);
    if (Q.every(x => S.done[x.id])) {
      burst(40);
      const mail = cfg.email ? ` <a href="mailto:${cfg.email}">Let's talk</a>` : '';
      toast(`🎉 All quests complete.${mail}`, 9000);
    }
  };

  const say = () => {
    const L = ['Meow! 🐾', 'Purr... nice portfolio.', 'Data looks better with a cat.', 'Hire Zesha, get free purrs.'];
    let b = cat.querySelector('.cat-bubble');
    if (!b) { b = document.createElement('div'); b.className = 'cat-bubble'; cat.appendChild(b); }
    b.textContent = L[Math.floor(Math.random() * L.length)];
    b.classList.add('show'); cat.classList.add('jump');
    clearTimeout(say.t);
    say.t = setTimeout(() => { b.classList.remove('show'); cat.classList.remove('jump'); }, 1600);
  };

  document.querySelectorAll('#skills-container span').forEach(c => { if (S.skills[c.textContent.trim()]) c.classList.add('got'); });

  document.addEventListener('click', (e) => {
    const t = e.target;
    const panel = $('#quest-panel');
    if (t.closest('#xp-pill')) { panel.hidden = !panel.hidden; $('#xp-pill').setAttribute('aria-expanded', String(!panel.hidden)); }
    else if (!t.closest('#xp-hud')) panel.hidden = true;

    const f = t.closest('.flower');
    if (f && !f.classList.contains('pop')) {
      f.classList.add('pop'); setTimeout(() => f.classList.remove('pop'), 700);
      S.flowers++; floatXp(e, '+10 XP'); addXp(10);
      if (S.flowers >= 3) done('flower');
    }
    if (t.closest('#project-container > div')) done('case');
    if (t.closest('.work-tab[data-tab="lab"], .coverflow-card')) done('lab');
    if (t.closest('#dark-toggle')) done('dark');
    if (catOK && t.closest('#cat-mascot')) { say(); done('cat'); }
    const chip = t.closest('#skills-container span');
    if (chip) {
      const name = chip.textContent.trim();
      if (!S.skills[name]) { S.skills[name] = 1; chip.classList.add('got'); floatXp(e, '+10 XP'); addXp(10); }
    }
  });

  const seen = (sel, id) => {
    const el = document.querySelector(sel); if (!el) return;
    const o = new IntersectionObserver(en => { if (en.some(x => x.isIntersecting)) { done(id); o.disconnect(); } }, { threshold: 0.35 });
    o.observe(el);
  };
  seen('#experience', 'exp'); seen('#contact', 'end');
  paint();
});
