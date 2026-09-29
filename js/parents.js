
const Module = {
  page: 1, perPage: 10, searchQ: '', editId: null,
  fields: ['name','relationship','phone','email','address','occupation'],
  init() { this.render(); this.buildForm(); },
  buildForm() {
    const container = document.getElementById('formFields');
    if (!container) return;
    container.innerHTML = `<div class="form-group"><label>Name *</label><input type="text" class="form-control" id="f_name" required></div><div class="form-row"><div class="form-group"><label>Relationship</label><select class="form-control" id="f_relationship"><option>Father</option><option>Mother</option><option>Guardian</option></select></div><div class="form-group"><label>Phone</label><input type="tel" class="form-control" id="f_phone"></div></div><div class="form-row"><div class="form-group"><label>Email</label><input type="email" class="form-control" id="f_email"></div><div class="form-group"><label>Occupation</label><input type="text" class="form-control" id="f_occupation"></div></div><div class="form-group"><label>Address</label><textarea class="form-control" id="f_address"></textarea></div>`;
  },
  getFiltered() {
    let data = DB.getData(DB_KEYS.parents);
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
    return ``<tr><td>${item.id}</td><td>${App.escapeHtml(item.name)}</td><td>${item.relationship||'—'}</td><td>${item.phone||'—'}</td><td>${item.email||'—'}</td><td>${item.occupation||'—'}</td>
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
    const item = DB.findById(DB_KEYS.parents, id);
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
      DB.updateData(DB_KEYS.parents, this.editId, data);
      App.toast('Record updated successfully');
      DB.logActivity('Updated', 'Parents', data.name || data.title || this.editId);
    } else {
      DB.addData(DB_KEYS.parents, data);
      App.toast('Record added successfully');
      DB.logActivity('Added', 'Parents', data.name || data.title || '');
    }
    App.closeModal('formModal');
    this.render();
  },
  view(id) {
    const item = DB.findById(DB_KEYS.parents, id);
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
      DB.deleteData(DB_KEYS.parents, id);
      App.toast('Record deleted successfully');
      DB.logActivity('Deleted', 'Parents', id);
      this.render();
    });
  }
};
document.addEventListener('DOMContentLoaded', () => Module.init());
