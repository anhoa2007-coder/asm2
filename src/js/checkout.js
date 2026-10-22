(() => {
  const sessionKey = 'huyhoang-auth-session-v1';
  try {
    if (!localStorage.getItem(sessionKey)) {
      const base = document.body.dataset.base || '../../';
      window.location.replace(`${base}src/html/sign-in.html?next=checkout`);
      return;
    }
  } catch {
    const base = document.body.dataset.base || '../../';
    window.location.replace(`${base}src/html/sign-in.html?next=checkout`);
    return;
  }
  const isAuthenticated = () => {
    try {
      return Boolean(localStorage.getItem(sessionKey));
    } catch {
      return false;
    }
  };
  const redirectToSignIn = () => {
    const base = document.body.dataset.base || '../../';
    window.location.replace(`${base}src/html/sign-in.html?next=checkout`);
  };
  document.body.removeAttribute('data-auth-guarded');
  const products = window.groceryProducts || [];
  const cartKey = 'huyhoang-grocery-cart-v1';
  const shippingFee = 25000;
  const byId = new Map(products.map(product => [product.id, product]));
  const itemsNode = document.querySelector('[data-cart-items]');
  const emptyNode = document.querySelector('[data-cart-empty]');
  const form = document.querySelector('[data-checkout-form]');
  const layout = document.querySelector('[data-checkout-content]');
  const confirmation = document.querySelector('[data-order-confirmation]');
  if (!itemsNode || !emptyNode || !form || !layout || !confirmation) return;

  const status = document.querySelector('[data-checkout-status]');
  const money = amount => new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
  const normalizeCart = value => {
    if (!Array.isArray(value)) return [];
    const cart = [];
    value.forEach(item => {
      const quantity = Number(item.quantity);
      if (!byId.has(item.id) || !Number.isInteger(quantity) || quantity < 1) return;
      const existing = cart.find(entry => entry.id === item.id);
      if (existing) existing.quantity = Math.min(99, existing.quantity + quantity);
      else cart.push({ id: item.id, quantity: Math.min(99, quantity) });
    });
    return cart;
  };
  let cart = [];
  try {
    cart = normalizeCart(JSON.parse(localStorage.getItem(cartKey) || '[]'));
  } catch {
    status.textContent = 'Không thể đọc giỏ hàng đã lưu. Vui lòng chọn lại sản phẩm.';
  }

  const persist = () => {
    try {
      localStorage.setItem(cartKey, JSON.stringify(cart));
      status.textContent = '';
      return true;
    } catch {
      status.textContent = 'Không thể lưu thay đổi giỏ hàng trên trình duyệt này.';
      return false;
    }
  };

  const createQuantityButton = (label, action, id, disabled = false) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.cartAction = action;
    button.dataset.productId = id;
    button.setAttribute('aria-label', label);
    button.disabled = disabled;
    button.textContent = action === 'increase' ? '+' : '−';
    return button;
  };

  const render = () => {
    itemsNode.replaceChildren();
    const subtotal = cart.reduce((sum, item) => sum + byId.get(item.id).price * item.quantity, 0);
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    const isEmpty = cart.length === 0;
    emptyNode.hidden = !isEmpty;
    form.hidden = isEmpty;
    document.querySelector('.checkout-summary').hidden = isEmpty;
    document.querySelector('[data-checkout-count]').textContent = `${totalQuantity} sản phẩm`;
    document.querySelector('[data-subtotal]').textContent = money(subtotal);
    document.querySelector('[data-shipping]').textContent = money(shippingFee);
    document.querySelector('[data-total]').textContent = money(subtotal + shippingFee);
    document.querySelectorAll('[data-cart-count]').forEach(node => {
      node.textContent = totalQuantity;
    });

    cart.forEach(item => {
      const product = byId.get(item.id);
      const row = document.createElement('article');
      row.className = 'checkout-item';

      const details = document.createElement('div');
      const name = document.createElement('h3');
      name.className = 'checkout-item-name';
      name.textContent = product.name;
      const pack = document.createElement('p');
      pack.className = 'checkout-item-pack';
      pack.textContent = product.pack;
      details.append(name, pack);

      const price = document.createElement('strong');
      price.className = 'checkout-item-price';
      price.textContent = money(product.price * item.quantity);

      const controls = document.createElement('div');
      controls.className = 'checkout-item-controls';
      const quantity = document.createElement('div');
      quantity.className = 'checkout-quantity-control';
      quantity.append(createQuantityButton(`Giảm số lượng ${product.name}`, 'decrease', item.id, item.quantity <= 1));
      const output = document.createElement('output');
      output.setAttribute('aria-label', `Số lượng ${product.name}`);
      output.textContent = item.quantity;
      quantity.append(output, createQuantityButton(`Tăng số lượng ${product.name}`, 'increase', item.id, item.quantity >= 99));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'checkout-remove';
      remove.dataset.cartAction = 'remove';
      remove.dataset.productId = item.id;
      remove.textContent = 'Xóa';
      controls.append(quantity, remove);
      row.append(details, price, controls);
      itemsNode.append(row);
    });
  };

  document.addEventListener('click', event => {
    const button = event.target.closest('button[data-cart-action]');
    if (!button) return;
    if (!isAuthenticated()) {
      redirectToSignIn();
      return;
    }
    const item = cart.find(entry => entry.id === button.dataset.productId);
    if (!item) return;
    if (button.dataset.cartAction === 'increase') item.quantity = Math.min(99, item.quantity + 1);
    else if (button.dataset.cartAction === 'decrease' && item.quantity > 1) item.quantity -= 1;
    else if (button.dataset.cartAction === 'remove') cart = cart.filter(entry => entry.id !== item.id);
    persist();
    render();
  });

  const paymentNote = document.querySelector('[data-payment-note]');
  form.querySelectorAll('input[name="payment"]').forEach(input => {
    input.addEventListener('change', () => {
      paymentNote.textContent = input.value === 'bank'
        ? 'Cửa hàng sẽ liên hệ xác nhận đơn và cung cấp hướng dẫn chuyển khoản. Không chuyển tiền ở bước này.'
        : 'Bạn thanh toán bằng tiền mặt sau khi nhận và kiểm tra hàng.';
    });
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!isAuthenticated()) {
      redirectToSignIn();
      return;
    }
    if (!cart.length) {
      status.textContent = 'Giỏ hàng đang trống. Vui lòng thêm sản phẩm trước khi tiếp tục.';
      return;
    }
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const orderCode = `HH-${Date.now().toString().slice(-8)}`;
    const total = cart.reduce((sum, item) => sum + byId.get(item.id).price * item.quantity, 0) + shippingFee;
    const payment = formData.get('payment') === 'bank' ? 'chuyển khoản sau khi cửa hàng xác nhận' : 'thanh toán khi nhận hàng';
    document.querySelector('[data-confirmation-message]').textContent =
      `${formData.get('name')}, mã đơn mẫu ${orderCode}. Tổng dự kiến ${money(total)}, hình thức ${payment}. Cửa hàng cần xác nhận đơn hàng với bạn.`;

    cart = [];
    persist();
    render();
    layout.hidden = true;
    confirmation.hidden = false;
    confirmation.focus();
  });

  window.addEventListener('storage', event => {
    if (event.key === sessionKey && !event.newValue) {
      redirectToSignIn();
      return;
    }
    if (event.key !== cartKey) return;
    try {
      cart = normalizeCart(JSON.parse(event.newValue || '[]'));
      render();
    } catch {
      status.textContent = 'Không thể cập nhật giỏ hàng từ thẻ trình duyệt khác.';
    }
  });

  render();
})();
