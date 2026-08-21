const CACHE='hk-trip-2026-v5';
const ASSETS=['./','./index.html','./manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));

const PAGE_PATCH=`<script>(function(){
  const HOTEL_URL='https://www.google.com/maps/search/?api=1&query=Prudential+Hotel+222+Nathan+Road+Hong+Kong';
  function applyPageFixes(){
    document.querySelectorAll('a[href*="Ljfb7mSmc41eyq7K9"]').forEach(a=>a.href=HOTEL_URL);
    document.querySelectorAll('a').forEach(a=>{
      if(a.textContent.includes('希爾頓')||a.textContent.includes('Hilton')){
        a.textContent=a.textContent.replaceAll('希爾頓','恆豐酒店').replaceAll('Hilton','Prudential Hotel');
      }
    });
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n=>{if(n.nodeValue.includes('希爾頓')||n.nodeValue.includes('Hilton')) n.nodeValue=n.nodeValue.replaceAll('希爾頓','恆豐酒店').replaceAll('Hilton','Prudential Hotel');});
    const flightCard=document.querySelector('.trip-info .info-card:first-child');
    if(flightCard){
      flightCard.innerHTML='<h3>✈️ 機票資訊</h3><div style="display:grid;gap:10px"><div style="padding:11px;border-radius:13px;background:var(--bg);border:1px solid var(--line)"><div style="font-size:13px;color:var(--sub);margin-bottom:5px">去程｜8/22｜UO 131</div><div style="font-size:16px">10:15 高雄 KHH → 11:45 香港 HKG</div><div style="font-size:12px;color:var(--sub);margin-top:4px">飛行時間約 1 小時 30 分</div></div><div style="padding:11px;border-radius:13px;background:var(--bg);border:1px solid var(--line)"><div style="font-size:13px;color:var(--sub);margin-bottom:5px">回程｜8/25｜BR 850</div><div style="font-size:16px">19:25 香港 HKG → 21:00 高雄 KHH</div><div style="font-size:12px;color:var(--sub);margin-top:4px">飛行時間約 1 小時 35 分</div></div></div>';
    }
    const day=document.querySelector('#day-0825');
    if(day){
      const note=day.querySelector('.date-note'); if(note) note.textContent='回程日';
      const empty=day.querySelector('.empty'); if(empty) empty.remove();
      const timeline=day.querySelector('.timeline');
      if(timeline && !timeline.querySelector('[data-id="0825-flight"]')){
        const a=document.createElement('article');
        a.className='stop'; a.dataset.id='0825-flight';
        a.innerHTML='<div class="stop-head"><div class="num">✈️</div><div class="stop-main"><div class="stop-title">回程航班・BR 850</div><div class="stop-note">19:25 香港 HKG 起飛 → 21:00 高雄 KHH 抵達｜飛行時間約 1 小時 35 分。</div><div class="stop-actions"><button class="editbtn doneBtn">✓ 完成</button></div></div></div>';
        timeline.prepend(a);
        if(typeof updateProgress==='function') updateProgress();
      }
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',applyPageFixes); else applyPageFixes();
})();<\/script>`;

async function patchPage(response){
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html')) return response;
  let text=await response.text();
  text=text.replaceAll('https://maps.app.goo.gl/Ljfb7mSmc41eyq7K9?g_st=com.apple.sharing.quick-note','https://www.google.com/maps/search/?api=1&query=Prudential+Hotel+222+Nathan+Road+Hong+Kong');
  text=text.replaceAll('希爾頓','恆豐酒店').replaceAll('Hilton','Prudential Hotel');
  text=text.replace('</body>',PAGE_PATCH+'</body>');
  const headers=new Headers(response.headers);
  headers.delete('content-length'); headers.delete('content-encoding');
  return new Response(text,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  if(e.request.mode==='navigate'){
    e.respondWith((async()=>{
      try{
        const r=await fetch(e.request,{cache:'no-store'});
        const copy=r.clone(); caches.open(CACHE).then(c=>c.put('./index.html',copy));
        return await patchPage(r);
      }catch(_){
        const cached=await caches.match('./index.html');
        return cached?patchPage(cached):Response.error();
      }
    })());
    return;
  }
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request)));
});