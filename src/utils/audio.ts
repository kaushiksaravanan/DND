/**
 * Procedural Audio Engine for Echo Manor Mysteries
 * Generates marimba/vibraphone-like sounds using Web Audio API
 */

import { SeededRandom } from './procedural';

// Pentatonic scales for mysterious/neutral moods
const SCALES = {
    neutral: [261.63, 293.66, 329.63, 392.00, 440.00], // C major pentatonic
    tense: [261.63, 277.18, 311.13, 369.99, 415.30],   // C locrian-ish
    mysterious: [261.63, 293.66, 311.13, 392.00, 415.30], // C minor pentatonic
    joyful: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25], // C major
};

export type AudioMood = 'neutral' | 'tense' | 'mysterious' | 'joyful';

export class MarimbaGenerator {
    private ctx: AudioContext | null = null;
    private isPlaying: boolean = false;
    private nextNoteTime: number = 0;
    private tempo: number = 60; // BPM
    private mood: AudioMood = 'neutral';
    private rng: SeededRandom;
    private masterGain: GainNode | null = null;
    private reverbNode: ConvolverNode | null = null;
    private lookaheadWrapper: number | null = null;

    constructor(seed: number = Date.now()) {
        this.rng = new SeededRandom(seed);
    }

    async init() {
        if (this.ctx) return;

        // Initialize AudioContext
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();

        // Master gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // Lower volume for background

        // Create reverb impulse
        try {
            const duration = 2.0;
            const sampleRate = this.ctx.sampleRate;
            const length = sampleRate * duration;
            const impulse = this.ctx.createBuffer(2, length, sampleRate);
            const left = impulse.getChannelData(0);
            const right = impulse.getChannelData(1);

            for (let i = 0; i < length; i++) {
                const decay = Math.pow(1 - i / length, 2);
                left[i] = (Math.random() * 2 - 1) * decay;
                right[i] = (Math.random() * 2 - 1) * decay;
            }

            this.reverbNode = this.ctx.createConvolver();
            this.reverbNode.buffer = impulse;

            // Connect graph: reverb -> master -> destination
            this.reverbNode.connect(this.masterGain);
        } catch (e) {
            console.warn('Reverb creation failed, skipping', e);
        }

        this.masterGain.connect(this.ctx.destination);
    }

    private playNote(freq: number, time: number) {
        if (!this.ctx || !this.masterGain) return;

        // Oscillator
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        // Envelope
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.5, time + 0.01); // Attack
        gain.gain.exponentialRampToValueAtTime(0.001, time + 1.5); // Decay

        // FM Synthesis for "wooden" texture
        const modulator = this.ctx.createOscillator();
        modulator.type = 'square';
        modulator.frequency.setValueAtTime(freq * 2.1, time); // Non-integer harmonic

        const modGain = this.ctx.createGain();
        modGain.gain.setValueAtTime(800, time); // Modulation depth

        modulator.connect(modGain);
        modGain.connect(osc.frequency);

        // Connections
        osc.connect(gain);
        if (this.reverbNode) {
            gain.connect(this.reverbNode);
        } else {
            gain.connect(this.masterGain);
        }

        // Start/Stop
        osc.start(time);
        modulator.start(time);
        osc.stop(time + 2.0);
        modulator.stop(time + 2.0);
    }

    private schedule() {
        if (!this.isPlaying || !this.ctx) return;

        const scheduleAhead = 0.1; // Seconds

        // Schedule next note if it's due
        while (this.nextNoteTime < this.ctx.currentTime + scheduleAhead) {
            if (this.rng.chance(0.6)) { // 60% chance to play a note
                const scale = SCALES[this.mood];
                const note = this.rng.pick(scale);
                // Random octave shift
                const freq = note * Math.pow(2, this.rng.int(-1, 0));

                this.playNote(freq, this.nextNoteTime);
            }

            // Calculate next note time based on rhythm
            const beatLength = 60 / this.tempo;
            const subdivision = this.rng.pick([1, 0.5, 0.5, 0.25]); // Whole, half, quarter beats
            this.nextNoteTime += beatLength * subdivision;
        }

        // Loop
        this.lookaheadWrapper = window.setTimeout(() => this.schedule(), 25);
    }

    async start(mood: AudioMood = 'neutral') {
        if (!this.ctx) await this.init();
        if (this.isPlaying) return;

        // Safety check for AudioContext state
        if (this.ctx?.state === 'suspended') {
            await this.ctx.resume();
        }

        this.mood = mood;
        this.isPlaying = true;

        if (this.ctx) {
            this.nextNoteTime = this.ctx.currentTime + 0.1;
            this.schedule();
        }
    }

    stop() {
        this.isPlaying = false;
        if (this.lookaheadWrapper !== null) {
            clearTimeout(this.lookaheadWrapper);
            this.lookaheadWrapper = null;
        }
        if (this.masterGain && this.ctx) {
            // Fade out
            this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
        }
    }

    setMood(mood: AudioMood) {
        this.mood = mood;
        // Adjust tempo based on mood
        switch (mood) {
            case 'tense': this.tempo = 90; break;
            case 'mysterious': this.tempo = 50; break;
            case 'joyful': this.tempo = 80; break;
            default: this.tempo = 60;
        }
    }
}
