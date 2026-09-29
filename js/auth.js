/* ============================================
   REHAN PUBLIC SCHOOL - Authentication
   ============================================ */

const Auth = {
  login(email, password, remember = false) {
    const users = DB.getData(DB_KEYS.users);
    const user = users.find(u =>
      (u.email.toLowerCase() === email.toLowerCase() || u.name.toLowerCase() === email.toLowerCase()) &&
      u.password === password &&
      u.status === 'active'
    );
    if (!user) return { success: false, message: 'Invalid email or password' };

    const session = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      teacherId: user.teacherId || null,
      studentId: user.studentId || null,
      parentId: user.parentId || null,
      loginAt: new Date().toISOString()
    };
    DB.setCurrentUser(session);
    if (remember) {
      localStorage.setItem('remember_email', email);
    } else {
      localStorage.removeItem('remember_email');
    }
    DB.logActivity('Login', 'Auth', `User ${user.name} logged in`);
    return { success: true, user: session };
  },

  logout() {
    const user = DB.getCurrentUser();
    if (user) DB.logActivity('Logout', 'Auth', `User ${user.name} logged out`);
    DB.setCurrentUser(null);
    window.location.href = 'login.html';
  },

  isLoggedIn() {
    return !!DB.getCurrentUser();
  },

  getUser() {
    return DB.getCurrentUser();
  },

  getRole() {
    const user = this.getUser();
    return user ? user.role : null;
  },

  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },

  requireRole(roles) {
    if (!this.requireAuth()) return false;
    const role = this.getRole();
    const allowed = Array.isArray(roles) ? roles : [roles];
    if (!allowed.includes(role) && role !== 'admin') {
      window.location.href = 'dashboard.html';
      return false;
    }
    return true;
  },

  hasAccess(module) {
    const role = this.getRole();
    if (!role) return false;
    if (role === 'admin') return true;

    const permissions = {
      teacher: [
        'dashboard', 'students', 'attendance', 'timetable', 'homework',
        'assignments', 'exams', 'results', 'notices', 'leave', 'profile',
        'quizzes', 'classes', 'subjects', 'events', 'calendar', 'communication'
      ],
      student: [
        'dashboard', 'profile', 'attendance', 'timetable', 'homework',
        'assignments', 'exams', 'results', 'fees', 'notices', 'events',
        'quizzes', 'calendar', 'library'
      ],
      parent: [
        'dashboard', 'profile', 'attendance', 'results', 'fees', 'homework',
        'exams', 'notices', 'events', 'ptm', 'calendar', 'communication'
      ]
    };
    const allowed = permissions[role] || [];
    return allowed.includes(module);
  },

  getRoleMenu() {
    const role = this.getRole();
    const allMenus = {
      main: [
        { id: 'dashboard', label: 'Dashboard', icon: '📊', href: 'dashboard.html' }
      ],
      people: [
        { id: 'students', label: 'Students', icon: '🎓', href: 'students.html' },
        { id: 'teachers', label: 'Teachers', icon: '👨‍🏫', href: 'teachers.html' },
        { id: 'parents', label: 'Parents', icon: '👨‍👩‍👧', href: 'parents.html' },
        { id: 'staff', label: 'Staff', icon: '👥', href: 'staff.html' }
      ],
      academic: [
        { id: 'admissions', label: 'Admissions', icon: '📝', href: 'admissions.html' },
        { id: 'classes', label: 'Classes', icon: '🏫', href: 'classes.html' },
        { id: 'subjects', label: 'Subjects', icon: '📚', href: 'subjects.html' },
        { id: 'attendance', label: 'Attendance', icon: '✅', href: 'attendance.html' },
        { id: 'timetable', label: 'Timetable', icon: '📅', href: 'timetable.html' },
        { id: 'exams', label: 'Exams', icon: '📋', href: 'exams.html' },
        { id: 'results', label: 'Results', icon: '🏆', href: 'results.html' },
        { id: 'homework', label: 'Homework', icon: '📖', href: 'homework.html' },
        { id: 'assignments', label: 'Assignments', icon: '📎', href: 'assignments.html' },
        { id: 'quizzes', label: 'Quizzes', icon: '❓', href: 'quizzes.html' },
        { id: 'promotion', label: 'Promotion', icon: '⬆️', href: 'promotion.html' },
        { id: 'transfer', label: 'Transfer', icon: '🔄', href: 'transfer.html' }
      ],
      finance: [
        { id: 'fees', label: 'Fees', icon: '💰', href: 'fees.html' },
        { id: 'payroll', label: 'Payroll', icon: '💵', href: 'payroll.html' },
        { id: 'expenses', label: 'Expenses', icon: '📉', href: 'expenses.html' },
        { id: 'finance', label: 'Finance', icon: '📊', href: 'finance.html' }
      ],
      school: [
        { id: 'library', label: 'Library', icon: '📕', href: 'library.html' },
        { id: 'transport', label: 'Transport', icon: '🚌', href: 'transport.html' },
        { id: 'inventory', label: 'Inventory', icon: '📦', href: 'inventory.html' },
        { id: 'events', label: 'Events', icon: '🎉', href: 'events.html' },
        { id: 'calendar', label: 'Calendar', icon: '📆', href: 'calendar.html' },
        { id: 'notices', label: 'Notices', icon: '📢', href: 'notices.html' },
        { id: 'communication', label: 'Communication', icon: '💬', href: 'communication.html' },
        { id: 'gallery', label: 'Gallery', icon: '🖼️', href: 'gallery.html' }
      ],
      management: [
        { id: 'reports', label: 'Reports', icon: '📈', href: 'reports.html' },
        { id: 'certificates', label: 'Certificates', icon: '🎖️', href: 'certificates.html' },
        { id: 'id-cards', label: 'ID Cards', icon: '🪪', href: 'id-cards.html' },
        { id: 'leave', label: 'Leave', icon: '🏖️', href: 'leave.html' },
        { id: 'ptm', label: 'PTM', icon: '🤝', href: 'ptm.html' },
        { id: 'visitors', label: 'Visitors', icon: '🚪', href: 'visitors.html' },
        { id: 'complaints', label: 'Complaints', icon: '⚠️', href: 'complaints.html' },
        { id: 'discipline', label: 'Discipline', icon: '⚖️', href: 'discipline.html' },
        { id: 'achievements', label: 'Achievements', icon: '🏅', href: 'achievements.html' },
        { id: 'contacts', label: 'Contacts', icon: '📧', href: 'contacts.html' }
      ],
      system: [
        { id: 'notifications', label: 'Notifications', icon: '🔔', href: 'notifications.html' },
        { id: 'activity-log', label: 'Activity Log', icon: '📜', href: 'activity-log.html' },
        { id: 'profile', label: 'Profile', icon: '👤', href: 'profile.html' },
        { id: 'settings', label: 'Settings', icon: '⚙️', href: 'settings.html' }
      ]
    };

    if (role === 'admin') return allMenus;

    const filtered = {};
    Object.keys(allMenus).forEach(section => {
      const items = allMenus[section].filter(item => this.hasAccess(item.id));
      if (items.length) filtered[section] = items;
    });
    return filtered;
  }
};
