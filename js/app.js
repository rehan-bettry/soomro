/* ============================================
   REHAN PUBLIC SCHOOL - Shared Application
   ============================================ */

const App = {
  init() {
    this.applyTheme();
    this.initSidebar();
    this.initNavbar();
    this.initGlobalSearch();
  },

  applyTheme() {
    const settings = DB.getSettings();
    const theme = localStorage.getItem('theme') || settings.theme || 'light';
    document.documentElement.setAttribute('data-theme', theme);
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    const settings = DB.getSettings();
    settings.theme = next;
    DB.saveSettings(settings);
  },

  initSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const menus = Auth.getRoleMenu();
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    let html = '';

    const sectionLabels = {
      main: 'MAIN',
      people: 'PEOPLE',
      academic: 'ACADEMIC',
      finance: 'FINANCE',
      school: 'SCHOOL',
      management: 'MANAGEMENT',
      system: 'SYSTEM'
    };

    Object.keys(menus).forEach(section => {
      html += `<div class="nav-section">${sectionLabels[section] || section.toUpperCase()}</div>`;
      menus[section].forEach(item => {
        const active = currentPage === item.href ? 'active' : '';
        html += `<a href="${item.href}" class="nav-item ${active}" data-module="${item.id}">
          <span class="nav-icon">${item.icon}</span>
          <span>${item.label}</span>
        </a>`;
      });
    });

    html += `<div class="nav-section">ACCOUNT</div>
      <a href="#" class="nav-item" onclick="Auth.logout(); return false;">
        <span class="nav-icon">🚪</span>
        <span>Logout</span>
      </a>`;

    const nav = sidebar.querySelector('.sidebar-nav');
    if (nav) nav.innerHTML = html;
  },

  initNavbar() {
    const user = Auth.getUser();
    if (!user) return;

    const nameEl = document.getElementById('navUserName');
    const roleEl = document.getElementById('navUserRole');
    const avatarEl = document.getElementById('navUserAvatar');
    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.role;
    if (avatarEl) {
      const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      avatarEl.textContent = initials;
    }

    // Notification count
    const notifs = DB.getData(DB_KEYS.notifications).filter(n => !n.read);
    const badge = document.getElementById('notifBadge');
    if (badge) {
      if (notifs.length > 0) {
        badge.textContent = notifs.length > 9 ? '9+' : notifs.length;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }

    // Page title
    const titleEl = document.getElementById('pageTitle');
    if (titleEl && !titleEl.dataset.set) {
      const page = window.location.pathname.split('/').pop().replace('.html', '').replace(/-/g, ' ');
      titleEl.textContent = page.replace(/\b\w/g, c => c.toUpperCase());
    }
  },

  initGlobalSearch() {
    const input = document.getElementById('globalSearch');
    const results = document.getElementById('searchResults');
    if (!input || !results) return;

    let debounce;
    input.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        const q = input.value.trim().toLowerCase();
        if (q.length < 2) {
          results.classList.remove('show');
          results.innerHTML = '';
          return;
        }
        this.performSearch(q, results);
      }, 250);
    });

    input.addEventListener('blur', () => {
      setTimeout(() => results.classList.remove('show'), 200);
    });
    input.addEventListener('focus', () => {
      if (results.innerHTML) results.classList.add('show');
    });
  },

  performSearch(query, container) {
    const groups = [];

    const students = DB.getData(DB_KEYS.students).filter(s =>
      s.name.toLowerCase().includes(query) || s.admissionNo?.toLowerCase().includes(query) || s.id.toLowerCase().includes(query)
    ).slice(0, 5);
    if (students.length) groups.push({ label: 'Students', items: students.map(s => ({ text: `${s.name} (${s.class})`, href: 'students.html' })) });

    const teachers = DB.getData(DB_KEYS.teachers).filter(t =>
      t.name.toLowerCase().includes(query) || t.subject?.toLowerCase().includes(query)
    ).slice(0, 5);
    if (teachers.length) groups.push({ label: 'Teachers', items: teachers.map(t => ({ text: `${t.name} - ${t.subject}`, href: 'teachers.html' })) });

    const notices = DB.getData(DB_KEYS.notices).filter(n =>
      n.title.toLowerCase().includes(query)
    ).slice(0, 3);
    if (notices.length) groups.push({ label: 'Notices', items: notices.map(n => ({ text: n.title, href: 'notices.html' })) });

    const books = DB.getData(DB_KEYS.library).filter(b =>
      b.name.toLowerCase().includes(query) || b.author?.toLowerCase().includes(query)
    ).slice(0, 3);
    if (books.length) groups.push({ label: 'Books', items: books.map(b => ({ text: b.name, href: 'library.html' })) });

    const exams = DB.getData(DB_KEYS.exams).filter(e =>
      e.name.toLowerCase().includes(query) || e.subject?.toLowerCase().includes(query)
    ).slice(0, 3);
    if (exams.length) groups.push({ label: 'Exams', items: exams.map(e => ({ text: `${e.name} - ${e.subject}`, href: 'exams.html' })) });

    if (!groups.length) {
      container.innerHTML = '<div class="result-item" style="color:var(--text-muted)">No results found</div>';
    } else {
      container.innerHTML = groups.map(g =>
        `<div class="result-group">
          <div class="result-label">${g.label}</div>
          ${g.items.map(i => `<div class="result-item" onclick="window.location='${i.href}'">${this.escapeHtml(i.text)}</div>`).join('')}
        </div>`
      ).join('');
    }
    container.classList.add('show');
  },

  // ========== TOAST ==========
  toast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ'}</span>
      <span class="toast-message">${this.escapeHtml(message)}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    container.appendChild(el);
    setTimeout(() => {
      el.classList.add('removing');
      setTimeout(() => el.remove(), 300);
    }, 3500);
  },

  // ========== MODAL ==========
  openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('show');
  },

  closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('show');
  },

  confirm(message, onConfirm) {
    const existing = document.getElementById('confirmModal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'confirmModal';
    overlay.className = 'modal-overlay show';
    overlay.innerHTML = `
      <div class="modal modal-sm">
        <div class="modal-header">
          <h3>Confirm</h3>
          <button class="modal-close" onclick="App.closeConfirm()">&times;</button>
        </div>
        <div class="modal-body">
          <p>${this.escapeHtml(message)}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="App.closeConfirm()">Cancel</button>
          <button class="btn btn-danger" id="confirmBtn">Delete</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('confirmBtn').onclick = () => {
      App.closeConfirm();
      if (onConfirm) onConfirm();
    };
  },

  closeConfirm() {
    const el = document.getElementById('confirmModal');
    if (el) el.remove();
  },

  // ========== UTILITIES ==========
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  formatCurrency(amount) {
    const settings = DB.getSettings();
    const curr = settings.currency || 'PKR';
    return `${curr} ${Number(amount || 0).toLocaleString()}`;
  },

  getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  },

  calcGrade(percentage) {
    const p = Number(percentage);
    if (p >= 90) return 'A+';
    if (p >= 80) return 'A';
    if (p >= 70) return 'B';
    if (p >= 60) return 'C';
    if (p >= 50) return 'D';
    return 'F';
  },

  statusBadge(status) {
    const map = {
      active: 'success', Active: 'success', Paid: 'success', Approved: 'success',
      Present: 'success', Completed: 'success', Resolved: 'success', Closed: 'secondary',
      pending: 'warning', Pending: 'warning', Partial: 'warning', Late: 'warning',
      'In Progress': 'info', Scheduled: 'info', Upcoming: 'info',
      inactive: 'secondary', Absent: 'danger', Rejected: 'danger', Failed: 'danger',
      Urgent: 'danger', Important: 'warning', Normal: 'info',
      'Low Stock': 'warning', 'In Stock': 'success', 'Checked In': 'info', 'Checked Out': 'secondary',
      Unread: 'warning', Read: 'secondary'
    };
    const cls = map[status] || 'secondary';
    return `<span class="badge badge-${cls}">${this.escapeHtml(String(status))}</span>`;
  },

  // Pagination helper
  paginate(data, page = 1, perPage = 10) {
    const total = data.length;
    const totalPages = Math.ceil(total / perPage) || 1;
    const current = Math.min(Math.max(1, page), totalPages);
    const start = (current - 1) * perPage;
    return {
      data: data.slice(start, start + perPage),
      page: current,
      perPage,
      total,
      totalPages,
      start: total ? start + 1 : 0,
      end: Math.min(start + perPage, total)
    };
  },

  renderPagination(containerId, pagination, onPageChange) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const { page, totalPages, start, end, total } = pagination;
    let btns = '';
    btns += `<button ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">‹</button>`;
    for (let i = 1; i <= totalPages; i++) {
      if (totalPages > 7 && Math.abs(i - page) > 2 && i !== 1 && i !== totalPages) {
        if (i === 2 || i === totalPages - 1) btns += `<button disabled>…</button>`;
        continue;
      }
      btns += `<button class="${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    btns += `<button ${page >= totalPages ? 'disabled' : ''} data-page="${page + 1}">›</button>`;
    el.innerHTML = `
      <span>Showing ${start}–${end} of ${total}</span>
      <div class="pagination-btns">${btns}</div>
    `;
    el.querySelectorAll('button[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = parseInt(btn.dataset.page);
        if (!isNaN(p) && onPageChange) onPageChange(p);
      });
    });
  },

  // Form validation
  validateForm(formEl) {
    let valid = true;
    formEl.querySelectorAll('[required]').forEach(field => {
      field.classList.remove('is-invalid');
      if (!field.value.trim()) {
        field.classList.add('is-invalid');
        valid = false;
      }
      if (field.type === 'email' && field.value) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
          field.classList.add('is-invalid');
          valid = false;
        }
      }
    });
    return valid;
  },

  // Sidebar toggle for mobile
  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('show');
  },

  closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
  },

  toggleUserMenu() {
    const menu = document.getElementById('userDropdown');
    if (menu) menu.classList.toggle('show');
  },

  printContent(elementId) {
    const el = document.getElementById(elementId);
    if (!el) { window.print(); return; }
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Print</title>
      <link rel="stylesheet" href="css/style.css">
      <link rel="stylesheet" href="css/print.css">
      <style>body{padding:20px;background:#fff;}</style>
      </head><body>${el.innerHTML}
      <script>window.onload=function(){window.print();window.close();}</script>
      </body></html>
    `);
    printWindow.document.close();
  },

  // Shared layout HTML generators
  getSidebarHTML() {
    return `
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">R</div>
          <div class="sidebar-brand">
            <h2>Rehan Public School</h2>
            <span>Management System</span>
          </div>
        </div>
        <nav class="sidebar-nav"></nav>
      </aside>
      <div class="sidebar-overlay" id="sidebarOverlay" onclick="App.closeSidebar()"></div>
    `;
  },

  getNavbarHTML(pageTitle) {
    return `
      <header class="top-navbar">
        <div class="navbar-left">
          <button class="menu-toggle" onclick="App.toggleSidebar()" aria-label="Toggle menu">☰</button>
          <h1 class="page-title" id="pageTitle" data-set="true">${pageTitle || 'Dashboard'}</h1>
        </div>
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" id="globalSearch" placeholder="Search students, teachers, notices..." autocomplete="off">
          <div class="search-results" id="searchResults"></div>
        </div>
        <div class="navbar-right">
          <button class="nav-btn" onclick="App.toggleTheme()" title="Toggle Dark Mode" aria-label="Toggle theme">🌓</button>
          <button class="nav-btn" onclick="window.location='notifications.html'" title="Notifications" aria-label="Notifications">
            🔔<span class="badge-count" id="notifBadge" style="display:none">0</span>
          </button>
          <button class="nav-btn" onclick="window.location='communication.html'" title="Messages" aria-label="Messages">✉️</button>
          <div class="user-menu" onclick="App.toggleUserMenu()">
            <div class="user-avatar" id="navUserAvatar">A</div>
            <div class="user-info">
              <div class="user-name" id="navUserName">User</div>
              <div class="user-role" id="navUserRole">admin</div>
            </div>
            <div class="dropdown-menu" id="userDropdown">
              <a href="profile.html">👤 Profile</a>
              <a href="settings.html">⚙️ Settings</a>
              <div class="divider"></div>
              <button onclick="Auth.logout()">🚪 Logout</button>
            </div>
          </div>
        </div>
      </header>
    `;
  }
};

// Close dropdowns on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.user-menu')) {
    const menu = document.getElementById('userDropdown');
    if (menu) menu.classList.remove('show');
  }
});
