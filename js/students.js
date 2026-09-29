
const Students = {
  page: 1, perPage: 10, searchQ: '', filterClass: '', filterStatus: '',
  init() {
    this.populateClassFilter();
    this.render();
  },
  populateClassFilter() {
    const classes = [...new Set(DB.getData(DB_KEYS.students).map(s => s.class))];
    const sel = document.getElementById('filterClass');
    const formSel = document.getElementById('f_class');
    classes.forEach(c => {
      sel.innerHTML += `<option value="${c}">${c}</option>`;
      if (formSel) formSel.innerHTML += `<option value="${c}">${c}</option>`;
    });
    // Also add standard classes
    ['Nursery','KG','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10'].forEach(c => {
      if (!classes.includes(c) && formSel) formSel.innerHTML += `<option value="${c}">${c}</option>`;
    });
  },
  getFiltered() {
    let data = DB.getData(DB_KEYS.students);
    if (this.searchQ) {
      const q = this.searchQ.toLowerCase();
      data = data.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || (s.admissionNo||'').toLowerCase().includes(q) || (s.phone||'').includes(q));
    }
    if (this.filterClass) data = data.filter(s => s.class === this.filterClass);
    if (this.filterStatus) data = data.filter(s => s.status === this.filterStatus);
    return data;
  },
  render() {
    const filtered = this.getFiltered();
    const pag = App.paginate(filtered, this.page, this.perPage);
    document.getElementById('tableBody').innerHTML = pag.data.map(s => `
      <tr>
        <td>${s.id}</td>
        <td><div class="d-flex align-center gap-1"><span class="avatar-sm">${App.getInitials(s.name)}</span>${App.escapeHtml(s.name)}</div></td>
        <td>${s.class} - ${s.section||'A'}</td>
        <td>${s.rollNo||'—'}</td>
        <td>${s.gender||'—'}</td>
        <td>${s.phone||'—'}</td>
        <td>${App.statusBadge(s.status)}</td>
        <td class="actions">
          <button class="btn btn-sm btn-info" onclick="Students.view('${s.id}')" title="View">👁</button>
          <button class="btn btn-sm btn-primary" onclick="Students.edit('${s.id}')" title="Edit">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="Students.remove('${s.id}')" title="Delete">🗑</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="8" class="text-center text-muted" style="padding:2rem">No students found</td></tr>';
    App.renderPagination('pagination', pag, p => { this.page = p; this.render(); });
  },
  search(q) { this.searchQ = q; this.page = 1; this.render(); },
  filter() {
    this.filterClass = document.getElementById('filterClass').value;
    this.filterStatus = document.getElementById('filterStatus').value;
    this.page = 1; this.render();
  },
  openAdd() {
    document.getElementById('modalTitle').textContent = 'Add Student';
    document.getElementById('dataForm').reset();
    document.getElementById('editId').value = '';
    App.openModal('formModal');
  },
  edit(id) {
    const s = DB.findById(DB_KEYS.students, id);
    if (!s) return;
    document.getElementById('modalTitle').textContent = 'Edit Student';
    document.getElementById('editId').value = s.id;
    ['name','admissionNo','fatherName','motherName','dob','gender','bloodGroup','class','section','rollNo','phone','email','address','guardian','guardianPhone','admissionDate','previousSchool','status'].forEach(f => {
      const el = document.getElementById('f_' + f);
      if (el) el.value = s[f] || '';
    });
    App.openModal('formModal');
  },
  save() {
    const form = document.getElementById('dataForm');
    if (!App.validateForm(form)) { App.toast('Please fill required fields', 'error'); return; }
    const data = {};
    ['name','admissionNo','fatherName','motherName','dob','gender','bloodGroup','class','section','rollNo','phone','email','address','guardian','guardianPhone','admissionDate','previousSchool','status'].forEach(f => {
      data[f] = document.getElementById('f_' + f).value;
    });
    data.rollNo = parseInt(data.rollNo) || 0;
    const editId = document.getElementById('editId').value;
    if (editId) {
      DB.updateData(DB_KEYS.students, editId, data);
      DB.logActivity('Student Updated', 'Students', data.name);
      App.toast('Student updated successfully');
    } else {
      data.status = data.status || 'active';
      DB.addData(DB_KEYS.students, data);
      DB.logActivity('Student Added', 'Students', data.name);
      DB.addNotification('New Student', `${data.name} added to ${data.class}`, 'info');
      App.toast('Student added successfully');
    }
    App.closeModal('formModal');
    this.render();
  },
  view(id) {
    const s = DB.findById(DB_KEYS.students, id);
    if (!s) return;
    document.getElementById('viewBody').innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar">${App.getInitials(s.name)}</div>
        <div class="profile-info"><h2>${App.escapeHtml(s.name)}</h2><p>${s.class} - Section ${s.section||'A'} | Roll #${s.rollNo||'—'}</p><p>${App.statusBadge(s.status)}</p></div>
      </div>
      <div class="detail-grid">
        <div class="detail-item"><label>Student ID</label><span>${s.id}</span></div>
        <div class="detail-item"><label>Admission No</label><span>${s.admissionNo||'—'}</span></div>
        <div class="detail-item"><label>Father Name</label><span>${App.escapeHtml(s.fatherName||'—')}</span></div>
        <div class="detail-item"><label>Mother Name</label><span>${App.escapeHtml(s.motherName||'—')}</span></div>
        <div class="detail-item"><label>Date of Birth</label><span>${App.formatDate(s.dob)}</span></div>
        <div class="detail-item"><label>Gender</label><span>${s.gender||'—'}</span></div>
        <div class="detail-item"><label>Blood Group</label><span>${s.bloodGroup||'—'}</span></div>
        <div class="detail-item"><label>Phone</label><span>${s.phone||'—'}</span></div>
        <div class="detail-item"><label>Email</label><span>${s.email||'—'}</span></div>
        <div class="detail-item"><label>Address</label><span>${App.escapeHtml(s.address||'—')}</span></div>
        <div class="detail-item"><label>Guardian</label><span>${App.escapeHtml(s.guardian||'—')}</span></div>
        <div class="detail-item"><label>Guardian Phone</label><span>${s.guardianPhone||'—'}</span></div>
        <div class="detail-item"><label>Admission Date</label><span>${App.formatDate(s.admissionDate)}</span></div>
        <div class="detail-item"><label>Previous School</label><span>${App.escapeHtml(s.previousSchool||'—')}</span></div>
      </div>
    `;
    App.openModal('viewModal');
  },
  remove(id) {
    App.confirm('Are you sure you want to delete this student?', () => {
      const s = DB.findById(DB_KEYS.students, id);
      DB.deleteData(DB_KEYS.students, id);
      DB.logActivity('Student Deleted', 'Students', s ? s.name : id);
      App.toast('Student deleted successfully');
      this.render();
    });
  }
};
document.addEventListener('DOMContentLoaded', () => Students.init());
