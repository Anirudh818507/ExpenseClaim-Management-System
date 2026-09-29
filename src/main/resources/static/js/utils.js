/**
 * utils.js - Shared UI Utilities for ExpenseClaim
 * Notifications, Spinner, Modals, Delete Confirm, Formatters
 * Encoding: UTF-8, all ASCII-safe (no emoji)
 */

'use strict';

/* ============================================================
   NOTIFICATIONS / TOASTS
   ============================================================ */
let _notifContainer = null;

function _getNotifContainer() {
  if (!_notifContainer) {
    _notifContainer = document.createElement('div');
    _notifContainer.className = 'notifications-container';
    document.body.appendChild(_notifContainer);
  }
  return _notifContainer;
}

/**
 * showNotification(message, type, title)
 * type: 'success' | 'error' | 'info' | 'warning'
 */
function showNotification(message, type, title) {
  if (type === undefined) type = 'info';
  var iconText = { success: 'OK', error: '!', info: 'i', warning: '!' };
  var titleMap = { success: 'Success', error: 'Error', info: 'Info', warning: 'Warning' };
  var displayTitle = title != null ? title : (titleMap[type] || 'Info');

  var el = document.createElement('div');
  el.className = 'notification ' + type;
  el.innerHTML =
    '<span class="notif-icon">' + (iconText[type] || 'i') + '</span>' +
    '<div class="notif-body">' +
      '<div class="notif-title">' + displayTitle + '</div>' +
      '<div class="notif-msg">' + message + '</div>' +
    '</div>' +
    '<button class="notif-close" onclick="this.closest(\'.notification\').remove()">x</button>';

  _getNotifContainer().appendChild(el);

  // Auto-dismiss after 5s
  setTimeout(function() {
    if (el.isConnected) {
      el.classList.add('fade-out');
      setTimeout(function() { el.remove(); }, 400);
    }
  }, 5000);
}

/* ============================================================
   SPINNER / LOADING OVERLAY
   ============================================================ */
var _spinnerEl  = null;
var _spinnerCnt = 0;

function _getSpinner() {
  if (!_spinnerEl) {
    _spinnerEl = document.createElement('div');
    _spinnerEl.className = 'spinner-overlay';
    _spinnerEl.innerHTML =
      '<div class="spinner-box">' +
        '<div class="spinner"></div>' +
        '<div class="spinner-lbl">Loading...</div>' +
      '</div>';
    document.body.appendChild(_spinnerEl);
  }
  return _spinnerEl;
}

function showSpinner() {
  _spinnerCnt++;
  _getSpinner().classList.add('active');
}

function hideSpinner() {
  _spinnerCnt = Math.max(0, _spinnerCnt - 1);
  if (_spinnerCnt === 0) _getSpinner().classList.remove('active');
}

/* ============================================================
   MODAL HELPERS
   ============================================================ */
function openModal(id) {
  var el = document.getElementById(id);
  if (el) { el.classList.add('open'); document.body.style.overflow = 'hidden'; }
}

function closeModal(id) {
  var el = document.getElementById(id);
  if (el) { el.classList.remove('open'); document.body.style.overflow = ''; }
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay.open').forEach(function(m) {
    m.classList.remove('open');
  });
  document.body.style.overflow = '';
}

// Click on overlay backdrop to close
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) closeAllModals();
});

// Escape key to close
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeAllModals();
});

/* ============================================================
   DELETE CONFIRMATION DIALOG
   ============================================================ */
var _confirmCb = null;

function _ensureConfirmModal() {
  if (document.getElementById('__confirm-modal')) return;
  var html =
    '<div id="__confirm-modal" class="modal-overlay">' +
      '<div class="modal" style="max-width:400px">' +
        '<div class="modal-header">' +
          '<span class="modal-title">Confirm Delete</span>' +
          '<button class="modal-close" onclick="closeModal(\'__confirm-modal\')">&#x2715;</button>' +
        '</div>' +
        '<div class="modal-body" style="text-align:center;padding:24px 20px 16px">' +
          '<div class="confirm-icon">X</div>' +
          '<p class="confirm-msg" id="__confirm-msg">Are you sure? This action cannot be undone.</p>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn btn-ghost" onclick="closeModal(\'__confirm-modal\')">Cancel</button>' +
          '<button class="btn btn-danger" id="__confirm-ok">Delete</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.body.insertAdjacentHTML('beforeend', html);

  document.getElementById('__confirm-ok').addEventListener('click', function() {
    closeModal('__confirm-modal');
    if (typeof _confirmCb === 'function') _confirmCb();
    _confirmCb = null;
  });
}

/**
 * confirmDelete(label, onConfirm)
 * Shows a styled confirmation dialog.
 * onConfirm() is called only when the user clicks Delete.
 */
