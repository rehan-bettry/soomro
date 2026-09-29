
const Module = {
  page: 1, perPage: 10, searchQ: '', editId: null,
  fields: ['employeeName','type','basicSalary','allowance','bonus','deduction','paymentDate','paymentMethod','status','month'],
  init() { this.render(); this.buildForm(); },
  buildForm() {
    const container = document.getElementById('formFields');
    if (!container) return;
    container.innerHTML = `<div class="form-row"><div class="form-group"><label>Employee Name *</label><input type="text" class="form-control" id="f_employeeName" required></div><div class="form-group"><label>Type</label><select class="form-control" id="f_type"><option>Teacher</option><option>Staff</option></select></div></div><div class="form-row"><div class="form-group"><label>Basic Salary</label><input type="number" class="form-control" id="f_basicSalary"></div><div class="form-group"><label>Allowance</label><input type="number" class="form-control" id="f_allowance" value="0"></div></div><div class="form-row"><div class="form-group"><label>Bonus</label><input type="number" class="form-control" id="f_bonus" value="0"></div><div class="form-group"><label>Deduction</label><input type="number" class="form-control" id="f_deduction" value="0"></div></div><div class="form-row"><div class="form-group"><label>Payment Date</label><input type="date" class="form-control" id="f_paymentDate"></div><div class="form-group"><label>Method</label><select class="form-control" id="f_paymentMethod"><option>Bank</option><option>Cash</option></select></div><div class="form-group"><label>Status</label><select class="form-control" id="f_status"><option>Paid</option><option>Pending</option></select></div></div><div class="form-group"><label>Month</label><input type="text" class="form-control" id="f_month"></div>`;
  },
  getFiltered() {
    let data = DB.getData(DB_KEYS.payroll);
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
    return ``<tr><td>${App.escapeHtml(item.employeeName)}</td><td>${App.formatCurrency(item.basicSalary)}</td><td>${App.formatCurrency(item.allowance)}</td><td>${App.formatCurrency(item.netSalary)}</td><td>${App.formatDate(item.paymentDate)}</td><td>${App.statusBadge(item.status)}</td>
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
    const item = DB.findById(DB_KEYS.payroll, id);
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
      DB.updateData(DB_KEYS.payroll, this.editId, data);
      App.toast('Record updated successfully');
      DB.logActivity('Updated', 'Payroll', data.name || data.title || this.editId);
    } else {
      DB.addData(DB_KEYS.payroll, data);
      App.toast('Record added successfully');
      DB.logActivity('Added', 'Payroll', data.name || data.title || '');
    }
    App.closeModal('formModal');
    this.render();
  },
  view(id) {
    const item = DB.findById(DB_KEYS.payroll, id);
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
      DB.deleteData(DB_KEYS.payroll, id);
      App.toast('Record deleted successfully');
      DB.logActivity('Deleted', 'Payroll', id);
      this.render();
    });
  }
};

Module.save = function() {
  const data = {};
  this.fields.forEach(f => { const el = document.getElementById('f_' + f); if (el) data[f] = el.value; });
  data.basicSalary = parseFloat(data.basicSalary) || 0;
  data.allowance = parseFloat(data.allowance) || 0;
  data.bonus = parseFloat(data.bonus) || 0;
  data.deduction = parseFloat(data.deduction) || 0;
  data.netSalary = data.basicSalary + data.allowance + data.bonus - data.deduction;
  if (this.editId) { DB.updateData(DB_KEYS.payroll, this.editId, data); App.toast('Payroll updated'); }
  else { DB.addData(DB_KEYS.payroll, data); App.toast('Payroll added'); }
  App.closeModal('formModal'); this.render();
};
document.addEventListener('DOMContentLoaded', () => Module.init());
