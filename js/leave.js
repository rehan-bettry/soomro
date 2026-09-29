
const Module = {
  page: 1, perPage: 10, searchQ: '', editId: null,
  fields: ['name','role','leaveType','startDate','endDate','reason','status'],
  init() { this.render(); this.buildForm(); },
  buildForm() {
    const container = document.getElementById('formFields');
    if (!container) return;
    container.innerHTML = `<div class="form-row"><div class="form-group"><label>Name *</label><input type="text" class="form-control" id="f_name" required></div><div class="form-group"><label>Role</label><select class="form-control" id="f_role"><option>Student</option><option>Teacher</option><option>Staff</option></select></div></div><div class="form-row"><div class="form-group"><label>Leave Type</label><select class="form-control" id="f_leaveType"><option>Sick Leave</option><option>Casual Leave</option><option>Annual Leave</option></select></div><div class="form-group"><label>Start Date</label><input type="date" class="form-control" id="f_startDate"></div><div class="form-group"><label>End Date</label><input type="date" class="form-control" id="f_endDate"></div></div><div class="form-group"><label>Reason</label><textarea class="form-control" id="f_reason"></textarea></div><div class="form-group"><label>Status</label><select class="form-control" id="f_status"><option>Pending</option><option>Approved</option><option>Rejected</option></select></div>`;
  },
  getFiltered() {
    let data = DB.getData(DB_KEYS.leaves);
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
    return ``<tr><td>${App.escapeHtml(item.name)}</td><td>${item.role||'—'}</td><td>${item.leaveType||'—'}</td><td>${App.formatDate(item.startDate)}</td><td>${App.formatDate(item.endDate)}</td><td>${App.statusBadge(item.status)}</td>
     <td class="actions"><button class="btn btn-sm btn-info" onclick="Module.view('${item.id}')">👁</button><button class="btn btn-sm btn-success" onclick="Module.approve('${item.id}')">✓</button><button class="btn btn-sm btn-danger" onclick="Module.reject('${item.id}')">✕</button></td></tr>``;
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
    const item = DB.findById(DB_KEYS.leaves, id);
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
      DB.updateData(DB_KEYS.leaves, this.editId, data);
      App.toast('Record updated successfully');
      DB.logActivity('Updated', 'Leaves', data.name || data.title || this.editId);
    } else {
      DB.addData(DB_KEYS.leaves, data);
      App.toast('Record added successfully');
      DB.logActivity('Added', 'Leaves', data.name || data.title || '');
    }
    App.closeModal('formModal');
    this.render();
  },
  view(id) {
    const item = DB.findById(DB_KEYS.leaves, id);
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
      DB.deleteData(DB_KEYS.leaves, id);
      App.toast('Record deleted successfully');
      DB.logActivity('Deleted', 'Leaves', id);
      this.render();
    });
  }
};

Module.approve = function(id) { DB.updateData(DB_KEYS.leaves, id, { status: 'Approved' }); App.toast('Leave approved'); this.render(); };
Module.reject = function(id) { DB.updateData(DB_KEYS.leaves, id, { status: 'Rejected' }); App.toast('Leave rejected'); this.render(); };
document.addEventListener('DOMContentLoaded', () => Module.init());
