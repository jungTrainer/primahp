(() => {
  'use strict';

  function openSection(view) {
    const menuButton = document.querySelector(`[data-view="${view}"]`);
    if (menuButton) menuButton.click();
    else location.hash = view;
  }

  function applySplitHero() {
    const home = document.getElementById('home');
    if (!home || home.dataset.splitHero === 'true') return;

    const currentImage = document.getElementById('hero-image');
    const currentEyebrow = document.getElementById('hero-eyebrow');
    const currentTitle = document.getElementById('hero-title');
    const currentDescription = document.getElementById('hero-description');

    const imageSrc = currentImage?.getAttribute('src') || 'assets/home.png';
    const imageAlt = currentImage?.getAttribute('alt') || '프리마요양병원 전경';
    const eyebrow = currentEyebrow?.textContent || '소통 · 공감 · 화합 · 행복';
    const title = currentTitle?.innerHTML || '내 부모님처럼 따뜻하게<br>정성껏 보살펴 드립니다.';
    const description = currentDescription?.textContent || '환자와 가족이 안심할 수 있도록 진료, 간호, 재활, 생활 환경을 세심하게 살피겠습니다.';

    home.dataset.splitHero = 'true';
    home.className = 'overflow-hidden border-b border-brand-border bg-white';
    home.innerHTML = `
      <div class="mx-auto max-w-[1500px] px-5 py-12 sm:px-8 md:py-16 lg:px-10 lg:py-20">
        <div class="grid min-h-[650px] items-center gap-12 lg:grid-cols-[0.93fr_1.07fr] xl:gap-20">
          <div class="order-2 lg:order-1 lg:pr-4">
            <span id="hero-eyebrow" class="section-kicker inline-flex rounded-full border border-brand-border bg-brand-lightBg px-4 py-2 text-[11px] font-black text-brand-blue">${eyebrow}</span>
            <h1 id="hero-title" class="font-serif-warm mt-7 max-w-2xl text-4xl font-bold leading-[1.22] tracking-tight text-brand-navy sm:text-5xl lg:text-[3.7rem]">${title}</h1>
            <p id="hero-description" class="mt-6 max-w-xl text-sm leading-7 text-slate-500 sm:text-base sm:leading-8">${description}</p>

            <div class="mt-9 flex flex-wrap gap-3">
              <button id="hero-facilities-button" type="button" class="rounded-2xl bg-slate-950 px-7 py-4 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-blue">병원 둘러보기</button>
              <a href="tel:051-867-7500" class="rounded-2xl border border-brand-border bg-white px-7 py-4 text-sm font-black text-brand-navy shadow-sm transition hover:border-brand-blue hover:text-brand-blue"><i class="fa-solid fa-phone mr-2 text-emerald-600"></i>전화 상담</a>
            </div>

            <div class="mt-14 grid max-w-2xl grid-cols-3 divide-x divide-brand-border border-t border-brand-border pt-8">
              <div class="pr-4">
                <strong class="font-serif-warm block text-lg font-bold text-brand-navy sm:text-xl">연산역 인근</strong>
                <span class="mt-2 block text-[11px] text-slate-400">편리한 접근성</span>
              </div>
              <div class="px-4 sm:px-6">
                <strong class="font-serif-warm block text-lg font-bold text-brand-navy sm:text-xl">양·한방 협진</strong>
                <span class="mt-2 block text-[11px] text-slate-400">통합 진료 지원</span>
              </div>
              <div class="pl-4 sm:pl-6">
                <strong class="font-serif-warm block text-lg font-bold text-brand-navy sm:text-xl">재활·간호</strong>
                <span class="mt-2 block text-[11px] text-slate-400">환자 중심 케어</span>
              </div>
            </div>
          </div>

          <div class="order-1 lg:order-2">
            <div class="relative mx-auto max-w-3xl overflow-hidden rounded-[2.25rem] bg-slate-100 shadow-[0_28px_70px_rgba(15,23,42,.16)] lg:min-h-[650px]">
              <img id="hero-image" src="${imageSrc}" alt="${imageAlt}" class="h-[470px] w-full object-cover sm:h-[600px] lg:absolute lg:inset-0 lg:h-full">
              <div class="pointer-events-none absolute inset-0 rounded-[2.25rem] ring-1 ring-inset ring-black/5"></div>
              <div class="absolute bottom-5 left-5 rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
                <strong class="block text-sm text-brand-navy">프리마요양병원</strong>
                <span class="mt-1 block text-[10px] text-slate-500">부산 연제구 고분로 4</span>
              </div>
              <div id="hero-placeholder-badge" class="hidden"></div>
            </div>
          </div>
        </div>
      </div>`;

    document.getElementById('hero-facilities-button')?.addEventListener('click', () => openSection('facilities'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySplitHero, { once: true });
  } else {
    applySplitHero();
  }
})();
