
const D=window.__D;
const QA=D.qa, PAGES=D.pages, CH=D.ch;
const byId=Object.fromEntries(QA.map((x,i)=>[x.id,i]));
const pageIdx={};PAGES.forEach((p,i)=>{if(p.p)pageIdx[p.p]=i});
const nz=s=>s.normalize('NFKC').toLowerCase().replace(/訪間/g,'訪問').replace(/[,，、]/g,',');
QA.forEach(x=>{x._t=nz(x.t);x._b=nz(x.q+'\n'+x.a)});
PAGES.forEach(p=>{p._x=nz(p.x).replace(/\s+/g,'')});
const $=id=>document.getElementById(id), main=$('main');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const store={get(k,d){try{const v=JSON.parse(localStorage.getItem(k));return v??d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let fav=store.get('fav',[]), hist=store.get('hist',[]), recent=store.get('recent',[]);
let mode=store.get('mode','qa'), query='', terms=[], fsIdx=store.get('fs',1);
const FS=[15,17,19,21];
function applyFs(){document.documentElement.style.setProperty('--fs',FS[fsIdx]+'px')}
applyFs();

const IC={
  back:'<svg viewBox="0 0 13 21" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2 2.5 10.5 11 19"/></svg>',
  chev:'<svg class="chev" viewBox="0 0 8 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m1.5 1.5 5 5-5 5"/></svg>',
  star:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path class="ic-star" d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>',
  aa:'<svg viewBox="0 0 24 24" fill="currentColor"><text x="1" y="18" font-size="13" font-weight="600" font-family="-apple-system,system-ui">A</text><text x="10" y="18" font-size="18" font-weight="600" font-family="-apple-system,system-ui">A</text></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>',
  x:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="m8.5 8.5 7 7m0-7-7 7" stroke="var(--cell)" stroke-width="2" stroke-linecap="round"/></svg>',
  page:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',
  copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>',
  starO:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>',
  starF:'<svg viewBox="0 0 24 24" fill="var(--star)" stroke="var(--star)" stroke-width="1.8" stroke-linejoin="round"><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
};
const SUGGEST=['特別管理加算','緊急時訪問看護加算','24時間対応体制加算','退院時共同指導加算','複数名訪問看護加算','ターミナルケア','特別訪問看護指示書','同一建物居住者','理学療法士','精神科訪問看護','長時間訪問看護加算','初回加算'];

function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('on');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('on'),1600)}
function hl(text){
  let h=esc(text); if(!terms.length) return h;
  const re=new RegExp('('+terms.map(t=>esc(t).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')','gi');
  return h.replace(re,'<mark>$1</mark>');
}
function snippet(text,len=80){
  const n=nz(text); let pos=-1;
  for(const t of terms){const k=n.indexOf(t);if(k>=0&&(pos<0||k<pos))pos=k}
  if(pos<0) return hl(text.slice(0,len).replace(/\n/g,' '))+(text.length>len?'…':'');
  const a=Math.max(0,pos-24), s=text.slice(a,a+len).replace(/\n/g,' ');
  return (a>0?'…':'')+hl(s)+(a+len<text.length?'…':'');
}
function partOf(p){const b=p.p;if(!b)return '前付・目次';if(b<224)return '第1部 制度の概要';if(b<=420)return '第2部 実務相談Q&A';return '第3部 関係法令・通知・資料';}
function qaCell(x,snip){
  return `<button class="cell" data-go="q-${x.id}"><div class="body"><span class="k">Q${x.id}</span><span class="t">${hl(x.t)}</span>${snip?`<span class="s">${snippet(x.q+' '+x.a)}</span>`:''}</div><span class="r">p.${x.p}${IC.chev}</span></button>`;
}
function emptyBox(icon,title,text){return `<div class="empty">${icon}<b>${title}</b><span>${text}</span></div>`}

/* ---------- navigation stack ---------- */
const ROOTS=['search','toc','fav','hist'];
let curTab=store.get('tab','search'); if(!ROOTS.includes(curTab)) curTab='search';
let stack=[]; const scrollMem={};
function rootOf(h){return ROOTS.includes(h)?h:null}
function go(h){location.hash=h}
function back(){ if(stack.length>1){const target=stack[stack.length-2]; stack.pop(); stack.pop(); location.replace('#'+target);} else location.replace('#'+curTab) }
function setNav({title='',left='',right='',large=false}){
  $('navT').textContent=title; $('navL').innerHTML=left; $('navR').innerHTML=right;
  $('nav').dataset.large=large?'1':''; onScroll();
}
function backBtn(label){return `<button class="nbtn back" id="bk" aria-label="戻る">${IC.back}<span>${esc(label)}</span></button>`}
function onScroll(){
  const y=scrollY, nav=$('nav');
  nav.classList.toggle('scrolled',y>4);
  nav.classList.toggle('show-title',nav.dataset.large?y>40:true);
}
addEventListener('scroll',onScroll,{passive:true});

function route(){
  const h=location.hash.slice(1)||curTab;
  const prev=stack[stack.length-1];
  if(prev) scrollMem[prev]=scrollY;
  let dir='push';
  if(rootOf(h)){ curTab=h; store.set('tab',h); stack=[h]; dir=''; }
  else if(stack.length>1 && stack[stack.length-2]===h){ stack.pop(); dir='pop'; }
  else if(prev!==h){ stack.push(h); }
  ROOTS.forEach(r=>$('tab-'+r).setAttribute('aria-selected',r===curTab));
  render(h);
  main.classList.remove('push','pop'); void main.offsetWidth; if(dir) main.classList.add(dir);
  requestAnimationFrame(()=>scrollTo(0,dir==='push'?0:(scrollMem[h]||0)));
}
function prevLabel(){const p=stack[stack.length-2];if(!p)return {search:'検索',toc:'目次',fav:'お気に入り',hist:'履歴'}[curTab];
  if(p==='search')return '検索';if(p==='toc')return '目次';if(p==='fav')return 'お気に入り';if(p==='hist')return '履歴';
  if(p.startsWith('ch-'))return '第'+p.slice(3)+'章';if(p.startsWith('q-'))return 'Q'+p.slice(2);if(p.startsWith('pg-'))return 'ページ';return '戻る'}
function render(h){
  let m;
  if(h==='search') return renderSearch();
  if(h==='toc') return renderToc();
  if(h==='fav') return renderSaved('fav');
  if(h==='hist') return renderSaved('hist');
  if(m=h.match(/^ch-(\d+)$/)) return renderChapter(m[1]);
  if(m=h.match(/^q-(\d+-\d+)$/)) return renderQ(m[1]);
  if(m=h.match(/^pg-(\d+)$/)) return renderPage(+m[1]);
  location.replace('#search');
}

/* ---------- screens ---------- */
function renderSearch(){
  setNav({title:'検索',large:true});
  main.innerHTML=`<h1 class="large">検索</h1>
  <div class="sfield"><div class="sbox">${IC.search}<input id="q" type="search" placeholder="加算名・キーワード" value="${esc(query)}" autocomplete="off" autocorrect="off" enterkeyhint="search" aria-label="キーワード"><button class="clear" id="clr" aria-label="消去" ${query?'':'hidden'}>${IC.x}</button></div><button class="cancel" id="cnl" ${query?'':'hidden'}>キャンセル</button></div>
  <div class="seg" role="group"><button id="m-qa" aria-pressed="${mode==='qa'}">Q&amp;A ${QA.length}問</button><button id="m-pg" aria-pressed="${mode==='pg'}">本文すべて ${PAGES.length}頁</button></div>
  <div id="res"></div>`;
  const q=$('q');
  let t; q.addEventListener('input',()=>{query=q.value;$('clr').hidden=$('cnl').hidden=!query;clearTimeout(t);t=setTimeout(results,160)});
  q.addEventListener('keydown',e=>{if(e.key==='Enter'){q.blur();saveRecent()}});
  $('clr').onclick=()=>{query='';q.value='';$('clr').hidden=$('cnl').hidden=true;results();q.focus()};
  $('cnl').onclick=()=>{query='';q.value='';$('clr').hidden=$('cnl').hidden=true;q.blur();results()};
  $('m-qa').onclick=()=>{mode='qa';store.set('mode',mode);renderSearch()};
  $('m-pg').onclick=()=>{mode='pg';store.set('mode',mode);renderSearch()};
  results();
}
function saveRecent(){const v=query.trim();if(!v)return;recent=[v,...recent.filter(r=>r!==v)].slice(0,8);store.set('recent',recent)}
function results(){
  const box=$('res'); if(!box) return;
  const raw=query.trim(); terms=raw?nz(raw).split(/[\s　]+/).filter(Boolean):[];
  if(!terms.length){
    let h='';
    if(recent.length) h+=`<div class="ghead">最近の検索</div><div class="chips">${recent.map(r=>`<button class="chip" data-kw="${esc(r)}">${esc(r)}</button>`).join('')}</div>`;
    h+=`<div class="ghead">よく引く項目</div><div class="chips">${SUGGEST.map(r=>`<button class="chip" data-kw="${esc(r)}">${esc(r)}</button>`).join('')}</div>`;
    h+=`<p class="foot" style="margin-top:18px">スペースで区切ると絞り込み検索になります（例：退院 准看護師）。OCRで読み取った本文のため、単位数・金額・日付は本のページで確認してください。</p>`;
    box.innerHTML=h; return;
  }
  if(mode==='pg'){
    const tt=terms.map(t=>t.replace(/\s+/g,''));
    const res=PAGES.filter(p=>tt.every(t=>p._x.includes(t)));
    box.innerHTML=res.length?`<div class="count">${res.length}ページ</div><div class="group">${res.slice(0,150).map(p=>`<button class="cell" data-go="pg-${p.i}"><div class="body"><span class="k">${p.p?'p.'+p.p:'前付'} · ${partOf(p)}</span><span class="s">${snippet(p.x,110)}</span></div>${IC.chev}</button>`).join('')}</div>`
      :emptyBox(IC.search,'見つかりませんでした','言葉を短くするか、別の言い方で試してください。');
    return;
  }
  const res=[];
  for(const x of QA){
    let s=0,ok=true;
    for(const t of terms){const a=x._t.includes(t),b=x._b.includes(t);if(!a&&!b){ok=false;break}s+=(a?10:0)+(b?Math.min(5,x._b.split(t).length-1):0)}
    if(ok)res.push([s,x]);
  }
  res.sort((a,b)=>b[0]-a[0]);
  box.innerHTML=res.length?`<div class="count">${res.length}件</div><div class="group">${res.slice(0,200).map(r=>qaCell(r[1],true)).join('')}</div>`
    :emptyBox(IC.search,'Q&Aには見つかりませんでした','<button class="chip" data-mode="pg" style="margin-top:6px">本文すべてで探す</button>');
}
function renderToc(){
  terms=[];
  setNav({title:'目次',large:true});
  let h=`<h1 class="large">目次</h1><p class="sub">訪問看護実務相談Q&amp;A 令和8年版</p>
  <div class="group"><div class="cell"><div class="body"><span class="t">ページ番号で開く</span></div><form class="pgjump" id="pj" style="justify-content:flex-end"><input id="pjn" type="number" inputmode="numeric" min="1" max="${PAGES.length-37}" placeholder="例 360" aria-label="ページ番号"><button type="submit">開く</button></form></div></div>
  <div class="ghead">第2部 訪問看護実務相談Q&amp;A</div><div class="group">`;
  for(const [n,name] of Object.entries(CH)){
    const c=QA.filter(x=>x.ch==n);
    h+=`<button class="cell ind" data-go="ch-${n}"><span class="badge">${n}</span><div class="body"><span class="t">${esc(name)}</span></div><span class="r">${c.length}問${IC.chev}</span></button>`;
  }
  h+=`</div><div class="ghead">ほかの部</div><div class="group">
    <button class="cell" data-go="pg-${pageIdx[1]??39}"><div class="body"><span class="t">第1部 訪問看護制度の概要</span></div><span class="r">p.1–${IC.chev}</span></button>
    <button class="cell" data-go="pg-${pageIdx[421]}"><div class="body"><span class="t">第3部 関係法令・通知・資料</span></div><span class="r">p.421–${IC.chev}</span></button>
  </div><p class="foot">文字サイズはQ&amp;Aの画面右上の「Aa」で変えられます。</p>`;
  main.innerHTML=h;
  $('pj').onsubmit=e=>{e.preventDefault();const n=+$('pjn').value;if(pageIdx[n]!=null){$('pjn').blur();go('pg-'+pageIdx[n])}else toast('そのページはありません')};
}
function renderChapter(n){
  terms=[];
  const c=QA.filter(x=>x.ch==n);
  setNav({title:`第${n}章`,left:backBtn(prevLabel()),large:true});
  main.innerHTML=`<h1 class="large" style="font-size:26px">${esc(CH[n])}</h1><p class="sub">第${n}章 · ${c.length}問 · p.${c[0].p}–${c[c.length-1].p}</p><div class="group">${c.map(x=>qaCell(x)).join('')}</div>`;
}
function renderSaved(kind){
  terms=[];
  const title=kind==='fav'?'お気に入り':'履歴';
  const ids=kind==='fav'?fav:hist;
  const xs=ids.map(id=>QA[byId[id]]).filter(Boolean);
  const right=xs.length?`<button class="nbtn" id="edit">${kind==='fav'?'編集':'消去'}</button>`:'';
  setNav({title,right,large:true});
  main.innerHTML=`<h1 class="large">${title}</h1>${xs.length?`<div class="group" id="sl">${xs.map(x=>qaCell(x)).join('')}</div>`
    :(kind==='fav'?emptyBox(IC.starO,'まだありません','Q&Aの画面で右上の☆をタップすると、ここに並びます。'):emptyBox(IC.clock,'まだありません','開いたQ&Aがここに残ります。'))}`;
  if(!xs.length) return;
  $('edit').onclick=()=>{
    if(kind==='hist'){
      if($('edit').dataset.c){hist=[];store.set('hist',hist);renderSaved('hist');toast('履歴を消去しました')}
      else{$('edit').dataset.c='1';$('edit').textContent='消去する';$('edit').style.color='var(--danger)';setTimeout(()=>{const b=$('edit');if(b){delete b.dataset.c;b.textContent='消去';b.style.color=''}},3000)}
      return;
    }
    const on=$('edit').textContent==='編集';
    $('edit').textContent=on?'完了':'編集';
    document.querySelectorAll('#sl .cell').forEach(c=>{
      const r=c.querySelector('.r'); const id=c.dataset.go.slice(2);
      if(on){c.dataset.lock='1';r.innerHTML=`<span role="button" class="rm" data-rm="${id}" style="color:var(--danger);font-weight:600">削除</span>`}
      else{delete c.dataset.lock;r.innerHTML=`p.${QA[byId[id]].p}${IC.chev}`}
    });
  };
}
function isRef(l){return /→\s*\d+頁|厚労告|厚令|老発|保医発|疑義解釈|Q&A\(V|問\s*\d+$|^〔/.test(l)}
function fmtAns(a){return a.split('\n').map(l=>isRef(l)?`<span class="ref">${hl(l)}</span>`:hl(l)).join('\n').replace(/\n(?=<span class="ref">)/g,'')}
function renderQ(id){
  const i=byId[id]; if(i==null) return location.replace('#search');
  const x=QA[i], prev=QA[i-1], next=QA[i+1];
  hist=[id,...hist.filter(h=>h!==id)].slice(0,80);store.set('hist',hist);
  const isFav=fav.includes(id);
  setNav({title:'Q'+x.id,left:backBtn(prevLabel()),right:`<button class="nbtn" id="aa" aria-label="文字サイズ">${IC.aa}</button><button class="nbtn" id="fv" aria-pressed="${isFav}" aria-label="お気に入り">${IC.star}</button>`});
  main.innerHTML=`<div class="dhead"><div class="crumb"><span class="k">Q${x.id}</span><span>第${x.ch}章 ${esc(CH[x.ch])}</span></div><h1 class="dtitle">${hl(x.t)}</h1></div>
  ${x.q?`<div class="card q"><span class="lab">Q</span><div class="txt">${hl(x.q)}</div></div>`:''}
  <div class="card a"><span class="lab">A</span><div class="txt">${fmtAns(x.a)||'<span class="ref">この回答は読み取れませんでした。本のページで確認してください。</span>'}</div></div>
  <div class="toolbar">
    <button class="tbtn" data-go="pg-${pageIdx[x.p]}">${IC.page}本 p.${x.p}</button>
    <button class="tbtn" id="cp">${IC.copy}コピー</button>
    <button class="tbtn" id="fv2">${isFav?IC.starF:IC.starO}${isFav?'登録済み':'お気に入り'}</button>
  </div>
  <div class="pager">
    <button class="pbtn" ${prev?`data-swap="q-${prev.id}"`:'disabled'}><small>‹ 前のQ</small><span>${prev?esc(prev.t):''}</span></button>
    <button class="pbtn" ${next?`data-swap="q-${next.id}"`:'disabled'}><small>次のQ ›</small><span>${next?esc(next.t):''}</span></button>
  </div>
  <p class="hint">左右にスワイプしても前後のQに移動できます</p>`;
  const toggle=()=>{fav=fav.includes(id)?fav.filter(f=>f!==id):[id,...fav];store.set('fav',fav);toast(fav.includes(id)?'お気に入りに追加しました':'お気に入りから外しました');const y=scrollY;renderQ(id);scrollTo(0,y)};
  $('fv').onclick=toggle; $('fv2').onclick=toggle;
  $('aa').onclick=()=>{fsIdx=(fsIdx+1)%FS.length;store.set('fs',fsIdx);applyFs();toast(['小','標準','大','特大'][fsIdx])};
  $('cp').onclick=()=>{const t=`Q${x.id} ${x.t}（訪問看護実務相談Q&A p.${x.p}）\n${x.q}\n\nA ${x.a}`;
    (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('コピーしました'),()=>toast('コピーできませんでした'))};
}
function renderPage(i){
  const p=PAGES[i]; if(!p) return location.replace('#toc');
  setNav({title:p.p?'p.'+p.p:'前付',left:backBtn(prevLabel()),right:`<button class="nbtn" id="aa" aria-label="文字サイズ">${IC.aa}</button>`});
  const qs=p.p?QA.filter(x=>x.p===p.p):[];
  main.innerHTML=`<div class="dhead"><div class="crumb"><span class="k">${p.p?'p.'+p.p:'前付'}</span><span>${partOf(p)}</span></div></div>
  ${qs.length?`<div class="ghead" style="margin-top:0">このページのQ</div><div class="group" style="margin-bottom:14px">${qs.map(x=>qaCell(x)).join('')}</div>`:''}
  <div class="pagetext">${p.x.split('\n').map(l=>`<p>${hl(l)}</p>`).join('')}</div>
  <p class="foot">OCRの原文です。表や2段組のページは行が混ざることがあります。</p>
  <div class="pager" style="margin-top:12px">
    <button class="pbtn" ${i>0?`data-swap="pg-${i-1}"`:'disabled'}><small>‹ 前のページ</small><span>${PAGES[i-1]?.p?'p.'+PAGES[i-1].p:''}</span></button>
    <button class="pbtn" ${i<PAGES.length-1?`data-swap="pg-${i+1}"`:'disabled'}><small>次のページ ›</small><span>${PAGES[i+1]?.p?'p.'+PAGES[i+1].p:''}</span></button>
  </div>`;
  $('aa').onclick=()=>{fsIdx=(fsIdx+1)%FS.length;store.set('fs',fsIdx);applyFs();toast(['小','標準','大','特大'][fsIdx])};
}
/* swap = replace current screen (prev/next) without growing the back stack */
function swap(h){stack[stack.length-1]=h;
  const m=h.match(/^q-(\d+)-/), pv=stack[stack.length-2];
  if(m&&pv&&/^ch-\d+$/.test(pv)&&pv!=='ch-'+m[1]){stack[stack.length-2]='ch-'+m[1];history.replaceState(null,'','#'+h)}history.replaceState(null,'','#'+h);render(h);main.classList.remove('push','pop');scrollTo(0,0)}

/* ---------- events ---------- */
document.addEventListener('click',e=>{
  const rm=e.target.closest('[data-rm]');
  if(rm){fav=fav.filter(f=>f!==rm.dataset.rm);store.set('fav',fav);rm.closest('.cell').remove();if(!fav.length)renderSaved('fav');return}
  const b=e.target.closest('[data-go],[data-swap],[data-kw],[data-mode],#bk,.tab'); if(!b) return;
  if(b.closest('[data-lock]')) return;
  if(b.id==='bk') return back();
  if(b.classList.contains('tab')){const t=b.dataset.tab; if(location.hash.slice(1)===t){scrollTo({top:0,behavior:'smooth'});return} location.replace('#'+t); return}
  if(b.dataset.kw){query=b.dataset.kw;saveRecent();renderSearch();return}
  if(b.dataset.mode){mode='pg';store.set('mode',mode);renderSearch();return}
  if(b.dataset.swap) return swap(b.dataset.swap);
  if(b.dataset.go && b.dataset.go!=='pg-undefined'){ if(location.hash.slice(1)==='search') saveRecent(); go(b.dataset.go) }
});
/* swipe: left edge → back; horizontal swipe on detail → prev/next */
let sx=0,sy=0,st=0;
addEventListener('touchstart',e=>{const t=e.touches[0];sx=t.clientX;sy=t.clientY;st=Date.now()},{passive:true});
addEventListener('touchend',e=>{
  const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;
  if(Math.abs(dx)<70||Math.abs(dy)>Math.abs(dx)*0.6||Date.now()-st>600) return;
  if(sx<28&&dx>0&&stack.length>0&&!rootOf(stack[stack.length-1])) return back();
  const p=document.querySelectorAll('.pager .pbtn');
  if(!p.length) return;
  const target=dx<0?p[1]:p[0];
  if(target&&target.dataset.swap) swap(target.dataset.swap);
},{passive:true});
addEventListener('hashchange',route);
if(!location.hash) history.replaceState(null,'','#'+curTab);
route();
