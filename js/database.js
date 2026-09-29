/* ============================================
   REHAN PUBLIC SCHOOL - Database Layer
   LocalStorage-based data persistence
   ============================================ */

const DB_KEYS = {
  users: 'school_users',
  students: 'students',
  teachers: 'teachers',
  parents: 'parents',
  staff: 'staff',
  classes: 'classes',
  subjects: 'subjects',
  attendance: 'attendance',
  timetable: 'timetable',
  admissions: 'admissions',
  promotions: 'promotions',
  transfers: 'transfers',
  exams: 'exams',
  results: 'results',
  assignments: 'assignments',
  quizzes: 'quizzes',
  homework: 'homework',
  fees: 'fees',
  payroll: 'payroll',
  expenses: 'expenses',
  finance: 'finance',
  library: 'library',
  transport: 'transport',
  inventory: 'inventory',
  events: 'events',
  calendar: 'calendar',
  leaves: 'leaves',
  ptm: 'ptm',
  notices: 'notices',
  messages: 'messages',
  certificates: 'certificates',
  idCards: 'id_cards',
  reports: 'reports',
  gallery: 'gallery',
  complaints: 'complaints',
  discipline: 'discipline',
  achievements: 'achievements',
  visitors: 'visitors',
  contacts: 'contacts',
  activityLogs: 'activity_logs',
  notifications: 'notifications',
  settings: 'school_settings',
  currentUser: 'current_user',
  initialized: 'db_initialized'
};

