'use strict';

class DhlTrackingCard extends HTMLElement {
  constructor() {
    super();
    this._hass        = null;
    this._config      = {};
    this._initialized = false;
    this.attachShadow({ mode: 'open' });
  }

  static getStubConfig() {
    return {};
  }

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

  getCardSize() { return 4; }

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

  // ── DOM aufbauen (einmalig) ───────────────────────────────────────────────

  _buildDOM() {
    this.shadowRoot.innerHTML = `
      <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :host {
          --dhl-red:    #D40511;
          --dhl-yellow: #FFCC00;
          --radius:     12px;
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
        input[type="text"] {
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
        }
        input[type="text"]:focus { border-color: var(--dhl-red); }
        input[type="text"]::placeholder { color: var(--secondary-text-color, #9ca3af); }
        #label-input { width: 100%; }

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
        .btn-delete {
          background: transparent;
          color: var(--secondary-text-color, #9ca3af);
          font-size: 20px;
          line-height: 1;
          padding: 6px 10px;
          flex-shrink: 0;
          border-radius: 6px;
        }
        .btn-delete:hover {
          background: rgba(212,5,17,.15);
          color: var(--dhl-red);
        }

        /* Sensor-Liste */
        .sensor-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: var(--secondary-background-color, #374151);
          border-radius: 9px;
          padding: 12px 13px;
          margin-bottom: 7px;
          transition: background .15s;
        }
        .sensor-item:last-child { margin-bottom: 0; }

        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 4px;
        }

        .sensor-info { flex: 1; min-width: 0; }
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
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sensor-state {
          font-size: 13px;
          font-weight: 600;
          margin-top: 5px;
        }
        .sensor-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-top: 4px;
        }
        .sensor-meta span {
          font-size: 11px;
          color: var(--secondary-text-color, #9ca3af);
        }
        .sensor-meta .etd {
          color: #4CAF50;
          font-weight: 600;
        }

        .empty {
          text-align: center;
          color: var(--secondary-text-color, #9ca3af);
          font-size: 13px;
          padding: 16px 0;
        }

        /* Refresh-Button */
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
      </style>

      <ha-card>
        <!-- Header -->
        <div class="header">
          <div class="dhl-badge">DHL</div>
          <div>
            <div class="header-title">Sendungsverfolgung</div>
            <div class="header-subtitle">Pakete speichern &amp; verfolgen</div>
          </div>
        </div>

        <!-- Neue Sendung -->
        <div class="section">
          <div class="section-label">Neue Sendung</div>
          <div class="input-row">
            <input id="num-input" type="text"
              placeholder="Sendungsnummer"
              autocomplete="off" autocorrect="off"
              autocapitalize="off" spellcheck="false">
            <button class="btn-add" id="add-btn">Verfolgen</button>
          </div>
          <input id="lbl-input" type="text"
            placeholder="Bezeichnung (z. B. Amazon, Zalando ...)">
        </div>

        <!-- Sendungsliste -->
        <div class="section">
          <div class="section-label">Gespeicherte Sendungen</div>
          <div id="sensor-list"><div class="empty">Noch keine Sendungen gespeichert</div></div>
        </div>

        <!-- Aktualisieren -->
        <div class="refresh-row">
          <button class="btn-refresh" id="refresh-btn">&#8635; Aktualisieren</button>
        </div>
      </ha-card>
    `;

    // Events
    this.shadowRoot.getElementById('add-btn').addEventListener('click', () => this._add());
    this.shadowRoot.getElementById('refresh-btn').addEventListener('click', () => this._refresh());
    this.shadowRoot.getElementById('num-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') this._add();
    });
    this.shadowRoot.getElementById('lbl-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') this._add();
    });
  }

  // ── Liste aktualisieren ───────────────────────────────────────────────────

  _updateList() {
    const list = this.shadowRoot.getElementById('sensor-list');
    if (!list) return;

    const sensors = this._getSensors();
    if (!sensors.length) {
      list.innerHTML = '<div class="empty">Noch keine Sendungen gespeichert.<br>Sendungsnummer oben eingeben.</div>';
      return;
    }

    list.innerHTML = sensors.map(s => this._renderItem(s)).join('');

    list.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', e => {
        this._remove(e.currentTarget.dataset.del);
      });
    });
  }

  _renderItem(sensor) {
    const attrs       = sensor.attributes;
    const state       = sensor.state;
    const statusCode  = attrs.status_code || '';
    const dotColor    = this._statusColor(statusCode);
    const stateColor  = this._statusColor(statusCode);
    const label       = attrs.label || attrs.tracking_number;
    const number      = attrs.tracking_number;
    const etd         = attrs.estimated_delivery || '';
    const lastChanged = this._formatDate(sensor.last_changed);
    const location    = attrs.current_location || '';

    return `
      <div class="sensor-item">
        <div class="status-dot" style="background:${dotColor}"></div>
        <div class="sensor-info">
          <div class="sensor-label" title="${label}">${this._esc(label)}</div>
          <div class="sensor-number">${this._esc(number)}</div>
          <div class="sensor-state" style="color:${stateColor}">${this._esc(state)}</div>
          <div class="sensor-meta">
            ${location ? `<span>&#128205; ${this._esc(location)}</span>` : ''}
            <span>&#128337; ${lastChanged}</span>
            ${etd ? `<span class="etd">&#128666; Lieferung: ${this._esc(etd)}</span>` : ''}
          </div>
        </div>
        <button class="btn-delete" data-del="${this._esc(number)}" title="Sendung entfernen">&#215;</button>
      </div>
    `;
  }

  // ── Services ──────────────────────────────────────────────────────────────

  async _add() {
    const numEl = this.shadowRoot.getElementById('num-input');
    const lblEl = this.shadowRoot.getElementById('lbl-input');
    const number = (numEl.value || '').trim().replace(/\s+/g, '').toUpperCase();
    const label  = (lblEl.value || '').trim();
    if (!number) { numEl.focus(); return; }

    try {
      await this._hass.callService('dhl_tracking', 'add_tracking', {
        tracking_number: number,
        ...(label ? { label } : {}),
      });
      numEl.value = '';
      lblEl.value = '';
      numEl.focus();
    } catch (err) {
      console.error('[dhl-tracking-card] add_tracking fehlgeschlagen:', err);
    }
  }

  async _remove(number) {
    try {
      await this._hass.callService('dhl_tracking', 'remove_tracking', {
        tracking_number: number,
      });
    } catch (err) {
      console.error('[dhl-tracking-card] remove_tracking fehlgeschlagen:', err);
    }
  }

  async _refresh() {
    try {
      await this._hass.callService('dhl_tracking', 'refresh', {});
    } catch (err) {
      console.error('[dhl-tracking-card] refresh fehlgeschlagen:', err);
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

  _formatDate(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('de-DE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return iso; }
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

// Karte im Lovelace-Picker anzeigen
window.customCards = window.customCards || [];
window.customCards.push({
  type:        'dhl-tracking-card',
  name:        'DHL Sendungsverfolgung',
  description: 'Karte zur Verwaltung und Anzeige von DHL-Sendungen. Benoetigt die DHL Sendungsverfolgung Integration.',
  preview:     false,
});
