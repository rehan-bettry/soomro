
const Module = {
  page: 1, perPage: 10, searchQ: '', editId: null,
  fields: ['name','section','teacherId','capacity','room','status'],
  init() { this.render(); this.buildForm(); },
  buildForm() {
    const container = document.getElementById('formFields');
    if (!container) return;
    container.innerHTML = `<div class="form-row"><div class="form-group"><label>Class Name *</label><input type="text" class="form-control" id="f_name" required></div><div class="form-group"><label>Section</label><input type="text" class="form-control" id="f_section" value="A"></div></div><div class="form-row"><div class="form-group"><label>Teacher ID</label><input type="text" class="form-control" id="f_teacherId"></div><div class="form-group"><label>Capacity</label><input type="number" class="form-control" id="f_capacity"></div><div class="form-group"><label>Room</label><input type="text" class="form-control" id="f_room"></div></div><div class="form-group"><label>Status</label><select class="form-control" id="f_status"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>`;
  },
  getFiltered() {
    let data = DB.getData(DB_KEYS.classes);
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
    return ``<tr><td>${item.id}</td><td>${item.name}</td><td>${item.section||'A'}</td><td>${item.teacherId||'—'}</td><td>${item.capacity||'—'}</td><td>${item.room||'—'}</td><td>${App.statusBadge(item.status)}</td>
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
    const item = DB.findById(DB_KEYS.classes, id);
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
      DB.updateData(DB_KEYS.classes, this.editId, data);
      App.toast('Record updated successfully');
      DB.logActivity('Updated', 'Classes', data.name || data.title || this.editId);
    } else {
      DB.addData(DB_KEYS.classes, data);
      App.toast('Record added successfully');
      DB.logActivity('Added', 'Classes', data.name || data.title || '');
    }
    App.closeModal('formModal');
    this.render();
  },
  view(id) {
    const item = DB.findById(DB_KEYS.classes, id);
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
      DB.deleteData(DB_KEYS.classes, id);
      App.toast('Record deleted successfully');
      DB.logActivity('Deleted', 'Classes', id);
      this.render();
    });
  }
};
document.addEventListener('DOMContentLoaded', () => Module.init());
