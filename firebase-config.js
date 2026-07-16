// 브라우저용 Firebase 공개 설정만 불러옵니다.
if (!window.__firebase_config) {
  document.write('<script src="firebase-public-config.js?v=20260716-8"><\/script>');
}
(() => {
  const page = location.pathname.split('/').pop() || 'index.html';
  const load = src => { const s=document.createElement('script');s.src=`${src}?v=20260716-8`;s.defer=true;document.head.appendChild(s); };
  if (page === 'index.html') {
    window.addEventListener('load',()=>{
      load('assets/ga4-loader.js');
      if (new URLSearchParams(location.search).get('preview') === '1') load('assets/site-editor-ui.js');
    },{once:true});
  }
  if (page === 'admin.html') window.addEventListener('load',()=>{load('assets/admin-seed.js');load('assets/admin-editor-events.js');},{once:true});
})();