const fs = require('fs');

const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');

function replaceOnce(search, replacement, label) {
  if (html.includes(replacement)) return;
  if (!html.includes(search)) throw new Error(`Patch target not found: ${label}`);
  html = html.replace(search, replacement);
}

replaceOnce(
`      function escapeHtml(str) {
        if (!str) return '';
        return str.toString()
                  .replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/"/g, "&quot;")
                  .replace(/'/g, "&#039;");
      }

      /* ================= 4. SHA-256 CLIENT DECRYPTION HASHING ================= */`,
`      function escapeHtml(str) {
        if (!str) return '';
        return str.toString()
                  .replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/"/g, "&quot;")
                  .replace(/'/g, "&#039;");
      }

      let toastTimer = null;
      const showToast = (message) => {
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toast-msg');
        if (!toast || !toastMsg) return;
        toastMsg.textContent = message;
        toast.classList.remove('hidden');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.add('hidden'), 3500);
      };

      const closeConfirmModal = () => {
        const modal = document.getElementById('confirmModal');
        if (modal) modal.classList.replace('flex', 'hidden');
      };

      /* ================= 4. SHA-256 CLIENT DECRYPTION HASHING ================= */`,
  'toast and confirm helpers'
);

replaceOnce(
`      window.navigateTo = navigateTo;
      window.toggleMobileMenu = toggleMobileMenu;`,
`      window.navigateTo = navigateTo;
      window.toggleMobileMenu = toggleMobileMenu;
      window.showToast = showToast;
      window.closeConfirmModal = closeConfirmModal;`,
  'runtime helper exposure'
);

fs.writeFileSync(file, html);
console.log('Runtime helper fixes applied successfully.');
