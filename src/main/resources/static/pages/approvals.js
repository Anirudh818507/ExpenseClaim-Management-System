'use strict';
/* approvals.js - Approval Step CRUD + Quick Approve/Reject */

var _allApprovals = [];
var _allClaims    = [];
var _allEmployees = [];
var _apprFilter   = 'ALL';

async function loadApprovals() {
  showSpinner();
  try {
    var results = await Promise.allSettled([
      ApprovalStepAPI.getAll(),
      ClaimAPI.getAll(),
      EmployeeAPI.getAll()
    ]);
    _allApprovals = results[0].status === 'fulfilled' ? results[0].value : [];
    _allClaims    = results[1].status === 'fulfilled' ? results[1].value : [];
    _allEmployees = results[2].status === 'fulfilled' ? results[2].value : [];
    renderApprovals();
    populateDropdowns();
    renderSummaryCards();
  } catch (err) {
    showNotification('Failed to load approvals: ' + err.message, 'error');
  } finally {
    hideSpinner();
  }
}

function renderSummaryCards() {
  var pending  = _allApprovals.filter(function(a) { return a.status === 'PENDING'; }).length;
  var approved = _allApprovals.filter(function(a) { return a.status === 'APPROVED'; }).length;
  var rejected = _allApprovals.filter(function(a) { return a.status === 'REJECTED'; }).length;
  var pEl = document.getElementById('appr-pending');
  var aEl = document.getElementById('appr-approved');
  var rEl = document.getElementById('appr-rejected');
  if (pEl) pEl.textContent = pending;
  if (aEl) aEl.textContent = approved;
  if (rEl) rEl.textContent = rejected;
}

function renderApprovals() {
  var search  = (document.getElementById('appr-search').value || '').toLowerCase().trim();
  var tbody   = document.getElementById('appr-tbody');
  var countEl = document.getElementById('appr-count');

  var filtered = _allApprovals.filter(function(a) {
    var matchStatus = _apprFilter === 'ALL' || a.status === _apprFilter;
    var claimId  = a.claim ? String(a.claim.claimId) : '';
    var empName  = a.claim && a.claim.employee ? (a.claim.employee.name || '') : '';
    var mgrName  = a.manager ? (a.manager.name || '') : '';
    var matchSearch = !search ||
      claimId.includes(search) ||
      empName.toLowerCase().includes(search) ||
      mgrName.toLowerCase().includes(search);
    return matchStatus && matchSearch;
  });

  if (countEl) countEl.textContent = filtered.length + ' of ' + _allApprovals.length + ' approval steps';

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8">' +
      emptyStateHtml('--', 'No Approval Steps Found', 'Create an approval step to link a manager to a claim.') +
      '</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(function(a) {
    var claimId   = a.claim ? a.claim.claimId : '--';
    var claimStatus = a.claim ? (a.claim.status || '--') : '--';
    var empName   = a.claim && a.claim.employee ? escHtml(a.claim.employee.name || '--') : '--';
    var mgrName   = a.manager ? escHtml(a.manager.name || '--') : '--';
    var isPending = a.status === 'PENDING';
    return (
      '<tr>' +
        '<td class="td-id">' + a.approvalStepId + '</td>' +
        '<td><span class="td-muted">#' + claimId + '</span></td>' +
        '<td>' + empName + '</td>' +
        '<td class="td-muted">' + mgrName + '</td>' +
        '<td>' + statusBadge(claimStatus) + '</td>' +
        '<td>' + statusBadge(a.status) + '</td>' +
        '<td style="max-width:160px;white-space:normal;color:var(--text-muted);font-size:12px">' +
          escHtml(truncate(a.remarks, 35)) +
        '</td>' +
        '<td>' +
          '<div class="table-actions">' +
            '<button class="btn-icon view" onclick="viewApproval(' + a.approvalStepId + ')" aria-label="View">View</button>' +
            '<button class="btn-icon edit" onclick="editApproval(' + a.approvalStepId + ')" aria-label="Edit">Edit</button>' +
            (isPending
              ? '<button class="btn-icon approve" onclick="quickApprove(' + a.approvalStepId + ')" aria-label="Approve">Approve</button>' +
                '<button class="btn-icon reject"  onclick="openQuickReject(' + a.approvalStepId + ')" aria-label="Reject">Reject</button>'
              : '') +
            '<button class="btn-icon del" onclick="deleteApproval(' + a.approvalStepId + ')" aria-label="Delete">Del</button>' +
          '</div>' +
        '</td>' +
      '</tr>'
    );
  }).join('');
}

function filterApprovals() { renderApprovals(); }

function setApprFilter(btn, status) {
  _apprFilter = status;
  document.querySelectorAll('#appr-tabs .filter-tab').forEach(function(t) { t.classList.remove('active'); });
  btn.classList.add('active');
  renderApprovals();
}

function populateDropdowns(selClaimId, selMgrId) {
  // Claims dropdown
  var cSel = document.getElementById('appr-claim');
  if (cSel) {
    cSel.innerHTML = '<option value="">-- Select Claim --</option>' +
      _allClaims.map(function(c) {
        var empName = c.employee ? c.employee.name : 'Unknown';
        var sel = (selClaimId && c.claimId === selClaimId) ? ' selected' : '';
        return '<option value="' + c.claimId + '"' + sel + '>' +
          'Claim #' + c.claimId + ' - ' + escHtml(empName) + ' [' + c.status + ']' +
          '</option>';
      }).join('');
  }

  // Managers dropdown
  var mSel = document.getElementById('appr-manager');
  if (mSel) {
    var managers = _allEmployees.filter(function(e) { return e.role === 'MANAGER' || e.role === 'ADMIN'; });
    mSel.innerHTML = '<option value="">-- Select Manager --</option>' +
      managers.map(function(m) {
        var sel = (selMgrId && m.employeeId === selMgrId) ? ' selected' : '';
        return '<option value="' + m.employeeId + '"' + sel + '>' + escHtml(m.name) + ' (' + m.role + ')</option>';
      }).join('');
  }
}

