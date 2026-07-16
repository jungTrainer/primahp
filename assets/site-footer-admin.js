(() => {
  'use strict';

  function addAdminLink() {
    const footer = document.querySelector('footer');
    if (!footer || document.getElementById('prima-admin-link')) return false;

    const host = footer.querySelector('.mx-auto') || footer;
    const link = document.createElement('a');
    link.id = 'prima-admin-link';
    link.href = 'admin.html';
    link.className = 'inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-[11px] font-bold text-slate-300 transition hover:border-white/40 hover:bg-white/10 hover:text-white';
    link.setAttribute('aria-label', '프리마요양병원 관리자 페이지로 이동');
    link.innerHTML = '<i class="fa-solid fa-lock"></i><span>관리자 페이지 이동</span>';

    const wrap = document.createElement('div');
    wrap.className = 'mt-6 border-t border-white/10 pt-5 md:col-span-3';
    wrap.appendChild(link);
    host.appendChild(wrap);
    return true;
  }

  if (!addAdminLink()) {
    const observer = new MutationObserver(() => {
      if (addAdminLink()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 10000);
  }
})();
