
const Module = {
  page: 1, perPage: 10, searchQ: '', editId: null,
  fields: ['name','phone','purpose','personToMeet','date','checkIn','checkOut','status'],
  init() { this.render(); this.buildForm(); },
  buildForm() {
    const container = document.getElementById('formFields');
    if (!container) return;
    container.innerHTML = `<div class="form-row"><div class="form-group"><label>Visitor Name *</label><input type="text" class="form-control" id="f_name" required></div><div class="form-group"><label>Phone</label><input type="tel" class="form-control" id="f_phone"></div></div><div class="form-row"><div class="form-group"><label>Purpose</label><input type="text" class="form-control" id="f_purpose"></div><div class="form-group"><label>Person to Meet</label><input type="text" class="form-control" id="f_personToMeet"></div></div><div class="form-row"><div class="form-group"><label>Date</label><input type="date" class="form-control" id="f_date"></div><div class="form-group"><label>Check-In</label><input type="time" class="form-control" id="f_checkIn"></div><div class="form-group"><label>Status</label><select class="form-control" id="f_status"><option>Checked In</option><option>Checked Out</option></select></div></div>`;
  },
  getFiltered() {
    let data = DB.getData(DB_KEYS.visitors);
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
    return ``<tr><td>${App.escapeHtml(item.name)}</td><td>${App.escapeHtml(item.purpose||'')}</td><td>${item.personToMeet||'—'}</td><td>${item.checkIn||'—'}</td><td>${App.statusBadge(item.status)}</td>
     <td class="actions"><button class="btn btn-sm btn-info" onclick="Module.view('${item.id}')">👁</button><button class="btn btn-sm btn-success" onclick="Module.checkout('${item.id}')" title="Check Out">🚪</button><button class="btn btn-sm btn-danger" onclick="Module.remove('${item.id}')">🗑</button></td></tr>``;
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
    const item = DB.findById(DB_KEYS.visitors, id);
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
      DB.updateData(DB_KEYS.visitors, this.editId, data);
      App.toast('Record updated successfully');
      DB.logActivity('Updated', 'Visitors', data.name || data.title || this.editId);
    } else {
      DB.addData(DB_KEYS.visitors, data);
      App.toast('Record added successfully');
      DB.logActivity('Added', 'Visitors', data.name || data.title || '');
    }
    App.closeModal('formModal');
    this.render();
  },
  view(id) {
    const item = DB.findById(DB_KEYS.visitors, id);
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
      DB.deleteData(DB_KEYS.visitors, id);
      App.toast('Record deleted successfully');
      DB.logActivity('Deleted', 'Visitors', id);
      this.render();
    });
  }
};

Module.checkout = function(id) {
  const now = new Date().toTimeString().slice(0,5);
  DB.updateData(DB_KEYS.visitors, id, { checkOut: now, status: 'Checked Out' });
  App.toast('Visitor checked out'); this.render();
};
document.addEventListener('DOMContentLoaded', () => Module.init());
