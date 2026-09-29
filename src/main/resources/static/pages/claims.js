'use strict';
/* claims.js - Claims CRUD + Approve/Reject workflow */

var _allClaims    = [];
var _allEmployees = [];
var _statusFilter = 'ALL';

async function loadClaims() {
  showSpinner();
  try {
    var results = await Promise.allSettled([
      ClaimAPI.getAll(),
      EmployeeAPI.getAll()
    ]);
    _allClaims    = results[0].status === 'fulfilled' ? results[0].value : [];
    _allEmployees = results[1].status === 'fulfilled' ? results[1].value : [];
    renderClaims();
    populateEmployeeDropdown();
  } catch (err) {
    showNotification('Failed to load claims: ' + err.message, 'error');
  } finally {
    hideSpinner();
  }
}

function renderClaims() {
  var search  = (document.getElementById('claim-search').value || '').toLowerCase().trim();
  var tbody   = document.getElementById('claims-tbody');
  var countEl = document.getElementById('claims-count');

  var filtered = _allClaims.filter(function(c) {
    var matchStatus = _statusFilter === 'ALL' || c.status === _statusFilter;
    var empName = c.employee ? (c.employee.name || '') : '';
    var empDept = c.employee ? (c.employee.department || '') : '';
    var matchSearch = !search ||
      empName.toLowerCase().includes(search) ||
      empDept.toLowerCase().includes(search) ||
      String(c.claimId).includes(search);
    return matchStatus && matchSearch;
  });

  if (countEl) countEl.textContent = filtered.length + ' of ' + _allClaims.length + ' claims';

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">' +
      emptyStateHtml('--', 'No Claims Found', 'Try adjusting your search or filter.') +
      '</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(function(c) {
    var empName = c.employee ? escHtml(c.employee.name || 'Unknown') : 'Unknown';
    var empDept = c.employee ? escHtml(c.employee.department || '--') : '--';
    var isPending = c.status === 'PENDING';
    return (
      '<tr>' +
        '<td class="td-id">#' + c.claimId + '</td>' +
        '<td>' +
          '<div style="font-weight:600">' + empName + '</div>' +
        '</td>' +
        '<td class="td-muted">' + empDept + '</td>' +
        '<td class="amount">' + formatCurrency(c.totalAmount) + '</td>' +
        '<td>' + statusBadge(c.status) + '</td>' +
        '<td>' +
          '<div class="table-actions">' +
            '<button class="btn-icon view"    onclick="viewClaim(' + c.claimId + ')" aria-label="View">View</button>' +
            '<button class="btn-icon edit"    onclick="editClaim(' + c.claimId + ')" aria-label="Edit">Edit</button>' +
            (isPending ?
              '<button class="btn-icon approve" onclick="approveClaim(' + c.claimId + ')" aria-label="Approve">Approve</button>' +
              '<button class="btn-icon reject"  onclick="openRejectModal(' + c.claimId + ')" aria-label="Reject">Reject</button>'
              : '') +
            '<button class="btn-icon del"     onclick="deleteClaim(' + c.claimId + ')" aria-label="Delete">Del</button>' +
          '</div>' +
        '</td>' +
      '</tr>'
    );
  }).join('');
}

function filterClaims() { renderClaims(); }

function setStatusFilter(btn, status) {
  _statusFilter = status;
  document.querySelectorAll('#status-tabs .filter-tab').forEach(function(t) { t.classList.remove('active'); });
  btn.classList.add('active');
  renderClaims();
}

function populateEmployeeDropdown(selectedId) {
  var sel = document.getElementById('claim-emp');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Select Employee --</option>' +
    _allEmployees.map(function(e) {
      var selected = (selectedId && e.employeeId === selectedId) ? ' selected' : '';
      return '<option value="' + e.employeeId + '"' + selected + '>' + escHtml(e.name) + ' (' + escHtml(e.department) + ')</option>';
    }).join('');
}

function openAddClaimModal() {
  document.getElementById('claim-modal-title').textContent = 'New Claim';
  document.getElementById('claim-id').value     = '';
  document.getElementById('claim-amount').value = '';
  document.getElementById('claim-status').value = 'PENDING';
  populateEmployeeDropdown(null);
  openModal('claim-modal');
}

function editClaim(id) {
  var c = _allClaims.find(function(x) { return x.claimId === id; });
  if (!c) return;
  document.getElementById('claim-modal-title').textContent = 'Edit Claim';
  document.getElementById('claim-id').value     = c.claimId;
  document.getElementById('claim-amount').value = c.totalAmount;
  document.getElementById('claim-status').value = c.status || 'PENDING';
  populateEmployeeDropdown(c.employee ? c.employee.employeeId : null);
  openModal('claim-modal');
}

