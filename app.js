import { fetchIncidents, ack } from './api.js';

const REFRESH_MS = 2000;

const list = document.querySelector('[data-testid="incident-list"]');
const loader = document.querySelector('[data-testid="loader"]');
const empty = document.querySelector('[data-testid="empty"]');
const errorBox = document.querySelector('.error');

/** id -> incident, id -> row element, ids already acked. */
const known = new Map();
const rows = new Map();
const acked = new Set();

// R5: the viewer's own zone and locale order (dd/mm for EU locales, mm/dd for en-US).
const timeFormat = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZoneName: 'short',
});
const formatTime = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : timeFormat.format(d);
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function markAcked(row) {
  const button = row.querySelector('[data-testid="ack"]');
  if (button) button.remove();
  if (!row.querySelector('[data-testid="acked"]')) {
    const mark = el('span', 'acked', '✓ Acked');
    mark.dataset.testid = 'acked';
    row.append(mark);
  }
  row.classList.add('is-acked');
}

function buildRow(incident) {
  const row = el('li', `row ${incident.severity}`);
  row.dataset.testid = 'incident-row';
  row.dataset.id = incident.id;
  row.append(el('span', 'id', incident.id), el('span', 'sev', incident.severity));
  row.append(el('span', 'what', `${incident.service} · ${incident.region} · ${incident.summary}`));
  const time = el('time', '', formatTime(incident.openedAt));
  time.setAttribute('datetime', incident.openedAt); // full UTC value stays in the attribute
  row.append(time);
  const button = el('button', 'ack', 'Ack');
  button.type = 'button';
  button.dataset.testid = 'ack';
  button.addEventListener('click', () => onAck(incident.id, row, button));
  row.append(button);
  if (acked.has(incident.id)) markAcked(row);
  return row;
}

async function onAck(id, row, button) {
  button.disabled = true;
  try {
    await ack(id);
    acked.add(id);
    markAcked(row);
    showError('');
  } catch (err) {
    button.disabled = false;
    showError(`Could not ack ${id}: ${err.message}`);
  }
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = !message;
}

/** R1: merge by id, newest first. Rows are kept, not rebuilt, so a click never lands on a stale node. */
function render() {
  const sorted = [...known.values()].sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt));
  sorted.forEach((incident, index) => {
    let row = rows.get(incident.id);
    if (!row) {
      row = buildRow(incident);
      rows.set(incident.id, row);
    }
    if (list.children[index] !== row) list.insertBefore(row, list.children[index] || null);
  });
  list.hidden = sorted.length === 0;
  empty.hidden = sorted.length !== 0;
}

let loaded = false;

async function refresh() {
  try {
    const page = await fetchIncidents();
    for (const incident of page.incidents) known.set(incident.id, incident);
    render();
    if (!loaded) {
      loaded = true;
      loader.remove(); // R3: gone once incidents load
    }
    showError('');
  } catch (err) {
    showError(`Could not refresh: ${err.message}`);
  } finally {
    setTimeout(refresh, REFRESH_MS); // R4: every 2 s, never overlapping
  }
}

refresh();
