
const Module = {
  page: 1, perPage: 10, searchQ: '', editId: null,
  fields: ['title','subject','class','timeLimit','totalMarks','status'],
  init() { this.render(); this.buildForm(); },
  buildForm() {
    const container = document.getElementById('formFields');
    if (!container) return;
    container.innerHTML = `<div class="form-group"><label>Title *</label><input type="text" class="form-control" id="f_title" required></div><div class="form-row"><div class="form-group"><label>Subject</label><input type="text" class="form-control" id="f_subject"></div><div class="form-group"><label>Class</label><input type="text" class="form-control" id="f_class"></div></div><div class="form-row"><div class="form-group"><label>Time Limit (min)</label><input type="number" class="form-control" id="f_timeLimit" value="30"></div><div class="form-group"><label>Total Marks</label><input type="number" class="form-control" id="f_totalMarks" value="20"></div><div class="form-group"><label>Status</label><select class="form-control" id="f_status"><option>Active</option><option>Inactive</option></select></div></div>`;
  },
  getFiltered() {
    let data = DB.getData(DB_KEYS.quizzes);
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
    return ``<tr><td>${App.escapeHtml(item.title)}</td><td>${item.subject||'—'}</td><td>${item.class||'—'}</td><td>${(item.questions||[]).length}</td><td>${item.timeLimit||'—'} min</td><td>${App.statusBadge(item.status)}</td>
     <td class="actions"><button class="btn btn-sm btn-info" onclick="Module.view('${item.id}')">👁</button><button class="btn btn-sm btn-success" onclick="Quizzes.take('${item.id}')">▶ Take</button><button class="btn btn-sm btn-danger" onclick="Module.remove('${item.id}')">🗑</button></td></tr>``;
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
    const item = DB.findById(DB_KEYS.quizzes, id);
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
      DB.updateData(DB_KEYS.quizzes, this.editId, data);
      App.toast('Record updated successfully');
      DB.logActivity('Updated', 'Quizzes', data.name || data.title || this.editId);
    } else {
      DB.addData(DB_KEYS.quizzes, data);
      App.toast('Record added successfully');
      DB.logActivity('Added', 'Quizzes', data.name || data.title || '');
    }
    App.closeModal('formModal');
    this.render();
  },
  view(id) {
    const item = DB.findById(DB_KEYS.quizzes, id);
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
      DB.deleteData(DB_KEYS.quizzes, id);
      App.toast('Record deleted successfully');
      DB.logActivity('Deleted', 'Quizzes', id);
      this.render();
    });
  }
};
document.addEventListener('DOMContentLoaded', () => Module.init());

const Quizzes = {
  take(id) {
    const quiz = DB.findById(DB_KEYS.quizzes, id);
    if (!quiz || !quiz.questions) { App.toast('No questions in this quiz', 'warning'); return; }
    let score = 0;
    const answers = [];
    quiz.questions.forEach((q, i) => {
      const ans = prompt(`Q${i+1}: ${q.q}\n${q.options.map((o,j) => (j+1)+'. '+o).join('\n')}\nEnter option number (1-${q.options.length}):`);
      const selected = parseInt(ans) - 1;
      answers.push(selected);
      if (selected === q.correct) score++;
    });
    const pct = ((score / quiz.questions.length) * 100).toFixed(1);
    alert(`Quiz Complete!\nScore: ${score}/${quiz.questions.length}\nPercentage: ${pct}%\nGrade: ${App.calcGrade(pct)}`);
  }
};