function openAddApprovalModal() {
  document.getElementById('appr-modal-title').textContent = 'Add Approval Step';
  document.getElementById('appr-id').value      = '';
  document.getElementById('appr-status').value  = 'PENDING';
  document.getElementById('appr-remarks').value = '';
  populateDropdowns(null, null);
  openModal('appr-modal');
}

function editApproval(id) {
  var a = _allApprovals.find(function(x) { return x.approvalStepId === id; });
  if (!a) return;
  document.getElementById('appr-modal-title').textContent = 'Edit Approval Step';
  document.getElementById('appr-id').value      = a.approvalStepId;
  document.getElementById('appr-status').value  = a.status || 'PENDING';
  document.getElementById('appr-remarks').value = a.remarks || '';
  populateDropdowns(
    a.claim   ? a.claim.claimId       : null,
    a.manager ? a.manager.employeeId  : null
  );
  openModal('appr-modal');
}

function viewApproval(id) {
  var a = _allApprovals.find(function(x) { return x.approvalStepId === id; });
  if (!a) return;
  var claimId     = a.claim ? a.claim.claimId : '--';
  var claimStatus = a.claim ? (a.claim.status || '--') : '--';
  var empName     = a.claim && a.claim.employee ? escHtml(a.claim.employee.name) : '--';
  var mgrName     = a.manager ? escHtml(a.manager.name) : '--';
  document.getElementById('appr-view-body').innerHTML =
    '<div class="detail-kv">' +
      '<span class="detail-k">Step ID</span><span class="detail-v">#' + a.approvalStepId + '</span>' +
      '<span class="detail-k">Claim</span><span class="detail-v">#' + claimId + '</span>' +
      '<span class="detail-k">Employee</span><span class="detail-v">' + empName + '</span>' +
      '<span class="detail-k">Manager</span><span class="detail-v">' + mgrName + '</span>' +
      '<span class="detail-k">Claim Status</span><span class="detail-v">' + statusBadge(claimStatus) + '</span>' +
      '<span class="detail-k">Appr. Status</span><span class="detail-v">' + statusBadge(a.status) + '</span>' +
      '<span class="detail-k">Remarks</span><span class="detail-v">' + escHtml(a.remarks || '--') + '</span>' +
    '</div>';
  openModal('appr-view-modal');
}

async function saveApproval() {
  var id      = document.getElementById('appr-id').value;
  var claimId = document.getElementById('appr-claim').value;
  var mgrId   = document.getElementById('appr-manager').value;
  var status  = document.getElementById('appr-status').value;
  var remarks = document.getElementById('appr-remarks').value.trim();

  if (!claimId || !mgrId) {
    showNotification('Please select a claim and a manager.', 'warning');
    return;
  }

  var payload = {
    claim:   { claimId: Number(claimId) },
    manager: { employeeId: Number(mgrId) },
    status:  status,
    remarks: remarks || null,
  };

  var btn = document.getElementById('appr-save-btn');
  btn.disabled = true; btn.textContent = 'Saving...';

  try {
    if (id) {
      await ApprovalStepAPI.update(id, payload);
      showNotification('Approval step updated.', 'success');
    } else {
      await ApprovalStepAPI.create(payload);
      showNotification('Approval step created.', 'success');
    }
    closeModal('appr-modal');
    await loadApprovals();
  } catch (err) {
    showNotification(err.message || 'Failed to save approval step.', 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Save';
  }
}

async function quickApprove(id) {
  var a = _allApprovals.find(function(x) { return x.approvalStepId === id; });
  if (!a || !a.claim) return;
  var payload = {
    claim:   { claimId: a.claim.claimId },
    manager: { employeeId: a.manager ? a.manager.employeeId : 0 },
    status:  'APPROVED',
    remarks: a.remarks || 'Approved by manager',
  };
  var ok = await apiCall(function() { return ApprovalStepAPI.update(id, payload); }, 'Claim approved.');
  if (ok) await loadApprovals();
}

function openQuickReject(id) {
  document.getElementById('quick-reject-id').value      = id;
  document.getElementById('quick-reject-remarks').value = '';
  openModal('quick-reject-modal');
}

async function confirmQuickReject() {
  var id      = document.getElementById('quick-reject-id').value;
  var remarks = document.getElementById('quick-reject-remarks').value.trim();
  var a       = _allApprovals.find(function(x) { return x.approvalStepId === Number(id); });
  if (!a || !a.claim) { closeModal('quick-reject-modal'); return; }
  var payload = {
    claim:   { claimId: a.claim.claimId },
    manager: { employeeId: a.manager ? a.manager.employeeId : 0 },
    status:  'REJECTED',
    remarks: remarks || 'Rejected by manager',
  };
  var ok = await apiCall(function() { return ApprovalStepAPI.update(Number(id), payload); }, 'Claim rejected.');
  if (ok) { closeModal('quick-reject-modal'); await loadApprovals(); }
}

function deleteApproval(id) {
  confirmDelete('Approval Step #' + id, async function() {
    try {
      await ApprovalStepAPI.remove(id);
      showNotification('Approval step deleted.', 'info');
      await loadApprovals();
    } catch (err) {
      showNotification(err.message || 'Failed to delete approval step.', 'error');
    }
  });
}

document.addEventListener('DOMContentLoaded', loadApprovals);