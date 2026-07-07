// 법인설립가이드 — 기본(가이드+체크) / 참고(동영상) 2탭. KV 동기화 + localStorage 캐시. 편집은 토큰.
const API_BASE    = 'https://corp-guide-api.junyoung-cha83.workers.dev';
const STORAGE_KEY = 'corp-guide-state-v1';
const TOKEN_KEY   = 'corp-guide-edit-token';
const SAVE_DEBOUNCE_MS = 700;

// ── 가이드 콘텐츠 (초안 — 이후 수시 업데이트) ───────────────
// block: {t:'p',text} 설명 | {t:'sub',text} 소제목 | {t:'flow',steps:[]} 흐름
//        {t:'check',id,text} 체크 항목 | {t:'note',text} 강조 박스
const GUIDE = [
  { n: 1, title: '법인을 만드는 목적부터 명확히 하기', blocks: [
    { t:'p', text:'개인 투자자가 아니라 “부동산 투자회사”를 만드는 개념입니다. 목적은 크게 6단계.' },
    { t:'flow', steps:['경매 낙찰','리모델링','매도','일부 월세 운영','수익 축적','법인 규모 확대'] },
  ]},
  { n: 2, title: '법인 형태', blocks: [
    { t:'p', text:'추천: 주식회사. 유한회사도 가능하지만, 규모를 키울 계획이면 주식회사가 좋습니다.' },
    { t:'p', text:'사명 후보 예) JY Asset · JY Holdings · JY Real Estate · JY Property · JYLAB Investment' },
    { t:'check', id:'s2_form', text:'법인 형태 결정 (추천: 주식회사)' },
    { t:'check', id:'s2_name', text:'사명(회사 이름) 결정' },
  ]},
  { n: 3, title: '자본금', blocks: [
    { t:'p', text:'법적 최소금액 제한은 없지만, 현실적으로 300 / 500 / 1,000만원 중 추천은 1,000만원.' },
    { t:'note', text:'1,000만원 추천 이유 — 은행 신뢰 · 금융기관 협상 · 투자회사 이미지 · 운영자금 확보.' },
    { t:'check', id:'s3_capital', text:'자본금 결정 (추천: 1,000만원)' },
  ]},
  { n: 4, title: '지분', blocks: [
    { t:'p', text:'예) 본인 100% 또는 본인 99% + 배우자 1%. 훗날 승계·지분 조정을 고려해 미리 설계할 수도 있습니다.' },
    { t:'check', id:'s4_share', text:'지분 구조 결정' },
  ]},
  { n: 5, title: '대표이사', blocks: [
    { t:'p', text:'당연히 본인.' },
    { t:'check', id:'s5_ceo', text:'대표이사 결정 (본인)' },
  ]},
  { n: 6, title: '사업목적', blocks: [
    { t:'p', text:'굉장히 중요합니다. 많이 넣는 게 좋아요. 나중에 추가하려면 등기변경 비용이 발생합니다. 넣을 목적을 체크하세요.' },
    { t:'check', id:'s6_maemae', text:'부동산 매매업' },
    { t:'check', id:'s6_imdae',  text:'부동산 임대업' },
    { t:'check', id:'s6_gaebal', text:'부동산 개발업' },
    { t:'check', id:'s6_sihaeng',text:'부동산 시행업' },
    { t:'check', id:'s6_consult',text:'부동산 컨설팅업' },
    { t:'check', id:'s6_manage', text:'부동산 관리업' },
    { t:'check', id:'s6_invest', text:'부동산 투자업' },
    { t:'check', id:'s6_asset',  text:'자산관리업' },
    { t:'check', id:'s6_biz',    text:'경영컨설팅업' },
    { t:'check', id:'s6_online', text:'온라인정보제공업' },
  ]},
  { n: 7, title: '주소', blocks: [
    { t:'p', text:'은근 중요. 자택 · 공유오피스 · 사무실 모두 가능(건물 용도·업종 적합성 확인). 추천은 공유오피스 — 사업 이미지·우편 관리·은행/거래처 신뢰.' },
    { t:'check', id:'s7_addr', text:'사업장 주소 결정 (추천: 공유오피스)' },
  ]},
  { n: 8, title: '업종코드', blocks: [
    { t:'check', id:'s8_maemae', text:'부동산 매매업 업종코드 등록' },
    { t:'check', id:'s8_imdae',  text:'(필요 시) 임대업 업종코드 추가' },
  ]},
  { n: 9, title: '은행', blocks: [
    { t:'p', text:'법인 통장 필수. 개인 통장 절대 사용 금지. 모든 자금은 “법인 통장 → 법인 카드”로 흘러야 합니다.' },
    { t:'flow', steps:['법인 통장','법인 카드'] },
    { t:'check', id:'s9_bank', text:'법인 통장 개설' },
  ]},
  { n: 10, title: '카드', blocks: [
    { t:'p', text:'법인카드 발급 — 가능하면 체크카드 + 신용카드 둘 다.' },
    { t:'check', id:'s10_card', text:'법인 카드 발급 (체크/신용)' },
  ]},
  { n: 11, title: '회계', blocks: [
    { t:'p', text:'반드시 세무사 계약(기장). 혼자 하려다 부가세·법인세·원천세가 전부 꼬이는 경우가 많습니다.' },
    { t:'check', id:'s11_tax', text:'세무사 기장 계약' },
  ]},
  { n: 12, title: '꼭 만들어야 하는 것', blocks: [
    { t:'check', id:'s12_ingam',   text:'법인인감' },
    { t:'check', id:'s12_useingam',text:'사용인감' },
    { t:'check', id:'s12_ingamcard',text:'인감카드' },
    { t:'check', id:'s12_cert',    text:'공동인증서' },
    { t:'check', id:'s12_etax',    text:'전자세금계산서' },
    { t:'check', id:'s12_hometax', text:'홈택스' },
    { t:'check', id:'s12_wetax',   text:'위택스' },
    { t:'check', id:'s12_4ins',    text:'4대보험 사업장 (직원 없어도 훗날 대비)' },
  ]},
  { n: 13, title: '사업자등록 이후 순서', blocks: [
    { t:'check', id:'s13_1', text:'① 통장 개설' },
    { t:'check', id:'s13_2', text:'② 카드' },
    { t:'check', id:'s13_3', text:'③ 홈택스' },
    { t:'check', id:'s13_4', text:'④ 전자세금계산서' },
    { t:'check', id:'s13_5', text:'⑤ 세무사 등록' },
    { t:'check', id:'s13_6', text:'⑥ 나라장터 (필요 시)' },
    { t:'check', id:'s13_7', text:'⑦ 인터넷뱅킹' },
    { t:'check', id:'s13_8', text:'⑧ OTP' },
    { t:'check', id:'s13_9', text:'⑨ 클라우드 백업' },
  ]},
  { n: 14, title: '경매법인 폴더 구조', blocks: [
    { t:'p', text:'추출/문서 폴더를 이렇게 잡아두면 나중에 엄청 편해집니다. (법인 아래)' },
    { t:'check', id:'s14_nakchal', text:'낙찰물건' },
    { t:'check', id:'s14_contract',text:'계약서' },
    { t:'check', id:'s14_remodel', text:'리모델링' },
    { t:'check', id:'s14_tax',     text:'세금' },
    { t:'check', id:'s14_photo',   text:'사진' },
    { t:'check', id:'s14_sell',    text:'매도' },
    { t:'check', id:'s14_rent',    text:'임대' },
    { t:'check', id:'s14_cost',    text:'비용' },
    { t:'check', id:'s14_docs',    text:'법인서류' },
    { t:'check', id:'s14_regi',    text:'등기부' },
    { t:'check', id:'s14_appraisal',text:'감정평가' },
    { t:'check', id:'s14_court',   text:'법원자료' },
  ]},
  { n: 15, title: '추천 자동화 시스템', blocks: [
    { t:'p', text:'이미 진행 중인 Claude Code 프로젝트를 여기까지 자동화하면, 규모가 커져도 운영이 훨씬 수월합니다.' },
    { t:'flow', steps:['경매 자동수집(법원→데이터 저장)','자동분석 AI(수익률→입찰가 추천)','낙찰 후 공사 일정·사진·비용 관리','매도 예상수익·세금·ROI·IRR 자동계산','전체 물건 Dashboard'] },
    { t:'note', text:'Dashboard 예) 입찰 준비 14건 · 낙찰 4건 · 공사중 2건 · 매도대기 1건 · 월세운영 3건 · 올해 순이익 3억 2천만원' },
  ]},
  { n: 16, title: '꼭 넣어야 하는 AI 기능', blocks: [
    { t:'p', text:'법인 운영의 가장 큰 경쟁력. 이미 준비 중인 Claude Code 기반 경매 플랫폼과 자연스럽게 연결됩니다. 넣을 기능을 체크하세요.' },
    { t:'check', id:'s16_select', text:'AI 경매 물건 자동 선별' },
    { t:'check', id:'s16_bid',    text:'AI 적정 입찰가 계산' },
    { t:'check', id:'s16_rights', text:'AI 권리분석 체크리스트' },
    { t:'check', id:'s16_myeongdo',text:'AI 명도 진행 관리' },
    { t:'check', id:'s16_estimate',text:'AI 리모델링 견적 비교' },
    { t:'check', id:'s16_sellprice',text:'AI 예상 매도가 분석' },
    { t:'check', id:'s16_taxsim', text:'AI 세금 시뮬레이션' },
    { t:'check', id:'s16_cashflow',text:'AI 법인 현금흐름 분석' },
    { t:'check', id:'s16_roi',    text:'AI 투자성과(ROI·IRR) 분석' },
    { t:'check', id:'s16_report', text:'AI 월간 투자 리포트 자동 생성' },
  ]},
];
const ALL_CHECK_IDS = GUIDE.flatMap(s => s.blocks.filter(b => b.t === 'check').map(b => b.id));

