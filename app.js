
const DATA = window.GM2_DATA;
const VIDEOS = window.GM2_VIDEOS || {};
const app = document.getElementById('app');
const FAV_KEY = 'gm2_favorites_v1';
const LAST_KEY = 'gm2_last_level_v1';
let state = { levelTab: 'ondate', waveIdx: 0, squadrePlayer: 'marco' };

const SQUADRE = {
  marco: {
    nome: 'Marco',
    squadre: Array.from({ length: 6 }, (_, i) => ({
      nome: `Squadra ${i + 1}`,
      img: `img/squadre/Marco/Marco-${i + 1}.png`,
      eroi: []
    })),
    jolly: []
  },
  monica: {
    nome: 'Monica',
    squadre: Array.from({ length: 6 }, (_, i) => ({
      nome: `Squadra ${i + 1}`,
      img: `img/squadre/Monica/Monica-${i + 1}.png`,
      eroi: []
    })),
    jolly: []
  }
};

const HERO_IMAGE_KEYS = {
  'Boudicca': 'QueenBoudicca',
  'Napoleon': 'NapoleonBonaparte'
};
const HERO_SHEET_FILES = new Set([
  '01_1_menes.jpg','04_1_giovanna.jpg','04_1_minosse.jpg','05_1_boudicca.jpg','05_1_mulan.jpg','05_1_tomoe.jpg',
  '07_1_attila.jpg','07_1_hat.jpg','08_1_bessie.jpg','08_1_franklin.jpg','09_1_leonardo.jpg','09_1_van_helsing.jpg',
  '10_1_margherita.jpg','10_1_medusa.jpg','10_1_wallace.jpg','11_1_bonny.jpg','11_1_tansen.jpg','12_1_elisabetta.jpg',
  '12_2_cesare.jpg','15_1_cesare.jpg','15_1_marie.jpg','15_2_boudicca.jpg','15_2_marie .jpg','15_2_van_gogh.jpg',
  '16_2_amelia.jpg','16_2_cleo.jpg','18_2_barba.jpg','18_2_ercole.jpg','19_1_giglio.jpg','19_2_ragnar.jpg',
  '19_2_sun_tzu.jpg','20_1_carlo.jpg','20_1_einstein.jpg','20_1_platone.jpg','20_1_washington.jpg',
  '20_2_beethoven.jpg','20_2_giovanna.jpg','20_2_margherita.jpg'
]);
const HERO_SHEET_ALIASES = {
  Menes:['menes'], JoanOfArc:['giovanna'], KingMinos:['minosse'], QueenBoudicca:['boudicca'], HuaMulan:['mulan'],
  TomoeGozen:['tomoe'], AttilaTheHun:['attila'], Hatshepsut:['hat'], BessieColeman:['bessie'],
  BenjaminFranklin:['franklin'], LeonardoDaVinci:['leonardo'], VanHelsing:['van_helsing'],
  MargaretIOfDenmark:['margherita'], Medusa:['medusa'], WilliamWallace:['wallace'], AnneBonny:['bonny'],
  Tansen:['tansen'], QueenElizabethI:['elisabetta'], JuliusCaesar:['cesare'], MarieCurie:['marie','marie '],
  VincentVanGogh:['van_gogh'], AmeliaEarhart:['amelia'], Cleopatra:['cleo'], Blackbeard:['barba'],
  Hercules:['ercole'], TigerLily:['giglio'], RagnarLodbrok:['ragnar'], SunTzu:['sun_tzu'], Charlemagne:['carlo'],
  AlbertEinstein:['einstein'], Plato:['platone'], GeorgeWashington:['washington'], LudwigVanBeethoven:['beethoven']
};

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
}