const DB = {
  getData(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('DB getData error:', key, e);
      return [];
    }
  },

  setData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('DB setData error:', key, e);
      return false;
    }
  },

  addData(key, item) {
    const data = this.getData(key);
    if (!item.id) item.id = this.generateId(key);
    if (!item.createdAt) item.createdAt = new Date().toISOString();
    data.push(item);
    this.setData(key, data);
    return item;
  },

  updateData(key, id, updates) {
    const data = this.getData(key);
    const idx = data.findIndex(item => item.id === id || String(item.id) === String(id));
    if (idx === -1) return null;
    data[idx] = { ...data[idx], ...updates, updatedAt: new Date().toISOString() };
    this.setData(key, data);
    return data[idx];
  },

  deleteData(key, id) {
    const data = this.getData(key);
    const filtered = data.filter(item => item.id !== id && String(item.id) !== String(id));
    this.setData(key, filtered);
    return filtered.length < data.length;
  },

  findData(key, predicate) {
    const data = this.getData(key);
    if (typeof predicate === 'function') return data.filter(predicate);
    if (typeof predicate === 'object') {
      return data.filter(item =>
        Object.keys(predicate).every(k => item[k] === predicate[k] || String(item[k]) === String(predicate[k]))
      );
    }
    return data;
  },

  findById(key, id) {
    const data = this.getData(key);
    return data.find(item => item.id === id || String(item.id) === String(id)) || null;
  },

  generateId(prefix = 'ID') {
    const short = prefix.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'ID';
    return `${short}${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  },

  getSettings() {
    try {
      const raw = localStorage.getItem(DB_KEYS.settings);
      return raw ? JSON.parse(raw) : this.defaultSettings();
    } catch {
      return this.defaultSettings();
    }
  },

  saveSettings(settings) {
    localStorage.setItem(DB_KEYS.settings, JSON.stringify(settings));
  },

  defaultSettings() {
    return {
      schoolName: 'Rehan Public School',
      tagline: 'Learn Today. Build Tomorrow.',
      principalName: 'Dr. Ayesha Rahman',
      email: 'info@rehan-school.com',
      phone: '+92 300 1234567',
      address: '123 Education Avenue, Model Town, Lahore, Pakistan',
      website: 'www.rehan-school.com',
      academicYear: '2025-2026',
      currentTerm: 'Term 1',
      currency: 'PKR',
      dateFormat: 'DD/MM/YYYY',
      theme: 'light',
      notifications: true,
      logo: null
    };
  },

  logActivity(action, module, details = '') {
    const user = this.getCurrentUser();
    this.addData(DB_KEYS.activityLogs, {
      user: user ? user.name : 'System',
      userId: user ? user.id : null,
      role: user ? user.role : 'system',
      action,
      module,
      details,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0]
    });
  },

  addNotification(title, message, type = 'info') {
    this.addData(DB_KEYS.notifications, {
      title,
      message,
      type,
      read: false,
      date: new Date().toISOString()
    });
  },

  getCurrentUser() {
    try {
      const raw = localStorage.getItem(DB_KEYS.currentUser);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem(DB_KEYS.currentUser, JSON.stringify(user));
    } else {
      localStorage.removeItem(DB_KEYS.currentUser);
    }
  },

  exportAll() {
    const exportData = {};
    Object.values(DB_KEYS).forEach(key => {
      if (key === 'current_user' || key === 'db_initialized') return;
      const raw = localStorage.getItem(key);
      if (raw) exportData[key] = JSON.parse(raw);
    });
    exportData._exportedAt = new Date().toISOString();
    exportData._version = '1.0';
    return exportData;
  },

  importAll(data) {
    if (!data || typeof data !== 'object') return false;
    Object.keys(data).forEach(key => {
      if (key.startsWith('_')) return;
      localStorage.setItem(key, JSON.stringify(data[key]));
    });
    return true;
  },

  clearAll() {
    Object.values(DB_KEYS).forEach(key => {
      if (key !== 'db_initialized') localStorage.removeItem(key);
    });
    localStorage.removeItem(DB_KEYS.initialized);
  },

  isInitialized() {
    return localStorage.getItem(DB_KEYS.initialized) === 'true';
  },

  markInitialized() {
    localStorage.setItem(DB_KEYS.initialized, 'true');
  },

  initializeDatabase() {
    if (this.isInitialized()) return;

    // Users
    const users = [
      { id: 'USR001', name: 'Admin User', email: 'admin@rehan-school.com', password: 'admin123', role: 'admin', phone: '03001234501', status: 'active' },
      { id: 'USR002', name: 'Fatima Khan', email: 'teacher@rehan-school.com', password: 'teacher123', role: 'teacher', phone: '03001234502', teacherId: 'TCH001', status: 'active' },
      { id: 'USR003', name: 'Ahmed Ali', email: 'student@rehan-school.com', password: 'student123', role: 'student', phone: '03001234503', studentId: 'STU001', status: 'active' },
      { id: 'USR004', name: 'Sara Malik', email: 'parent@rehan-school.com', password: 'parent123', role: 'parent', phone: '03001234504', parentId: 'PAR001', status: 'active' }
    ];
    this.setData(DB_KEYS.users, users);

    // Classes
    const classes = [
      { id: 'CLS001', name: 'Nursery', section: 'A', teacherId: 'TCH001', capacity: 30, room: 'R101', status: 'active' },
      { id: 'CLS002', name: 'KG', section: 'A', teacherId: 'TCH002', capacity: 30, room: 'R102', status: 'active' },
      { id: 'CLS003', name: 'Grade 1', section: 'A', teacherId: 'TCH003', capacity: 35, room: 'R201', status: 'active' },
      { id: 'CLS004', name: 'Grade 2', section: 'A', teacherId: 'TCH004', capacity: 35, room: 'R202', status: 'active' },
      { id: 'CLS005', name: 'Grade 3', section: 'A', teacherId: 'TCH005', capacity: 35, room: 'R203', status: 'active' },
      { id: 'CLS006', name: 'Grade 5', section: 'A', teacherId: 'TCH006', capacity: 40, room: 'R301', status: 'active' },
      { id: 'CLS007', name: 'Grade 8', section: 'A', teacherId: 'TCH007', capacity: 40, room: 'R401', status: 'active' },
      { id: 'CLS008', name: 'Grade 10', section: 'A', teacherId: 'TCH001', capacity: 40, room: 'R501', status: 'active' }
    ];
    this.setData(DB_KEYS.classes, classes);

    // Teachers
    const teachers = [
      { id: 'TCH001', name: 'Fatima Khan', gender: 'Female', dob: '1985-03-15', subject: 'Mathematics', classes: ['Grade 10', 'Grade 8'], phone: '03001111001', email: 'fatima.khan@rehan-school.com', qualification: 'M.Sc Mathematics', experience: 12, joiningDate: '2015-08-01', address: 'Gulberg, Lahore', salary: 75000, status: 'active' },
      { id: 'TCH002', name: 'Muhammad Hassan', gender: 'Male', dob: '1982-07-22', subject: 'English', classes: ['Grade 5', 'Grade 3'], phone: '03001111002', email: 'm.hassan@rehan-school.com', qualification: 'MA English', experience: 15, joiningDate: '2014-03-01', address: 'DHA Phase 5, Lahore', salary: 80000, status: 'active' },
      { id: 'TCH003', name: 'Ayesha Siddiqui', gender: 'Female', dob: '1990-11-08', subject: 'Science', classes: ['Grade 1', 'Grade 2'], phone: '03001111003', email: 'ayesha.s@rehan-school.com', qualification: 'B.Sc Biology, B.Ed', experience: 8, joiningDate: '2018-09-01', address: 'Johar Town, Lahore', salary: 65000, status: 'active' },
      { id: 'TCH004', name: 'Imran Malik', gender: 'Male', dob: '1988-01-30', subject: 'Urdu', classes: ['Grade 2', 'Grade 3'], phone: '03001111004', email: 'imran.malik@rehan-school.com', qualification: 'MA Urdu', experience: 10, joiningDate: '2016-04-15', address: 'Cantt, Lahore', salary: 60000, status: 'active' },
      { id: 'TCH005', name: 'Sana Riaz', gender: 'Female', dob: '1992-05-12', subject: 'Islamiyat', classes: ['Grade 3', 'Grade 5'], phone: '03001111005', email: 'sana.riaz@rehan-school.com', qualification: 'MA Islamic Studies', experience: 6, joiningDate: '2019-08-01', address: 'Model Town, Lahore', salary: 55000, status: 'active' },
      { id: 'TCH006', name: 'Bilal Ahmed', gender: 'Male', dob: '1980-09-18', subject: 'Computer Science', classes: ['Grade 5', 'Grade 8', 'Grade 10'], phone: '03001111006', email: 'bilal.ahmed@rehan-school.com', qualification: 'MCS', experience: 14, joiningDate: '2013-01-10', address: 'Bahria Town, Lahore', salary: 85000, status: 'active' },
      { id: 'TCH007', name: 'Nadia Hussain', gender: 'Female', dob: '1987-12-25', subject: 'Social Studies', classes: ['Grade 8', 'Grade 10'], phone: '03001111007', email: 'nadia.h@rehan-school.com', qualification: 'MA History, B.Ed', experience: 11, joiningDate: '2015-09-01', address: 'Garden Town, Lahore', salary: 70000, status: 'active' },
      { id: 'TCH008', name: 'Usman Tariq', gender: 'Male', dob: '1991-04-05', subject: 'Physical Education', classes: ['All'], phone: '03001111008', email: 'usman.t@rehan-school.com', qualification: 'B.P.Ed', experience: 7, joiningDate: '2018-03-01', address: 'Faisal Town, Lahore', salary: 50000, status: 'active' },
      { id: 'TCH009', name: 'Hina Shah', gender: 'Female', dob: '1989-08-14', subject: 'Art', classes: ['Nursery', 'KG', 'Grade 1'], phone: '03001111009', email: 'hina.shah@rehan-school.com', qualification: 'BFA', experience: 9, joiningDate: '2017-02-01', address: 'Iqbal Town, Lahore', salary: 48000, status: 'active' },
      { id: 'TCH010', name: 'Kamran Ali', gender: 'Male', dob: '1984-06-20', subject: 'Physics', classes: ['Grade 8', 'Grade 10'], phone: '03001111010', email: 'kamran.ali@rehan-school.com', qualification: 'M.Sc Physics', experience: 13, joiningDate: '2014-08-15', address: 'Wapda Town, Lahore', salary: 78000, status: 'active' }
    ];
    this.setData(DB_KEYS.teachers, teachers);

    // Students (30)
    const firstNames = ['Ahmed', 'Ali', 'Hassan', 'Omar', 'Zain', 'Bilal', 'Usman', 'Hamza', 'Ibrahim', 'Yusuf', 'Fatima', 'Ayesha', 'Sara', 'Zara', 'Hira', 'Noor', 'Maryam', 'Amina', 'Sana', 'Hina', 'Laiba', 'Esha', 'Maham', 'Rida', 'Areeba', 'Daniyal', 'Rayyan', 'Arham', 'Mustafa', 'Suleman'];
    const lastNames = ['Khan', 'Ahmed', 'Ali', 'Malik', 'Hassan', 'Riaz', 'Shah', 'Siddiqui', 'Hussain', 'Tariq', 'Butt', 'Sheikh', 'Qureshi', 'Mirza', 'Chaudhry'];
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    const students = [];
    const classList = ['Nursery', 'KG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 5', 'Grade 8', 'Grade 10'];
    for (let i = 0; i < 30; i++) {
      const fn = firstNames[i];
      const ln = lastNames[i % lastNames.length];
      const cls = classList[i % classList.length];
      const gender = i < 10 || (i >= 20 && i < 25) ? 'Male' : 'Female';
      students.push({
        id: `STU${String(i + 1).padStart(3, '0')}`,
        admissionNo: `ADM2025${String(i + 1).padStart(3, '0')}`,
        name: `${fn} ${ln}`,
        fatherName: `${lastNames[(i + 3) % lastNames.length]} ${ln}`,
        motherName: `Mrs. ${lastNames[(i + 5) % lastNames.length]}`,
        dob: `${2010 + (i % 10)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
        gender,
        bloodGroup: bloodGroups[i % bloodGroups.length],
        class: cls,
        section: 'A',
        rollNo: (i % 35) + 1,
        phone: `0300${String(2000000 + i).slice(-7)}`,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}@student.rehan-school.com`,
        address: `${100 + i} Street ${i + 1}, Lahore`,
        admissionDate: `2024-0${(i % 8) + 1}-${String((i % 25) + 1).padStart(2, '0')}`,
        guardian: `${lastNames[(i + 3) % lastNames.length]} ${ln}`,
        guardianPhone: `0300${String(3000000 + i).slice(-7)}`,
        previousSchool: i % 3 === 0 ? 'City Public School' : '',
        status: 'active'
      });
    }
    this.setData(DB_KEYS.students, students);

    // Parents
    const parents = [
      { id: 'PAR001', name: 'Sara Malik', relationship: 'Mother', studentIds: ['STU001'], phone: '03001234504', email: 'parent@rehan-school.com', address: 'Gulberg III, Lahore', occupation: 'Teacher' },
      { id: 'PAR002', name: 'Tariq Khan', relationship: 'Father', studentIds: ['STU002'], phone: '03002222001', email: 'tariq.khan@email.com', address: 'DHA Phase 3, Lahore', occupation: 'Engineer' },
      { id: 'PAR003', name: 'Naveed Ahmed', relationship: 'Father', studentIds: ['STU003'], phone: '03002222002', email: 'naveed.a@email.com', address: 'Johar Town, Lahore', occupation: 'Businessman' },
      { id: 'PAR004', name: 'Farah Ali', relationship: 'Mother', studentIds: ['STU004'], phone: '03002222003', email: 'farah.ali@email.com', address: 'Model Town, Lahore', occupation: 'Doctor' },
      { id: 'PAR005', name: 'Asif Riaz', relationship: 'Father', studentIds: ['STU005'], phone: '03002222004', email: 'asif.riaz@email.com', address: 'Cantt, Lahore', occupation: 'Accountant' },
      { id: 'PAR006', name: 'Mehreen Shah', relationship: 'Mother', studentIds: ['STU006'], phone: '03002222005', email: 'mehreen.s@email.com', address: 'Bahria Town, Lahore', occupation: 'Homemaker' },
      { id: 'PAR007', name: 'Javed Hussain', relationship: 'Father', studentIds: ['STU007'], phone: '03002222006', email: 'javed.h@email.com', address: 'Garden Town, Lahore', occupation: 'Lawyer' },
      { id: 'PAR008', name: 'Samina Butt', relationship: 'Mother', studentIds: ['STU008'], phone: '03002222007', email: 'samina.b@email.com', address: 'Faisal Town, Lahore', occupation: 'Banker' },
      { id: 'PAR009', name: 'Rashid Sheikh', relationship: 'Father', studentIds: ['STU009'], phone: '03002222008', email: 'rashid.s@email.com', address: 'Iqbal Town, Lahore', occupation: 'Professor' },
      { id: 'PAR010', name: 'Uzma Qureshi', relationship: 'Mother', studentIds: ['STU010'], phone: '03002222009', email: 'uzma.q@email.com', address: 'Wapda Town, Lahore', occupation: 'Designer' }
    ];
    this.setData(DB_KEYS.parents, parents);

    // Staff
    const staff = [
      { id: 'STF001', name: 'Rashid Mahmood', position: 'Accountant', department: 'Accounts', phone: '03003333001', email: 'rashid.m@rehan-school.com', joiningDate: '2016-01-15', salary: 45000, status: 'active' },
      { id: 'STF002', name: 'Shabana Bibi', position: 'Librarian', department: 'Library', phone: '03003333002', email: 'shabana@rehan-school.com', joiningDate: '2017-06-01', salary: 35000, status: 'active' },
      { id: 'STF003', name: 'Ghulam Hussain', position: 'Security Guard', department: 'Security', phone: '03003333003', email: '', joiningDate: '2015-03-01', salary: 28000, status: 'active' },
      { id: 'STF004', name: 'Imtiaz Ali', position: 'Driver', department: 'Transport', phone: '03003333004', email: '', joiningDate: '2018-02-01', salary: 32000, status: 'active' },
      { id: 'STF005', name: 'Nasreen Akhtar', position: 'Admin Assistant', department: 'Administration', phone: '03003333005', email: 'nasreen@rehan-school.com', joiningDate: '2019-07-01', salary: 38000, status: 'active' },
      { id: 'STF006', name: 'Pervez Iqbal', position: 'Maintenance', department: 'Maintenance', phone: '03003333006', email: '', joiningDate: '2016-09-01', salary: 30000, status: 'active' },
      { id: 'STF007', name: 'Khalid Mehmood', position: 'Driver', department: 'Transport', phone: '03003333007', email: '', joiningDate: '2020-01-15', salary: 32000, status: 'active' },
      { id: 'STF008', name: 'Farzana Bibi', position: 'Support Staff', department: 'Support', phone: '03003333008', email: '', joiningDate: '2017-11-01', salary: 25000, status: 'active' }
    ];
    this.setData(DB_KEYS.staff, staff);

    // Subjects
    const subjects = [
      { id: 'SUB001', name: 'Mathematics', code: 'MATH', class: 'Grade 10', teacherId: 'TCH001', totalMarks: 100, passingMarks: 40, type: 'Compulsory' },
      { id: 'SUB002', name: 'English', code: 'ENG', class: 'Grade 10', teacherId: 'TCH002', totalMarks: 100, passingMarks: 40, type: 'Compulsory' },
      { id: 'SUB003', name: 'Urdu', code: 'URD', class: 'Grade 10', teacherId: 'TCH004', totalMarks: 100, passingMarks: 40, type: 'Compulsory' },
      { id: 'SUB004', name: 'Physics', code: 'PHY', class: 'Grade 10', teacherId: 'TCH010', totalMarks: 100, passingMarks: 40, type: 'Compulsory' },
      { id: 'SUB005', name: 'Computer Science', code: 'CS', class: 'Grade 10', teacherId: 'TCH006', totalMarks: 100, passingMarks: 40, type: 'Compulsory' },
      { id: 'SUB006', name: 'Islamiyat', code: 'ISL', class: 'Grade 10', teacherId: 'TCH005', totalMarks: 50, passingMarks: 20, type: 'Compulsory' },
      { id: 'SUB007', name: 'Science', code: 'SCI', class: 'Grade 5', teacherId: 'TCH003', totalMarks: 100, passingMarks: 40, type: 'Compulsory' },
      { id: 'SUB008', name: 'Mathematics', code: 'MATH', class: 'Grade 5', teacherId: 'TCH001', totalMarks: 100, passingMarks: 40, type: 'Compulsory' },
      { id: 'SUB009', name: 'English', code: 'ENG', class: 'Grade 5', teacherId: 'TCH002', totalMarks: 100, passingMarks: 40, type: 'Compulsory' },
      { id: 'SUB010', name: 'Social Studies', code: 'SST', class: 'Grade 8', teacherId: 'TCH007', totalMarks: 100, passingMarks: 40, type: 'Compulsory' },
      { id: 'SUB011', name: 'Mathematics', code: 'MATH', class: 'Grade 8', teacherId: 'TCH001', totalMarks: 100, passingMarks: 40, type: 'Compulsory' },
      { id: 'SUB012', name: 'Art', code: 'ART', class: 'Nursery', teacherId: 'TCH009', totalMarks: 50, passingMarks: 20, type: 'Compulsory' },
      { id: 'SUB013', name: 'English', code: 'ENG', class: 'Grade 1', teacherId: 'TCH002', totalMarks: 100, passingMarks: 40, type: 'Compulsory' },
      { id: 'SUB014', name: 'Urdu', code: 'URD', class: 'Grade 3', teacherId: 'TCH004', totalMarks: 100, passingMarks: 40, type: 'Compulsory' },
      { id: 'SUB015', name: 'Physical Education', code: 'PE', class: 'All', teacherId: 'TCH008', totalMarks: 50, passingMarks: 20, type: 'Compulsory' }
    ];
    this.setData(DB_KEYS.subjects, subjects);

    // Attendance (today + recent)
    const today = new Date().toISOString().split('T')[0];
    const attendance = [];
    students.slice(0, 20).forEach((s, i) => {
      const statuses = ['Present', 'Present', 'Present', 'Present', 'Absent', 'Late', 'Present', 'Leave'];
      attendance.push({
        id: `ATT${String(i + 1).padStart(3, '0')}`,
        studentId: s.id,
        studentName: s.name,
        class: s.class,
        section: s.section,
        date: today,
        status: statuses[i % statuses.length],
        markedBy: 'TCH001'
      });
    });
    this.setData(DB_KEYS.attendance, attendance);

    // Timetable
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const periods = [
      { start: '08:00', end: '08:45' },
      { start: '08:45', end: '09:30' },
      { start: '09:45', end: '10:30' },
      { start: '10:30', end: '11:15' },
      { start: '11:30', end: '12:15' },
      { start: '12:15', end: '13:00' }
    ];
    const timetable = [];
    let ttIdx = 0;
    ['Grade 10', 'Grade 8', 'Grade 5'].forEach(cls => {
      days.forEach(day => {
        periods.forEach((p, pi) => {
          const subj = subjects.filter(s => s.class === cls || s.class === 'All')[pi % 5];
          if (subj) {
            timetable.push({
              id: `TT${String(++ttIdx).padStart(3, '0')}`,
              class: cls,
              section: 'A',
              day,
              subject: subj.name,
              teacherId: subj.teacherId,
              teacherName: teachers.find(t => t.id === subj.teacherId)?.name || '',
              room: `R${300 + pi}`,
              startTime: p.start,
              endTime: p.end
            });
          }
        });
      });
    });
    this.setData(DB_KEYS.timetable, timetable);

    // Admissions
    const admissions = [
      { id: 'ADM001', studentName: 'Zainab Fatima', fatherName: 'Ahmed Raza', dob: '2018-05-12', gender: 'Female', previousSchool: 'Little Stars', previousClass: 'Playgroup', applyingClass: 'Nursery', phone: '03004444001', email: 'ahmed.raza@email.com', address: 'Gulberg, Lahore', admissionDate: '2025-03-01', documents: ['Birth Certificate', 'Photos'], status: 'Pending', admissionFee: 15000 },
      { id: 'ADM002', studentName: 'Haris Mehmood', fatherName: 'Mehmood Ali', dob: '2017-08-20', gender: 'Male', previousSchool: '', previousClass: '', applyingClass: 'KG', phone: '03004444002', email: 'mehmood@email.com', address: 'DHA, Lahore', admissionDate: '2025-03-05', documents: ['Birth Certificate'], status: 'Approved', admissionFee: 15000 },
      { id: 'ADM003', studentName: 'Areeba Noor', fatherName: 'Noor Hassan', dob: '2015-02-14', gender: 'Female', previousSchool: 'City School', previousClass: 'Grade 1', applyingClass: 'Grade 2', phone: '03004444003', email: 'noor.h@email.com', address: 'Johar Town, Lahore', admissionDate: '2025-02-20', documents: ['TC', 'Report Card'], status: 'Pending', admissionFee: 18000 },
      { id: 'ADM004', studentName: 'Faizan Ali', fatherName: 'Ali Akbar', dob: '2014-11-30', gender: 'Male', previousSchool: 'Beacon House', previousClass: 'Grade 2', applyingClass: 'Grade 3', phone: '03004444004', email: 'ali.akbar@email.com', address: 'Model Town, Lahore', admissionDate: '2025-02-15', documents: ['TC', 'Report Card', 'Photos'], status: 'Rejected', admissionFee: 18000 },
      { id: 'ADM005', studentName: 'Mahnoor Khan', fatherName: 'Shahid Khan', dob: '2012-07-08', gender: 'Female', previousSchool: 'LGS', previousClass: 'Grade 4', applyingClass: 'Grade 5', phone: '03004444005', email: 'shahid.k@email.com', address: 'Bahria Town, Lahore', admissionDate: '2025-03-10', documents: ['TC', 'Report Card'], status: 'Approved', admissionFee: 20000 }
    ];
    this.setData(DB_KEYS.admissions, admissions);

    // Exams
    const exams = [
      { id: 'EXM001', name: 'Mid-Term Examination', subject: 'Mathematics', class: 'Grade 10', date: '2025-10-15', startTime: '09:00', endTime: '12:00', room: 'Hall A', totalMarks: 100, status: 'Upcoming' },
      { id: 'EXM002', name: 'Mid-Term Examination', subject: 'English', class: 'Grade 10', date: '2025-10-16', startTime: '09:00', endTime: '12:00', room: 'Hall A', totalMarks: 100, status: 'Upcoming' },
      { id: 'EXM003', name: 'Mid-Term Examination', subject: 'Physics', class: 'Grade 10', date: '2025-10-17', startTime: '09:00', endTime: '12:00', room: 'Hall B', totalMarks: 100, status: 'Upcoming' },
      { id: 'EXM004', name: 'Unit Test 1', subject: 'Science', class: 'Grade 5', date: '2025-09-20', startTime: '10:00', endTime: '11:30', room: 'R301', totalMarks: 50, status: 'Completed' },
      { id: 'EXM005', name: 'Unit Test 1', subject: 'Mathematics', class: 'Grade 8', date: '2025-09-22', startTime: '10:00', endTime: '11:30', room: 'R401', totalMarks: 50, status: 'Completed' },
      { id: 'EXM006', name: 'Final Examination', subject: 'Computer Science', class: 'Grade 10', date: '2026-03-10', startTime: '09:00', endTime: '12:00', room: 'Lab 1', totalMarks: 100, status: 'Scheduled' }
    ];
    this.setData(DB_KEYS.exams, exams);

    // Results
    const results = [];
    students.filter(s => s.class === 'Grade 10' || s.class === 'Grade 5').slice(0, 10).forEach((s, i) => {
      const marks = 55 + (i * 4) % 40;
      const total = 100;
      const pct = (marks / total) * 100;
      let grade = 'F';
      if (pct >= 90) grade = 'A+';
      else if (pct >= 80) grade = 'A';
      else if (pct >= 70) grade = 'B';
      else if (pct >= 60) grade = 'C';
      else if (pct >= 50) grade = 'D';
      results.push({
        id: `RES${String(i + 1).padStart(3, '0')}`,
        studentId: s.id,
        studentName: s.name,
        examId: 'EXM004',
        examName: 'Unit Test 1',
        subject: s.class === 'Grade 10' ? 'Mathematics' : 'Science',
        class: s.class,
        totalMarks: total,
        obtainedMarks: marks,
        percentage: pct.toFixed(1),
        grade,
        remarks: pct >= 70 ? 'Excellent' : pct >= 50 ? 'Good' : 'Needs Improvement'
      });
    });
    this.setData(DB_KEYS.results, results);

    // Fees
    const fees = [];
    students.slice(0, 25).forEach((s, i) => {
      const totalFee = s.class.includes('Grade 1') || s.class.includes('Nursery') || s.class === 'KG' ? 8000 : s.class.includes('10') || s.class.includes('8') ? 12000 : 10000;
      const paid = i % 4 === 0 ? 0 : i % 3 === 0 ? totalFee / 2 : totalFee;
      fees.push({
        id: `FEE${String(i + 1).padStart(3, '0')}`,
        studentId: s.id,
        studentName: s.name,
        class: s.class,
        month: 'September 2025',
        totalFee,
        paid,
        remaining: totalFee - paid,
        paymentDate: paid > 0 ? `2025-09-${String((i % 20) + 1).padStart(2, '0')}` : null,
        paymentMethod: paid > 0 ? ['Cash', 'Bank', 'Online'][i % 3] : null,
        status: paid === 0 ? 'Pending' : paid < totalFee ? 'Partial' : 'Paid'
      });
    });
    this.setData(DB_KEYS.fees, fees);

    // Homework
    const homework = [
      { id: 'HW001', subject: 'Mathematics', teacherId: 'TCH001', teacherName: 'Fatima Khan', class: 'Grade 10', title: 'Chapter 5 - Quadratic Equations', description: 'Solve exercises 5.1 to 5.3. Show all working.', dueDate: '2025-09-30', status: 'Active' },
      { id: 'HW002', subject: 'English', teacherId: 'TCH002', teacherName: 'Muhammad Hassan', class: 'Grade 5', title: 'Essay Writing', description: 'Write a 200-word essay on "My Favorite Season".', dueDate: '2025-09-28', status: 'Active' },
      { id: 'HW003', subject: 'Science', teacherId: 'TCH003', teacherName: 'Ayesha Siddiqui', class: 'Grade 5', title: 'Plant Life Cycle', description: 'Draw and label the life cycle of a flowering plant.', dueDate: '2025-10-02', status: 'Active' },
      { id: 'HW004', subject: 'Physics', teacherId: 'TCH010', teacherName: 'Kamran Ali', class: 'Grade 10', title: 'Newton Laws Problems', description: 'Complete numerical problems from chapter 3.', dueDate: '2025-09-29', status: 'Active' },
      { id: 'HW005', subject: 'Urdu', teacherId: 'TCH004', teacherName: 'Imran Malik', class: 'Grade 3', title: 'Nazm Memorization', description: 'Memorize the nazm from page 45.', dueDate: '2025-10-01', status: 'Active' }
    ];
    this.setData(DB_KEYS.homework, homework);

    // Assignments
    const assignments = [
      { id: 'ASN001', title: 'Science Project - Solar System', subject: 'Science', teacherId: 'TCH003', teacherName: 'Ayesha Siddiqui', class: 'Grade 5', description: 'Create a 3D model of the solar system.', deadline: '2025-10-15', status: 'Active', totalMarks: 50 },
      { id: 'ASN002', title: 'History Timeline', subject: 'Social Studies', teacherId: 'TCH007', teacherName: 'Nadia Hussain', class: 'Grade 8', description: 'Create a timeline of major events in Pakistan history 1947-2020.', deadline: '2025-10-10', status: 'Active', totalMarks: 40 },
      { id: 'ASN003', title: 'Programming Project', subject: 'Computer Science', teacherId: 'TCH006', teacherName: 'Bilal Ahmed', class: 'Grade 10', description: 'Build a simple calculator using HTML/CSS/JS.', deadline: '2025-10-20', status: 'Active', totalMarks: 100 }
    ];
    this.setData(DB_KEYS.assignments, assignments);

    // Notices
    const notices = [
      { id: 'NTC001', title: 'Parent-Teacher Meeting Scheduled', content: 'PTM for all classes will be held on October 5, 2025 from 9:00 AM to 1:00 PM. Parents are requested to attend.', audience: 'Everyone', priority: 'Important', date: '2025-09-20', pinned: true, author: 'Admin' },
      { id: 'NTC002', title: 'Mid-Term Exam Schedule Released', content: 'Mid-term examinations will commence from October 15, 2025. Detailed schedule has been posted on the notice board and website.', audience: 'Students', priority: 'Urgent', date: '2025-09-22', pinned: true, author: 'Admin' },
      { id: 'NTC003', title: 'Sports Day 2025', content: 'Annual Sports Day will be held on November 15, 2025. Students interested in participating should register with their PE teacher by October 30.', audience: 'Everyone', priority: 'Normal', date: '2025-09-18', pinned: false, author: 'Admin' },
      { id: 'NTC004', title: 'Library Book Return Reminder', content: 'All students are requested to return overdue library books by September 30 to avoid fines.', audience: 'Students', priority: 'Normal', date: '2025-09-25', pinned: false, author: 'Librarian' },
      { id: 'NTC005', title: 'Fee Payment Deadline', content: 'September fee payment deadline is September 30, 2025. Please clear dues to avoid late fee charges.', audience: 'Parents', priority: 'Important', date: '2025-09-15', pinned: false, author: 'Accounts' }
    ];
    this.setData(DB_KEYS.notices, notices);

    // Events
    const events = [
      { id: 'EVT001', title: 'Annual Function', date: '2025-12-20', endDate: '2025-12-20', type: 'Annual Function', description: 'Annual day celebration with performances by students.', location: 'School Auditorium', status: 'Upcoming' },
      { id: 'EVT002', title: 'Sports Day', date: '2025-11-15', endDate: '2025-11-15', type: 'Sports Day', description: 'Inter-house sports competition.', location: 'Sports Ground', status: 'Upcoming' },
      { id: 'EVT003', title: 'Parent-Teacher Meeting', date: '2025-10-05', endDate: '2025-10-05', type: 'Parent Meeting', description: 'Discuss student progress with teachers.', location: 'Classrooms', status: 'Upcoming' },
      { id: 'EVT004', title: 'Science Fair', date: '2025-11-01', endDate: '2025-11-02', type: 'Science Fair', description: 'Student science projects exhibition.', location: 'Science Block', status: 'Upcoming' },
      { id: 'EVT005', title: 'Educational Trip - Museum', date: '2025-10-25', endDate: '2025-10-25', type: 'Educational Trip', description: 'Visit to Lahore Museum for Grade 5-8.', location: 'Lahore Museum', status: 'Upcoming' },
      { id: 'EVT006', title: 'Eid Holiday', date: '2025-04-10', endDate: '2025-04-12', type: 'Holidays', description: 'Eid-ul-Fitr holidays.', location: '', status: 'Completed' },
      { id: 'EVT007', title: 'Independence Day Celebration', date: '2025-08-14', endDate: '2025-08-14', type: 'Activities', description: 'Flag hoisting and cultural program.', location: 'School Ground', status: 'Completed' }
    ];
    this.setData(DB_KEYS.events, events);

    // Library
    const library = [
      { id: 'BK001', isbn: '978-0-123456-01-1', name: 'Mathematics for Grade 10', author: 'Dr. Ali Hassan', category: 'Textbook', publisher: 'Oxford', quantity: 50, available: 42, status: 'Available' },
      { id: 'BK002', isbn: '978-0-123456-02-2', name: 'English Literature Classics', author: 'Various', category: 'Literature', publisher: 'Penguin', quantity: 30, available: 25, status: 'Available' },
      { id: 'BK003', isbn: '978-0-123456-03-3', name: 'Introduction to Physics', author: 'Kamran Ali', category: 'Textbook', publisher: 'Ferozsons', quantity: 40, available: 35, status: 'Available' },
      { id: 'BK004', isbn: '978-0-123456-04-4', name: 'The Alchemist', author: 'Paulo Coelho', category: 'Fiction', publisher: 'HarperCollins', quantity: 15, available: 8, status: 'Available' },
      { id: 'BK005', isbn: '978-0-123456-05-5', name: 'Pakistan Studies', author: 'I.H. Qureshi', category: 'Textbook', publisher: 'National Book Foundation', quantity: 45, available: 40, status: 'Available' },
      { id: 'BK006', isbn: '978-0-123456-06-6', name: 'Computer Fundamentals', author: 'P.K. Sinha', category: 'Textbook', publisher: 'BPB', quantity: 35, available: 30, status: 'Available' },
      { id: 'BK007', isbn: '978-0-123456-07-7', name: 'Harry Potter Series Set', author: 'J.K. Rowling', category: 'Fiction', publisher: 'Bloomsbury', quantity: 10, available: 3, status: 'Available' },
      { id: 'BK008', isbn: '978-0-123456-08-8', name: 'Islamic History', author: 'Maulana Maududi', category: 'Religious', publisher: 'Islamic Publications', quantity: 25, available: 22, status: 'Available' },
      { id: 'BK009', isbn: '978-0-123456-09-9', name: 'Art and Craft Guide', author: 'Hina Shah', category: 'Art', publisher: 'Local', quantity: 20, available: 18, status: 'Available' },
      { id: 'BK010', isbn: '978-0-123456-10-0', name: 'Science Encyclopedia', author: 'DK Publishing', category: 'Reference', publisher: 'DK', quantity: 12, available: 10, status: 'Available' }
    ];
    this.setData(DB_KEYS.library, library);

    // Transport
    const transport = {
      vehicles: [
        { id: 'VEH001', number: 'LEH-2020', type: 'Bus', driverId: 'STF004', driverName: 'Imtiaz Ali', capacity: 40, route: 'Route A - Gulberg', status: 'Active' },
        { id: 'VEH002', number: 'LEH-2021', type: 'Bus', driverId: 'STF007', driverName: 'Khalid Mehmood', capacity: 40, route: 'Route B - DHA', status: 'Active' },
        { id: 'VEH003', number: 'LEH-1515', type: 'Van', driverId: 'STF004', driverName: 'Imtiaz Ali', capacity: 15, route: 'Route C - Model Town', status: 'Active' }
      ],
      routes: [
        { id: 'RT001', name: 'Route A - Gulberg', pickupPoints: ['Main Boulevard', 'MM Alam Road', 'Liberty Market'], departureTime: '07:00', arrivalTime: '07:45' },
        { id: 'RT002', name: 'Route B - DHA', pickupPoints: ['Y-Block', 'Phase 5', 'Phase 6'], departureTime: '07:00', arrivalTime: '07:50' },
        { id: 'RT003', name: 'Route C - Model Town', pickupPoints: ['F-Block', 'Link Road', 'Town Center'], departureTime: '07:15', arrivalTime: '07:55' }
      ]
    };
    this.setData(DB_KEYS.transport, transport);

    // Inventory
    const inventory = [
      { id: 'INV001', name: 'Whiteboard Markers', category: 'Stationery', quantity: 150, unit: 'pcs', purchasePrice: 50, supplier: 'Office Plus', purchaseDate: '2025-08-01', minStock: 30, status: 'In Stock' },
      { id: 'INV002', name: 'A4 Paper Reams', category: 'Stationery', quantity: 80, unit: 'reams', purchasePrice: 800, supplier: 'Paper World', purchaseDate: '2025-08-15', minStock: 20, status: 'In Stock' },
      { id: 'INV003', name: 'Student Chairs', category: 'Furniture', quantity: 25, unit: 'pcs', purchasePrice: 3500, supplier: 'Furniture Hub', purchaseDate: '2025-07-01', minStock: 10, status: 'In Stock' },
      { id: 'INV004', name: 'Projector Bulbs', category: 'Electronics', quantity: 5, unit: 'pcs', purchasePrice: 4500, supplier: 'Tech Store', purchaseDate: '2025-06-20', minStock: 3, status: 'Low Stock' },
      { id: 'INV005', name: 'Science Lab Chemicals Kit', category: 'Lab Equipment', quantity: 8, unit: 'kits', purchasePrice: 12000, supplier: 'Lab Supplies Co', purchaseDate: '2025-05-10', minStock: 5, status: 'In Stock' },
      { id: 'INV006', name: 'Football', category: 'Sports', quantity: 12, unit: 'pcs', purchasePrice: 1500, supplier: 'Sports Zone', purchaseDate: '2025-04-01', minStock: 5, status: 'In Stock' },
      { id: 'INV007', name: 'First Aid Kits', category: 'Medical', quantity: 4, unit: 'kits', purchasePrice: 2500, supplier: 'MediCare', purchaseDate: '2025-03-15', minStock: 3, status: 'In Stock' },
      { id: 'INV008', name: 'Printer Toner', category: 'Electronics', quantity: 2, unit: 'pcs', purchasePrice: 6000, supplier: 'Tech Store', purchaseDate: '2025-09-01', minStock: 3, status: 'Low Stock' }
    ];
    this.setData(DB_KEYS.inventory, inventory);

    // Payroll
    const payroll = teachers.slice(0, 5).map((t, i) => ({
      id: `PAY${String(i + 1).padStart(3, '0')}`,
      employeeId: t.id,
      employeeName: t.name,
      type: 'Teacher',
      basicSalary: t.salary,
      allowance: 5000,
      bonus: i === 0 ? 10000 : 0,
      deduction: 2000,
      netSalary: t.salary + 5000 + (i === 0 ? 10000 : 0) - 2000,
      paymentDate: '2025-09-01',
      paymentMethod: 'Bank',
      status: 'Paid',
      month: 'September 2025'
    }));
    this.setData(DB_KEYS.payroll, payroll);

    // Expenses
    const expenses = [
      { id: 'EXP001', title: 'Electricity Bill', category: 'Electricity', amount: 85000, date: '2025-09-05', description: 'September electricity charges', status: 'Paid' },
      { id: 'EXP002', title: 'Water Bill', category: 'Water', amount: 12000, date: '2025-09-05', description: 'September water charges', status: 'Paid' },
      { id: 'EXP003', title: 'Internet Package', category: 'Internet', amount: 15000, date: '2025-09-01', description: 'Monthly internet - PTCL', status: 'Paid' },
      { id: 'EXP004', title: 'Building Maintenance', category: 'Maintenance', amount: 45000, date: '2025-09-10', description: 'Classroom repairs and painting', status: 'Paid' },
      { id: 'EXP005', title: 'Stationery Purchase', category: 'Stationery', amount: 28000, date: '2025-09-12', description: 'Markers, paper, notebooks', status: 'Paid' },
      { id: 'EXP006', title: 'Bus Fuel', category: 'Transport', amount: 55000, date: '2025-09-08', description: 'Fuel for 3 vehicles', status: 'Paid' },
      { id: 'EXP007', title: 'Sports Day Prep', category: 'Events', amount: 35000, date: '2025-09-20', description: 'Equipment and decorations', status: 'Pending' },
      { id: 'EXP008', title: 'Staff Salaries', category: 'Salaries', amount: 850000, date: '2025-09-01', description: 'September payroll', status: 'Paid' }
    ];
    this.setData(DB_KEYS.expenses, expenses);

    // Leaves
    const leaves = [
      { id: 'LV001', name: 'Fatima Khan', role: 'Teacher', leaveType: 'Sick Leave', startDate: '2025-09-25', endDate: '2025-09-26', reason: 'Medical appointment', status: 'Approved' },
      { id: 'LV002', name: 'Ahmed Ali', role: 'Student', leaveType: 'Casual Leave', startDate: '2025-09-28', endDate: '2025-09-28', reason: 'Family function', status: 'Pending' },
      { id: 'LV003', name: 'Muhammad Hassan', role: 'Teacher', leaveType: 'Annual Leave', startDate: '2025-10-01', endDate: '2025-10-05', reason: 'Personal travel', status: 'Pending' },
      { id: 'LV004', name: 'Ghulam Hussain', role: 'Staff', leaveType: 'Sick Leave', startDate: '2025-09-20', endDate: '2025-09-21', reason: 'Fever', status: 'Approved' }
    ];
    this.setData(DB_KEYS.leaves, leaves);

    // PTM
    const ptm = [
      { id: 'PTM001', studentId: 'STU001', studentName: 'Ahmed Khan', parentName: 'Sara Malik', teacherId: 'TCH001', teacherName: 'Fatima Khan', date: '2025-10-05', time: '10:00', room: 'R501', notes: '', status: 'Scheduled' },
      { id: 'PTM002', studentId: 'STU002', studentName: 'Ali Ahmed', parentName: 'Tariq Khan', teacherId: 'TCH002', teacherName: 'Muhammad Hassan', date: '2025-10-05', time: '10:30', room: 'R301', notes: '', status: 'Scheduled' },
      { id: 'PTM003', studentId: 'STU003', studentName: 'Hassan Ali', parentName: 'Naveed Ahmed', teacherId: 'TCH003', teacherName: 'Ayesha Siddiqui', date: '2025-10-05', time: '11:00', room: 'R201', notes: '', status: 'Scheduled' }
    ];
    this.setData(DB_KEYS.ptm, ptm);

    // Quizzes
    const quizzes = [
      {
        id: 'QZ001',
        title: 'Mathematics Quiz - Algebra',
        subject: 'Mathematics',
        class: 'Grade 10',
        teacherId: 'TCH001',
        timeLimit: 30,
        totalMarks: 20,
        status: 'Active',
        questions: [
          { q: 'What is the value of x in 2x + 5 = 15?', options: ['5', '10', '7.5', '2.5'], correct: 0 },
          { q: 'Simplify: (x+2)(x-2)', options: ['x²-4', 'x²+4', 'x²-2', 'x²+2x'], correct: 0 },
          { q: 'What is the quadratic formula?', options: ['x = (-b±√(b²-4ac))/2a', 'x = b²-4ac', 'x = -b/2a', 'x = a/b'], correct: 0 },
          { q: 'Factor: x² - 9', options: ['(x-3)(x+3)', '(x-9)(x+1)', '(x-3)²', '(x+3)²'], correct: 0 },
          { q: 'Solve: 3x = 27', options: ['9', '6', '8', '7'], correct: 0 }
        ]
      }
    ];
    this.setData(DB_KEYS.quizzes, quizzes);

    // Gallery
    const gallery = [
      { id: 'GAL001', caption: 'Annual Function 2024', category: 'Annual Function', date: '2024-12-20', url: '' },
      { id: 'GAL002', caption: 'Sports Day Winners', category: 'Sports', date: '2024-11-15', url: '' },
      { id: 'GAL003', caption: 'Science Fair Projects', category: 'Events', date: '2024-10-01', url: '' },
      { id: 'GAL004', caption: 'Class Picnic', category: 'Trips', date: '2024-09-20', url: '' },
      { id: 'GAL005', caption: 'Independence Day', category: 'Activities', date: '2024-08-14', url: '' },
      { id: 'GAL006', caption: 'Smart Classroom', category: 'Classes', date: '2024-07-01', url: '' }
    ];
    this.setData(DB_KEYS.gallery, gallery);

    // Complaints
    const complaints = [
      { id: 'CMP001', person: 'Tariq Khan', complaint: 'Bus delay issue', category: 'Transport', date: '2025-09-18', description: 'School bus on Route B is consistently 20 minutes late.', assignedTo: 'Transport Incharge', status: 'In Progress' },
      { id: 'CMP002', person: 'Sara Malik', complaint: 'Classroom AC not working', category: 'Facilities', date: '2025-09-22', description: 'AC in Grade 10 classroom is not cooling properly.', assignedTo: 'Maintenance', status: 'Pending' }
    ];
    this.setData(DB_KEYS.complaints, complaints);

    // Discipline
    const discipline = [
      { id: 'DIS001', studentId: 'STU015', studentName: students[14].name, date: '2025-09-10', incidentType: 'Late Arrival', description: 'Arrived 30 minutes late without reason', actionTaken: 'Verbal Warning', teacher: 'Fatima Khan', status: 'Closed' },
      { id: 'DIS002', studentId: 'STU008', studentName: students[7].name, date: '2025-09-15', incidentType: 'Uniform Violation', description: 'Not wearing proper school uniform', actionTaken: 'Written Warning', teacher: 'Muhammad Hassan', status: 'Closed' }
    ];
    this.setData(DB_KEYS.discipline, discipline);

    // Achievements
    const achievements = [
      { id: 'ACH001', person: 'Ahmed Khan', personType: 'Student', achievement: '1st Place - Math Olympiad', category: 'Academic', date: '2025-08-20', description: 'District level Mathematics Olympiad', position: '1st', certificate: true },
      { id: 'ACH002', person: 'Fatima Khan', personType: 'Teacher', achievement: 'Best Teacher Award 2025', category: 'Academic', date: '2025-07-15', description: 'Recognized for outstanding teaching performance', position: '', certificate: true },
      { id: 'ACH003', person: students[5].name, personType: 'Student', achievement: 'Gold Medal - Inter School Sports', category: 'Sports', date: '2025-06-10', description: '100m sprint gold medal', position: '1st', certificate: true },
      { id: 'ACH004', person: students[12].name, personType: 'Student', achievement: 'Debate Competition Winner', category: 'Debate', date: '2025-05-22', description: 'Inter-school English debate', position: '1st', certificate: true }
    ];
    this.setData(DB_KEYS.achievements, achievements);

    // Visitors
    const visitors = [
      { id: 'VIS001', name: 'Dr. Kamran Shah', phone: '03005555001', purpose: 'Meeting Principal', personToMeet: 'Dr. Ayesha Rahman', date: today, checkIn: '09:30', checkOut: '10:15', status: 'Checked Out' },
      { id: 'VIS002', name: 'Mrs. Bushra Ali', phone: '03005555002', purpose: 'Admission Inquiry', personToMeet: 'Admin Office', date: today, checkIn: '11:00', checkOut: null, status: 'Checked In' }
    ];
    this.setData(DB_KEYS.visitors, visitors);

    // Contacts (public form submissions)
    const contacts = [
      { id: 'CNT001', name: 'Ali Raza', email: 'ali.raza@email.com', phone: '03006666001', subject: 'Admission Inquiry', message: 'I would like information about Grade 1 admission for my son.', date: '2025-09-20', status: 'Unread' },
      { id: 'CNT002', name: 'Saima Khan', email: 'saima.k@email.com', phone: '03006666002', subject: 'Transport Facility', message: 'Does the school provide transport from Bahria Town?', date: '2025-09-22', status: 'Read' }
    ];
    this.setData(DB_KEYS.contacts, contacts);

    // Messages
    const messages = [
      { id: 'MSG001', from: 'Admin', to: 'All Teachers', subject: 'Staff Meeting', body: 'Staff meeting scheduled for Friday at 2 PM in the conference room.', date: '2025-09-24', read: false },
      { id: 'MSG002', from: 'Fatima Khan', to: 'Parents - Grade 10', subject: 'Homework Reminder', body: 'Please ensure students complete the Mathematics homework by Monday.', date: '2025-09-25', read: false }
    ];
    this.setData(DB_KEYS.messages, messages);

    // Notifications
    const notifications = [
      { id: 'NOT001', title: 'New Admission', message: 'New admission application from Zainab Fatima', type: 'info', read: false, date: new Date().toISOString() },
      { id: 'NOT002', title: 'Pending Fees', message: '5 students have pending fee payments', type: 'warning', read: false, date: new Date().toISOString() },
      { id: 'NOT003', title: 'Upcoming Exam', message: 'Mid-Term Examination starts on October 15', type: 'info', read: false, date: new Date().toISOString() },
      { id: 'NOT004', title: 'Leave Request', message: 'Muhammad Hassan requested annual leave', type: 'info', read: true, date: new Date(Date.now() - 86400000).toISOString() }
    ];
    this.setData(DB_KEYS.notifications, notifications);

    // Activity logs
    const activityLogs = [
      { id: 'LOG001', user: 'Admin User', role: 'admin', action: 'Login', module: 'Auth', details: 'Successful login', date: today, time: '08:00:00' },
      { id: 'LOG002', user: 'Admin User', role: 'admin', action: 'View', module: 'Dashboard', details: 'Accessed dashboard', date: today, time: '08:01:00' }
    ];
    this.setData(DB_KEYS.activityLogs, activityLogs);

    // Settings
    this.saveSettings(this.defaultSettings());

    // Empty arrays for remaining
    this.setData(DB_KEYS.promotions, []);
    this.setData(DB_KEYS.transfers, []);
    this.setData(DB_KEYS.certificates, []);
    this.setData(DB_KEYS.idCards, []);
    this.setData(DB_KEYS.finance, { income: 0, expenses: 0 });

    this.markInitialized();
    console.log('Rehan Public School database initialized with sample data.');
  }
};

// Auto-initialize on load
if (typeof window !== 'undefined') {
  DB.initializeDatabase();
}
