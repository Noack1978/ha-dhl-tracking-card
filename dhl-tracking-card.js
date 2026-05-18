'use strict';

class DhlTrackingCard extends HTMLElement {
  constructor() {
    super();
    this._hass        = null;
    this._config      = {};
    this._initialized = false;
    this._expanded    = new Set(); // erweiterte Sendungen
    this.attachShadow({ mode: 'open' });
  }

  static getStubConfig() { return {}; }

  setConfig(config) {
    this._config = config || {};
    if (!this._initialized) {
      this._buildDOM();
      this._initialized = true;
    }
  }

  set hass(hass) {
    this._hass = hass;
    this._updateList();
  }

  getCardSize() { return 5; }

  // ── Sensoren ──────────────────────────────────────────────────────────────

  _getSensors() {
    if (!this._hass) return [];
    return Object.values(this._hass.states)
      .filter(s => s.attributes.tracking_number !== undefined)
      .sort((a, b) =>
        (a.attributes.label || a.attributes.tracking_number)
          .localeCompare(b.attributes.label || b.attributes.tracking_number)
      );
  }

  // ── DOM (einmalig) ────────────────────────────────────────────────────────

  _buildDOM() {
    this.shadowRoot.innerHTML = `
      <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :host {
          --dhl-red:    #D40511;
          --dhl-yellow: #FFCC00;
          --radius: 12px;
          display: block;
        }
        ha-card {
          overflow: hidden;
          border-radius: var(--radius);
          background: var(--ha-card-background, var(--card-background-color, #1c1c1e));
        }

        /* Header */
        .header {
          background: var(--dhl-red);
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .dhl-badge {
          background: var(--dhl-yellow);
          color: #000;
          font-weight: 900;
          font-size: 20px;
          letter-spacing: -1px;
          padding: 4px 10px;
          border-radius: 6px;
          line-height: 1.2;
          flex-shrink: 0;
        }
        .header-title    { color: #fff; font-size: 16px; font-weight: 700; }
        .header-subtitle { color: rgba(255,255,255,.75); font-size: 12px; margin-top: 2px; }

        /* Sections */
        .section {
          padding: 14px 16px;
          border-bottom: 1px solid var(--divider-color, rgba(255,255,255,.08));
        }
        .section:last-child { border-bottom: none; }
        .section-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .8px;
          text-transform: uppercase;
          color: var(--secondary-text-color, #9ca3af);
          margin-bottom: 10px;
        }

        /* Inputs */
        .input-row { display: flex; gap: 8px; margin-bottom: 8px; }
        input {
          flex: 1;
          background: var(--secondary-background-color, #374151);
          border: 1.5px solid var(--divider-color, rgba(255,255,255,.12));
          border-radius: 8px;
          color: var(--primary-text-color, #fff);
          padding: 11px 13px;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: border-color .2s;
          min-width: 0;
          width: 100%;
        }
        input:focus { border-color: var(--dhl-red); }
        input::placeholder { color: var(--secondary-text-color, #9ca3af); }
        .input-sub { margin-top: 8px; }

        /* Buttons */
        button {
          cursor: pointer;
          font-family: inherit;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          transition: opacity .15s, transform .1s;
        }
        button:active { transform: scale(.97); }
        .btn-add {
          background: var(--dhl-red);
          color: #fff;
          padding: 11px 16px;
          font-size: 14px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .btn-add:hover { opacity: .88; }
        .btn-icon {
          background: transparent;
          padding: 5px 8px;
          font-size: 16px;
          line-height: 1;
          border-radius: 6px;
        }
        .btn-delete { color: var(--secondary-text-color, #9ca3af); }
        .btn-delete:hover { background: rgba(212,5,17,.15); color: var(--dhl-red); }
        .btn-expand { color: var(--secondary-text-color, #9ca3af); font-size: 14px; }
        .btn-expand:hover { color: var(--primary-text-color, #fff); }

        /* Sensor-Item */
        .sensor-item {
          background: var(--secondary-background-color, #374151);
          border-radius: 9px;
          margin-bottom: 8px;
          overflow: hidden;
        }
        .sensor-item:last-child { margin-bottom: 0; }

        /* Sensor-Header (immer sichtbar) */
        .sensor-header {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 13px;
          cursor: pointer;
          user-select: none;
        }
        .sensor-header:hover { background: rgba(255,255,255,.04); }

        .status-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 5px;
        }
        .sensor-main { flex: 1; min-width: 0; }
        .sensor-label {
          font-weight: 600;
          font-size: 14px;
          color: var(--primary-text-color, #fff);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sensor-number {
          font-family: 'Courier New', monospace;
          font-size: 11px;
          color: var(--secondary-text-color, #9ca3af);
          margin-top: 1px;
        }
        .sensor-state {
          font-size: 13px;
          font-weight: 600;
          margin-top: 5px;
        }
        .sensor-quick {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 5px;
        }
        .pill {
          font-size: 11px;
          color: var(--secondary-text-color, #9ca3af);
          background: rgba(255,255,255,.06);
          border-radius: 20px;
          padding: 2px 8px;
          white-space: nowrap;
        }
        .pill.green { color: #4CAF50; background: rgba(76,175,80,.12); }

        .sensor-actions { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }

        /* Detailbereich (ausgeklappt) */
        .sensor-detail {
          border-top: 1px solid var(--divider-color, rgba(255,255,255,.08));
          padding: 12px 13px;
          display: none;
        }
        .sensor-detail.open { display: block; }

        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 12px;
        }
        .detail-cell { }
        .detail-key {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .5px;
          color: var(--secondary-text-color, #9ca3af);
          margin-bottom: 2px;
        }
        .detail-val {
          font-size: 13px;
          color: var(--primary-text-color, #fff);
          word-break: break-word;
        }
        .detail-val.green { color: #4CAF50; font-weight: 600; }

        /* Ereignis-Timeline */
        .timeline-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .5px;
          color: var(--secondary-text-color, #9ca3af);
          margin-bottom: 8px;
        }
        .timeline { display: flex; flex-direction: column; gap: 0; }
        .timeline-event {
          display: flex;
          gap: 10px;
          position: relative;
          padding-bottom: 10px;
        }
        .timeline-event:last-child { padding-bottom: 0; }
        .tl-line {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
          width: 16px;
        }
        .tl-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--secondary-text-color, #9ca3af);
          flex-shrink: 0;
          margin-top: 4px;
        }
        .tl-dot.first { background: var(--dhl-red); width: 10px; height: 10px; margin-top: 3px; }
        .tl-connector {
          width: 2px;
          flex: 1;
          background: var(--divider-color, rgba(255,255,255,.1));
          margin-top: 3px;
          min-height: 10px;
        }
        .tl-content { flex: 1; min-width: 0; }
        .tl-desc {
          font-size: 12px;
          color: var(--primary-text-color, #fff);
          line-height: 1.3;
        }
        .tl-meta {
          font-size: 11px;
          color: var(--secondary-text-color, #9ca3af);
          margin-top: 2px;
        }

        /* Refresh */
        .refresh-row {
          display: flex;
          justify-content: flex-end;
          padding: 8px 16px 12px;
        }
        .btn-refresh {
          background: transparent;
          color: var(--secondary-text-color, #9ca3af);
          font-size: 12px;
          padding: 5px 10px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .btn-refresh:hover {
          background: var(--secondary-background-color, #374151);
          color: var(--primary-text-color, #fff);
        }

        .empty {
          text-align: center;
          color: var(--secondary-text-color, #9ca3af);
          font-size: 13px;
          padding: 16px 0;
        }
      </style>

      <ha-card>
        <div class="header">
          <div class="dhl-badge">DHL</div>
          <div>
            <div class="header-title">Sendungsverfolgung</div>
            <div class="header-subtitle">Pakete speichern &amp; verfolgen</div>
          </div>
        </div>

        <div class="section">
          <div class="section-label">Neue Sendung</div>
          <div class="input-row">
            <input id="num-input" type="text" placeholder="Sendungsnummer"
              autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
            <button class="btn-add" id="add-btn">Verfolgen</button>
          </div>
          <input id="lbl-input" class="input-sub" type="text"
            placeholder="Bezeichnung (z. B. Amazon, Zalando ...)">
          <input id="plz-input" class="input-sub" type="text"
            placeholder="PLZ Empfaenger (optional)" inputmode="numeric" maxlength="10">
        </div>

        <div class="section">
          <div class="section-label">Gespeicherte Sendungen</div>
          <div id="sensor-list"><div class="empty">Noch keine Sendungen gespeichert</div></div>
        </div>

        <div class="refresh-row">
          <button class="btn-refresh" id="refresh-btn">&#8635; Aktualisieren</button>
        </div>
      </ha-card>
    `;

    this.shadowRoot.getElementById('add-btn').addEventListener('click', () => this._add());
    this.shadowRoot.getElementById('refresh-btn').addEventListener('click', () => this._refresh());
    ['num-input','lbl-input','plz-input'].forEach(id => {
      this.shadowRoot.getElementById(id).addEventListener('keydown', e => {
        if (e.key === 'Enter') this._add();
      });
    });
  }

