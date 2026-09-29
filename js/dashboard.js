
const Dashboard = {
  init() {
    this.renderStats();
    this.renderCharts();
    this.renderTables();
  },
  renderStats() {
    const students = DB.getData(DB_KEYS.students);
    const teachers = DB.getData(DB_KEYS.teachers);
    const parents = DB.getData(DB_KEYS.parents);
    const staff = DB.getData(DB_KEYS.staff);
    const classes = DB.getData(DB_KEYS.classes);
    const today = new Date().toISOString().split('T')[0];
    const att = DB.getData(DB_KEYS.attendance).filter(a => a.date === today);
    const present = att.filter(a => a.status === 'Present').length;
    const absent = att.filter(a => a.status === 'Absent').length;
    const fees = DB.getData(DB_KEYS.fees);
    const pending = fees.filter(f => f.status === 'Pending' || f.status === 'Partial');
    const pendingAmt = pending.reduce((s, f) => s + (f.remaining || 0), 0);
    const paid = fees.filter(f => f.status === 'Paid').reduce((s, f) => s + (f.paid || 0), 0);
    const expenses = DB.getData(DB_KEYS.expenses).reduce((s, e) => s + (e.amount || 0), 0);
    const exams = DB.getData(DB_KEYS.exams).filter(e => e.status === 'Upcoming' || e.status === 'Scheduled').length;
    const admissions = DB.getData(DB_KEYS.admissions).filter(a => a.status === 'Pending').length;

    const stats = [
      { label: 'Total Students', value: students.length, icon: '🎓', color: 'blue' },
      { label: 'Total Teachers', value: teachers.length, icon: '👨‍🏫', color: 'green' },
      { label: 'Total Parents', value: parents.length, icon: '👨‍👩‍👧', color: 'purple' },
      { label: 'Total Staff', value: staff.length, icon: '👥', color: 'orange' },
      { label: 'Total Classes', value: classes.length, icon: '🏫', color: 'teal' },
      { label: 'Present Today', value: present, icon: '✅', color: 'green' },
      { label: 'Absent Today', value: absent, icon: '❌', color: 'red' },
      { label: 'Pending Fees', value: App.formatCurrency(pendingAmt), icon: '💰', color: 'orange' },
      { label: 'Fee Collected', value: App.formatCurrency(paid), icon: '💵', color: 'green' },
      { label: 'Expenses', value: App.formatCurrency(expenses), icon: '📉', color: 'red' },
      { label: 'Upcoming Exams', value: exams, icon: '📋', color: 'indigo' },
      { label: 'New Admissions', value: admissions, icon: '📝', color: 'pink' }
    ];
    document.getElementById('statCards').innerHTML = stats.map(s => `
      <div class="stat-card">
        <div class="stat-icon ${s.color}">${s.icon}</div>
        <div class="stat-info"><h4>${s.label}</h4><div class="stat-value">${s.value}</div></div>
      </div>
    `).join('');
  },
  renderCharts() {
    if (typeof Chart === 'undefined') return;
    const students = DB.getData(DB_KEYS.students);
    const classCount = {};
    students.forEach(s => { classCount[s.class] = (classCount[s.class] || 0) + 1; });
    new Chart(document.getElementById('chartStudents'), {
      type: 'bar',
      data: { labels: Object.keys(classCount), datasets: [{ label: 'Students', data: Object.values(classCount), backgroundColor: '#3b82f6', borderRadius: 6 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
    const att = DB.getData(DB_KEYS.attendance);
    const statusCount = { Present: 0, Absent: 0, Late: 0, Leave: 0 };
    att.forEach(a => { if (statusCount[a.status] !== undefined) statusCount[a.status]++; });
    new Chart(document.getElementById('chartAttendance'), {
      type: 'doughnut',
      data: { labels: Object.keys(statusCount), datasets: [{ data: Object.values(statusCount), backgroundColor: ['#10b981','#ef4444','#f59e0b','#6366f1'] }] },
      options: { responsive: true, maintainAspectRatio: false }
    });
    const fees = DB.getData(DB_KEYS.fees);
    const feeStatus = { Paid: 0, Partial: 0, Pending: 0 };
    fees.forEach(f => { if (feeStatus[f.status] !== undefined) feeStatus[f.status]++; });
    new Chart(document.getElementById('chartFees'), {
      type: 'pie',
      data: { labels: Object.keys(feeStatus), datasets: [{ data: Object.values(feeStatus), backgroundColor: ['#10b981','#f59e0b','#ef4444'] }] },
      options: { responsive: true, maintainAspectRatio: false }
    });
    const income = fees.reduce((s, f) => s + (f.paid || 0), 0);
    const expenses = DB.getData(DB_KEYS.expenses).reduce((s, e) => s + (e.amount || 0), 0);
    new Chart(document.getElementById('chartFinance'), {
      type: 'bar',
      data: { labels: ['Income', 'Expenses'], datasets: [{ data: [income, expenses], backgroundColor: ['#10b981', '#ef4444'], borderRadius: 6 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  },
  renderTables() {
    const students = DB.getData(DB_KEYS.students).slice(-5).reverse();
    document.querySelector('#recentStudents tbody').innerHTML = students.map(s =>
      `<tr><td><div class="d-flex align-center gap-1"><span class="avatar-sm">${App.getInitials(s.name)}</span>${App.escapeHtml(s.name)}</div></td><td>${s.class}</td><td>${App.statusBadge(s.status)}</td></tr>`
    ).join('') || '<tr><td colspan="3" class="text-center text-muted">No students</td></tr>';

    const notices = DB.getData(DB_KEYS.notices).slice(0, 5);
    document.getElementById('latestNotices').innerHTML = notices.map(n =>
      `<div class="notice-item ${n.priority==='Urgent'?'urgent':n.priority==='Important'?'important':''}" style="margin-bottom:0.5rem"><h4 style="font-size:0.85rem">${App.escapeHtml(n.title)}</h4><div class="notice-meta">${n.date} · ${n.priority}</div></div>`
    ).join('') || '<p class="text-muted">No notices</p>';

    const exams = DB.getData(DB_KEYS.exams).filter(e => e.status === 'Upcoming' || e.status === 'Scheduled').slice(0, 5);
    document.querySelector('#upcomingExams tbody').innerHTML = exams.map(e =>
      `<tr><td>${App.escapeHtml(e.name)}</td><td>${e.subject}</td><td>${App.formatDate(e.date)}</td></tr>`
    ).join('') || '<tr><td colspan="3" class="text-center text-muted">No upcoming exams</td></tr>';

    const pending = DB.getData(DB_KEYS.fees).filter(f => f.status !== 'Paid').slice(0, 5);
    document.querySelector('#pendingFees tbody').innerHTML = pending.map(f =>
      `<tr><td>${App.escapeHtml(f.studentName)}</td><td>${App.formatCurrency(f.remaining)}</td><td>${App.statusBadge(f.status)}</td></tr>`
    ).join('') || '<tr><td colspan="3" class="text-center text-muted">No pending fees</td></tr>';
  }
};
document.addEventListener('DOMContentLoaded', () => Dashboard.init());