function confirmDelete(label, onConfirm) {
  _ensureConfirmModal();
  var msg = document.getElementById('__confirm-msg');
  if (msg) msg.textContent = 'Are you sure you want to delete "' + label + '"? This action cannot be undone.';
  _confirmCb = onConfirm;
  openModal('__confirm-modal');
}

/* ============================================================
   FORMATTING HELPERS
   ============================================================ */

/** Format number as Indian Rupees */
function formatCurrency(amount) {
  if (amount == null || isNaN(Number(amount))) return '--';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 2,
  }).format(Number(amount));
}

/** Returns a status badge <span> for PENDING / APPROVED / REJECTED */
function statusBadge(status) {
  var s = (status || 'UNKNOWN').toUpperCase();
  var cls = s === 'APPROVED' ? 'approved' : s === 'REJECTED' ? 'rejected' : 'pending';
  return '<span class="badge badge-' + cls + '">' + s + '</span>';
}

/** Format ISO date string to readable format */
function formatDate(dateStr) {
  if (!dateStr) return '--';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch (e) { return dateStr; }
}

/** Truncate long strings with ellipsis */
function truncate(str, max) {
  if (max === undefined) max = 45;
  if (!str) return '--';
  return str.length > max ? str.slice(0, max) + '...' : str;
}

/** Escape HTML to safely insert user data into innerHTML */
function escHtml(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ============================================================
   EMPTY STATE RENDERER
   ============================================================ */
function emptyStateHtml(iconText, title, desc) {
  return (
    '<div class="empty-state fade-in">' +
      '<div class="empty-icon">' + (iconText || '?') + '</div>' +
      '<div class="empty-title">' + title + '</div>' +
      '<div class="empty-desc">' + desc + '</div>' +
    '</div>'
  );
}

/* ============================================================
   DEBOUNCE  (for search inputs)
   ============================================================ */
function debounce(fn, delay) {
  if (delay === undefined) delay = 280;
  var t;
  return function() {
    var args = arguments;
    clearTimeout(t);
    t = setTimeout(function() { fn.apply(null, args); }, delay);
  };
}

/* ============================================================
   ACTIVE NAV HIGHLIGHT
   ============================================================ */
function highlightNav() {
  var current = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.nav-item[href]').forEach(function(item) {
    var href = item.getAttribute('href').split('/').pop();
    item.classList.toggle('active', href === current);
  });
}

document.addEventListener('DOMContentLoaded', highlightNav);

/* ============================================================
   GENERIC TABLE SORT HELPER
   ============================================================ */
function sortData(arr, key, dir) {
  if (dir === undefined) dir = 'asc';
  return arr.slice().sort(function(a, b) {
    var va = a[key], vb = b[key];
    if (va == null) return 1;
    if (vb == null) return -1;
    var cmp = typeof va === 'string'
      ? va.localeCompare(vb, undefined, { sensitivity: 'base' })
      : va - vb;
    return dir === 'asc' ? cmp : -cmp;
  });
}

/* ============================================================
   FORM HELPER - read all form fields into a plain object
   ============================================================ */
function formToObject(formEl) {
  var fd = new FormData(formEl);
  var obj = {};
  fd.forEach(function(val, key) { obj[key] = val === '' ? null : val; });
  return obj;
}

/* ============================================================
   API CALL WRAPPER - handles spinner + error notification
   ============================================================ */
async function apiCall(fn, successMsg) {
  if (successMsg === undefined) successMsg = null;
  showSpinner();
  try {
    var result = await fn();
    if (successMsg) showNotification(successMsg, 'success');
    return result;
  } catch (err) {
    showNotification(err.message || 'An unexpected error occurred.', 'error');
    return null;
  } finally {
    hideSpinner();
  }
}

/* ============================================================
   MOBILE SIDEBAR TOGGLE
   ============================================================ */
function initMobileSidebar() {
  if (!document.getElementById('__sidebar-backdrop')) {
    var bd = document.createElement('div');
    bd.id = '__sidebar-backdrop';
    bd.className = 'sidebar-backdrop';
    bd.addEventListener('click', closeMobileSidebar);
    document.body.appendChild(bd);
  }
}

function toggleMobileSidebar() {
  var sidebar  = document.querySelector('.sidebar');
  var backdrop = document.getElementById('__sidebar-backdrop');
  if (!sidebar) return;
  var isOpen = sidebar.classList.toggle('mobile-open');
  if (backdrop) backdrop.classList.toggle('visible', isOpen);
}

function closeMobileSidebar() {
  var sidebar  = document.querySelector('.sidebar');
  var backdrop = document.getElementById('__sidebar-backdrop');
  if (sidebar)  sidebar.classList.remove('mobile-open');
  if (backdrop) backdrop.classList.remove('visible');
}

document.addEventListener('DOMContentLoaded', initMobileSidebar);