  // ── Liste rendern ─────────────────────────────────────────────────────────

  _updateList() {
    const list = this.shadowRoot.getElementById('sensor-list');
    if (!list) return;

    const sensors = this._getSensors();
    if (!sensors.length) {
      list.innerHTML = '<div class="empty">Noch keine Sendungen.<br>Sendungsnummer oben eingeben.</div>';
      return;
    }

    list.innerHTML = sensors.map(s => this._renderItem(s)).join('');

    list.querySelectorAll('[data-del]').forEach(btn =>
      btn.addEventListener('click', e => {
        e.stopPropagation();
        this._remove(e.currentTarget.dataset.del);
      })
    );
    list.querySelectorAll('[data-exp]').forEach(btn =>
      btn.addEventListener('click', e => {
        e.stopPropagation();
        this._toggleExpand(e.currentTarget.dataset.exp);
      })
    );
    list.querySelectorAll('.sensor-header').forEach(el =>
      el.addEventListener('click', () => this._toggleExpand(el.dataset.num))
    );
  }

  _renderItem(sensor) {
    const a    = sensor.attributes;
    const num  = a.tracking_number;
    const open = this._expanded.has(num);
    const dot  = this._statusColor(a.status_code || '');

    // Quick-Pills (Header)
    const pills = [];
    if (a.current_location) pills.push(`&#128205; ${this._esc(a.current_location)}`);
    if (a.estimated_delivery) pills.push(`&#128666; ${this._esc(a.estimated_delivery)}`);
    if (a.service) pills.push(this._esc(a.service));

    return `
      <div class="sensor-item">
        <div class="sensor-header" data-num="${this._esc(num)}">
          <div class="status-dot" style="background:${dot}"></div>
          <div class="sensor-main">
            <div class="sensor-label">${this._esc(a.label || num)}</div>
            <div class="sensor-number">${this._esc(num)}</div>
            <div class="sensor-state" style="color:${dot}">${this._esc(sensor.state)}</div>
            ${pills.length ? `<div class="sensor-quick">${pills.map(p => `<span class="pill">${p}</span>`).join('')}</div>` : ''}
          </div>
          <div class="sensor-actions">
            <button class="btn-icon btn-expand" data-exp="${this._esc(num)}"
              title="${open ? 'Zuklappen' : 'Details'}">
              ${open ? '&#9650;' : '&#9660;'}
            </button>
            <button class="btn-icon btn-delete" data-del="${this._esc(num)}"
              title="Sendung entfernen">&#215;</button>
          </div>
        </div>
        <div class="sensor-detail ${open ? 'open' : ''}">
          ${this._renderDetail(sensor)}
        </div>
      </div>
    `;
  }

