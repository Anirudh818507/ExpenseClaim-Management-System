'use strict';
/* dashboard.js - ExpenseClaim Dashboard */

var _employees = [];
var _claims    = [];

async function loadDashboard() {
  showSpinner();
  try {
    var results = await Promise.allSettled([
      EmployeeAPI.getAll(),
      ClaimAPI.getAll()
    ]);

    _employees = results[0].status === 'fulfilled' ? results[0].value : [];
    _claims    = results[1].status === 'fulfilled' ? results[1].value : [];

    renderStats();
    renderDistribution();
    renderRecentClaims();
  } catch (err) {
    showNotification('Failed to load dashboard data: ' + err.message, 'error');
  } finally {
    hideSpinner();
  }
}

function renderStats() {
  var pending  = _claims.filter(function(c) { return c.status === 'PENDING'; }).length;
  var approved = _claims.filter(function(c) { return c.status === 'APPROVED'; }).length;
  var rejected = _claims.filter(function(c) { return c.status === 'REJECTED'; }).length;

  setText('stat-emp',      _employees.length);
  setText('stat-claims',   _claims.length);
  setText('stat-pending',  pending);
  setText('stat-approved', approved);
  setText('stat-rejected', rejected);
}

function renderDistribution() {
  var total    = _claims.length || 1;
  var pending  = _claims.filter(function(c) { return c.status === 'PENDING'; }).length;
  var approved = _claims.filter(function(c) { return c.status === 'APPROVED'; }).length;
  var rejected = _claims.filter(function(c) { return c.status === 'REJECTED'; }).length;

  setWidth('seg-pending',  Math.round(pending  / total * 100));
  setWidth('seg-approved', Math.round(approved / total * 100));
  setWidth('seg-rejected', Math.round(rejected / total * 100));

  setText('leg-pending',  'Pending (' + pending + ')');
  setText('leg-approved', 'Approved (' + approved + ')');
  setText('leg-rejected', 'Rejected (' + rejected + ')');
}

function renderRecentClaims() {
  var tbody = document.getElementById('recent-tbody');
  if (!tbody) return;

  var recent = _claims.slice(-8).reverse();

  if (recent.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6">' +
        emptyStateHtml('--', 'No Claims Yet', 'Claims will appear here once created.') +
      '</td></tr>';
    return;
  }

  tbody.innerHTML = recent.map(function(c) {
    var empName = c.employee ? escHtml(c.employee.name || 'Unknown') : 'Unknown';
    var empDept = c.employee ? escHtml(c.employee.department || '--') : '--';
    return (
      '<tr>' +
        '<td class="td-id">#' + c.claimId + '</td>' +
        '<td>' + empName + '</td>' +
        '<td class="td-muted">' + empDept + '</td>' +
        '<td class="amount">' + formatCurrency(c.totalAmount) + '</td>' +
        '<td>' + statusBadge(c.status) + '</td>' +
        '<td><a href="/pages/claims.html" class="btn-icon view">View</a></td>' +
      '</tr>'
    );
  }).join('');
}

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setWidth(id, pct) {
  var el = document.getElementById(id);
  if (el) el.style.width = pct + '%';
}

document.addEventListener('DOMContentLoaded', loadDashboard);