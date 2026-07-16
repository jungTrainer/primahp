(() => {
  'use strict';

  const tools = window.PrimaImageTools;
  if (!tools) return;

  const bypass = new WeakSet();
  const supportedIds = new Set(['heroImage', 'photo']);

  function optionsFor(input) {
    const kind = document.getElementById('kind')?.value || '';
    const isDocument = input.id === 'photo' && kind === 'certifications';
    return isDocument
      ? { maxDimension: 1800, targetBytes: 1.2 * 1024 * 1024, initialQuality: 0.82, minQuality: 0.72 }
      : { maxDimension: 1400, targetBytes: 800 * 1024, initialQuality: 0.82, minQuality: 0.72 };
  }

  function statusNode(input) {
    let node = input.parentElement?.querySelector('.prima-compress-status');
    if (node) return node;
    node = document.createElement('p');
    node.className = 'prima-compress-status mt-2 text-[11px] leading-5 text-slate-500';
    input.insertAdjacentElement('afterend', node);
    return node;
  }

  function redispatch(input) {
    bypass.add(input);
    input.dispatchEvent(new Event('change', { bubbles: true }));
    window.setTimeout(() => bypass.delete(input), 0);
  }

  document.addEventListener('change', async event => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.type !== 'file' || !supportedIds.has(input.id)) return;
    if (bypass.has(input)) return;

    const original = input.files?.[0];
    if (!original || !String(original.type || '').startsWith('image/')) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const status = statusNode(input);
    input.disabled = true;
    status.className = 'prima-compress-status mt-2 text-[11px] leading-5 text-brand-blue';
    status.textContent = '이미지를 홈페이지용 크기로 자동 최적화하고 있습니다.';

    try {
      const result = await tools.compressImage(original, optionsFor(input));
      const transfer = new DataTransfer();
      transfer.items.add(result.file);
      input.files = transfer.files;
      status.className = 'prima-compress-status mt-2 text-[11px] leading-5 text-emerald-700';
      status.textContent = `자동 최적화 완료: ${tools.formatBytes(result.originalBytes)} → ${tools.formatBytes(result.compressedBytes)} · ${result.width}×${result.height}px`;
    } catch (error) {
      status.className = 'prima-compress-status mt-2 text-[11px] leading-5 text-rose-700';
      status.textContent = `자동 최적화에 실패해 원본으로 진행합니다. ${error?.message || ''}`.trim();
    } finally {
      input.disabled = false;
      redispatch(input);
    }
  }, true);
})();