  _renderDetail(sensor) {
    const a   = sensor.attributes;
    const num = a.tracking_number;
    const rows = [];

    // Detailgitter
    const cells = [];
    if (a.status_description)  cells.push(['Status-Detail',  a.status_description]);
    if (a.last_event_time)     cells.push(['Letztes Ereignis', a.last_event_time]);
    if (a.estimated_delivery)  cells.push(['Lieferung ca.',   a.estimated_delivery]);
    if (a.current_location)    cells.push(['Aktueller Ort',   a.current_location]);
    if (a.current_country)     cells.push(['Land',            a.current_country]);
    if (a.origin)              cells.push(['Absender-Ort',    a.origin]);
    if (a.destination)         cells.push(['Zielort',         a.destination]);
    if (a.service)             cells.push(['Dienstleistung',  a.service]);
    if (a.event_count != null) cells.push(['Ereignisse ges.', String(a.event_count)]);

    if (cells.length) {
      rows.push('<div class="detail-grid">');
      for (const [k, v] of cells) {
        const green = k === 'Lieferung ca.' ? ' green' : '';
        rows.push(`
          <div class="detail-cell">
            <div class="detail-key">${this._esc(k)}</div>
            <div class="detail-val${green}">${this._esc(v)}</div>
          </div>`);
      }
      rows.push('</div>');
    }

    // Ereignis-Timeline
    const events = a.events;
    if (events && events.length) {
      rows.push('<div class="timeline-title">Ereignisverlauf</div>');
      rows.push('<div class="timeline">');
      events.forEach((evt, i) => {
        const isFirst = i === 0;
        const loc  = evt.location   ? ` &bull; ${this._esc(evt.location)}` : '';
        const time = evt.time || evt.timestamp || '';
        rows.push(`
          <div class="timeline-event">
            <div class="tl-line">
              <div class="tl-dot ${isFirst ? 'first' : ''}"></div>
              ${i < events.length - 1 ? '<div class="tl-connector"></div>' : ''}
            </div>
            <div class="tl-content">
              <div class="tl-desc">${this._esc(evt.description || '')}</div>
              <div class="tl-meta">${this._esc(time)}${loc}</div>
            </div>
          </div>`);
      });
      rows.push('</div>');
    }

    return rows.join('') || '<div class="empty">Keine Detaildaten verfuegbar</div>';
  }

