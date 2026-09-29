
const Module = {
  page: 1, perPage: 10, searchQ: '', editId: null,
  fields: ['studentId','studentName','class','month','totalFee','paid','paymentMethod','status'],
  init() { this.render(); this.buildForm(); },
  buildForm() {
    const container = document.getElementById('formFields');
    if (!container) return;
    container.innerHTML = `<div class="form-row"><div class="form-group"><label>Student Name *</label><input type="text" class="form-control" id="f_studentName" required></div><div class="form-group"><label>Student ID</label><input type="text" class="form-control" id="f_studentId"></div></div><div class="form-row"><div class="form-group"><label>Class</label><input type="text" class="form-control" id="f_class"></div><div class="form-group"><label>Month</label><input type="text" class="form-control" id="f_month" placeholder="September 2025"></div></div><div class="form-row"><div class="form-group"><label>Total Fee</label><input type="number" class="form-control" id="f_totalFee"></div><div class="form-group"><label>Paid Amount</label><input type="number" class="form-control" id="f_paid"></div></div><div class="form-row"><div class="form-group"><label>Payment Method</label><select class="form-control" id="f_paymentMethod"><option>Cash</option><option>Bank</option><option>Online</option></select></div><div class="form-group"><label>Status</label><select class="form-control" id="f_status"><option>Pending</option><option>Partial</option><option>Paid</option></select></div></div>`;
  },
  getFiltered() {
    let data = DB.getData(DB_KEYS.fees);
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
    return ``<tr><td>${App.escapeHtml(item.studentName)}</td><td>${item.class||'—'}</td><td>${item.month||'—'}</td><td>${App.formatCurrency(item.totalFee)}</td><td>${App.formatCurrency(item.paid)}</td><td>${App.formatCurrency(item.remaining)}</td><td>${App.statusBadge(item.status)}</td>
     <td class="actions"><button class="btn btn-sm btn-info" onclick="Module.view('${item.id}')">👁</button><button class="btn btn-sm btn-primary" onclick="Module.edit('${item.id}')">✏️</button><button class="btn btn-sm btn-success" onclick="Module.collect('${item.id}')" title="Collect">💰</button><button class="btn btn-sm btn-danger" onclick="Module.remove('${item.id}')">🗑</button></td></tr>``;
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
    const item = DB.findById(DB_KEYS.fees, id);
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
      DB.updateData(DB_KEYS.fees, this.editId, data);
      App.toast('Record updated successfully');
      DB.logActivity('Updated', 'Fees', data.name || data.title || this.editId);
    } else {
      DB.addData(DB_KEYS.fees, data);
      App.toast('Record added successfully');
      DB.logActivity('Added', 'Fees', data.name || data.title || '');
    }
    App.closeModal('formModal');
    this.render();
  },
  view(id) {
    const item = DB.findById(DB_KEYS.fees, id);
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
      DB.deleteData(DB_KEYS.fees, id);
      App.toast('Record deleted successfully');
      DB.logActivity('Deleted', 'Fees', id);
      this.render();
    });
  }
};

Module.collect = function(id) {
  const fee = DB.findById(DB_KEYS.fees, id);
  if (!fee) return;
  const paid = fee.totalFee;
  DB.updateData(DB_KEYS.fees, id, { paid, remaining: 0, status: 'Paid', paymentDate: new Date().toISOString().split('T')[0] });
  App.toast('Payment recorded successfully');
  DB.logActivity('Fee Payment', 'Fees', fee.studentName);
  this.render();
};
Module.save = function() {
  const data = {};
  this.fields.forEach(f => { const el = document.getElementById('f_' + f); if (el) data[f] = el.value; });
  data.totalFee = parseFloat(data.totalFee) || 0;
  data.paid = parseFloat(data.paid) || 0;
  data.remaining = data.totalFee - data.paid;
  if (data.paid >= data.totalFee) data.status = 'Paid';
  else if (data.paid > 0) data.status = 'Partial';
  else data.status = 'Pending';
  if (this.editId) { DB.updateData(DB_KEYS.fees, this.editId, data); App.toast('Fee updated'); }
  else { DB.addData(DB_KEYS.fees, data); App.toast('Fee added'); }
  App.closeModal('formModal'); this.render();
};
document.addEventListener('DOMContentLoaded', () => Module.init());
