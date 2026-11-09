/**
 * Wabacrobes ALife Brain — "The Throng" Mandate
 * True Digital Artificial Life Controller
 * Recurrent Neural Network + Active Inference & Neuromodulated Hebbian Plasticity
 * Clinical Telemetry & JSON Export
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WabacrobesALife = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class ALifeBrain {
    constructor({
      weights = null,
      numInputs = 10,
      numHidden = 6,
      numOutputs = 4
    } = {}) {
      this.numInputs = numInputs;
      this.numHidden = numHidden;
      this.numOutputs = numOutputs;

      this.hiddenActivations = new Float32Array(numHidden);
      this.prevHiddenActivations = new Float32Array(numHidden);

      this.inputs = new Float32Array(numInputs);
      this.outputs = new Float32Array(numOutputs);

      if (weights) {
        this.wInputHidden = Float32Array.from(weights.wInputHidden);
        this.wHiddenHidden = Float32Array.from(weights.wHiddenHidden);
        this.wHiddenOutput = Float32Array.from(weights.wHiddenOutput);
        this.biasHidden = Float32Array.from(weights.biasHidden);
        this.biasOutput = Float32Array.from(weights.biasOutput);
      } else {
        this._initRandomWeights();
      }

      // Homeostatic Internal States (Active Inference)
      this.dopamine = 0.5; // Reward
      this.stress = 0.0;   // Pain/Cortisol
      this.cumulativeReward = 0;
      this.cumulativeStress = 0;

      // Telemetry log for observational studies
      this.decisionLog = [];
      this.maxLogLength = 40;
    }

    _initRandomWeights() {
      this.wInputHidden = new Float32Array(this.numInputs * this.numHidden);
      this.wHiddenHidden = new Float32Array(this.numHidden * this.numHidden);
      this.wHiddenOutput = new Float32Array(this.numHidden * this.numOutputs);
      this.biasHidden = new Float32Array(this.numHidden);
      this.biasOutput = new Float32Array(this.numOutputs);

      const scaleIH = Math.sqrt(2.0 / (this.numInputs + this.numHidden));
      for (let i = 0; i < this.wInputHidden.length; i++) {
        this.wInputHidden[i] = (Math.random() * 2 - 1) * scaleIH;
      }

      const scaleHH = Math.sqrt(2.0 / (this.numHidden + this.numHidden));
      for (let i = 0; i < this.wHiddenHidden.length; i++) {
        this.wHiddenHidden[i] = (Math.random() * 2 - 1) * scaleHH;
      }

      const scaleHO = Math.sqrt(2.0 / (this.numHidden + this.numOutputs));
      for (let i = 0; i < this.wHiddenOutput.length; i++) {
        this.wHiddenOutput[i] = (Math.random() * 2 - 1) * scaleHO;
      }

      for (let i = 0; i < this.numHidden; i++) this.biasHidden[i] = (Math.random() * 2 - 1) * 0.1;
      for (let i = 0; i < this.numOutputs; i++) this.biasOutput[i] = (Math.random() * 2 - 1) * 0.1;
    }

    /**
     * Sensory Forward Pass
     * @param {Array<number>} sensorInputs 10 normalized sensor signals
     */
    forward(sensorInputs) {
      for (let i = 0; i < this.numInputs; i++) {
        this.inputs[i] = sensorInputs[i] || 0;
      }

      this.prevHiddenActivations.set(this.hiddenActivations);

      // Hidden recurrent loop with tanh activation
      for (let h = 0; h < this.numHidden; h++) {
        let sum = this.biasHidden[h];
        for (let i = 0; i < this.numInputs; i++) {
          sum += this.inputs[i] * this.wInputHidden[i * this.numHidden + h];
        }
        for (let rh = 0; rh < this.numHidden; rh++) {
          sum += this.prevHiddenActivations[rh] * this.wHiddenHidden[rh * this.numHidden + h];
        }
        this.hiddenActivations[h] = Math.tanh(sum);
      }

      // Actuator Outputs
      for (let o = 0; o < this.numOutputs; o++) {
        let sum = this.biasOutput[o];
        for (let h = 0; h < this.numHidden; h++) {
          sum += this.hiddenActivations[h] * this.wHiddenOutput[h * this.numOutputs + o];
        }
        this.outputs[o] = sum;
      }

      // Actuator 0: Thrust propulsion (0 to 1)
      const thrust = 1.0 / (1.0 + Math.exp(-this.outputs[0]));
      // Actuator 1: Steering torque (-1 to +1)
      const turn = Math.tanh(this.outputs[1]);
      // Actuator 2: Huddle Adhesion lock brake (0 to 1)
      const huddleLock = 1.0 / (1.0 + Math.exp(-this.outputs[2]));
      // Actuator 3: Temporal signal / feedback
      const signal = Math.tanh(this.outputs[3]);

      if (this.decisionLog.length >= this.maxLogLength) {
        this.decisionLog.shift();
      }
      this.decisionLog.push({
        time: performance.now(),
        dopamine: this.dopamine,
        stress: this.stress,
        thrust,
        turn,
        huddleLock
      });

      return { thrust, turn, huddleLock, signal };
    }

    /**
     * Neuromodulated Hebbian Plasticity & Active Inference
     * Rewires synaptic connections during organism lifetime
     */
    applyPlasticity(rewardSignal, stressSignal, dt) {
      this.dopamine = this.dopamine * 0.93 + rewardSignal * 0.07;
      this.stress = this.stress * 0.93 + stressSignal * 0.07;
      this.cumulativeReward += rewardSignal * dt;
      this.cumulativeStress += stressSignal * dt;

      // Positive neuromodulator reinforces active pathways; stress suppresses them
      const neuromodulator = (this.dopamine - this.stress * 1.25) * 0.04 * dt;

      for (let i = 0; i < this.numInputs; i++) {
        const inp = this.inputs[i];
        if (Math.abs(inp) < 0.01) continue;
        for (let h = 0; h < this.numHidden; h++) {
          const idx = i * this.numHidden + h;
          const delta = neuromodulator * inp * this.hiddenActivations[h];
          this.wInputHidden[idx] = Math.max(-2.5, Math.min(2.5, this.wInputHidden[idx] * 0.9999 + delta));
        }
      }

      for (let h = 0; h < this.numHidden; h++) {
        const hAct = this.hiddenActivations[h];
        for (let o = 0; o < this.numOutputs; o++) {
          const idx = h * this.numOutputs + o;
          const delta = neuromodulator * hAct * this.outputs[o];
          this.wHiddenOutput[idx] = Math.max(-2.5, Math.min(2.5, this.wHiddenOutput[idx] * 0.9999 + delta));
        }
      }
    }

    /**
     * Generational Mitosis Cloning with Neuroevolutionary Mutation
     */
    cloneWithMutation(isMutagen = false) {
      const mutRate = isMutagen ? 0.35 : 0.08;
      const rewiringChance = isMutagen ? 0.18 : 0.04;

      const mutate = (arr) => {
        const out = new Float32Array(arr.length);
        for (let i = 0; i < arr.length; i++) {
          let w = arr[i];
          if (Math.random() < mutRate) {
            w += (Math.random() * 2 - 1) * 0.22;
          }
          if (Math.random() < rewiringChance) {
            w = (Math.random() * 2 - 1) * 0.5;
          }
          out[i] = Math.max(-2.5, Math.min(2.5, w));
        }
        return out;
      };

      return new ALifeBrain({
        numInputs: this.numInputs,
        numHidden: this.numHidden,
        numOutputs: this.numOutputs,
        weights: {
          wInputHidden: mutate(this.wInputHidden),
          wHiddenHidden: mutate(this.wHiddenHidden),
          wHiddenOutput: mutate(this.wHiddenOutput),
          biasHidden: mutate(this.biasHidden),
          biasOutput: mutate(this.biasOutput)
        }
      });
    }

    serialize() {
      return {
        numInputs: this.numInputs,
        numHidden: this.numHidden,
        numOutputs: this.numOutputs,
        wInputHidden: Array.from(this.wInputHidden),
        wHiddenHidden: Array.from(this.wHiddenHidden),
        wHiddenOutput: Array.from(this.wHiddenOutput),
        biasHidden: Array.from(this.biasHidden),
        biasOutput: Array.from(this.biasOutput)
      };
    }

    static deserialize(data) {
      if (!data) return new ALifeBrain();
      return new ALifeBrain({
        numInputs: data.numInputs,
        numHidden: data.numHidden,
        numOutputs: data.numOutputs,
        weights: {
          wInputHidden: new Float32Array(data.wInputHidden),
          wHiddenHidden: new Float32Array(data.wHiddenHidden),
          wHiddenOutput: new Float32Array(data.wHiddenOutput),
          biasHidden: new Float32Array(data.biasHidden),
          biasOutput: new Float32Array(data.biasOutput)
        }
      });
    }
  }

  return {
    ALifeBrain
  };
});