  _toggleExpand(num) {
    if (this._expanded.has(num)) {
      this._expanded.delete(num);
    } else {
      this._expanded.add(num);
    }
    this._updateList();
  }

  // ── Services ──────────────────────────────────────────────────────────────

  async _add() {
    const numEl = this.shadowRoot.getElementById('num-input');
    const lblEl = this.shadowRoot.getElementById('lbl-input');
    const plzEl = this.shadowRoot.getElementById('plz-input');
    const number = (numEl.value || '').trim().replace(/\s+/g, '').toUpperCase();
    const label  = (lblEl.value || '').trim();
    const plz    = (plzEl.value || '').trim();
    if (!number) { numEl.focus(); return; }

    try {
      await this._hass.callService('dhl_tracking', 'add_tracking', {
        tracking_number: number,
        ...(label ? { label }            : {}),
        ...(plz   ? { postal_code: plz } : {}),
      });
      numEl.value = '';
      lblEl.value = '';
      plzEl.value = '';
      numEl.focus();
    } catch (err) {
      console.error('[dhl-tracking-card] add_tracking:', err);
    }
  }

  async _remove(number) {
    this._expanded.delete(number);
    try {
      await this._hass.callService('dhl_tracking', 'remove_tracking', {
        tracking_number: number,
      });
    } catch (err) {
      console.error('[dhl-tracking-card] remove_tracking:', err);
    }
  }

  async _refresh() {
    try {
      await this._hass.callService('dhl_tracking', 'refresh', {});
    } catch (err) {
      console.error('[dhl-tracking-card] refresh:', err);
    }
  }

  // ── Hilfsfunktionen ───────────────────────────────────────────────────────

  _statusColor(code) {
    return {
      'delivered':        '#4CAF50',
      'out-for-delivery': '#FF9800',
      'transit':          '#2196F3',
      'pre-transit':      '#9C27B0',
      'delivery-failure': '#F44336',
      'exception':        '#F44336',
      'pickup-failure':   '#F44336',
      'not-found':        '#9E9E9E',
      'expired':          '#9E9E9E',
    }[code] || '#9E9E9E';
  }

  _esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

customElements.define('dhl-tracking-card', DhlTrackingCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type:        'dhl-tracking-card',
  name:        'DHL Sendungsverfolgung',
  description: 'Karte zur Verwaltung und Anzeige von DHL-Sendungen mit Ereignis-Timeline.',
  preview:     false,
});
