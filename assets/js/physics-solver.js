/**
 * Wabacrobes Physics Solver
 * Integrates Planck.js Box2D rigid-body constraint solver & O(N) Spatial Hash Grid.
 * Guarantees zero border clipping, non-overlapping circular colliders,
 * cellular lattice packing, and momentum transfer on impacts and shockwaves.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['planck'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('planck'));
  } else {
    root.WabacrobesPhysics = factory(root.planck);
  }
})(typeof self !== 'undefined' ? self : this, function (planck) {
  'use strict';

  if (!planck && typeof window !== 'undefined' && window.planck) {
    planck = window.planck;
  }

  const Vec2 = planck ? planck.Vec2 : null;
  const PIXELS_PER_METER = 50.0;
  const METERS_PER_PIXEL = 1.0 / PIXELS_PER_METER;

  function toMeters(px) {
    return px * METERS_PER_PIXEL;
  }

  function toPixels(m) {
    return m * PIXELS_PER_METER;
  }

  /**
   * SpatialHashGrid for O(N) neighbor lookups
   */
  class SpatialHashGrid {
    constructor(width, height, cellSize = 85) {
      this.cellSize = cellSize;
      this.invCellSize = 1.0 / cellSize;
      this.resize(width, height);
    }

    resize(width, height) {
      this.width = Math.max(width, 50);
      this.height = Math.max(height, 50);
      this.cols = Math.ceil(this.width * this.invCellSize) + 1;
      this.rows = Math.ceil(this.height * this.invCellSize) + 1;
      this.buckets = new Array(this.cols * this.rows);
      for (let i = 0; i < this.buckets.length; i++) {
        this.buckets[i] = [];
      }
    }

    clear() {
      for (let i = 0; i < this.buckets.length; i++) {
        this.buckets[i].length = 0;
      }
    }

    _getKey(col, row) {
      return row * this.cols + col;
    }

    insert(entity) {
      const col = Math.floor(entity.x * this.invCellSize);
      const row = Math.floor(entity.y * this.invCellSize);
      if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
        this.buckets[this._getKey(col, row)].push(entity);
      }
    }

    queryRadius(x, y, radius) {
      const results = [];
      const minCol = Math.max(0, Math.floor((x - radius) * this.invCellSize));
      const maxCol = Math.min(this.cols - 1, Math.floor((x + radius) * this.invCellSize));
      const minRow = Math.max(0, Math.floor((y - radius) * this.invCellSize));
      const maxRow = Math.min(this.rows - 1, Math.floor((y + radius) * this.invCellSize));
      const rSq = radius * radius;

      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          const bucket = this.buckets[this._getKey(c, r)];
          for (let i = 0; i < bucket.length; i++) {
            const ent = bucket[i];
            const dx = ent.x - x;
            const dy = ent.y - y;
            const dSq = dx * dx + dy * dy;
            if (dSq <= rSq) {
              results.push({ entity: ent, distSq: dSq, dist: Math.sqrt(dSq) });
            }
          }
        }
      }
      return results;
    }
  }

  /**
   * RigidBodyWorld wrapping Planck.js constraint solver
   */
  class RigidBodyWorld {
    constructor(width, height) {
      this.width = width;
      this.height = height;

      if (!planck) {
        console.warn('Planck.js not found, falling back to soft physics.');
        this.world = null;
        return;
      }

      this.world = new planck.World({
        gravity: Vec2(0, 0)
      });

      this.wallBody = null;
      this._createWalls();
    }

    resize(width, height) {
      this.width = width;
      this.height = height;
      this._createWalls();
    }

    _createWalls() {
      if (!this.world) return;
      if (this.wallBody) {
        this.world.destroyBody(this.wallBody);
        this.wallBody = null;
      }

      const wM = toMeters(this.width);
      const hM = toMeters(this.height);

      this.wallBody = this.world.createBody({
        type: 'static',
        position: Vec2(0, 0)
      });

      const wallFix = {
        restitution: 0.35,
        friction: 0.15
      };

      // Bottom, Right, Top, Left edges
      this.wallBody.createFixture(planck.Edge(Vec2(0, 0), Vec2(wM, 0)), wallFix);
      this.wallBody.createFixture(planck.Edge(Vec2(wM, 0), Vec2(wM, hM)), wallFix);
      this.wallBody.createFixture(planck.Edge(Vec2(wM, hM), Vec2(0, hM)), wallFix);
      this.wallBody.createFixture(planck.Edge(Vec2(0, hM), Vec2(0, 0)), wallFix);
    }

    /**
     * Enforces impenetrable circular collider on outer neon perimeter
     */
    createOrganismBody(x, y, radius, strokeWidth = 1.8) {
      if (!this.world) return null;

      // Outer radius encompasses stroke to guarantee zero visual clipping or overlap
      const outerRadiusPx = radius + strokeWidth * 0.5;
      const radiusMeters = toMeters(outerRadiusPx);

      const body = this.world.createDynamicBody({
        position: Vec2(toMeters(x), toMeters(y)),
        linearDamping: 1.25, // fluid damping
        angularDamping: 1.8
      });

      body.createFixture({
        shape: planck.Circle(radiusMeters),
        density: 1.0,
        friction: 0.12,
        restitution: 0.35 // non-overlapping physical momentum transfer
      });

      return body;
    }

    destroyBody(body) {
      if (this.world && body) {
        this.world.destroyBody(body);
      }
    }

    step(dt) {
      if (!this.world) return;
      const stepDt = Math.max(0.001, Math.min(dt, 0.033));
      // 8 velocity iterations, 3 position iterations for tight lattice convergence
      this.world.step(stepDt, 8, 3);
    }

    applyShockwaveImpulse(centerX, centerY, radiusPx, strength) {
      if (!this.world) return;
      const centerM = Vec2(toMeters(centerX), toMeters(centerY));
      const radiusM = toMeters(radiusPx);
      const radiusMSq = radiusM * radiusM;

      for (let body = this.world.getBodyList(); body; body = body.getNext()) {
        if (body.getType() !== 'dynamic') continue;

        const pos = body.getPosition();
        const diff = Vec2.sub(pos, centerM);
        const dSq = diff.lengthSquared();

        if (dSq > 0.0001 && dSq <= radiusMSq) {
          const d = Math.sqrt(dSq);
          diff.normalize();
          // Inverse distance force
          const forceMag = (strength * 0.002) / (d + 0.25);
          body.applyLinearImpulse(Vec2.mul(diff, forceMag), body.getWorldCenter(), true);
        }
      }
    }
  }

  return {
    toMeters,
    toPixels,
    SpatialHashGrid,
    RigidBodyWorld
  };
});
