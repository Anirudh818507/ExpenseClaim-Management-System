/**
 * api.js — ExpenseClaim Centralised API Client
 *
 * All REST calls go through apiFetch().
 * Base URL is relative (/api) so same-origin requests work
 * whether accessed on port 8080 or any other port.
 */

'use strict';

const API_BASE = '/api';

/**
 * Core fetch wrapper.
 * - Automatically JSON-stringifies object bodies.
 * - On non-OK responses, extracts the error message from the
 *   GlobalExceptionHandler JSON payload and throws an Error.
 * - Returns parsed JSON or raw text depending on Content-Type.
 */
async function apiFetch(path, options = {}) {
  const url = API_BASE + path;

  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  // Merge caller headers on top of defaults
  if (options.headers) {
    config.headers = { ...config.headers, ...options.headers };
  }

  // Auto-stringify object bodies
  if (config.body !== null && config.body !== undefined && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (networkErr) {
    throw new Error('Cannot reach the server. Is Spring Boot running on port 8080?');
  }

  if (!response.ok) {
    let errMsg = `Server error ${response.status}`;
    try {
      const errBody = await response.json();
      errMsg = errBody.message || errBody.error || errMsg;
    } catch (_) { /* ignore – body may not be JSON */ }
    throw new Error(errMsg);
  }

  const ct = response.headers.get('Content-Type') || '';
  if (ct.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

/* ============================================================
   EMPLOYEE API
   Base: /api/employees
   ============================================================ */
const EmployeeAPI = {
  getAll  : ()           => apiFetch('/employees'),
  getById : (id)         => apiFetch(`/employees/${id}`),
  create  : (data)       => apiFetch('/employees',     { method: 'POST',   body: data }),
  update  : (id, data)   => apiFetch(`/employees/${id}`, { method: 'PUT', body: data }),
  remove  : (id)         => apiFetch(`/employees/${id}`, { method: 'DELETE' }),
};

/* ============================================================
   CLAIM API
   Base: /api/claims
   ============================================================ */
const ClaimAPI = {
  getAll  : ()             => apiFetch('/claims'),
  getById : (id)           => apiFetch(`/claims/${id}`),
  create  : (data)         => apiFetch('/claims',       { method: 'POST',   body: data }),
  update  : (id, data)     => apiFetch(`/claims/${id}`, { method: 'PUT',    body: data }),
  remove  : (id)           => apiFetch(`/claims/${id}`, { method: 'DELETE' }),

  approve : (id) =>
    apiFetch(`/claims/${id}/approve`, { method: 'PUT' }),

  reject  : (id, remarks) =>
    apiFetch(`/claims/${id}/reject`, {
      method: 'PUT',
      body: remarks ? { remarks } : null,
    }),
};

/* ============================================================
   EXPENSE ITEM API
   Base: /api/expense-items
   ============================================================ */
const ExpenseItemAPI = {
  getAll  : ()           => apiFetch('/expense-items'),
  getById : (id)         => apiFetch(`/expense-items/${id}`),
  create  : (data)       => apiFetch('/expense-items',     { method: 'POST',   body: data }),
  update  : (id, data)   => apiFetch(`/expense-items/${id}`, { method: 'PUT', body: data }),
  remove  : (id)         => apiFetch(`/expense-items/${id}`, { method: 'DELETE' }),
};

/* ============================================================
   APPROVAL STEP API
   Base: /api/approval-steps
   ============================================================ */
const ApprovalStepAPI = {
  getAll  : ()           => apiFetch('/approval-steps'),
  getById : (id)         => apiFetch(`/approval-steps/${id}`),
  create  : (data)       => apiFetch('/approval-steps',     { method: 'POST',   body: data }),
  update  : (id, data)   => apiFetch(`/approval-steps/${id}`, { method: 'PUT', body: data }),
  remove  : (id)         => apiFetch(`/approval-steps/${id}`, { method: 'DELETE' }),
};