function viewClaim(id) {
  var c = _allClaims.find(function(x) { return x.claimId === id; });
  if (!c) return;
  var empName = c.employee ? escHtml(c.employee.name) : 'Unknown';
  var empDept = c.employee ? escHtml(c.employee.department) : '--';
  var items   = c.expenseItems || [];

  var itemsHtml = items.length === 0
    ? '<p style="color:var(--text-muted);font-size:13px">No expense items linked to this claim.</p>'
    : '<div class="table-wrap" style="margin-top:6px"><table class="data-table" style="min-width:380px"><thead><tr><th>ID</th><th>Category</th><th>Amount</th><th>Description</th></tr></thead><tbody>' +
      items.map(function(i) {
        return '<tr>' +
          '<td class="td-id">' + i.expenseItemId + '</td>' +
          '<td>' + escHtml(i.category) + '</td>' +
          '<td class="amount">' + formatCurrency(i.amount) + '</td>' +
          '<td class="td-muted">' + escHtml(truncate(i.description, 40)) + '</td>' +
          '</tr>';
      }).join('') +
      '</tbody></table></div>';

  document.getElementById('claim-view-body').innerHTML =
    '<div class="detail-kv">' +
      '<span class="detail-k">Claim ID</span><span class="detail-v">#' + c.claimId + '</span>' +
      '<span class="detail-k">Employee</span><span class="detail-v">' + empName + '</span>' +
      '<span class="detail-k">Department</span><span class="detail-v">' + empDept + '</span>' +
      '<span class="detail-k">Total Amount</span><span class="detail-v amount">' + formatCurrency(c.totalAmount) + '</span>' +
      '<span class="detail-k">Status</span><span class="detail-v">' + statusBadge(c.status) + '</span>' +
    '</div>' +
    '<div class="detail-section">' +
      '<div class="detail-section-title">Expense Items (' + items.length + ')</div>' +
      itemsHtml +
    '</div>';

  openModal('claim-view-modal');
}

async function saveClaim() {
  var id     = document.getElementById('claim-id').value;
  var empId  = document.getElementById('claim-emp').value;
  var amount = document.getElementById('claim-amount').value;
  var status = document.getElementById('claim-status').value;

  if (!empId || !amount) {
    showNotification('Please select an employee and enter an amount.', 'warning');
    return;
  }
  if (Number(amount) < 0) {
    showNotification('Amount cannot be negative.', 'warning');
    return;
  }

  var payload = {
    employee: { employeeId: Number(empId) },
    totalAmount: Number(amount),
    status: status,
  };

  var btn = document.getElementById('claim-save-btn');
  btn.disabled = true; btn.textContent = 'Saving...';

  try {
    if (id) {
      await ClaimAPI.update(id, payload);
      showNotification('Claim updated successfully.', 'success');
    } else {
      await ClaimAPI.create(payload);
      showNotification('Claim created successfully.', 'success');
    }
    closeModal('claim-modal');
    await loadClaims();
  } catch (err) {
    showNotification(err.message || 'Failed to save claim.', 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Save Claim';
  }
}

async function approveClaim(id) {
  showSpinner();
  try {
    await ClaimAPI.approve(id);
    showNotification('Claim approved successfully.', 'success');
    await loadClaims();
  } catch (err) {
    var msg = err.message || '';
    if (msg.toLowerCase().includes('no pending approval')) {
      showNotification(
        'Cannot approve: No pending Approval Step exists for this claim. ' +
        'Go to the Approvals page and create a PENDING approval step first.',
        'warning', 'Approval Step Required'
      );
    } else if (msg.toLowerCase().includes('already approved')) {
      showNotification('This claim is already approved.', 'info');
    } else {
      showNotification(msg || 'Failed to approve claim.', 'error');
    }
  } finally {
    hideSpinner();
  }
}

function openRejectModal(id) {
  document.getElementById('reject-claim-id').value = id;
  document.getElementById('reject-remarks').value  = '';
  openModal('reject-modal');
}

async function confirmReject() {
  var id      = document.getElementById('reject-claim-id').value;
  var remarks = document.getElementById('reject-remarks').value.trim();
  showSpinner();
  try {
    await ClaimAPI.reject(id, remarks || null);
    showNotification('Claim rejected.', 'info');
    closeModal('reject-modal');
    await loadClaims();
  } catch (err) {
    var msg = err.message || '';
    if (msg.toLowerCase().includes('no pending approval')) {
      showNotification(
        'Cannot reject: No pending Approval Step exists. Create one on the Approvals page first.',
        'warning', 'Approval Step Required'
      );
      closeModal('reject-modal');
    } else if (msg.toLowerCase().includes('already rejected')) {
      showNotification('This claim is already rejected.', 'info');
      closeModal('reject-modal');
    } else {
      showNotification(msg || 'Failed to reject claim.', 'error');
    }
  } finally {
    hideSpinner();
  }
}

function deleteClaim(id) {
  confirmDelete('Claim #' + id, async function() {
    try {
      await ClaimAPI.remove(id);
      showNotification('Claim deleted.', 'info');
      await loadClaims();
    } catch (err) {
      showNotification(err.message || 'Failed to delete claim.', 'error');
    }
  });
}

document.addEventListener('DOMContentLoaded', loadClaims);