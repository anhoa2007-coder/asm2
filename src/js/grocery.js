(() => {
  const products = window.groceryProducts || [];
  const cartKey = 'huyhoang-grocery-cart-v1';
  const sessionKey = 'huyhoang-auth-session-v1';
  const base = document.body.dataset.base;
  const detailPagePath = product => product.detailPageSlug || product.id;
  const money = amount => new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
  const cartLive = document.createElement('p');
  cartLive.className = 'sr-only'; cartLive.setAttribute('role', 'status'); document.body.append(cartLive);
  const readSignedInEmail = () => {
    try {
      return localStorage.getItem(sessionKey);
    } catch {
      cartLive.textContent = 'Không thể truy cập dữ liệu tài khoản trong trình duyệt.';
      return null;
    }
  };
  const hasSignedInAccount = () => Boolean(readSignedInEmail());
  const createActionIcon = pathData => {
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.classList.add('grocery-action-icon');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    icon.append(path);
    return icon;
  };
  const readCart = () => {
    try {
      const value = JSON.parse(localStorage.getItem(cartKey) || '[]');
      if (!Array.isArray(value)) return [];
      return value.reduce((items, item) => {
        const quantity = Number(item.quantity);
        if (products.some(product => product.id === item.id) && Number.isInteger(quantity) && quantity > 0) {
          const existing = items.find(entry => entry.id === item.id);
          if (existing) existing.quantity = Math.min(99, existing.quantity + quantity);
          else items.push({ id: item.id, quantity: Math.min(99, quantity) });
        }
        return items;
      }, []);
    } catch {
      cartLive.textContent = 'Không thể đọc giỏ hàng đã lưu. Giỏ hàng mới sẽ được tạo.';
      return [];
    }
  };
  let cart = readCart();
  const renderCartAccess = () => {
    const signedIn = hasSignedInAccount();
    const quantity = cart.reduce((count, item) => count + item.quantity, 0);
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.textContent = quantity;
      el.closest('a')?.setAttribute('aria-label', `Giỏ hàng, ${quantity} sản phẩm`);
    });
    document.querySelectorAll('a[href*="checkout.html"]').forEach(link => {
      link.hidden = !signedIn;
    });
    document.querySelectorAll('[data-cart-add]').forEach(button => {
      if (!button.dataset.signedInLabel) button.dataset.signedInLabel = button.textContent;
      button.textContent = signedIn ? button.dataset.signedInLabel : 'Đăng nhập để thêm giỏ';
      button.setAttribute('aria-label', button.textContent);
    });
  };
  const saveCart = () => {
    try {
      localStorage.setItem(cartKey, JSON.stringify(cart));
      return true;
    } catch {
      cartLive.textContent = 'Trình duyệt không cho phép lưu giỏ hàng. Giỏ hàng chỉ còn trong phiên hiện tại.';
      return false;
    }
  };
  const addButton = (id, label = 'Thêm vào giỏ') => {
    const button = document.createElement('button');
    button.className = 'grocery-add-to-cart';
    button.type = 'button';
    button.dataset.cartAdd = id;
    button.dataset.signedInLabel = label;
    button.textContent = hasSignedInAccount() ? label : 'Đăng nhập để thêm giỏ';
    return button;
  };
  document.querySelectorAll('.nav-actions .grocery-cart-link').forEach(link => {
    if (!link.querySelector('.grocery-action-icon')) {
      link.prepend(createActionIcon('M3.5 4.5h2l2.1 10.1a1.75 1.75 0 0 0 1.7 1.4h8.1a1.75 1.75 0 0 0 1.7-1.35L20.5 8H6.1M9.5 20a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM17 20a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z'));
    }
  });
  document.querySelectorAll('.nav-actions').forEach(actions => {
    if (actions.querySelector('[data-cart-count]')) return;
    const link = document.createElement('a');
    link.className = 'grocery-cart-link';
    link.href = `${base}src/html/checkout.html`;
    link.setAttribute('aria-label', 'Giỏ hàng');
    link.title = 'Giỏ hàng';
    link.append(createActionIcon('M3.5 4.5h2l2.1 10.1a1.75 1.75 0 0 0 1.7 1.4h8.1a1.75 1.75 0 0 0 1.7-1.35L20.5 8H6.1M9.5 20a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM17 20a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z'));
    const count = document.createElement('span');
    count.dataset.cartCount = '';
    count.textContent = '0';
    link.append(count);
    const authLink = actions.querySelector('.auth-nav-link');
    actions.insertBefore(link, authLink);
  });
  document.querySelectorAll('.mobile-nav-links').forEach(nav => {
    if (nav.querySelector('[data-cart-count]')) return;
    const link = document.createElement('a');
    link.className = 'grocery-mobile-cart-link';
    link.href = `${base}src/html/checkout.html`;
    link.append('Giỏ hàng ');
    const count = document.createElement('span');
    count.dataset.cartCount = '';
    count.textContent = '0';
    link.append(count);
    nav.append(link);
  });
  const makeAccountLink = (label, page, className) => {
    const link = document.createElement('a');
    link.className = className;
    link.href = `${base}src/html/${page}.html`;
    link.textContent = label;
    return link;
  };
  const updateAccountNavigation = () => {
    const email = readSignedInEmail();
    document.querySelectorAll('.nav-actions').forEach(actions => {
      actions.querySelectorAll('.auth-nav-link, [data-auth-user], [data-auth-logout]').forEach(el => el.remove());
      if (email) {
        const greeting = document.createElement('span');
        greeting.className = 'auth-nav-link account-greeting';
        greeting.dataset.authUser = '';
        greeting.textContent = email;
        const logout = document.createElement('button');
        logout.className = 'btn btn-outline auth-nav-link';
        logout.type = 'button';
        logout.dataset.authLogout = '';
        logout.textContent = 'Đăng xuất';
        actions.append(greeting, logout);
      } else {
        actions.append(
          makeAccountLink('Đăng nhập', 'sign-in', 'btn btn-outline auth-nav-link'),
          makeAccountLink('Đăng ký', 'sign-up', 'btn btn-solid auth-nav-link'),
        );
      }
    });
    document.querySelectorAll('.mobile-nav-drawer').forEach(drawer => {
      let actions = drawer.querySelector('.mobile-nav-actions');
      if (!actions) {
        actions = document.createElement('div');
        actions.className = 'mobile-nav-actions';
        drawer.append(actions);
      }
      actions.replaceChildren();
      if (email) {
        const greeting = document.createElement('span');
        greeting.className = 'mobile-account-greeting';
        greeting.textContent = email;
        const logout = document.createElement('button');
        logout.className = 'btn mobile-nav-auth-btn';
        logout.type = 'button';
        logout.dataset.authLogout = '';
        logout.textContent = 'Đăng xuất';
        actions.append(greeting, logout);
      } else {
        actions.append(
          makeAccountLink('Đăng nhập', 'sign-in', 'btn mobile-nav-auth-btn'),
          makeAccountLink('Đăng ký', 'sign-up', 'btn mobile-nav-auth-btn mobile-nav-auth-btn-primary'),
        );
      }
    });
    renderCartAccess();
  };
  updateAccountNavigation();
  document.addEventListener('click', event => {
    const logout = event.target.closest('[data-auth-logout]');
    if (!logout) return;
    try {
      localStorage.removeItem(sessionKey);
      updateAccountNavigation();
      renderCartAccess();
      cartLive.textContent = 'Bạn đã đăng xuất.';
      if (/\/checkout\.html$/.test(location.pathname)) {
        window.location.href = `${base}src/html/products.html`;
      }
    } catch {
      cartLive.textContent = 'Không thể đăng xuất vì trình duyệt không cho phép cập nhật dữ liệu tài khoản.';
    }
  });
  window.addEventListener('storage', event => {
    if (event.key === sessionKey || event.key === accountKey) updateAccountNavigation();
  });
  document.querySelectorAll('article[data-product]').forEach(card => {
    const id = card.dataset.product;
    if (products.some(product => product.id === id) && !card.querySelector('[data-cart-add]')) {
      card.append(addButton(id));
    }
  });
  const detailMatch = location.pathname.match(/\/products\/([^/]+)\.html$/);
  const detailProduct =
    detailMatch &&
    products.find(
      product => product.id === detailMatch[1] || product.detailPageSlug === detailMatch[1],
    );
  if (detailProduct) {
    const agentCard = document.querySelector('.agent-card');
    if (agentCard && !agentCard.querySelector('[data-cart-add]')) {
      agentCard.append(addButton(detailMatch[1]));
    }

    const detailSections = document.querySelector('.detail-sections');
    if (detailSections && detailProduct.healthDetails) {
      const section = document.createElement('section');
      section.className = 'detail-section detail-health-section';
      const heading = document.createElement('h2');
      heading.textContent = detailProduct.healthDetails.title;
      const details = document.createElement('dl');
      details.className = 'detail-health-list';
      detailProduct.healthDetails.items.forEach(([label, value]) => {
        const row = document.createElement('div');
        const term = document.createElement('dt');
        term.textContent = label;
        const description = document.createElement('dd');
        description.textContent = value;
        row.append(term, description);
        details.append(row);
      });
      const note = document.createElement('p');
      note.className = 'detail-health-note';
      note.textContent =
        'Thông tin này chỉ mang tính tham khảo. Luôn kiểm tra nhãn hàng thực tế; nếu có dị ứng hoặc yêu cầu dinh dưỡng đặc biệt, hãy xác nhận với nhà sản xuất.';
      section.append(heading, details, note);
      detailSections.append(section);
    }
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-cart-add]');
    if (!button) return;
    if (!hasSignedInAccount()) {
      const returnTo = `${location.pathname}${location.search}${location.hash}`;
      window.location.href = `${base}src/html/sign-in.html?returnTo=${encodeURIComponent(returnTo)}`;
      return;
    }
    const item = cart.find(entry => entry.id === button.dataset.cartAdd);
    if (item) item.quantity = Math.min(99, item.quantity + 1);
    else cart.push({ id: button.dataset.cartAdd, quantity: 1 });
    const persisted = saveCart();
    renderCartAccess();
    cartLive.textContent = `${products.find(product => product.id === button.dataset.cartAdd).name} đã được thêm vào giỏ hàng${persisted ? '.' : ' trong phiên hiện tại.'}`;
  });
  window.addEventListener('storage', event => {
    if (event.key === sessionKey) {
      updateAccountNavigation();
      return;
    }
    if (event.key === cartKey) {
      cart = readCart();
      renderCartAccess();
    }
  });
  renderCartAccess();
  const isNewProduct = product =>
    Number.isFinite(Date.parse(product.addedAt)) &&
    Date.parse(product.addedAt) >= Date.parse('2026-09-20');
  const createProductCard = (product, showNewBadge = false) => {
    const card = document.createElement('article');
    card.className = 'listing-row-card home-feature-card';
    card.dataset.product = product.id;
    card.dataset.category = product.category;

    const badges = [];
    if (product.originalPrice) badges.push(['product-badge-sale', 'Sale']);
    if (showNewBadge && isNewProduct(product)) badges.push(['product-badge-new', 'Mới']);
    if (badges.length) {
      const badgeList = document.createElement('div');
      badgeList.className = 'product-badges';
      badges.forEach(([className, text]) => {
        const badge = document.createElement('span');
        badge.className = `product-badge ${className}`;
        badge.textContent = text;
        badgeList.append(badge);
      });
      card.append(badgeList);
    }

    const link = document.createElement(product.detailPage ? 'a' : 'div');
    link.className = 'listing-row-link home-feature-link';
    if (product.detailPage) link.href = `${base}src/html/products/${detailPagePath(product)}.html`;

    const image = document.createElement('img');
    image.src = product.photo.startsWith('https://')
      ? product.photo
      : `https://images.unsplash.com/${product.photo}?auto=format&fit=crop&w=900&q=80`;
    image.alt = `${product.name} — hình ảnh minh họa`;
    image.loading = 'lazy';
    link.append(image);

    const body = document.createElement('div');
    body.className = 'listing-row-body home-feature-body';
    const tag = document.createElement('p');
    tag.className = 'listing-card-tag';
    tag.textContent = product.category;
    const name = document.createElement('h2');
    name.textContent = product.name;
    const meta = document.createElement('div');
    meta.className = 'listing-row-meta';
    const pack = document.createElement('span');
    pack.textContent = product.pack;
    meta.append(pack);
    const price = document.createElement('p');
    price.className = `listing-row-price home-feature-price${product.originalPrice ? ' has-sale-price' : ''}`;
    const currentPrice = document.createElement('span');
    currentPrice.textContent = money(product.price);
    price.append(currentPrice);
    if (product.originalPrice) {
      const originalPrice = document.createElement('s');
      originalPrice.textContent = money(product.originalPrice);
      price.append(originalPrice);
    }
    const description = document.createElement('p');
    description.className = 'listing-row-copy';
    description.textContent = product.description;
    body.append(tag, name, meta, price, description);
    if (product.detailPage) {
      const detailHint = document.createElement('p');
      detailHint.className = 'product-health-hint';
      detailHint.textContent =
        product.category === 'Chăm sóc nhà cửa'
          ? 'Xem thông tin an toàn →'
          : 'Xem dinh dưỡng & lưu ý dị ứng →';
      body.append(detailHint);
    }
    link.append(body);

    card.append(link, addButton(product.id));
    return card;
  };

  const renderHomeSections = () => {
    document.querySelectorAll('[data-home-grid]').forEach(grid => {
      const isSale = grid.dataset.homeGrid === 'sale';
      const selected = isSale
        ? products.filter(product => product.originalPrice)
        : (grid.dataset.products || '').split(',').map(id => products.find(product => product.id === id)).filter(Boolean);

      grid.replaceChildren(...selected.map(product => createProductCard(product)));
    });
  };
  renderHomeSections();

  const initializeCarousels = () => {
    document.querySelectorAll('[data-carousel]').forEach(carousel => {
      const track = carousel.querySelector('.carousel-track');
      if (!track) return;
      const slides = [...track.children];
      const prev = carousel.querySelector('.carousel-prev');
      const next = carousel.querySelector('.carousel-next');
      const indicatorsWrap = carousel.querySelector('.carousel-indicators');
      let index = 0;
      const setIndex = i => {
        index = (i + slides.length) % slides.length;
        track.style.transform = `translateX(${ -index * 100 }%)`;
        if (indicatorsWrap) {
          [...indicatorsWrap.children].forEach((btn, idx) => btn.setAttribute('aria-current', String(idx === index)));
        }
      };
      // build indicators
      if (indicatorsWrap && indicatorsWrap.children.length === 0) {
        slides.forEach((s, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('aria-label', `Slide ${i + 1}`);
          b.addEventListener('click', () => setIndex(i));
          indicatorsWrap.append(b);
        });
      }
      prev?.addEventListener('click', () => setIndex(index - 1));
      next?.addEventListener('click', () => setIndex(index + 1));
      // autoplay
      let timer = setInterval(() => setIndex(index + 1), 4000);
      carousel.addEventListener('mouseenter', () => clearInterval(timer));
      carousel.addEventListener('mouseleave', () => { clearInterval(timer); timer = setInterval(() => setIndex(index + 1), 4000); });
      // initial
      setIndex(0);
      // make accessible focus controls
      [prev, next].forEach(btn => { if (btn) btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); } }); });
    });
  };
  initializeCarousels();

  const grid = document.querySelector('[data-product-grid]');
  if (grid) {
    const input = document.querySelector('#product-search');
    const sort = document.querySelector('#product-sort');
    grid.replaceChildren(...products.map(product => createProductCard(product, true)));
    const cards = [...grid.children];
    let category = 'Tất cả';
    const normalize = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
    const productFor = card => products.find(p => p.id === card.dataset.product);
    const matchesFilter = product => {
      if (category === 'Sale') return Boolean(product.originalPrice);
      if (category === 'Mới') return isNewProduct(product);
      return category === 'Tất cả' || product.category === category;
    };
    const filter = () => {
      const query = normalize(input.value.trim());
      let count = 0;
      const ordered = [...cards].sort((a, b) => {
        if (sort.value === 'default') return cards.indexOf(a) - cards.indexOf(b);
        const productA = productFor(a);
        const productB = productFor(b);
        if (sort.value === 'newest' || sort.value === 'oldest') {
          const addedAtA = Date.parse(productA.addedAt);
          const addedAtB = Date.parse(productB.addedAt);
          if (!Number.isFinite(addedAtA) && !Number.isFinite(addedAtB)) {
            return cards.indexOf(a) - cards.indexOf(b);
          }
          if (!Number.isFinite(addedAtA)) return 1;
          if (!Number.isFinite(addedAtB)) return -1;
          const diff = addedAtA - addedAtB;
          return sort.value === 'newest' ? -diff : diff;
        }
        const diff = productA.price - productB.price;
        return sort.value === 'asc' ? diff : -diff;
      });
      ordered.forEach(card => {
        const p = productFor(card);
        const healthText = p.healthDetails?.items.map(([label, value]) => `${label} ${value}`).join(' ') || '';
        card.hidden =
          !matchesFilter(p) ||
          !normalize(`${p.name} ${p.category} ${p.pack} ${p.description} ${healthText}`).includes(query);
        if (!card.hidden) count++;
        grid.append(card);
      });
      document.querySelector('[data-result-count]').textContent = `${count} sản phẩm`;
      document.querySelector('[data-empty]').hidden = count > 0;
    };
    input.value = new URLSearchParams(location.search).get('q') || '';
    input.addEventListener('input', filter);
    input.form.addEventListener('submit', e => { e.preventDefault(); filter(); });
    sort.addEventListener('change', filter);
    document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
      category = button.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach(b => { b.setAttribute('aria-pressed', String(b === button)); b.classList.toggle('listing-mode-tab-active', b === button); });
      filter();
    }));
    filter();
  }
  const toggle = document.querySelector('.topbar-mobile-toggle');
  const drawer = document.querySelector('.mobile-nav-drawer');
  const overlay = document.querySelector('.mobile-nav-overlay');
  const setMenu = open => {
    document.body.classList.toggle('mobile-nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    drawer.setAttribute('aria-hidden', String(!open));
    drawer.inert = !open;
    overlay.hidden = !open;
    if (open) drawer.querySelector('.mobile-nav-close').focus(); else toggle.focus();
  };
  toggle.addEventListener('click', () => setMenu(true));
  document.querySelector('.mobile-nav-close').addEventListener('click', () => setMenu(false));
  overlay.addEventListener('click', () => setMenu(false));
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => {
    if (!document.body.classList.contains('mobile-nav-open')) return;
    if (e.key === 'Escape') setMenu(false);
    if (e.key === 'Tab') {
      const items = [...drawer.querySelectorAll('a, button')];
      const first = items[0], last = items.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();
