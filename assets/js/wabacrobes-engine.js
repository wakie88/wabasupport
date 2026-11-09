/**
 * Wabacrobes Engine v0.1 — Core Simulation & High-DPI Renderer
 * Integrates Planck.js rigid-body dynamics, ALife Neural Brain,
 * 10-Substance Mitosis Rule, Initiation Rite of Passage,
 * 5-Stage 30-Second Isolation Dimming, and Wallpaper Engine / Lively hooks.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./physics-solver.js', './alife-brain.js'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./physics-solver.js'), require('./alife-brain.js'));
  } else {
    root.WabacrobesEngine = factory(root.WabacrobesPhysics, root.WabacrobesALife);
  }
})(typeof self !== 'undefined' ? self : this, function (Physics, ALife) {
  'use strict';

  const NEON_PALETTE = [
    { name: 'Cyan', hex: '#00f0ff', rgb: [0, 240, 255] },
    { name: 'Magenta', hex: '#ff007f', rgb: [255, 0, 127] },
    { name: 'Electric Lime', hex: '#39ff14', rgb: [57, 255, 20] },
    { name: 'Solar Gold', hex: '#ffd700', rgb: [255, 215, 0] },
    { name: 'Ultraviolet', hex: '#b347ff', rgb: [179, 71, 255] },
    { name: 'Coral Red', hex: '#ff4d4d', rgb: [255, 77, 77] },
    { name: 'Aqua', hex: '#00ffc4', rgb: [0, 255, 196] }
  ];

  const THEMES = {
    dark: {
      id: 'dark',
      name: 'Dark Void',
      bg: '#05070a',
      voidCenter: '#05070a',
      mist: 'rgba(40, 60, 90, 0.05)',
      dust: 'rgba(200, 230, 255, 0.25)',
      text: '#e6edf3'
    },
    light: {
      id: 'light',
      name: 'Light Lab',
      bg: '#f3f6fa',
      voidCenter: '#f3f6fa',
      mist: 'rgba(190, 210, 235, 0.09)',
      dust: 'rgba(50, 80, 120, 0.2)',
      text: '#111827'
    }
  };

  class Particle {
    constructor(x, y, color, vx, vy, lifetime = 0.55) {
      this.x = x; this.y = y;
      this.color = color;
      this.vx = vx; this.vy = vy;
      this.lifetime = lifetime;
      this.age = 0;
    }
    update(dt) {
      this.age += dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vx *= 0.93;
      this.vy *= 0.93;
    }
    render(ctx) {
      const alpha = Math.max(0, 1.0 - (this.age / this.lifetime));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  class SubstanceSpore {
    constructor(x, y) {
      this.x = x; this.y = y;
      this.vx = (Math.random() - 0.5) * 12;
      this.vy = (Math.random() - 0.5) * 12;
      this.phase = Math.random() * Math.PI * 2;
      this.radius = 2.4;
      this.eaten = false;
      this.age = 0;
      this.lifetime = 120;
    }
    update(dt, width, height) {
      this.age += dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vx *= 0.98;
      this.vy *= 0.98;
      this.phase += dt * 3.5;

      if (this.x < 10) { this.x = 10; this.vx *= -1; }
      if (this.x > width - 10) { this.x = width - 10; this.vx *= -1; }
      if (this.y < 10) { this.y = 10; this.vy *= -1; }
      if (this.y > height - 10) { this.y = height - 10; this.vy *= -1; }
    }
    render(ctx, isDark) {
      const pulse = Math.sin(this.phase) * 0.35 + 0.95;
      ctx.save();
      ctx.shadowColor = isDark ? '#00f0ff' : '#0a84ff';
      ctx.shadowBlur = 8;
      ctx.fillStyle = isDark ? '#ffffff' : '#0a84ff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  class Shockwave {
    constructor(x, y, color = '#00f0ff') {
      this.x = x; this.y = y;
      this.color = color;
      this.radius = 4;
      this.maxRadius = 240;
      this.speed = 420;
      this.isDead = false;
    }
    update(dt) {
      this.radius += this.speed * dt;
      if (this.radius >= this.maxRadius) this.isDead = true;
    }
    render(ctx) {
      const progress = this.radius / this.maxRadius;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1.0 - progress);
      ctx.strokeStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 12;
      ctx.lineWidth = Math.max(1, 3.0 * (1 - progress * 0.5));
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  class SymbioticLink {
    constructor(orgA, orgB) {
      this.orgA = orgA;
      this.orgB = orgB;
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.intensity = 0.5;
      this.isDead = false;
    }
    update(dt) {
      if (this.orgA.isDead || this.orgB.isDead) { this.isDead = true; return; }
      const dx = this.orgA.x - this.orgB.x;
      const dy = this.orgA.y - this.orgB.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 95 || !this.orgA.isSafe || !this.orgB.isSafe) {
        this.intensity -= dt * 2.0;
        if (this.intensity <= 0) this.isDead = true;
        return;
      }
      this.intensity = Math.min(1.0, this.intensity + dt * 2.0);
      this.pulsePhase += dt * 4.0;
      this.orgA.hunger = Math.min(100, this.orgA.hunger + 0.8 * dt);
      this.orgB.hunger = Math.min(100, this.orgB.hunger + 0.8 * dt);
    }
    render(ctx) {
      if (this.intensity <= 0.05 || this.isDead) return;
      ctx.save();
      const alpha = this.intensity * 0.4;
      const grad = ctx.createLinearGradient(this.orgA.x, this.orgA.y, this.orgB.x, this.orgB.y);
      const [rA, gA, bA] = this.orgA.color.rgb;
      const [rB, gB, bB] = this.orgB.color.rgb;
      grad.addColorStop(0, `rgba(${rA}, ${gA}, ${bA}, ${alpha})`);
      grad.addColorStop(1, `rgba(${rB}, ${gB}, ${bB}, ${alpha})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(this.orgA.x, this.orgA.y);
      ctx.lineTo(this.orgB.x, this.orgB.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  let nextId = 1;

  class Wabacrobe {
    constructor(x, y, color, genome = null, brain = null, rigidWorld = null) {
      this.id = nextId++;
      this.x = x; this.y = y;
      this.color = color;
      this.rigidWorld = rigidWorld;

      this.genome = genome || {
        generation: 1,
        baseRadius: 5.5,
        speed: 1.75 * (0.9 + Math.random() * 0.2),
        agility: 0.045 * (0.9 + Math.random() * 0.2),
        sensorRadius: 95 * (0.9 + Math.random() * 0.2),
        cohesionDrive: 1.15 * (0.9 + Math.random() * 0.2),
        shockwaveResilience: 1.0 * (0.9 + Math.random() * 0.2)
      };

      this.brain = brain || new ALife.ALifeBrain();

      this.radius = this.genome.baseRadius;
      this.vx = 0; this.vy = 0;
      this.heading = Math.random() * Math.PI * 2;

      this.brightness = 1.0;
      this.decayStage = 0;
      this.isolationTimer = 0;
      this.isSafe = false;
      this.sameColorNeighbors = 0;

      // 10-Substance Mitosis Rule Counter
      this.substanceConsumed = 0;
      this.replicationCapacity = 0.0; // 0% -> 100%

      this.hunger = 100;
      this.isSplitting = false;
      this.splitProgress = 0;
      this.splitAngle = 0;
      this.isDead = false;
      this.lifetime = 0;

      this.body = null;
      if (this.rigidWorld) {
        this.body = this.rigidWorld.createOrganismBody(this.x, this.y, this.radius, 1.8);
      }
    }

    perceive(neighbors, substances, width, height) {
      let nearestSameDist = 1.0;
      let nearestSameAngle = 0.0;
      let sameCount = 0;
      let safeCluster = 0;
      let nearestAlienDist = 1.0;

      const sensorR = this.genome.sensorRadius;

      for (let i = 0; i < neighbors.length; i++) {
        const { entity: other, dist } = neighbors[i];
        if (other === this || other.isDead) continue;
        const normDist = Math.min(1.0, dist / sensorR);

        if (other.color.name === this.color.name) {
          sameCount++;
          if (dist < 28) safeCluster++;
          if (normDist < nearestSameDist) {
            nearestSameDist = normDist;
            const targetAngle = Math.atan2(other.y - this.y, other.x - this.x);
            let diff = targetAngle - this.heading;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            nearestSameAngle = diff / Math.PI;
          }
        } else {
          if (normDist < nearestAlienDist) nearestAlienDist = normDist;
        }
      }

      this.sameColorNeighbors = safeCluster;

      let nearestFoodDist = 1.0;
      let nearestFoodAngle = 0.0;
      let targetFood = null;
      let minFDist = sensorR;

      for (let i = 0; i < substances.length; i++) {
        const f = substances[i];
        if (f.eaten) continue;
        const dx = f.x - this.x;
        const dy = f.y - this.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < minFDist) {
          minFDist = d;
          targetFood = f;
        }
        if (d <= this.radius + f.radius + 2) {
          this.consumeSubstance(f);
        }
      }

      if (targetFood) {
        nearestFoodDist = Math.min(1.0, minFDist / sensorR);
        const targetAngle = Math.atan2(targetFood.y - this.y, targetFood.x - this.x);
        let diff = targetAngle - this.heading;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        nearestFoodAngle = diff / Math.PI;
      }

      const wallDist = Math.min(this.x, width - this.x, this.y, height - this.y);
      const wallProx = Math.max(0, Math.min(1.0, wallDist / 50));

      const isoStress = Math.min(1.0, this.isolationTimer / 30.0);
      const hungerStress = Math.max(0, (100 - this.hunger) / 100);

      return [
        1.0 - nearestSameDist,
        nearestSameAngle,
        Math.min(1.0, sameCount / 5),
        1.0 - nearestFoodDist,
        nearestFoodAngle,
        wallProx,
        isoStress,
        hungerStress,
        1.0 - nearestAlienDist,
        this.brain.outputs ? this.brain.outputs[3] : 0
      ];
    }

    consumeSubstance(substance) {
      if (substance.eaten) return;
      substance.eaten = true;
      this.substanceConsumed = Math.min(10, this.substanceConsumed + 1);
      this.replicationCapacity = (this.substanceConsumed / 10) * 100;

      // Restore dimmed vitality stages
      if (this.decayStage > 0) {
        this.decayStage = Math.max(0, this.decayStage - 2);
        this.isolationTimer = this.decayStage * 30;
        this.brightness = 1.0 - this.decayStage * 0.2;
      }

      this.hunger = Math.min(100, this.hunger + 30);
      this.brain.dopamine = 1.0; // Dopamine reward spike

      // Mitosis at 10 pieces of substance
      if (this.substanceConsumed >= 10 && !this.isSplitting) {
        this.isSplitting = true;
        this.splitProgress = 0;
        this.splitAngle = this.heading;
      }
    }

    finishMitosis() {
      this.isSplitting = false;
      this.splitProgress = 0;
      this.substanceConsumed = 0;
      this.replicationCapacity = 0;

      const daughterBrain = this.brain.cloneWithMutation();
      const mutate = (v, rate = 0.08) => v * (1 + (Math.random() * 2 - 1) * rate);

      const daughterGenome = {
        generation: this.genome.generation + 1,
        baseRadius: this.genome.baseRadius,
        speed: mutate(this.genome.speed),
        agility: mutate(this.genome.agility),
        sensorRadius: mutate(this.genome.sensorRadius),
        cohesionDrive: mutate(this.genome.cohesionDrive),
        shockwaveResilience: mutate(this.genome.shockwaveResilience)
      };

      // Spawning touching rings via Planck rigid-body distance
      const sep = (this.radius * 2) + 2.0;
      const daughter = new Wabacrobe(
        this.x + Math.cos(this.splitAngle) * sep,
        this.y + Math.sin(this.splitAngle) * sep,
        this.color,
        daughterGenome,
        daughterBrain,
        this.rigidWorld
      );

      // Clean rigid-body separation impulse
      if (this.body && daughter.body && window.planck) {
        const imp = 0.08 / this.genome.shockwaveResilience;
        const nx = Math.cos(this.splitAngle) * imp;
        const ny = Math.sin(this.splitAngle) * imp;
        this.body.applyLinearImpulse(window.planck.Vec2(-nx, -ny), this.body.getWorldCenter(), true);
        daughter.body.applyLinearImpulse(window.planck.Vec2(nx, ny), daughter.body.getWorldCenter(), true);
      }

      return daughter;
    }

    updateBrainAndPhysics(sensorInputs, dt) {
      if (this.isSplitting) return;

      const decisions = this.brain.forward(sensorInputs);

      // Steer heading
      this.heading += decisions.turn * this.genome.agility * 80 * dt;

      // Apply motor thrust to Planck body
      if (this.body && window.planck) {
        const thrust = decisions.thrust * this.genome.speed * 2.2;
        const fx = Math.cos(this.heading) * thrust;
        const fy = Math.sin(this.heading) * thrust;
        this.body.applyForceToCenter(window.planck.Vec2(Physics.toMeters(fx), Physics.toMeters(fy)), true);

        if (this.isSafe && decisions.huddleLock > 0.5) {
          const vel = this.body.getLinearVelocity();
          vel.mul(Math.pow(0.85, dt * 60));
          this.body.setLinearVelocity(vel);
        }

        const bPos = this.body.getPosition();
        this.x = Physics.toPixels(bPos.x);
        this.y = Physics.toPixels(bPos.y);

        const bVel = this.body.getLinearVelocity();
        this.vx = Physics.toPixels(bVel.x);
        this.vy = Physics.toPixels(bVel.y);
      } else {
        // Fallback soft physics
        const thrust = decisions.thrust * this.genome.speed;
        this.vx += Math.cos(this.heading) * thrust * 0.1;
        this.vy += Math.sin(this.heading) * thrust * 0.1;
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95;
        this.vy *= 0.95;
      }

      // Active Inference homeostatic stress vs reward
      let reward = this.isSafe ? 0.45 : 0.0;
      let stress = !this.isSafe ? Math.min(1.0, this.isolationTimer / 30.0) : 0.0;
      this.brain.applyPlasticity(reward, stress, dt);
    }

    update(dt, width, height) {
      if (this.isDead) return null;
      this.lifetime += dt;

      if (this.isSplitting) {
        this.splitProgress += dt / 0.75;
        if (this.splitProgress >= 1.0) {
          return this.finishMitosis();
        }
      }

      // Hunger drain
      this.hunger -= 0.065 * dt;
      if (this.hunger <= 0) {
        this.destroy();
        return { type: 'dissipated', reason: 'starved' };
      }

      // 30-Second Isolation Decay Rule (5 Stages)
      if (this.sameColorNeighbors >= 2) {
        this.isSafe = true;
        this.isolationTimer = 0;
        if (this.decayStage > 0 || this.brightness < 1.0) {
          this.brightness = Math.min(1.0, this.brightness + dt * 0.75);
          if (this.brightness >= 1.0) this.decayStage = 0;
        }
      } else {
        this.isSafe = false;
        this.isolationTimer += dt;
        this.decayStage = Math.min(5, Math.floor(this.isolationTimer / 30.0));
        const targetB = Math.max(0, 1.0 - this.decayStage * 0.2);
        this.brightness += (targetB - this.brightness) * dt * 2.5;

        // Stage 5 -> Dissipate into micro-particles
        if (this.decayStage >= 5 && this.brightness <= 0.05) {
          this.destroy();
          return { type: 'dissipated', reason: 'isolated' };
        }
      }

      return null;
    }

    destroy() {
      this.isDead = true;
      if (this.body && this.rigidWorld) {
        this.rigidWorld.destroyBody(this.body);
        this.body = null;
      }
    }

    render(ctx, theme, isSelected = false) {
      if (this.isDead || this.brightness <= 0.01) return;
      const b = Math.max(0, Math.min(1, this.brightness));
      const [r, g, bVal] = this.color.rgb;
      const strokeColor = `rgba(${r}, ${g}, ${bVal}, ${b})`;
      const glowColor = `rgba(${r}, ${g}, ${bVal}, ${b * 0.5})`;
      const rad = this.radius;

      ctx.save();

      if (this.isSplitting) {
        const p = this.splitProgress;
        const sep = rad * 1.8 * p;
        const dx = Math.cos(this.splitAngle) * sep * 0.5;
        const dy = Math.sin(this.splitAngle) * sep * 0.5;
        const lRad = rad * (1 - p * 0.12);

        ctx.shadowColor = glowColor;
        ctx.shadowBlur = lRad * 2.2;
        ctx.beginPath();
        ctx.arc(this.x - dx, this.y - dy, lRad, 0, Math.PI * 2);
        ctx.arc(this.x + dx, this.y + dy, lRad, 0, Math.PI * 2);
        ctx.fillStyle = theme.voidCenter;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      } else {
        const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const isElongating = spd > 1.2;
        const rx = isElongating ? rad * 1.3 : rad;
        const ry = isElongating ? rad * 0.8 : rad;

        // 20% Radial Bloom Glow
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = rad * 2.2;

        // Outer halo
        ctx.beginPath();
        if (isElongating) ctx.ellipse(this.x, this.y, rx + 1.2, ry + 1.2, this.heading, 0, Math.PI * 2);
        else ctx.arc(this.x, this.y, rad + 1.2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${bVal}, ${b * 0.22})`;
        ctx.lineWidth = 3.2;
        ctx.stroke();

        // Hollow Void Center
        ctx.beginPath();
        if (isElongating) ctx.ellipse(this.x, this.y, rx, ry, this.heading, 0, Math.PI * 2);
        else ctx.arc(this.x, this.y, rad, 0, Math.PI * 2);
        ctx.fillStyle = theme.voidCenter;
        ctx.fill();

        // Crisp Neon Perimeter
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Elders (Gen >= 3)
        if (this.genome.generation >= 3) {
          ctx.beginPath();
          ctx.arc(this.x, this.y, rad * 0.52, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${r}, ${g}, ${bVal}, ${b * 0.6})`;
          ctx.lineWidth = 1.0;
          ctx.stroke();
        }

        // 10-Substance Mitosis Capacity Arc (0 -> 10 pieces)
        if (this.substanceConsumed > 0 && this.substanceConsumed < 10) {
          const capacityAngle = (this.substanceConsumed / 10) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(this.x, this.y, rad * 0.42, -Math.PI / 2, -Math.PI / 2 + capacityAngle);
          ctx.strokeStyle = `rgba(${r}, ${g}, ${bVal}, ${b * 0.9})`;
          ctx.lineWidth = 1.3;
          ctx.stroke();
        }

        // Safe huddle nucleus
        if (this.isSafe) {
          ctx.beginPath();
          ctx.arc(this.x, this.y, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${bVal}, ${b * 0.75})`;
          ctx.fill();
        }

        if (isSelected) {
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 10;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(this.x, this.y, rad + 7, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.restore();
    }
  }

  /**
   * Main Wabacrobes Simulation Engine
   */
  class SimulationEngine {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
      this.options = Object.assign({
        theme: 'dark',
        ambientFoodInterval: 2.8,
        timeScale: 1.0,
        enableSymbiosis: true
      }, options);

      this.activeTheme = THEMES[this.options.theme] || THEMES.dark;
      this.width = 1920;
      this.height = 1080;
      this.dpr = 1;

      this.grid = new Physics.SpatialHashGrid(this.width, this.height, 85);
      this.rigidWorld = new Physics.RigidBodyWorld(this.width, this.height);

      this.wabacrobes = [];
      this.substances = [];
      this.shockwaves = [];
      this.particles = [];
      this.symbioticLinks = [];
      this.mistBlobs = [];

      this.foodTimer = 0;
      this.selectedOrganism = null;
      this.isPaused = false;
      this.lastFrameTime = performance.now();

      this._initAtmosphere();
      this.init();
      this._setupVisibility();
      this._setupInteractions();
      this._setupWallpaperHooks();
    }

    _initAtmosphere() {
      this.mistBlobs = [];
      for (let i = 0; i < 6; i++) {
        this.mistBlobs.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: Math.min(this.width, this.height) * (0.35 + Math.random() * 0.3),
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 5
        });
      }
    }

    setTheme(themeId) {
      if (THEMES[themeId]) {
        this.activeTheme = THEMES[themeId];
        document.body.className = themeId === 'light' ? 'theme-light' : '';
      }
    }

    resize(w = null, h = null) {
      this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      this.width = w || this.canvas.parentElement.clientWidth || window.innerWidth;
      this.height = h || this.canvas.parentElement.clientHeight || window.innerHeight;

      this.canvas.width = Math.floor(this.width * this.dpr);
      this.canvas.height = Math.floor(this.height * this.dpr);

      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(this.dpr, this.dpr);

      this.grid.resize(this.width, this.height);
      this.rigidWorld.resize(this.width, this.height);
      this._initAtmosphere();
    }

    getDesiredPopulation() {
      const area = this.width * this.height;
      const target = Math.round(85 * (area / (1920 * 1080)));
      return Math.max(22, Math.min(260, target));
    }

    /**
     * Initiation Rite of Passage (Scattered Isolation Spawning)
     * Microbes never spawn in pre-formed groups; every organism starts isolated
     */
    init() {
      for (let i = 0; i < this.wabacrobes.length; i++) this.wabacrobes[i].destroy();
      this.wabacrobes = [];
      this.substances = [];
      this.shockwaves = [];
      this.particles = [];
      this.symbioticLinks = [];
      this.selectedOrganism = null;

      const targetPop = this.getDesiredPopulation();
      for (let i = 0; i < targetPop; i++) {
        const color = NEON_PALETTE[i % NEON_PALETTE.length];
        const pos = this._findScatteredSpawnPosition(65);
        this.wabacrobes.push(new Wabacrobe(pos.x, pos.y, color, null, null, this.rigidWorld));
      }

      for (let i = 0; i < 10; i++) {
        this.spawnAmbientFood();
      }
    }

    _findScatteredSpawnPosition(minDistance = 60) {
      const margin = 45;
      const minDistSq = minDistance * minDistance;
      let attempts = 0;
      while (attempts < 35) {
        const rx = margin + Math.random() * (this.width - margin * 2);
        const ry = margin + Math.random() * (this.height - margin * 2);
        let tooClose = false;
        for (let i = 0; i < this.wabacrobes.length; i++) {
          const org = this.wabacrobes[i];
          const dSq = (org.x - rx) ** 2 + (org.y - ry) ** 2;
          if (dSq < minDistSq) { tooClose = true; break; }
        }
        if (!tooClose) return { x: rx, y: ry };
        attempts++;
      }
      return { x: margin + Math.random() * (this.width - margin * 2), y: margin + Math.random() * (this.height - margin * 2) };
    }

    spawnAmbientFood() {
      if (this.substances.length >= 40) return;
      const margin = 30;
      this.substances.push(new SubstanceSpore(
        margin + Math.random() * (this.width - margin * 2),
        margin + Math.random() * (this.height - margin * 2)
      ));
    }

    spawnFoodCluster(x, y) {
      for (let i = 0; i < 6; i++) {
        const ang = Math.random() * Math.PI * 2;
        const d = Math.random() * 22;
        const sp = new SubstanceSpore(x + Math.cos(ang) * d, y + Math.sin(ang) * d);
        sp.vx = Math.cos(ang) * (15 + Math.random() * 15);
        sp.vy = Math.sin(ang) * (15 + Math.random() * 15);
        this.substances.push(sp);
      }
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        this.particles.push(new Particle(x, y, '#ffffff', Math.cos(ang) * 35, Math.sin(ang) * 35, 0.4));
      }
    }

    triggerShockwave(x, y) {
      const colors = ['#00f0ff', '#ff007f', '#39ff14', '#00ffc4'];
      const c = colors[Math.floor(Math.random() * colors.length)];
      this.shockwaves.push(new Shockwave(x, y, c));
      this.rigidWorld.applyShockwaveImpulse(x, y, 240, 650);

      for (let i = 0; i < 14; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 40 + Math.random() * 80;
        this.particles.push(new Particle(x, y, c, Math.cos(ang) * spd, Math.sin(ang) * spd, 0.5));
      }
    }

    /**
     * Touch & external bridge helpers for Live Wallpaper services
     */
    feed(x, y) {
      this.spawnFoodCluster(x, y);
    }

    shockwave(x, y) {
      this.triggerShockwave(x, y);
    }

    setPaused(isPaused) {
      this.isPaused = !!isPaused;
      if (this.isPaused) {
        if (this._rafId) {
          cancelAnimationFrame(this._rafId);
          this._rafId = null;
        }
      } else {
        this.lastFrameTime = performance.now();
        if (!this._rafId && this._boundLoop) {
          this._rafId = requestAnimationFrame(this._boundLoop);
        }
      }
    }

    _setupVisibility() {
      document.addEventListener('visibilitychange', () => {
        this.setPaused(document.hidden);
      });
    }

    _setupInteractions() {
      let lastTap = 0;
      let lastTapPos = { x: 0, y: 0 };
      let tapTimer = null;

      const handlePointer = (clientX, clientY) => {
        const rect = this.canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const now = performance.now();
        const distSq = (x - lastTapPos.x) ** 2 + (y - lastTapPos.y) ** 2;

        if (now - lastTap < 280 && distSq < 1200) {
          if (tapTimer) clearTimeout(tapTimer);
          this.triggerShockwave(x, y);
          lastTap = 0;
        } else {
          lastTap = now;
          lastTapPos = { x, y };
          if (tapTimer) clearTimeout(tapTimer);
          tapTimer = setTimeout(() => {
            // Check if clicking an organism for telemetry inspector
            let selected = null;
            for (const org of this.wabacrobes) {
              const dSq = (org.x - x) ** 2 + (org.y - y) ** 2;
              if (dSq <= 26 * 26) { selected = org; break; }
            }
            if (selected) {
              this.selectedOrganism = selected;
              if (this.onSelectOrganism) this.onSelectOrganism(selected);
            } else {
              this.spawnFoodCluster(x, y);
            }
            tapTimer = null;
          }, 220);
        }
      };

      this.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (e.touches.length > 0) handlePointer(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: false });

      this.canvas.addEventListener('mousedown', (e) => {
        if (e.target === this.canvas) handlePointer(e.clientX, e.clientY);
      });
    }

    _setupWallpaperHooks() {
      // 1. Steam Wallpaper Engine property listener
      window.wallpaperPropertyListener = {
        applyUserProperties: (properties) => {
          if (properties.theme) this.setTheme(properties.theme.value);
          if (properties.timeScale) this.options.timeScale = properties.timeScale.value;
          if (properties.ambientFoodInterval) this.options.ambientFoodInterval = properties.ambientFoodInterval.value;
        }
      };

      // 2. Lively Wallpaper Windows listener
      window.livelyPropertyListener = (name, val) => {
        if (name === 'theme') this.setTheme(val === 0 ? 'dark' : 'light');
        if (name === 'foodRate') this.options.ambientFoodInterval = val;
        if (name === 'timeScale') this.options.timeScale = val;
      };
    }

    step(dt) {
      const scaledDt = dt * this.options.timeScale;

      // Atmosphere drift
      for (const m of this.mistBlobs) {
        m.x += m.vx * scaledDt; m.y += m.vy * scaledDt;
        if (m.x < -m.radius) m.x = this.width + m.radius;
        if (m.x > this.width + m.radius) m.x = -m.radius;
        if (m.y < -m.radius) m.y = this.height + m.radius;
        if (m.y > this.height + m.radius) m.y = -m.radius;
      }

      // Ambient Food
      this.foodTimer += scaledDt;
      if (this.foodTimer >= this.options.ambientFoodInterval) {
        this.foodTimer = 0;
        this.spawnAmbientFood();
      }

      for (let i = this.substances.length - 1; i >= 0; i--) {
        const f = this.substances[i];
        f.update(scaledDt, this.width, this.height);
        if (f.eaten || f.age >= f.lifetime) this.substances.splice(i, 1);
      }

      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        this.shockwaves[i].update(scaledDt);
        if (this.shockwaves[i].isDead) this.shockwaves.splice(i, 1);
      }

      // Populate spatial grid
      this.grid.clear();
      for (const org of this.wabacrobes) this.grid.insert(org);

      // Sensory perception & neural forward pass
      const sensoryList = new Array(this.wabacrobes.length);
      for (let i = 0; i < this.wabacrobes.length; i++) {
        const org = this.wabacrobes[i];
        const neighbors = this.grid.queryRadius(org.x, org.y, org.genome.sensorRadius);
        sensoryList[i] = org.perceive(neighbors, this.substances, this.width, this.height);
        org.updateBrainAndPhysics(sensoryList[i], scaledDt);
      }

      // Planck.js constraint step
      this.rigidWorld.step(scaledDt);

      // Symbiosis check
      if (this.options.enableSymbiosis && this.symbioticLinks.length < 6 && this.wabacrobes.length >= 6) {
        for (let i = 0; i < this.wabacrobes.length; i += 3) {
          const orgA = this.wabacrobes[i];
          if (!orgA.isSafe) continue;
          const nearby = this.grid.queryRadius(orgA.x, orgA.y, 90);
          for (const nb of nearby) {
            const orgB = nb.entity;
            if (orgB !== orgA && orgB.isSafe && orgB.color.name !== orgA.color.name) {
              const exists = this.symbioticLinks.some(l => (l.orgA === orgA && l.orgB === orgB) || (l.orgA === orgB && l.orgB === orgA));
              if (!exists) {
                this.symbioticLinks.push(new SymbioticLink(orgA, orgB));
                break;
              }
            }
          }
        }
      }

      for (let i = this.symbioticLinks.length - 1; i >= 0; i--) {
        this.symbioticLinks[i].update(scaledDt);
        if (this.symbioticLinks[i].isDead) this.symbioticLinks.splice(i, 1);
      }

      // Update life cycles & mitosis
      const newDaughters = [];
      for (let i = this.wabacrobes.length - 1; i >= 0; i--) {
        const org = this.wabacrobes[i];
        const res = org.update(scaledDt, this.width, this.height);
        if (res && res.constructor === Wabacrobe) {
          newDaughters.push(res);
        } else if (res && res.type === 'dissipated') {
          for (let k = 0; k < 16; k++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 20 + Math.random() * 50;
            this.particles.push(new Particle(org.x, org.y, org.color.hex, Math.cos(ang) * spd, Math.sin(ang) * spd));
          }
          if (this.selectedOrganism === org) this.selectedOrganism = null;
          this.wabacrobes.splice(i, 1);
        }
      }

      if (newDaughters.length > 0) this.wabacrobes.push(...newDaughters);

      // Auto replenish
      const minPop = Math.floor(this.getDesiredPopulation() * 0.45);
      if (this.wabacrobes.length < minPop) {
        const color = NEON_PALETTE[Math.floor(Math.random() * NEON_PALETTE.length)];
        const pos = this._findScatteredSpawnPosition(60);
        this.wabacrobes.push(new Wabacrobe(pos.x, pos.y, color, null, null, this.rigidWorld));
      }

      for (let i = this.particles.length - 1; i >= 0; i--) {
        this.particles[i].update(scaledDt);
        if (this.particles[i].age >= this.particles[i].lifetime) this.particles.splice(i, 1);
      }
    }

    render() {
      const ctx = this.ctx;
      const theme = this.activeTheme;

      // Background
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, this.width, this.height);

      // Atmospheric mist
      for (const m of this.mistBlobs) {
        const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.radius);
        grad.addColorStop(0, theme.mist);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Symbiotic tethers
      for (const l of this.symbioticLinks) l.render(ctx);

      // Substances
      const isDark = theme.id === 'dark';
      for (const f of this.substances) f.render(ctx, isDark);

      // Shockwaves
      for (const sw of this.shockwaves) sw.render(ctx);

      // Particles
      for (const p of this.particles) p.render(ctx);

      // Wabacrobes
      for (const org of this.wabacrobes) {
        org.render(ctx, theme, this.selectedOrganism === org);
      }
    }

    start() {
      this._boundLoop = (now) => {
        if (!this.isPaused) {
          let dt = (now - this.lastFrameTime) / 1000;
          this.lastFrameTime = now;
          if (dt > 0.066) dt = 0.066;

          this.step(dt);
          this.render();

          if (this.onTelemetryUpdate) {
            let safeC = 0, isoC = 0, maxG = 1;
            for (const org of this.wabacrobes) {
              if (org.isSafe) safeC++; else isoC++;
              if (org.genome.generation > maxG) maxG = org.genome.generation;
            }
            this.onTelemetryUpdate({
              total: this.wabacrobes.length,
              safe: safeC,
              isolated: isoC,
              maxGen: maxG,
              substances: this.substances.length,
              symbiosis: this.symbioticLinks.length
            });
          }

          this._rafId = requestAnimationFrame(this._boundLoop);
        } else {
          this._rafId = null;
        }
      };

      if (!this._rafId && !this.isPaused) {
        this.lastFrameTime = performance.now();
        this._rafId = requestAnimationFrame(this._boundLoop);
      }
    }
  }

  return {
    NEON_PALETTE,
    THEMES,
    Wabacrobe,
    SimulationEngine
  };
});
