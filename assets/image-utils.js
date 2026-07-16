(() => {
  'use strict';

  const loadImage = file => new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => { URL.revokeObjectURL(objectUrl); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('이미지를 읽을 수 없습니다.')); };
    image.src = objectUrl;
  });

  const canvasBlob = (canvas, type, quality) => new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('이미지 압축에 실패했습니다.')), type, quality);
  });

  async function compressImage(file, options = {}) {
    if (!file || !String(file.type || '').startsWith('image/')) throw new Error('이미지 파일을 선택해 주세요.');
    const { maxDimension = 1400, targetBytes = 800 * 1024, initialQuality = 0.82, minQuality = 0.72, outputType = 'image/jpeg' } = options;
    const image = await loadImage(file);
    const ratio = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * ratio));
    const height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d', { alpha: outputType !== 'image/jpeg' });
    if (outputType === 'image/jpeg') { context.fillStyle = '#ffffff'; context.fillRect(0, 0, width, height); }
    context.drawImage(image, 0, 0, width, height);
    let quality = initialQuality;
    let blob = await canvasBlob(canvas, outputType, quality);
    while (blob.size > targetBytes && quality > minQuality) {
      quality = Math.max(minQuality, Number((quality - 0.03).toFixed(2)));
      blob = await canvasBlob(canvas, outputType, quality);
    }
    const extension = outputType === 'image/webp' ? 'webp' : outputType === 'image/png' ? 'png' : 'jpg';
    const baseName = String(file.name || 'image').replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9가-힣_-]/g, '-');
    const compressedFile = new File([blob], `${baseName}.${extension}`, { type: outputType, lastModified: Date.now() });
    return { file: compressedFile, originalBytes: file.size, compressedBytes: compressedFile.size, width, height, quality };
  }

  const formatBytes = bytes => {
    if (!Number.isFinite(bytes)) return '-';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
  };

  window.PrimaImageTools = { compressImage, formatBytes };
})();
