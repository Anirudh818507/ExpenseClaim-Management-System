'use strict';
/* employees.js - Employee CRUD */

var _allEmployees = [];
var _roleFilter   = 'ALL';

async function loadEmployees() {
  showSpinner();
  try {
    _allEmployees = await EmployeeAPI.getAll();
    renderEmployees();
    populateManagerDropdown();
  } catch (err) {
    showNotification('Failed to load employees: ' + err.message, 'error');
    document.getElementById('emp-tbody').innerHTML =
      '<tr><td colspan="6">' + emptyStateHtml('!', 'Load Failed', err.message) + '</td></tr>';
  } finally {
    hideSpinner();
  }
}

function renderEmployees() {
  var search  = (document.getElementById('emp-search').value || '').toLowerCase().trim();
  var tbody   = document.getElementById('emp-tbody');
  var countEl = document.getElementById('emp-count');

  var filtered = _allEmployees.filter(function(e) {
    var matchRole = _roleFilter === 'ALL' || e.role === _roleFilter;
    var matchSearch = !search ||
      (e.name && e.name.toLowerCase().includes(search)) ||
      (e.email && e.email.toLowerCase().includes(search)) ||
      (e.department && e.department.toLowerCase().includes(search));
    return matchRole && matchSearch;
  });

  if (countEl) countEl.textContent = filtered.length + ' of ' + _allEmployees.length + ' employees';

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">' +
      emptyStateHtml('?', 'No Employees Found', 'Try adjusting your search or filter.') +
      '</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(function(e) {
    var roleCls = e.role === 'MANAGER' ? 'manager' : e.role === 'ADMIN' ? 'admin' : 'employee';
    var mgrName = '';
    if (e.managerId) {
      var mgr = _allEmployees.find(function(m) { return m.employeeId === e.managerId; });
      mgrName = mgr ? escHtml(mgr.name) : ('#' + e.managerId);
    }
    return (
      '<tr>' +
        '<td class="td-id">' + e.employeeId + '</td>' +
        '<td>' +
          '<div style="font-weight:600">' + escHtml(e.name) + '</div>' +
          '<div style="font-size:12px;color:var(--text-muted)">' + escHtml(e.email) + '</div>' +
        '</td>' +
        '<td class="td-muted">' + escHtml(e.department) + '</td>' +
        '<td><span class="role-badge ' + roleCls + '">' + escHtml(e.role) + '</span></td>' +
        '<td class="td-muted">' + (mgrName || '--') + '</td>' +
        '<td>' +
          '<div class="table-actions">' +
            '<button class="btn-icon view"    onclick="viewEmployee(' + e.employeeId + ')" aria-label="View">View</button>' +
            '<button class="btn-icon edit"    onclick="editEmployee(' + e.employeeId + ')" aria-label="Edit">Edit</button>' +
            '<button class="btn-icon del"     onclick="deleteEmployee(' + e.employeeId + ',\'' + escHtml(e.name) + '\')" aria-label="Delete">Del</button>' +
          '</div>' +
        '</td>' +
      '</tr>'
    );
  }).join('');
}

function filterEmployees() {
  renderEmployees();
}

function setRoleFilter(btn, role) {
  _roleFilter = role;
  document.querySelectorAll('#role-tabs .filter-tab').forEach(function(t) {
    t.classList.remove('active');
  });
  btn.classList.add('active');
  renderEmployees();
}

function populateManagerDropdown(selectedId) {
  var sel = document.getElementById('emp-mgr');
  if (!sel) return;
  var managers = _allEmployees.filter(function(e) {
    return e.role === 'MANAGER' || e.role === 'ADMIN';
  });
  sel.innerHTML = '<option value="">-- No Manager --</option>' +
    managers.map(function(m) {
      var selected = (selectedId && m.employeeId === selectedId) ? ' selected' : '';
      return '<option value="' + m.employeeId + '"' + selected + '>' + escHtml(m.name) + ' (' + m.role + ')</option>';
    }).join('');
}

function openAddEmployeeModal() {
  document.getElementById('emp-modal-title').textContent = 'Add Employee';
  document.getElementById('emp-id').value    = '';
  document.getElementById('emp-name').value  = '';
  document.getElementById('emp-email').value = '';
  document.getElementById('emp-dept').value  = '';
  document.getElementById('emp-role').value  = 'EMPLOYEE';
  populateManagerDropdown(null);
  openModal('emp-modal');
  document.getElementById('emp-name').focus();
}

function editEmployee(id) {
  var emp = _allEmployees.find(function(e) { return e.employeeId === id; });
  if (!emp) return;
  document.getElementById('emp-modal-title').textContent = 'Edit Employee';
  document.getElementById('emp-id').value    = emp.employeeId;
  document.getElementById('emp-name').value  = emp.name  || '';
  document.getElementById('emp-email').value = emp.email || '';
  document.getElementById('emp-dept').value  = emp.department || '';
  document.getElementById('emp-role').value  = emp.role  || 'EMPLOYEE';
  populateManagerDropdown(emp.managerId);
  openModal('emp-modal');
  document.getElementById('emp-name').focus();
}

function viewEmployee(id) {
  var emp = _allEmployees.find(function(e) { return e.employeeId === id; });
  if (!emp) return;
  var mgr = emp.managerId ? _allEmployees.find(function(m) { return m.employeeId === emp.managerId; }) : null;
  var body = document.getElementById('emp-view-body');
  body.innerHTML =
    '<div class="detail-kv">' +
      '<span class="detail-k">ID</span><span class="detail-v">#' + emp.employeeId + '</span>' +
      '<span class="detail-k">Name</span><span class="detail-v">' + escHtml(emp.name) + '</span>' +
      '<span class="detail-k">Email</span><span class="detail-v">' + escHtml(emp.email) + '</span>' +
      '<span class="detail-k">Department</span><span class="detail-v">' + escHtml(emp.department) + '</span>' +
      '<span class="detail-k">Role</span><span class="detail-v">' + escHtml(emp.role) + '</span>' +
      '<span class="detail-k">Manager</span><span class="detail-v">' + (mgr ? escHtml(mgr.name) : '--') + '</span>' +
    '</div>';
  openModal('emp-view-modal');
}

async function saveEmployee() {
  var id   = document.getElementById('emp-id').value;
  var name = document.getElementById('emp-name').value.trim();
  var email = document.getElementById('emp-email').value.trim();
  var dept  = document.getElementById('emp-dept').value.trim();
  var role  = document.getElementById('emp-role').value;
  var mgrId = document.getElementById('emp-mgr').value;

  if (!name || !email || !dept) {
    showNotification('Name, email, and department are required.', 'warning');
    return;
  }

  var payload = {
    name: name,
    email: email,
    department: dept,
    role: role,
    managerId: mgrId ? Number(mgrId) : null,
  };

  var btn = document.getElementById('emp-save-btn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    if (id) {
      await EmployeeAPI.update(id, payload);
      showNotification('Employee updated successfully.', 'success');
    } else {
      await EmployeeAPI.create(payload);
      showNotification('Employee created successfully.', 'success');
    }
    closeModal('emp-modal');
    await loadEmployees();
  } catch (err) {
    showNotification(err.message || 'Failed to save employee.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Employee';
  }
}

function deleteEmployee(id, name) {
  confirmDelete(name, async function() {
    try {
      await EmployeeAPI.remove(id);
      showNotification('Employee deleted.', 'info');
      await loadEmployees();
    } catch (err) {
      showNotification(err.message || 'Failed to delete employee.', 'error');
    }
  });
}

document.addEventListener('DOMContentLoaded', loadEmployees);