function favs(){ return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); }
function saveFavs(v){ localStorage.setItem(FAV_KEY, JSON.stringify(v)); }
function key(f,l){ return `${f}-${l}`; }
function isFav(f,l){ return favs().includes(key(f,l)); }
function toggleFav(f,l){
  let list = favs(); const k = key(f,l);
  if(list.includes(k)) list = list.filter(x=>x!==k);
  else {
    if(list.length >= 10){ toast('Massimo 10 preferiti'); return; }
    list.push(k);
  }
  saveFavs(list); render();
}
function removeFav(f,l){
  saveFavs(favs().filter(x=>x!==key(f,l)));
  render();
}
function toast(msg){
  const t=document.createElement('div'); t.textContent=msg; t.style.cssText='position:fixed;left:50%;bottom:88px;transform:translateX(-50%);background:#1e293b;color:white;padding:10px 14px;border:1px solid #334155;border-radius:16px;z-index:99;box-shadow:0 10px 30px rgba(0,0,0,.35)';
  document.body.appendChild(t); setTimeout(()=>t.remove(),1500);
}
function fase(n){ return DATA.fasi.find(f=>f.fase===Number(n)); }
function livello(f,l){ const ph=fase(f); return ph?.livelli.find(x=>x.livello===Number(l)); }
function nextLevel(globalLevel){ const n=Number(globalLevel)+1; if(n<1 || n>80) return null; return { f: Math.ceil(n/20), l:n }; }
function prevLevel(globalLevel){ const n=Number(globalLevel)-1; if(n<1 || n>80) return null; return { f: Math.ceil(n/20), l:n }; }
function lastSeen(){ try { return JSON.parse(localStorage.getItem(LAST_KEY) || 'null'); } catch(e){ return null; } }
function saveLastSeen(f,l){ localStorage.setItem(LAST_KEY, JSON.stringify({f:Number(f), l:Number(l)})); }
function escapeHtml(s=''){ return String(s).replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function heroKey(name=''){ return HERO_IMAGE_KEYS[name] || String(name).replace(/[^A-Za-z0-9]/g,''); }
function heroSheetSrc(globalLevel, wave, hero){
  const waveNumber = String(wave?.numero || '').split('.').pop();
  const prefix = `${String(globalLevel).padStart(2,'0')}_${waveNumber}`;
  const aliases = HERO_SHEET_ALIASES[hero.nome_key] || [heroKey(hero.nome_key).toLowerCase()];
  for(const alias of aliases){
    const file = `${prefix}_${alias}.jpg`;
    if(HERO_SHEET_FILES.has(file)) return `img/schede-eroi/${encodeURIComponent(file)}`;
  }
  return '';
}
function toggleHeroSheet(src='', name=''){
  const old = document.querySelector('.hero-sheet-backdrop');
  if(old){
    const same = old.dataset.src === src;
    old.remove();
    if(same) return;
  }
  if(!src) return;
  const wrap = document.createElement('div');
  wrap.className = 'hero-sheet-backdrop';
  wrap.dataset.src = src;
  wrap.innerHTML = `<div class="hero-sheet-modal" role="dialog" aria-label="Scheda ${escapeHtml(name)}"><div class="hero-sheet-scroll"><img src="${escapeHtml(src)}" alt="Scheda ${escapeHtml(name)}"></div></div>`;
  document.body.appendChild(wrap);
}
function waveFileName(globalLevel, wave){
  const raw = String(wave?.numero || '');
  const waveNumber = raw.includes('.') ? raw.split('.').pop() : String(Number(state.waveIdx) + 1);
  return `${String(globalLevel).padStart(2,'0')}_${waveNumber}.png`;
}
function waveShot(globalLevel, wave){
  const file = waveFileName(globalLevel, wave);
  const phaseFolder = `fase-${Math.ceil(Number(globalLevel)/20)}`;
  const src = `img/ondate/${phaseFolder}/${file}?v=20260505`;
  if(file === '80_1.png'){
    return `<div class="layout-shot wave-shot missing-shot"><div><b>Immagine mancante</b><br><span>${file}</span></div></div>`;
  }
  return `<div class="wave-image-card"><img class="wave-real-image" src="${src}" alt="Livello ${globalLevel}, ondata ${escapeHtml(wave.numero)}" loading="lazy"></div>`;
}
function header({eyebrow,title,subtitle,back,star}){
  return `<div class="topbar">${back?`<a class="back" href="${back}">‹</a>`:'<div></div>'}<div class="title-block"><div class="eyebrow">${eyebrow}</div><div class="title">${title}</div>${subtitle?`<div class="subtitle">${subtitle}</div>`:''}</div>${star||'<div></div>'}</div>`;
}
function setNav(){
  const h = location.hash || '#/fasi';
  document.querySelectorAll('.nav-item').forEach(b=>{
    b.classList.toggle('active', h.startsWith(b.dataset.nav));
    b.onclick=()=>{ location.hash=b.dataset.nav; };
  });
}
function renderHome(){
  const last = lastSeen();
  const lastBox = (last && livello(last.f,last.l)) ? `<a class="last-seen-card" href="#/livello/${last.f}/${last.l}"><div><span>Continua da</span><b>Livello ${last.l}</b></div><strong>→</strong></a>` : '';
  app.innerHTML = header({
    eyebrow:DATA.modalita,
    title:'GUIDA GM2',
    star:'<img class="home-logo" src="img/logo.png" alt="ITA Heroes">'
  }) +
  `<div class="phase-grid">${DATA.fasi.map(f=>`<a class="phase-card clean" href="#/fase/${f.fase}"><h2>Fase ${f.fase}</h2><span class="go">→</span></a>`).join('')}</div>${lastBox ? `<div class="home-last">${lastBox}</div>` : ''}`;
}

function renderFasiIndice(){
  app.innerHTML = header({eyebrow:'GUIDA GM2',title:'Fasi',subtitle:'Scegli una fase',back:'#/home'})+
  `<div class="phase-grid">${DATA.fasi.map(f=>`<a class="phase-card clean" href="#/fase/${f.fase}"><h2>Fase ${f.fase}</h2><span class="go">→</span></a>`).join('')}</div>`;
}

function renderFase(n){
  const ph=fase(n); if(!ph) return renderHome();
  app.innerHTML = header({eyebrow:'GUIDA GM2',title:`Fase ${ph.fase}`,subtitle:`Livelli ${ph.range || ((ph.fase-1)*20+1)+'-'+(ph.fase*20)}`,back:'#/home'})+
  `<div class="card"><h2>Scontri</h2><p>I livelli marcati con ★ sono multipli di 5: boss/checkpoint, quindi più importanti.</p><div class="level-grid">${ph.livelli.map(l=>`<a class="level-tile ${l.boss?'boss':''} ${l.ondate.every(o=>o.eroi.length===0)?'empty':''}" href="#/livello/${ph.fase}/${l.livello}">${l.livello}</a>`).join('')}</div></div>`;
}
function renderLivello(f,l){
  const lv=livello(f,l); if(!lv) return renderHome();
  saveLastSeen(f,l);
  const fav = isFav(f,l);
  const star = `<button class="icon-btn ${fav?'active':''}" onclick="toggleFav(${f},${l})">★</button>`;
  let html = header({eyebrow:`Fase ${f}`,title:`Livello ${l}`,back:`#/fase/${f}`,star});
  const nx = nextLevel(l);
  const pv = prevLevel(l);
  html += `<div class="level-nav-row compact">${pv?`<a class="level-nav-btn" href="#/livello/${pv.f}/${pv.l}">← ${pv.l}</a>`:'<span></span>'}${nx?`<a class="level-nav-btn" href="#/livello/${nx.f}/${nx.l}">${nx.l} →</a>`:'<span></span>'}</div>`;
  html += `<div class="tabs tabs-row"><div class="tab-left"><button class="tab ${state.levelTab==='ondate'?'active':''}" onclick="state.levelTab='ondate';render()">Ondate</button><button class="tab ${state.levelTab==='video'?'active':''}" onclick="state.levelTab='video';render()">Video</button></div></div>`;
  if(state.levelTab==='video'){
    const vids = VIDEOS[l] || [];
    html += `<div class="card"><h2>Raccolta video</h2>${vids.length ? `<div class="video-list">${vids.map(v=>videoCard(v,l)).join('')}</div>` : `<div class="empty-state">Nessun video collegato per questo livello.</div>`}</div>`;
  } else {
    if(state.waveIdx >= lv.ondate.length) state.waveIdx=0;
    const o = lv.ondate[state.waveIdx];
    html += `<div class="wave-tabs">${lv.ondate.map((w,i)=>`<button class="wave-pill ${i===state.waveIdx?'active':''}" onclick="state.waveIdx=${i};render()"><span>Ondata</span><b>${w.numero}</b></button>`).join('')}</div>`;
    html += `<div class="card wave-content image-only">${waveShot(l,o)}</div>`;
    html += `<div class="card"><h2>Eroi nemici</h2>${o.eroi.length?`<div class="enemy-list">${o.eroi.map((e,idx)=>enemyCard(e,idx,l,o)).join('')}</div>`:`<div class="empty-state">Nessun eroe con abilità in questa ondata.</div>`}</div>`;
    html += `<div class="card"><h2>Strategia / consigli</h2><p>Testo guida da inserire. Base consigliata: identifica l’eroe con abilità più alta, evita di sprecare abilità sui bersagli secondari, e conserva burst o controllo per il picco centrale dello scontro.</p></div>`;
  }
  app.innerHTML = html;
}

function videoCard(v,l){
  const player = escapeHtml(v.player || 'Video');
  const id = escapeHtml(v.id || '');
  const url = escapeHtml(v.url || '#');
  const thumb = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
  return `<a class="video-card video-link" href="${url}" target="_blank" rel="noopener"><div class="video-thumb real-thumb">${thumb?`<img src="${thumb}" alt="Video ${player} livello ${l}">`:''}<span class="play-badge">▶</span></div><div><b>Livello ${l} • ${player}</b><p class="subtitle">Guarda su YouTube</p><div class="pill-row"><span class="pill">${player}</span></div></div></a>`;
}

function enemyCard(e,idx,globalLevel,wave){
  const name = escapeHtml(e.nome_it || e.nome_en || e.nome_key);
  const img = escapeHtml(e.img || '');
  const missing = e.img_presente===false ? 'missing' : '';
  const sheet = heroSheetSrc(globalLevel,wave,e);
  const content = `<img src="${img}" alt="${name}" onerror="this.style.visibility='hidden'"><div><div class="name">${idx+1}. ${name}</div><div class="meta">Liv. ${e.livello} • Abilità ${e.abilita}</div></div>`;
  return sheet
    ? `<button type="button" class="enemy-card ${missing} has-sheet" data-hero-sheet="${escapeHtml(sheet)}" data-hero-name="${name}">${content}</button>`
    : `<div class="enemy-card ${missing}">${content}</div>`;
}
function setSquadrePlayer(player){
  state.squadrePlayer = SQUADRE[player] ? player : 'marco';
  location.hash = `#/squadre/${state.squadrePlayer}`;
}

function renderSquadre(){
  app.innerHTML = header({eyebrow:'GUIDA GM2',title:'Squadre',subtitle:'Scegli il giocatore',back:'#/home'})+
  `<div class="players-list">${Object.entries(SQUADRE).map(([id,p])=>`<a class="player-card" href="#/squadre/${id}"><div><h2>${escapeHtml(p.nome)}</h2></div><strong>→</strong></a>`).join('')}</div>`;
}

function renderSquadrePlayer(player){
  const selected = SQUADRE[player] ? player : Object.keys(SQUADRE)[0];
  const data = SQUADRE[selected];
  const jolly = data.jolly.length ? data.jolly.map(heroChip).join('') : `<div class="empty-state">Jolly da compilare: qui inseriremo fino a 6 eroi a danno singolo.</div>`;
  app.innerHTML = header({eyebrow:'Squadre',title:data.nome,subtitle:'6 team base + Jolly',back:'#/squadre'})+
  `<div class="squadre-list">${data.squadre.map((team,idx)=>teamCard(idx+1,team)).join('')}</div>
  <div class="card jolly-card"><div class="squadra-head"><div><span>Jolly</span><h2>Danno singolo</h2></div><b>max 6</b></div>${data.jolly.length ? `<div class="team-heroes">${jolly}</div>` : jolly}</div>`;
}

function teamCard(number, team){
  const heroes = team.eroi || [];
  const elenco = heroes.length ? `<div class="team-heroes">${heroes.map(heroChip).join('')}</div>` : `<div class="team-empty">Elenco eroi da compilare</div>`;
  return `<div class="card squadra-card"><div class="squadra-head"><div><span>Team</span><h2>${escapeHtml(team.nome || `Squadra ${number}`)}</h2></div><b>${heroes.length || 5}/5</b></div><img class="team-shot" src="${escapeHtml(team.img)}" alt="${escapeHtml(team.nome || `Squadra ${number}`)}">${elenco}</div>`;
}

function heroChip(name){
  const safe = escapeHtml(name);
  const src = `img/eroi/${heroKey(name)}.png`;
  return `<div class="team-hero"><img src="${src}" alt="${safe}" onerror="this.style.display='none'"><span>${safe}</span></div>`;
}

function renderPreferiti(){
  const list=favs().map(k=>{ const [f,l]=k.split('-').map(Number); return {f,l,lv:livello(f,l)}; }).filter(x=>x.lv);
  app.innerHTML = header({eyebrow:'GUIDA GM2',title:'Preferiti',subtitle:`${list.length}/10 salvati`,back:'#/fasi'})+
  `<div class="card"><h2>Livelli salvati</h2>${list.length?`<div class="result-list">${list.map(x=>`<div class="favorite-row"><a class="result-item favorite-link" href="#/livello/${x.f}/${x.l}"><div><b>Fase ${x.f} • Livello ${x.l}</b><br><small>${x.lv.ondate.length} ondata${x.lv.ondate.length>1?'e':''}</small></div><span>→</span></a><button class="remove-fav-btn" onclick="removeFav(${x.f},${x.l})" aria-label="Rimuovi livello ${x.l} dai preferiti">Rimuovi</button></div>`).join('')}</div>`:`<div class="empty-state">Nessun preferito. Entra in un livello e premi ★.</div>`}</div>`;
}
function resolveSearch(q){
  q = String(q||'').trim().toLowerCase().replace(/fase|livello|l|f/g,'').replace(/\s+/g,'');
  if(!q) return null;
  const m = q.match(/^(\d+)[-./:](\d+)$/); if(m) { const f=+m[1], local=+m[2]; return {f, l:(f-1)*20+local}; }
  const n = Number(q); if(Number.isInteger(n) && n>=1 && n<=80) return {f:Math.ceil(n/20),l:n};
  return null;
}
function renderCerca(){
  app.innerHTML = header({eyebrow:'GUIDA GM2',title:'Cerca',subtitle:'Numero globale 1-80 o formato Fase-Livello',back:'#/fasi'})+
  `<div class="card"><h2>Vai direttamente al livello</h2><div class="search-box"><input id="searchInput" inputmode="numeric" placeholder="es. 25 oppure 2-5"><button class="primary-btn" onclick="doSearch()">Vai</button></div><p style="margin-top:12px">Esempio: <b>25</b> apre il Livello 25. <b>3-10</b> apre Fase 3, Livello 50.</p></div><div class="card"><h2>Scorciatoie boss</h2><div class="result-list">${DATA.fasi.flatMap(f=>[5,10,15,20].map(local=>{ const l=(f.fase-1)*20+local; return `<a class="result-item" href="#/livello/${f.fase}/${l}"><b>Fase ${f.fase} • Livello ${l}</b><span>★</span></a>`; })).join('')}</div></div>`;
  setTimeout(()=>document.getElementById('searchInput')?.focus(),50);
}
function doSearch(){
  const r=resolveSearch(document.getElementById('searchInput').value);
  if(r && livello(r.f,r.l)) location.hash = `#/livello/${r.f}/${r.l}`;
  else toast('Livello non trovato');
}
window.doSearch=doSearch; window.toggleFav=toggleFav; window.setSquadrePlayer=setSquadrePlayer;
function render(){
  setNav();
  const parts = (location.hash || '#/home').replace(/^#\/?/,'').split('/').filter(Boolean);
  if(parts[0]==='home') return renderHome();
  if(parts[0]==='fasi') return renderFasiIndice();
  if(parts[0]==='fase') return renderFase(parts[1]);
  if(parts[0]==='livello') return renderLivello(parts[1],parts[2]);
  if(parts[0]==='squadre' && parts[1]) return renderSquadrePlayer(parts[1]);
  if(parts[0]==='squadre') return renderSquadre();
  if(parts[0]==='preferiti') return renderPreferiti();
  if(parts[0]==='cerca') return renderCerca();
  return renderHome();
}
window.addEventListener('hashchange',()=>{ state.waveIdx=0; state.levelTab='ondate'; render(); });
document.addEventListener('click', event => {
  const trigger = event.target.closest('[data-hero-sheet]');
  if(trigger){
    toggleHeroSheet(trigger.dataset.heroSheet, trigger.dataset.heroName || 'eroe');
    return;
  }
});
document.addEventListener('dblclick', event => {
  const popup = event.target.closest('.hero-sheet-backdrop');
  if(popup) popup.remove();
});
render();
