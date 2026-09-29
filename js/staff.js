
const Module = {
  page: 1, perPage: 10, searchQ: '', editId: null,
  fields: ['name','position','department','phone','email','joiningDate','salary','status'],
  init() { this.render(); this.buildForm(); },
  buildForm() {
    const container = document.getElementById('formFields');
    if (!container) return;
    container.innerHTML = `<div class="form-group"><label>Name *</label><input type="text" class="form-control" id="f_name" required></div><div class="form-row"><div class="form-group"><label>Position</label><input type="text" class="form-control" id="f_position"></div><div class="form-group"><label>Department</label><select class="form-control" id="f_department"><option>Administration</option><option>Accounts</option><option>Security</option><option>Transport</option><option>Library</option><option>Maintenance</option><option>Support</option></select></div></div><div class="form-row"><div class="form-group"><label>Phone</label><input type="tel" class="form-control" id="f_phone"></div><div class="form-group"><label>Email</label><input type="email" class="form-control" id="f_email"></div></div><div class="form-row"><div class="form-group"><label>Joining Date</label><input type="date" class="form-control" id="f_joiningDate"></div><div class="form-group"><label>Salary</label><input type="number" class="form-control" id="f_salary"></div><div class="form-group"><label>Status</label><select class="form-control" id="f_status"><option value="active">Active</option><option value="inactive">Inactive</option></select></div></div>`;
  },
  getFiltered() {
    let data = DB.getData(DB_KEYS.staff);
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
    return ``<tr><td>${item.id}</td><td>${App.escapeHtml(item.name)}</td><td>${item.position||'—'}</td><td>${item.department||'—'}</td><td>${item.phone||'—'}</td><td>${App.formatCurrency(item.salary)}</td><td>${App.statusBadge(item.status)}</td>
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
    const item = DB.findById(DB_KEYS.staff, id);
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
      DB.updateData(DB_KEYS.staff, this.editId, data);
      App.toast('Record updated successfully');
      DB.logActivity('Updated', 'Staff', data.name || data.title || this.editId);
    } else {
      DB.addData(DB_KEYS.staff, data);
      App.toast('Record added successfully');
      DB.logActivity('Added', 'Staff', data.name || data.title || '');
    }
    App.closeModal('formModal');
    this.render();
  },
  view(id) {
    const item = DB.findById(DB_KEYS.staff, id);
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
      DB.deleteData(DB_KEYS.staff, id);
      App.toast('Record deleted successfully');
      DB.logActivity('Deleted', 'Staff', id);
      this.render();
    });
  }
};
document.addEventListener('DOMContentLoaded', () => Module.init());
