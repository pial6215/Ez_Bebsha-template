// ─── App Object ───────────────────────────────────────────────────────────────
const App = {

  _initialized: false,
  _timerIntervals: [],

  initPage() {
    if (this._initialized) return;
    this._initialized = true;

    this.initToast();          
    this.initCartBadge();
    this.initMobileMenu();
    this.initHeaderButtons();
    this.initiateCountdownTimers();

    const page = document.body?.dataset?.page;
    if (page === 'home')           this.initHome();
    if (page === 'product-detail') this.initProductDetail();
  },

  // ─── Toast Notification System 
  initToast() {
    if (document.getElementById('app-toast-container')) return;
    const container = document.createElement('div');
    container.id = 'app-toast-container';
    container.style.cssText = [
      'position:fixed', 'bottom:24px', 'right:24px', 'z-index:9999',
      'display:flex', 'flex-direction:column', 'gap:10px',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(container);
  },

  showToast(message, type = 'success') {
    const container = document.getElementById('app-toast-container');
    if (!container) return;

    const colors = {
      success: { bg: '#1c4d4f', text: '#fff' },
      error:   { bg: '#f43f5e', text: '#fff' },
      info:    { bg: '#0ea5e9', text: '#fff' },
    };
    const { bg, text } = colors[type] || colors.success;

    const toast = document.createElement('div');
    toast.style.cssText = [
      `background:${bg}`, `color:${text}`,
      'padding:12px 20px', 'border-radius:12px',
      'font-family:Inter,sans-serif', 'font-size:13px', 'font-weight:700',
      'box-shadow:0 8px 24px rgba(0,0,0,0.15)',
      'pointer-events:auto',
      'opacity:0', 'transform:translateY(12px)',
      'transition:opacity 0.25s ease, transform 0.25s ease',
      'max-width:320px', 'line-height:1.4'
    ].join(';');
    toast.textContent = message;
    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
      });
    });

    // Animate out after 3s
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 280);
    }, 3000);
  },

  // ─── Cart Badge ─────────────────────────────────────────────────────────────
  initCartBadge() {
    const badge = document.getElementById('global-cart-count');
    if (!badge) return;
    try {
      const stored = parseInt(localStorage.getItem('cartTotal'), 10);
      if (Number.isFinite(stored) && stored > 0) badge.textContent = stored;
    } catch (e) {}
  },

  // ─── Mobile Menu ────────────────────────────────────────────────────────────
  initMobileMenu() {
    const btn  = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('mobileMenu');
    if (btn && menu) {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        menu.classList.toggle('hidden');
      });
    }
  },

  // ─── Header Buttons ─────────────────────────────────────────────────────────
  initHeaderButtons() {
    try {
      function findHeaderButtonByPath(fragment) {
        for (const btn of document.querySelectorAll('header button')) {
          const path = btn.querySelector('svg path');
          if (path?.getAttribute('d')?.includes(fragment)) return btn;
        }
        return null;
      }

      // SEARCH
      const searchBtn = document.getElementById('searchBtnHeader') || findHeaderButtonByPath('M21 21l-6-6');
      if (searchBtn) {
        searchBtn.addEventListener('click', e => {
          e.preventDefault();
          const existing = document.getElementById('nav-search-overlay');
          if (existing) { existing._remove?.(); return; }
          App._createSearchOverlay();
        });
      }

      // ACCOUNT
      const accountBtn = document.getElementById('accountBtnHeader') || findHeaderButtonByPath('M16 7a4 4');
      if (accountBtn) {
        accountBtn.addEventListener('click', e => {
          e.preventDefault();
          window.location.href = 'account.html';
        });
      }

      // CART
      const badge   = document.getElementById('global-cart-count');
      let   cartBtn = document.getElementById('cartBtnHeader');
      if (!cartBtn && badge)        cartBtn = badge.closest('button');
      if (!cartBtn)                 cartBtn = findHeaderButtonByPath('M16 11V7');
      if (cartBtn) {
        cartBtn.addEventListener('click', e => {
          e.preventDefault();
          window.location.href = 'checkout.html';
        });
      }

      // VIEW buttons
      document.querySelectorAll('button').forEach(b => {
        if (b.textContent?.trim().toUpperCase() === 'VIEW') {
          b.addEventListener('click', e => {
            e.preventDefault();
            window.location.href = 'product-detail.html';
          });
        }
      });
    } catch (err) { console.error('initHeaderButtons error', err); }
  },

  _createSearchOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'nav-search-overlay';
    overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4';

    const panel = document.createElement('form');
    panel.id = 'nav-search-panel';
    panel.className = 'w-full max-w-3xl bg-white rounded-2xl p-4 shadow-lg flex items-center gap-3 border border-slate-100';
    panel.action = 'search.html';
    panel.method = 'get';

    const input = document.createElement('input');
    input.type = 'search';
    input.name = 'q';
    input.placeholder = 'Search products, categories, SKUs…';
    input.className = 'flex-1 px-4 py-3 border rounded-lg border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand';

    const btn = document.createElement('button');
    btn.type = 'submit';
    btn.className = 'bg-brand text-white font-bold px-4 py-3 rounded-lg hover:bg-brand-light';
    btn.textContent = 'Search';

    panel.appendChild(input);
    panel.appendChild(btn);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    document.documentElement.classList.add('overflow-hidden');
    document.body.classList.add('overflow-hidden');

    function removeOverlay() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      document.documentElement.classList.remove('overflow-hidden');
      document.body.classList.remove('overflow-hidden');
      document.removeEventListener('keydown', onKey);
    }

    overlay.addEventListener('click', e => { if (e.target === overlay) removeOverlay(); });
    panel.addEventListener('click', e => e.stopPropagation());
    function onKey(e) { if (e.key === 'Escape') removeOverlay(); }
    document.addEventListener('keydown', onKey);
    overlay._remove = removeOverlay;
    setTimeout(() => input.focus(), 60);
  },

  // ─── Countdown Timers ───────────────────────────────────────────────────────
  initiateCountdownTimers() {
    // আগের কোনো ইন্টারভাল সচল থাকলে তা আগে ক্লিয়ার করে মেমোরি সেভ করবে
    this._timerIntervals.forEach(clearInterval);
    this._timerIntervals = [];

    document.querySelectorAll('.js-countdown').forEach(el => {
      const hours = parseInt(el.getAttribute('data-hours'), 10) || 24;
      const target = Date.now() + hours * 60 * 60 * 1000;

      const tick = () => {
        const diff = target - Date.now();
        if (diff <= 0) { 
          el.textContent = 'PROMOTION EXPIRED'; 
          return; 
        }
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        const p = n => String(n).padStart(2, '0');
        el.textContent = `${p(d)}d : ${p(h)}h : ${p(m)}m : ${p(s)}s`;
      };
      
      tick();
      const intervalId = setInterval(tick, 1000);
      this._timerIntervals.push(intervalId); // অ্যারেতে ইন্টারভাল ট্র্যাক রাখা হচ্ছে
    });
  },

  // ─── Home Page ──────────────────────────────────────────────────────────────
  initHome() {
    try {
      const badge = document.getElementById('global-cart-count');
      let cartCount = parseInt(localStorage.getItem('cartTotal'), 10) || 0;

      document.querySelectorAll('.product-card').forEach(card => {
        const minVal = parseInt(card.getAttribute('data-min'), 10) || 1;
        const maxVal = parseInt(card.getAttribute('data-max'), 10) || 9999;
        const minusBtn   = card.querySelector('.minus-btn');
        const plusBtn    = card.querySelector('.plus-btn');
        const qtyView    = card.querySelector('.quantity-value');
        const buyButton  = card.querySelector('.buy-btn');

        if (qtyView) qtyView.textContent = String(minVal);

        if (minusBtn && qtyView) {
          minusBtn.addEventListener('click', e => {
            e.stopPropagation();
            let cur = parseInt(qtyView.textContent, 10) || minVal;
            if (cur > minVal) qtyView.textContent = String(--cur);
          });
        }

        if (plusBtn && qtyView) {
          plusBtn.addEventListener('click', e => {
            e.stopPropagation();
            let cur = parseInt(qtyView.textContent, 10) || minVal;
            if (cur < maxVal) qtyView.textContent = String(++cur);
          });
        }

        // কার্ডে ক্লিক করলে কারেন্ট সিলেক্টেড কোয়ান্টিটিসহ ডিটেইলস পেজে যাবে
        card.addEventListener('click', () => {
          const currentQty = parseInt(qtyView?.textContent, 10) || minVal;
          App._saveProductContext(card, currentQty);
          window.location.href = 'product-detail.html';
        });

        // BUY বাটনে ক্লিক লজিক (কার্টে অ্যাড + নোটিফিকেশন + রিডাইরেক্ট একসাথে)
        if (buyButton) {
          buyButton.addEventListener('click', e => {
            e.stopPropagation();
            const qty = parseInt(qtyView?.textContent, 10) || minVal;

            // কারেন্ট আপডেটেড কোয়ান্টিটিসহ কনটেক্সট সেভ করা হচ্ছে
            App._saveProductContext(card, qty);

            // কার্ট আপডেট মেকানিজম
            cartCount += qty;
            if (badge) badge.textContent = String(cartCount);
            try { localStorage.setItem('cartTotal', String(cartCount)); } catch (_) {}

            // ব্যাজ অ্যানিমেশন
            if (badge) {
              badge.classList.add('scale-125', 'bg-emerald-500');
              setTimeout(() => badge.classList.remove('scale-125', 'bg-emerald-500'), 300);
            }

            const name = card.getAttribute('data-product-name') || 'Item';
            App.showToast(`🛒 Added ${qty} × ${name} to cart!`);

            // টোস্ট নোটিফিকেশন এবং কার্ট অ্যানিমেশন শেষ হলে সুন্দরভাবে রিডাইরেক্ট হবে
            setTimeout(() => {
              window.location.href = 'product-detail.html';
            }, 800);
          });
        }
      });
    } catch (err) { console.error('initHome error', err); }
  },

  // Helper: localStorage-quantity
  _saveProductContext(card, selectedQty) {
    const name     = card.getAttribute('data-product-name') || card.querySelector('h3')?.textContent.trim() || '';
    const price    = card.getAttribute('data-price') || '';
    const oldPrice = card.getAttribute('data-old-price') || '';
    const imgEl    = card.querySelector('[style*="background-image"]');
    const image    = card.getAttribute('data-image') ||
                     (imgEl?.style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '')) || '';
    try {
      localStorage.setItem('productName',     name);
      localStorage.setItem('productPrice',    price);
      localStorage.setItem('productOldPrice', oldPrice);
      localStorage.setItem('productImage',    image);
      localStorage.setItem('minQty',          String(selectedQty));
    } catch (_) {}
  },

  // ─── Product Detail Page ────────────────────────────────────────────────────
  initProductDetail() {
    try {
      // Thumbnail gallery
      const mainImage = document.getElementById('mainImage');
      document.querySelectorAll('.thumb').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
          btn.classList.add('active');
          const img = btn.dataset.image;
          if (mainImage && img) mainImage.style.backgroundImage = `url('${img}')`;
        });
      });

      // Size button active state toggle
      document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.size-btn').forEach(b => {
            b.classList.remove('bg-brand', 'text-white');
            b.classList.add('border', 'border-slate-300');
          });
          btn.classList.add('bg-brand', 'text-white');
          btn.classList.remove('border', 'border-slate-300');
        });
      });

      // Quantity stepper
      const qtyValue = document.getElementById('qtyValue');
      const plusBtn  = document.getElementById('plusBtn');
      const minusBtn = document.getElementById('minusBtn');

      const storedMin = parseInt(localStorage.getItem('minQty'), 10);
      const BASE_MIN  = Number.isFinite(storedMin) && storedMin > 0 ? storedMin : 1;
      const MAX_QTY   = 9999;
      let qty = BASE_MIN;
      if (qtyValue) qtyValue.textContent = String(qty);

      if (plusBtn)  plusBtn.addEventListener('click',  () => { if (qty < MAX_QTY) { qty++; if (qtyValue) qtyValue.textContent = String(qty); } });
      if (minusBtn) minusBtn.addEventListener('click', () => { if (qty > BASE_MIN) { qty--; if (qtyValue) qtyValue.textContent = String(qty); } });

      // Populate product info from localStorage with ৳ prefix
      try {
        const storedName     = localStorage.getItem('productName');
        const storedPrice    = localStorage.getItem('productPrice');
        const storedOldPrice = localStorage.getItem('productOldPrice');
        const storedImage    = localStorage.getItem('productImage');

        if (storedName) {
          const titleEl = document.getElementById('productTitle');
          if (titleEl) titleEl.textContent = storedName;
          const crumbEl = document.getElementById('productBreadcrumb');
          if (crumbEl) crumbEl.textContent = storedName;
        }

        if (storedPrice) {
          const priceEl = document.getElementById('productPrice');
          if (priceEl) {
            const numStr = storedPrice.replace(/[^\d.]/g, '');
            priceEl.textContent = `৳${parseFloat(numStr).toLocaleString('en-BD')}`;
          }
        }

        if (storedOldPrice) {
          const oldEl = document.getElementById('productOldPrice');
          if (oldEl) {
            const numStr = storedOldPrice.replace(/[^\d.]/g, '');
            oldEl.textContent = `৳${parseFloat(numStr).toLocaleString('en-BD')}`;
          }
        }

        if (storedImage) {
          if (mainImage) mainImage.style.backgroundImage = `url('${storedImage}')`;
        }

        const minNote = document.getElementById('minOrderNote');
        if (minNote) minNote.textContent = `Min. Order: ${BASE_MIN} pc`;

      } catch (err) { console.error('initProductDetail populate error', err); }

      // Cart helpers
      const badge = document.getElementById('global-cart-count');
      const getQty = () => { const n = parseInt(qtyValue?.textContent, 10); return Number.isFinite(n) ? n : BASE_MIN; };

      function animateBadge() {
        if (!badge) return;
        badge.classList.add('scale-125', 'bg-emerald-500');
        setTimeout(() => badge.classList.remove('scale-125', 'bg-emerald-500'), 300);
      }

      function addToBadge(amount) {
        if (!badge) return;
        const current = parseInt(badge.textContent, 10) || 0;
        const next    = current + amount;
        badge.textContent = String(next);
        try { localStorage.setItem('cartTotal', String(next)); } catch (_) {}
        animateBadge();
      }

      const addBtn = document.getElementById('addToCartBtn');
      const buyBtn = document.getElementById('buyNowBtn');

      if (addBtn) {
        addBtn.addEventListener('click', e => {
          e.preventDefault();
          const q = getQty();
          addToBadge(q);
          App.showToast(`🛒 ${q} item(s) added to cart!`);
        });
      }

      if (buyBtn) {
        buyBtn.addEventListener('click', e => {
          e.preventDefault();
          addToBadge(getQty());
          setTimeout(() => window.location.href = 'checkout.html', 350);
        });
      }

    } catch (err) { console.error('initProductDetail error', err); }
  }
};

// ─── App Initialization / Trigger Engine ──────────────────────────────────────
window.App = App;
function runLoader() {
  if (window.App && typeof window.App.initPage === 'function') {
    window.App.initPage();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runLoader);
} else {
  runLoader();
}
window.addEventListener('load', runLoader);