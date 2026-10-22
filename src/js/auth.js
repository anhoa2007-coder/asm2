(() => {
  const accountsKey = 'huyhoang-auth-accounts-v1';
  const sessionKey = 'huyhoang-auth-session-v1';
  const form = document.querySelector('[data-auth-form]');
  if (!form) return;

  const status = form.querySelector('[data-auth-message]');
  const setMessage = (message, state = 'error') => {
    status.textContent = message;
    status.dataset.state = state;
  };
  const getAccounts = () => {
    const stored = localStorage.getItem(accountsKey);
    if (!stored) return [];
    const accounts = JSON.parse(stored);
    if (!Array.isArray(accounts)) throw new Error('Dữ liệu tài khoản đã lưu không hợp lệ.');
    return accounts;
  };
  const encodeHex = bytes => [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  const derivePasswordHash = async (password, salt) => {
    if (!window.crypto?.subtle) {
      throw new Error('Trình duyệt chưa hỗ trợ lưu tài khoản an toàn. Hãy mở website qua HTTPS hoặc localhost.');
    }
    const key = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits'],
    );
    const bits = await window.crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: Uint8Array.from(salt.match(/.{2}/g), byte => parseInt(byte, 16)), iterations: 120000, hash: 'SHA-256' },
      key,
      256,
    );
    return encodeHex(bits);
  };
  const isAdult = value => {
    const birthDate = new Date(`${value}T00:00:00`);
    if (!value || Number.isNaN(birthDate.getTime())) return false;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const birthdayHasNotOccurred =
      today.getMonth() < birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());
    if (birthdayHasNotOccurred) age -= 1;
    return age >= 18 && birthDate <= today;
  };
  const isSignUp = form.dataset.authForm === 'sign-up';
  const getPostAuthUrl = () => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('next') === 'checkout') return `${document.body.dataset.base}src/html/checkout.html`;
    const returnTo = query.get('returnTo');
    if (returnTo?.startsWith('/') && !returnTo.startsWith('//')) return returnTo;
    return `${document.body.dataset.base}index.html`;
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const data = new FormData(form);
    const email = String(data.get('email') || '').trim().toLowerCase();
    const password = String(data.get('password') || '');

    if (!window.validator) {
      setMessage('Không tải được thư viện kiểm tra dữ liệu. Vui lòng tải lại trang và thử lại.');
      return;
    }
    if (!window.validator.isEmail(email)) {
      setMessage('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    if (isSignUp) {
      const phone = String(data.get('phone') || '').trim();
      const birthDate = String(data.get('birthDate') || '');
      const errors = [];
      if (password.length < 6 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) ||
          !/\d/.test(password) || !/[^A-Za-z0-9\s]/.test(password)) {
        errors.push('Mật khẩu cần có ít nhất 6 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.');
      }
      if (!window.validator.isMobilePhone(phone, 'vi-VN')) {
        errors.push('Vui lòng nhập số điện thoại di động Việt Nam hợp lệ.');
      }
      if (!isAdult(birthDate)) errors.push('Bạn cần đủ 18 tuổi để đăng ký.');
      if (!data.has('terms')) errors.push('Vui lòng đồng ý với điều khoản trước khi đăng ký.');
      if (errors.length) {
        setMessage(errors.join(' '));
        return;
      }
    }

    try {
      const accounts = getAccounts();
      if (isSignUp) {
        if (accounts.some(account => account.email === email)) {
          setMessage('Email này đã được đăng ký. Hãy đăng nhập hoặc sử dụng email khác.');
          return;
        }
        const saltBytes = window.crypto.getRandomValues(new Uint8Array(16));
        const salt = encodeHex(saltBytes);
        const account = {
          email,
          passwordSalt: salt,
          passwordHash: await derivePasswordHash(password, salt),
          phone: String(data.get('phone')).trim(),
          birthDate: String(data.get('birthDate')),
        };
        localStorage.setItem(accountsKey, JSON.stringify([...accounts, account]));
        localStorage.setItem(sessionKey, email);
        setMessage('Đăng ký thành công. Đang chuyển trang…', 'success');
        window.setTimeout(() => { window.location.href = getPostAuthUrl(); }, 700);
        return;
      }

      const account = accounts.find(item => item.email === email);
      if (!account || !account.passwordSalt || !account.passwordHash ||
          await derivePasswordHash(password, account.passwordSalt) !== account.passwordHash) {
        setMessage('Email hoặc mật khẩu không chính xác.');
        return;
      }
      localStorage.setItem(sessionKey, account.email);
      setMessage('Đăng nhập thành công. Đang chuyển trang…', 'success');
      window.setTimeout(() => { window.location.href = getPostAuthUrl(); }, 700);
    } catch (error) {
      setMessage(error instanceof Error && error.name === 'QuotaExceededError'
        ? 'Bộ nhớ trình duyệt đã đầy, không thể lưu tài khoản.'
        : `Không thể hoàn tất thao tác tài khoản: ${error instanceof Error ? error.message : 'lỗi không xác định'}`);
    }
  });
})();