// 참고 탭 동영상 중분류
const VIDEO_CATS = ['법인설립·등기','세무·회계','경매','자금·대출','리모델링·공사','매도·세금','임대·운영','기타'];

let state = { version: 1, checks: {}, videos: [] };
let activeTab = 'basic';
let _saveTimer = null, _saveCtrl = null, _editId = null;

// ── 유틸 ─────────────────────────────────────────
function escapeHtml(s){ return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
function escapeAttr(s){ return escapeHtml(s); }
function nowIso(){ return new Date().toISOString(); }
function genId(){ return 'v_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function getEditToken(){ try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } }
function normalizeUrl(raw){ let u = String(raw||'').trim(); if(!u) return ''; if(!/^https?:\/\//i.test(u)) u='https://'+u; try { return new URL(u).href; } catch { return ''; } }
function domainOf(u){ try { return new URL(u).hostname.replace(/^www\./,''); } catch { return ''; } }
function ytId(u){
  try { const url=new URL(u); const h=url.hostname.replace(/^www\./,'');
    if(h==='youtu.be') return url.pathname.slice(1).split('/')[0]||'';
    if(h.endsWith('youtube.com')){ if(url.pathname==='/watch') return url.searchParams.get('v')||''; const m=url.pathname.match(/^\/(?:shorts|embed|live)\/([^/?#]+)/); if(m) return m[1]; }
  } catch {} return '';
}
function embedSrc(url, autoplay){
  const vid = ytId(url);
  if (vid) return `https://www.youtube.com/embed/${vid}?rel=0&playsinline=1${autoplay?'&autoplay=1':''}`;
  return url;
}
// 인스타/틱톡/페북 릴스는 iframe 임베드 불가 → 링크 카드로 폴백
function nonEmbeddable(url){
  try { const u=new URL(url); const h=u.hostname.replace(/^www\./,'');
    if((h.endsWith('facebook.com')||h==='fb.watch') && /\/(reel|reels|share|stories|story)\b/i.test(u.pathname)) return '페이스북';
    if(h.endsWith('instagram.com')) return '인스타그램';
    if(h.endsWith('tiktok.com')) return '틱톡';
  } catch {} return '';
}

// ── 동기화 ───────────────────────────────────────
function setSyncStatus(s){
  const el=document.getElementById('syncStatus'); if(!el) return;
  el.textContent = { saving:'저장중…', saved:'저장됨 ✓', error:'오프라인', readonly:'읽기전용', '':'' }[s] ?? '';
  el.className = 'sync-status ' + (s||'');
}
function migrate(loaded){
  const checks = (loaded && loaded.checks && typeof loaded.checks==='object') ? loaded.checks : {};
  const cleanChecks = {}; for(const id of ALL_CHECK_IDS) if(checks[id]) cleanChecks[id]=true;
  const videos = (loaded && Array.isArray(loaded.videos) ? loaded.videos : []).map(v => ({
    id: v.id||genId(), url:String(v.url||''), vid:String(v.vid||ytId(v.url||'')), note:String(v.note||''),
    cat: VIDEO_CATS.includes(v.cat) ? v.cat : '기타', added_at:v.added_at||nowIso(),
  })).filter(v => v.url);
  return { version:1, checks:cleanChecks, videos };
}
function cacheLocal(){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} }
async function fetchFromServer(){
  try { const res=await fetch(`${API_BASE}/api/data`, { cache:'no-store' }); if(!res.ok) return null; const j=await res.json(); if(j&&typeof j==='object') return j; } catch {} return null;
}
async function loadInitial(){
  const remote = await fetchFromServer();
  if (remote) return migrate(remote);
  try { const local=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'); if(local) return migrate(local); } catch {}
  return { version:1, checks:{}, videos:[] };
}
function saveLocalAndSync(){
  cacheLocal();
  if (!getEditToken()) { setSyncStatus('readonly'); return; }
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(pushToServer, SAVE_DEBOUNCE_MS);
}
async function pushToServer(){
  const token = getEditToken(); if(!token) return;
  if (_saveCtrl) _saveCtrl.abort(); _saveCtrl = new AbortController();
  setSyncStatus('saving');
  try {
    const res = await fetch(`${API_BASE}/api/data`, { method:'PUT', headers:{ 'Content-Type':'application/json','X-Edit-Token':token }, body:JSON.stringify(state), signal:_saveCtrl.signal });
    if (res.ok) setSyncStatus('saved');
    else if (res.status===401) { try{localStorage.removeItem(TOKEN_KEY);}catch{} updateEditUI(); setSyncStatus('error'); alert('편집 비밀번호가 잘못됐습니다 — 다시 입력하세요.'); }
    else setSyncStatus('error');
  } catch(e){ if(e.name!=='AbortError') setSyncStatus('error'); }
}
function promptEditToken(){
  const cur=getEditToken();
  const v=prompt(cur ? '편집 비밀번호 (지우고 확인 시 잠금)' : '편집 비밀번호를 입력하세요', cur);
  if(v===null) return;
  try { if(v.trim()) localStorage.setItem(TOKEN_KEY, v.trim()); else localStorage.removeItem(TOKEN_KEY); } catch {}
  updateEditUI(); render();
}
function updateEditUI(){
  const editable=!!getEditToken();
  document.body.classList.toggle('read-only', !editable);
  document.getElementById('btnEdit').textContent = editable ? '🔓' : '🔒';
  setSyncStatus(editable ? '' : 'readonly');
}

// ── 렌더 ─────────────────────────────────────────
function render(){
  document.querySelectorAll('#tabs .tab').forEach(b=>{ const on=b.dataset.tab===activeTab; b.classList.toggle('active',on); b.setAttribute('aria-selected',on?'true':'false'); });
  document.getElementById('panelBasic').classList.toggle('hidden', activeTab!=='basic');
  document.getElementById('panelRef').classList.toggle('hidden', activeTab!=='ref');
  document.getElementById('btnAddVideo').classList.toggle('hidden', activeTab!=='ref' || !getEditToken());
  if (activeTab==='basic') renderBasic(); else renderRef();
}

function renderProgress(){
  const done = ALL_CHECK_IDS.filter(id=>state.checks[id]).length;
  const total = ALL_CHECK_IDS.length;
  const pct = total ? Math.round(done/total*100) : 0;
  document.getElementById('progressCard').innerHTML =
    `<div class="prog-top"><b>진행률</b><span>${done} / ${total} · ${pct}%</span></div>
     <div class="prog-bar"><div class="prog-fill" style="width:${pct}%"></div></div>`;
}

function renderBasic(){
  renderProgress();
  const editable = !!getEditToken();
  const html = GUIDE.map(sec => {
    const body = sec.blocks.map(b => {
      if (b.t==='p')   return `<p class="g-p">${escapeHtml(b.text)}</p>`;
      if (b.t==='sub') return `<h3 class="g-sub">${escapeHtml(b.text)}</h3>`;
      if (b.t==='note')return `<div class="g-note">${escapeHtml(b.text)}</div>`;
      if (b.t==='flow')return `<div class="g-flow">${b.steps.map(s=>`<span class="g-step">${escapeHtml(s)}</span>`).join('<span class="g-arrow">→</span>')}</div>`;
      if (b.t==='check'){ const on=!!state.checks[b.id];
        return `<label class="g-check${on?' on':''}"><input type="checkbox" data-check="${escapeAttr(b.id)}" ${on?'checked':''} ${editable?'':'disabled'} /><span>${escapeHtml(b.text)}</span></label>`; }
      return '';
    }).join('');
    return `<section class="g-sec"><h2 class="g-title"><span class="g-num">${sec.n}</span>${escapeHtml(sec.title)}</h2>${body}</section>`;
  }).join('');
  const g=document.getElementById('guide'); g.innerHTML=html;
  g.querySelectorAll('input[data-check]').forEach(inp => inp.onchange = () => {
    if(!getEditToken()){ inp.checked=!inp.checked; return; }
    const id=inp.dataset.check;
    if(inp.checked) state.checks[id]=true; else delete state.checks[id];
    inp.closest('.g-check').classList.toggle('on', inp.checked);
    renderProgress(); saveLocalAndSync();
  });
}

function renderRef(){
  const box=document.getElementById('videos');
  const editable=!!getEditToken();
  if(!state.videos.length){
    box.innerHTML=`<div class="empty">아직 등록된 동영상이 없어요.${editable?'<br/><small>아래 ＋ 로 동영상 링크를 추가하세요.</small>':'<br/><small>🔒 로 편집 비밀번호를 입력하면 추가할 수 있어요.</small>'}</div>`;
    return;
  }
  const cardHtml = v => {
    const svc=nonEmbeddable(v.url);
    const title = escapeHtml(v.note||domainOf(v.url));
    const media = svc
      ? `<div class="v-fallback">${svc} 영상은 앱 안에서 재생 불가 <a href="${escapeAttr(v.url)}" target="_blank" rel="noopener">열기 ↗</a></div>`
      : `<div class="v-frame"><iframe src="${escapeAttr(embedSrc(v.url,false))}" title="동영상" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe><div class="v-title">${title}</div></div>`;
    const actions = editable
      ? `<div class="v-actions"><button class="v-edit" data-edit="${escapeAttr(v.id)}">✏️ 수정</button><button class="v-del" data-del="${escapeAttr(v.id)}">🗑 삭제</button></div>` : '';
    return `<div class="v-card" data-id="${escapeAttr(v.id)}">${media}${actions}</div>`;
  };
  // 중분류별로 묶어 표시 (영상 있는 분류만)
  let html='';
  for(const cat of VIDEO_CATS){
    const list=state.videos.filter(v=>(v.cat||'기타')===cat).sort((a,b)=>String(b.added_at).localeCompare(String(a.added_at)));
    if(!list.length) continue;
    html += `<h3 class="v-cat">${escapeHtml(cat)} <span class="v-cat-n">${list.length}</span></h3>` + list.map(cardHtml).join('');
  }
  box.innerHTML=html;
  box.querySelectorAll('.v-del').forEach(b=>b.onclick=()=>{
    if(!getEditToken()) return;
    if(!confirm('이 동영상을 삭제할까요?')) return;
    state.videos=state.videos.filter(v=>v.id!==b.dataset.del); saveLocalAndSync(); renderRef();
  });
  box.querySelectorAll('.v-edit').forEach(b=>b.onclick=()=>{
    const v=state.videos.find(x=>x.id===b.dataset.edit); if(v) openAdd(v);
  });
}

// ── 동영상 추가/수정 (팝업) ───────────────────────
function openAdd(video){
  if(!getEditToken()){ promptEditToken(); return; }
  _editId = video ? video.id : null;
  document.getElementById('addTitle').textContent = video ? '동영상 수정' : '동영상 추가';
  document.getElementById('fUrl').value  = video ? video.url  : '';
  document.getElementById('fNote').value = video ? video.note : '';
  const sel=document.getElementById('fCategory');
  sel.innerHTML = VIDEO_CATS.map(c=>`<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join('');
  sel.value = video ? (video.cat||'기타') : VIDEO_CATS[0];
  document.getElementById('addSave').textContent = video ? '수정' : '저장';
  document.getElementById('addStatus').textContent='';
  document.getElementById('addDialog').showModal();
}
function saveVideo(){
  const url=normalizeUrl(document.getElementById('fUrl').value);
  if(!url){ document.getElementById('addStatus').textContent='URL을 확인하세요.'; return; }
  const note=document.getElementById('fNote').value.trim();
  const cat=document.getElementById('fCategory').value || '기타';
  if(_editId){
    const v=state.videos.find(x=>x.id===_editId);
    if(v){ v.url=url; v.vid=ytId(url); v.note=note; v.cat=cat; }
  } else {
    state.videos.push({ id:genId(), url, vid:ytId(url), note, cat, added_at:nowIso() });
  }
  _editId=null;
  saveLocalAndSync();
  document.getElementById('addDialog').close();
  renderRef();
}

// ── 부팅 ─────────────────────────────────────────
(async function init(){
  state = await loadInitial();
  cacheLocal();
  updateEditUI();
  render();
  document.querySelectorAll('#tabs .tab').forEach(b=>b.onclick=()=>{ activeTab=b.dataset.tab; render(); });
  document.getElementById('btnEdit').onclick = promptEditToken;
  document.getElementById('btnAddVideo').onclick = openAdd;
  document.getElementById('addCancel').onclick = ()=>document.getElementById('addDialog').close();
  document.getElementById('addSave').onclick = saveVideo;
  document.getElementById('addForm').addEventListener('submit', e=>{ e.preventDefault(); saveVideo(); });
})();
