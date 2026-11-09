/**
 * Resolution & Aspect-Ratio Test Harness
 * Toggle with key 'D' or click the top-left resolution badge.
 * Simulates Desktop 1080p-4K, Ultrawides, and Mobile Carrier/Foldable aspect ratios.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ResolutionTestHarness = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const PRESETS = [
    // Desktop Displays
    { id: 'native', name: 'Fullscreen (Native)', w: '100%', h: '100%', aspect: 'Native', category: 'Desktop' },
    { id: '1080p', name: '1080p FHD (16:9)', w: 1920, h: 1080, aspect: '16:9', category: 'Desktop' },
    { id: '1440p', name: '1440p QHD (16:9)', w: 2560, h: 1440, aspect: '16:9', category: 'Desktop' },
    { id: '4k', name: '4K UHD (16:9)', w: 3840, h: 2160, aspect: '16:9', category: 'Desktop' },
    { id: '16_10', name: '16:10 Wide (2560x1600)', w: 2560, h: 1600, aspect: '16:10', category: 'Desktop' },
    { id: 'ultrawide', name: '21:9 Ultrawide (3440x1440)', w: 3440, h: 1440, aspect: '21:9', category: 'Desktop' },
    { id: 'superwide', name: '32:9 Super Ultrawide', w: 5120, h: 1440, aspect: '32:9', category: 'Desktop' },

    // Mobile Phone & Carrier Handsets
    { id: 'm_16_9', name: 'Phone 16:9 (Standard)', w: 1080, h: 1920, aspect: '16:9', category: 'Mobile' },
    { id: 'm_18_9', name: 'Phone 18:9 (2:1 Compact)', w: 1080, h: 2160, aspect: '18:9', category: 'Mobile' },
    { id: 'm_19_5_9', name: 'Flagship 19.5:9 (Galaxy/Pixel)', w: 1080, h: 2340, aspect: '19.5:9', category: 'Mobile' },
    { id: 'm_20_9', name: 'Modern 20:9 (Ultra/Tall)', w: 1080, h: 2400, aspect: '20:9', category: 'Mobile' },
    { id: 'm_21_9', name: 'Cinema 21:9 (Sony Xperia)', w: 1080, h: 2520, aspect: '21:9', category: 'Mobile' },
    { id: 'fold_cover', name: 'Foldable Cover (23:9)', w: 904, h: 2316, aspect: '23:9', category: 'Foldable' },
    { id: 'fold_inner', name: 'Foldable Main Inner (4:3)', w: 1812, h: 2176, aspect: '4:3', category: 'Foldable' }
  ];

  class TestHarness {
    constructor(engine, options = {}) {
      this.engine = engine;
      this.frameEl = document.getElementById('canvas-frame');
      this.panelEl = document.getElementById('resolution-panel');
      this.badgeEl = document.getElementById('resolution-badge');
      this.badgeTextEl = document.getElementById('resolution-badge-text');

      this.currentPreset = PRESETS[0];
      this.isPortrait = false;
      this.isOpen = false;

      this._buildUI();
      this._bindEvents();
    }

    _buildUI() {
      if (!this.panelEl) return;

      let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">
          <b style="color:#00f0ff; font-size:12px;">Resolution & Carrier Matrix</b>
          <button id="btn-close-res" style="background:none; border:none; color:#888; font-size:16px; cursor:pointer;">✕</button>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin:4px 0;">
          <span style="color:#888;">Orientation:</span>
          <button id="btn-toggle-orient" class="btn-tool" style="padding:4px 8px; font-size:10px;">
            <span id="orient-label">Landscape</span> 🔄
          </button>
        </div>

        <div style="font-weight:700; color:#888; font-size:10px; margin-top:4px;">DESKTOP PROFILES:</div>
        <div class="res-btn-grid" id="desktop-presets"></div>

        <div style="font-weight:700; color:#888; font-size:10px; margin-top:4px;">MOBILE & FOLDABLE CARRIER:</div>
        <div class="res-btn-grid" id="mobile-presets"></div>
      `;

      this.panelEl.innerHTML = html;

      const dContainer = this.panelEl.querySelector('#desktop-presets');
      const mContainer = this.panelEl.querySelector('#mobile-presets');

      PRESETS.forEach(p => {
        const btn = document.createElement('button');
        btn.className = `res-btn ${p.id === this.currentPreset.id ? 'active' : ''}`;
        btn.id = `preset-${p.id}`;
        btn.innerHTML = `<div>${p.name}</div><div style="font-size:9px; opacity:0.7;">${p.aspect}</div>`;
        btn.onclick = () => this.applyPreset(p);

        if (p.category === 'Desktop') dContainer.appendChild(btn);
        else mContainer.appendChild(btn);
      });
    }

    _bindEvents() {
      if (this.badgeEl) {
        this.badgeEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this.togglePanel();
        });
      }

      const closeBtn = document.getElementById('btn-close-res');
      if (closeBtn) closeBtn.onclick = () => this.togglePanel(false);

      const orientBtn = document.getElementById('btn-toggle-orient');
      if (orientBtn) {
        orientBtn.onclick = () => {
          this.isPortrait = !this.isPortrait;
          orientBtn.querySelector('#orient-label').textContent = this.isPortrait ? 'Portrait' : 'Landscape';
          this.applyPreset(this.currentPreset);
        };
      }

      window.addEventListener('keydown', (e) => {
        if (e.key === 'd' || e.key === 'D') {
          this.togglePanel();
        }
      });
    }

    togglePanel(force = null) {
      this.isOpen = force !== null ? force : !this.isOpen;
      if (this.panelEl) {
        this.panelEl.style.display = this.isOpen ? 'flex' : 'none';
      }
    }

    applyPreset(preset) {
      this.currentPreset = preset;

      this.panelEl.querySelectorAll('.res-btn').forEach(b => b.classList.remove('active'));
      const activeBtn = this.panelEl.querySelector(`#preset-${preset.id}`);
      if (activeBtn) activeBtn.classList.add('active');

      if (preset.id === 'native') {
        this.frameEl.style.width = '100%';
        this.frameEl.style.height = '100%';
        this.frameEl.style.borderRadius = '0px';
        if (this.badgeTextEl) this.badgeTextEl.textContent = 'Native Display (Auto DPI)';
      } else {
        const maxW = window.innerWidth * 0.92;
        const maxH = window.innerHeight * 0.88;

        let targetW = preset.w;
        let targetH = preset.h;

        if (this.isPortrait && targetW > targetH) {
          const tmp = targetW; targetW = targetH; targetH = tmp;
        } else if (!this.isPortrait && targetH > targetW && preset.category !== 'Desktop') {
          const tmp = targetW; targetW = targetH; targetH = tmp;
        }

        const scaleW = maxW / targetW;
        const scaleH = maxH / targetH;
        const scale = Math.min(1.0, Math.min(scaleW, scaleH));

        const fitW = Math.round(targetW * scale);
        const fitH = Math.round(targetH * scale);

        this.frameEl.style.width = `${fitW}px`;
        this.frameEl.style.height = `${fitH}px`;
        this.frameEl.style.borderRadius = preset.category === 'Mobile' ? '28px' : '8px';

        if (this.badgeTextEl) {
          this.badgeTextEl.textContent = `${preset.name} [${fitW}x${fitH}]`;
        }
      }

      setTimeout(() => {
        this.engine.resize();
        this.engine.init(); // re-balance density
      }, 50);
    }
  }

  return {
    PRESETS,
    TestHarness
  };
});
