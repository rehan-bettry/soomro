
const Module = {
  page: 1, perPage: 10, searchQ: '', editId: null,
  fields: ['studentId','studentName','examName','subject','class','totalMarks','obtainedMarks','remarks'],
  init() { this.render(); this.buildForm(); },
  buildForm() {
    const container = document.getElementById('formFields');
    if (!container) return;
    container.innerHTML = `<div class="form-row"><div class="form-group"><label>Student Name *</label><input type="text" class="form-control" id="f_studentName" required></div><div class="form-group"><label>Student ID</label><input type="text" class="form-control" id="f_studentId"></div></div><div class="form-row"><div class="form-group"><label>Exam Name</label><input type="text" class="form-control" id="f_examName"></div><div class="form-group"><label>Subject</label><input type="text" class="form-control" id="f_subject"></div><div class="form-group"><label>Class</label><input type="text" class="form-control" id="f_class"></div></div><div class="form-row"><div class="form-group"><label>Total Marks</label><input type="number" class="form-control" id="f_totalMarks" value="100"></div><div class="form-group"><label>Obtained Marks</label><input type="number" class="form-control" id="f_obtainedMarks"></div></div><div class="form-group"><label>Remarks</label><input type="text" class="form-control" id="f_remarks"></div>`;
  },
  getFiltered() {
    let data = DB.getData(DB_KEYS.results);
    if (!Array.isArray(data)) data = data.vehicles || data.routes || [];
    if (this.searchQ) {
      const q = this.searchQ.toLowerCase();
      data = data.filter(item => JSON.stringify(item).toLowerCase().includes(q));
    }
    return data;
  },
  render() {
    const filtered = this.getFiltered();
    const pag = App.paginate(filtered, this.page, this.perPage);
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    tbody.innerHTML = pag.data.map(item => this.renderRow(item)).join('') ||
      `<tr><td colspan="10" class="text-center text-muted" style="padding:2rem">No records found</td></tr>`;
    App.renderPagination('pagination', pag, p => { this.page = p; this.render(); });
  },
  renderRow(item) {
    return ``<tr><td>${App.escapeHtml(item.studentName)}</td><td>${item.examName||'—'}</td><td>${item.subject||'—'}</td><td>${item.obtainedMarks}/${item.totalMarks}</td><td>${item.grade||'—'}</td><td>${item.percentage||'—'}%</td>
     <td class="actions"><button class="btn btn-sm btn-info" onclick="Module.view('${item.id}')">👁</button><button class="btn btn-sm btn-primary" onclick="Module.edit('${item.id}')">✏️</button><button class="btn btn-sm btn-danger" onclick="Module.remove('${item.id}')">🗑</button></td></tr>``;
  },
  search(q) { this.searchQ = q; this.page = 1; this.render(); },
  openAdd() {
    this.editId = null;
    const form = document.getElementById('dataForm');
    if (form) form.reset();
    const title = document.getElementById('modalTitle');
    if (title) title.textContent = 'Add New';
    App.openModal('formModal');
  },
  edit(id) {
    const item = DB.findById(DB_KEYS.results, id);
    if (!item) return;
    this.editId = id;
    this.fields.forEach(f => {
      const el = document.getElementById('f_' + f);
      if (el) el.value = item[f] || '';
    });
    const title = document.getElementById('modalTitle');
    if (title) title.textContent = 'Edit';
    App.openModal('formModal');
  },
  save() {
    const data = {};
    this.fields.forEach(f => {
      const el = document.getElementById('f_' + f);
      if (el) data[f] = el.value;
    });
    if (this.editId) {
      DB.updateData(DB_KEYS.results, this.editId, data);
      App.toast('Record updated successfully');
      DB.logActivity('Updated', 'Results', data.name || data.title || this.editId);
    } else {
      DB.addData(DB_KEYS.results, data);
      App.toast('Record added successfully');
      DB.logActivity('Added', 'Results', data.name || data.title || '');
    }
    App.closeModal('formModal');
    this.render();
  },
  view(id) {
    const item = DB.findById(DB_KEYS.results, id);
    if (!item) return;
    let html = '<div class="detail-grid">';
    Object.keys(item).forEach(k => {
      if (k === 'createdAt' || k === 'updatedAt') return;
      html += `<div class="detail-item"><label>${k}</label><span>${App.escapeHtml(String(item[k]||'—'))}</span></div>`;
    });
    html += '</div>';
    document.getElementById('viewBody').innerHTML = html;
    App.openModal('viewModal');
  },
  remove(id) {
    App.confirm('Are you sure you want to delete this record?', () => {
      DB.deleteData(DB_KEYS.results, id);
      App.toast('Record deleted successfully');
      DB.logActivity('Deleted', 'Results', id);
      this.render();
    });
  }
};

Module.save = function() {
  const data = {};
  this.fields.forEach(f => { const el = document.getElementById('f_' + f); if (el) data[f] = el.value; });
  data.totalMarks = parseFloat(data.totalMarks) || 100;
  data.obtainedMarks = parseFloat(data.obtainedMarks) || 0;
  data.percentage = ((data.obtainedMarks / data.totalMarks) * 100).toFixed(1);
  data.grade = App.calcGrade(data.percentage);
  if (this.editId) { DB.updateData(DB_KEYS.results, this.editId, data); App.toast('Result updated'); }
  else { DB.addData(DB_KEYS.results, data); App.toast('Result saved'); }
  App.closeModal('formModal'); this.render();
};
document.addEventListener('DOMContentLoaded', () => Module.init());
