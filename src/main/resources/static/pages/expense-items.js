'use strict';
/* expense-items.js - Expense Item CRUD */

var _allItems     = [];
var _allClaims    = [];
var _allEmployees = [];
var _catFilter    = 'ALL';

async function loadItems() {
  showSpinner();
  try {
    var results = await Promise.allSettled([
      ExpenseItemAPI.getAll(),
      ClaimAPI.getAll(),
      EmployeeAPI.getAll()
    ]);
    _allItems     = results[0].status === 'fulfilled' ? results[0].value : [];
    _allClaims    = results[1].status === 'fulfilled' ? results[1].value : [];
    _allEmployees = results[2].status === 'fulfilled' ? results[2].value : [];
    renderItems();
    populateClaimDropdown();
  } catch (err) {
    showNotification('Failed to load expense items: ' + err.message, 'error');
  } finally {
    hideSpinner();
  }
}

/* Build a map of claimId -> claim for quick lookup */
function getClaimMap() {
  var map = {};
  _allClaims.forEach(function(c) { map[c.claimId] = c; });
  return map;
}

function getClaimForItem(item) {
  /* API returns items without claim (JsonBackReference),
     so we look them up from the claims list */
  if (item.claimId) return getClaimMap()[item.claimId] || null;
  /* Some items may have a partial claim object */
  if (item.claim && item.claim.claimId) return getClaimMap()[item.claim.claimId] || null;
  /* Fall back: scan claims' expenseItems array */
  var claimMap = getClaimMap();
  var found = null;
  _allClaims.forEach(function(c) {
    if (c.expenseItems && c.expenseItems.some(function(i) { return i.expenseItemId === item.expenseItemId; })) {
      found = c;
    }
  });
  return found;
}

function renderItems() {
  var search  = (document.getElementById('item-search').value || '').toLowerCase().trim();
  var tbody   = document.getElementById('items-tbody');
  var countEl = document.getElementById('items-count');

  var filtered = _allItems.filter(function(item) {
    var matchCat = _catFilter === 'ALL' || (item.category || '').toLowerCase() === _catFilter.toLowerCase();
    var matchSearch = !search ||
      (item.category || '').toLowerCase().includes(search) ||
      (item.description || '').toLowerCase().includes(search);
    return matchCat && matchSearch;
  });

  if (countEl) countEl.textContent = filtered.length + ' of ' + _allItems.length + ' items';

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7">' +
      emptyStateHtml('--', 'No Expense Items Found', 'Try adjusting your search or category filter.') +
      '</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(function(item) {
    var claim   = getClaimForItem(item);
    var claimId = claim ? claim.claimId : (item.claim ? item.claim.claimId : '--');
    var empName = '--';
    if (claim && claim.employee) {
      empName = escHtml(claim.employee.name || '--');
    }
    return (
      '<tr>' +
        '<td class="td-id">' + item.expenseItemId + '</td>' +
        '<td><span class="td-muted">#' + claimId + '</span></td>' +
        '<td class="td-muted">' + empName + '</td>' +
        '<td>' +
          '<span style="background:var(--bg-elevated);border:1px solid var(--border);padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600">' +
            escHtml(item.category || '--') +
          '</span>' +
        '</td>' +
        '<td class="amount">' + formatCurrency(item.amount) + '</td>' +
        '<td class="td-muted" style="max-width:200px;white-space:normal">' + escHtml(truncate(item.description, 50)) + '</td>' +
        '<td>' +
          '<div class="table-actions">' +
            '<button class="btn-icon edit" onclick="editItem(' + item.expenseItemId + ')" aria-label="Edit">Edit</button>' +
            '<button class="btn-icon del"  onclick="deleteItem(' + item.expenseItemId + ')" aria-label="Delete">Del</button>' +
          '</div>' +
        '</td>' +
      '</tr>'
    );
  }).join('');
}

function filterItems() { renderItems(); }

function setCatFilter(btn, cat) {
  _catFilter = cat;
  document.querySelectorAll('#cat-tabs .filter-tab').forEach(function(t) { t.classList.remove('active'); });
  btn.classList.add('active');
  renderItems();
}

function populateClaimDropdown(selectedClaimId) {
  var sel = document.getElementById('item-claim');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Select Claim --</option>' +
    _allClaims.map(function(c) {
      var empName = c.employee ? c.employee.name : 'Unknown';
      var selected = (selectedClaimId && c.claimId === selectedClaimId) ? ' selected' : '';
      return '<option value="' + c.claimId + '"' + selected + '>' +
        'Claim #' + c.claimId + ' - ' + escHtml(empName) + ' (' + escHtml(c.status) + ')' +
        '</option>';
    }).join('');
}

function openAddItemModal() {
  document.getElementById('item-modal-title').textContent = 'Add Expense Item';
  document.getElementById('item-id').value        = '';
  document.getElementById('item-amount').value    = '';
  document.getElementById('item-desc').value      = '';
  document.getElementById('item-category').value  = 'Travel';
  populateClaimDropdown(null);
  openModal('item-modal');
}

function editItem(id) {
  var item = _allItems.find(function(i) { return i.expenseItemId === id; });
  if (!item) return;
  var claim = getClaimForItem(item);
  document.getElementById('item-modal-title').textContent = 'Edit Expense Item';
  document.getElementById('item-id').value        = item.expenseItemId;
  document.getElementById('item-amount').value    = item.amount || '';
  document.getElementById('item-desc').value      = item.description || '';
  document.getElementById('item-category').value  = item.category || 'Travel';
  populateClaimDropdown(claim ? claim.claimId : null);
  openModal('item-modal');
}

async function saveItem() {
  var id       = document.getElementById('item-id').value;
  var claimId  = document.getElementById('item-claim').value;
  var category = document.getElementById('item-category').value;
  var amount   = document.getElementById('item-amount').value;
  var desc     = document.getElementById('item-desc').value.trim();

  if (!claimId || !amount) {
    showNotification('Please select a claim and enter an amount.', 'warning');
    return;
  }
  if (Number(amount) < 0) {
    showNotification('Amount cannot be negative.', 'warning');
    return;
  }

  var payload = {
    claim:       { claimId: Number(claimId) },
    category:    category,
    amount:      Number(amount),
    description: desc || null,
  };

  var btn = document.getElementById('item-save-btn');
  btn.disabled = true; btn.textContent = 'Saving...';

  try {
    if (id) {
      await ExpenseItemAPI.update(id, payload);
      showNotification('Expense item updated.', 'success');
    } else {
      await ExpenseItemAPI.create(payload);
      showNotification('Expense item created.', 'success');
    }
    closeModal('item-modal');
    await loadItems();
  } catch (err) {
    showNotification(err.message || 'Failed to save expense item.', 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Save Item';
  }
}

function deleteItem(id) {
  confirmDelete('Expense Item #' + id, async function() {
    try {
      await ExpenseItemAPI.remove(id);
      showNotification('Expense item deleted.', 'info');
      await loadItems();
    } catch (err) {
      showNotification(err.message || 'Failed to delete expense item.', 'error');
    }
  });
}

document.addEventListener('DOMContentLoaded', loadItems);