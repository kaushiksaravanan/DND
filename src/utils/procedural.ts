/**
 * Procedural Generation Utilities for Echo Manor Mysteries
 * All content is generated from seeds for reproducibility
 */

// ============================================
// SEEDED RANDOM NUMBER GENERATOR
// ============================================

/**
 * Mulberry32 - Fast seeded PRNG
 * Same seed always produces same sequence
 */
export function createSeededRandom(seed: number): () => number {
    let state = seed;
    return function () {
        state |= 0;
        state = (state + 0x6D2B79F5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export class SeededRandom {
    private random: () => number;

    constructor(seed: number) {
        this.random = createSeededRandom(seed);
    }

    // Random float between 0 and 1
    next(): number {
        return this.random();
    }

    // Random integer between min and max (inclusive)
    int(min: number, max: number): number {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }

    // Random float between min and max
    float(min: number, max: number): number {
        return this.random() * (max - min) + min;
    }

    // Pick random element from array
    pick<T>(array: T[]): T {
        return array[Math.floor(this.random() * array.length)];
    }

    // Shuffle array in place
    shuffle<T>(array: T[]): T[] {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(this.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    // Random boolean with given probability
    chance(probability: number): boolean {
        return this.random() < probability;
    }
}

// ============================================
// ROOM TYPES AND MOODS
// ============================================

export type RoomMood = 'dark' | 'bright' | 'eerie' | 'warm' | 'cold' | 'dusty' | 'elegant';

export interface RoomTemplate {
    name: string;
    mood: RoomMood;
    descriptions: string[];
    features: string[];
}

// Room templates - AI can expand these dynamically
export const ROOM_TEMPLATES: RoomTemplate[] = [
    {
        name: 'Grand Entrance Hall',
        mood: 'elegant',
        descriptions: ['A sweeping marble staircase dominates the space', 'Crystal chandeliers catch the dim light'],
        features: ['staircase', 'chandelier', 'coat rack', 'grandfather clock'],
    },
    {
        name: 'Library',
        mood: 'dusty',
        descriptions: ['Towering bookshelves line every wall', 'The scent of old paper fills the air'],
        features: ['bookshelves', 'reading desk', 'fireplace', 'ladder'],
    },
    {
        name: 'Conservatory',
        mood: 'cold',
        descriptions: ['Exotic plants crowd the glass-walled room', 'Moonlight filters through the frosted panes'],
        features: ['plants', 'fountain', 'stone benches', 'bird cage'],
    },
    {
        name: 'Dining Room',
        mood: 'elegant',
        descriptions: ['A long mahogany table seats twenty', 'Silver candlesticks stand sentinel'],
        features: ['dining table', 'china cabinet', 'silverware', 'portraits'],
    },
    {
        name: 'Kitchen',
        mood: 'warm',
        descriptions: ['Copper pots hang from iron hooks', 'The great stove still radiates heat'],
        features: ['stove', 'pantry', 'knife block', 'wine rack'],
    },
    {
        name: 'Wine Cellar',
        mood: 'dark',
        descriptions: ['Rows of dusty bottles line the stone walls', 'A chill emanates from the earth'],
        features: ['wine racks', 'barrels', 'stone floor', 'locked cage'],
    },
    {
        name: 'Study',
        mood: 'dusty',
        descriptions: ['Papers cover every surface', 'A single lamp illuminates the chaos'],
        features: ['desk', 'safe', 'globe', 'typewriter'],
    },
    {
        name: 'Master Bedroom',
        mood: 'dark',
        descriptions: ['Heavy curtains block all light', 'The four-poster bed looms ominously'],
        features: ['bed', 'wardrobe', 'vanity', 'locked drawer'],
    },
    {
        name: 'Ballroom',
        mood: 'elegant',
        descriptions: ['Mirrors multiply the emptiness', 'The parquet floor is scuffed with memories'],
        features: ['mirrors', 'piano', 'stage', 'balcony'],
    },
    {
        name: 'Servants Quarters',
        mood: 'cold',
        descriptions: ['Sparse furnishings speak of hard lives', 'Personal effects are few'],
        features: ['bunk beds', 'trunk', 'uniforms', 'hidden letters'],
    },
    {
        name: 'Attic',
        mood: 'eerie',
        descriptions: ['Dust motes dance in shafts of light', 'Forgotten things crowd the shadows'],
        features: ['trunks', 'mannequin', 'rocking horse', 'covered paintings'],
    },
    {
        name: 'Gallery',
        mood: 'eerie',
        descriptions: ['Ancestor portraits stare accusingly', 'Eyes seem to follow your movement'],
        features: ['paintings', 'sculptures', 'display cases', 'secret door'],
    },
];

// ============================================
// MANOR LAYOUT GENERATION
// ============================================

export interface ProceduralRoom {
    id: string;
    name: string;
    mood: RoomMood;
    description: string;
    features: string[];
    connections: string[];
    position: { x: number; y: number };
    discovered: boolean;
    searched: boolean;
}

export interface ManorLayout {
    rooms: ProceduralRoom[];
    seed: number;
    secretPassages: Array<{ from: string; to: string }>;
}

/**
 * Generate a procedural manor layout from a seed
 */
export function generateManorLayout(seed: number, roomCount: number = 10): ManorLayout {
    const rng = new SeededRandom(seed);
    const rooms: ProceduralRoom[] = [];
    const shuffledTemplates = rng.shuffle([...ROOM_TEMPLATES]);

    // Grid-based placement for room positions
    const gridSize = Math.ceil(Math.sqrt(roomCount));
    const positions: Array<{ x: number; y: number }> = [];

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            positions.push({ x: x * 150 + rng.int(-20, 20), y: y * 120 + rng.int(-20, 20) });
        }
    }

    // Shuffle positions for variety
    const shuffledPositions = rng.shuffle(positions);

    // Generate rooms
    for (let i = 0; i < Math.min(roomCount, shuffledTemplates.length); i++) {
        const template = shuffledTemplates[i];
        const pos = shuffledPositions[i];

        rooms.push({
            id: `room-${i}`,
            name: template.name,
            mood: template.mood,
            description: rng.pick(template.descriptions),
            features: rng.shuffle(template.features).slice(0, rng.int(2, 4)),
            connections: [],
            position: pos,
            discovered: i === 0, // First room is always discovered (entrance)
            searched: false,
        });
    }

    // Generate connections (minimum spanning tree + extra edges)
    const connected = new Set<number>([0]);
    const unconnected = new Set<number>(rooms.map((_, i) => i).slice(1));

    // Connect all rooms (MST-like)
    while (unconnected.size > 0) {
        let minDist = Infinity;
        let bestPair: [number, number] = [0, 0];

        for (const c of connected) {
            for (const u of unconnected) {
                const dist = getDistance(rooms[c].position, rooms[u].position);
                if (dist < minDist) {
                    minDist = dist;
                    bestPair = [c, u];
                }
            }
        }

        const [from, to] = bestPair;
        rooms[from].connections.push(rooms[to].id);
        rooms[to].connections.push(rooms[from].id);
        connected.add(to);
        unconnected.delete(to);
    }

    // Add extra connections for variety (20-40% more)
    const extraConnections = rng.int(2, Math.floor(roomCount * 0.4));
    for (let i = 0; i < extraConnections; i++) {
        const from = rng.int(0, rooms.length - 1);
        const to = rng.int(0, rooms.length - 1);
        if (from !== to && !rooms[from].connections.includes(rooms[to].id)) {
            rooms[from].connections.push(rooms[to].id);
            rooms[to].connections.push(rooms[from].id);
        }
    }

    // Generate 1-2 secret passages
    const secretPassages: Array<{ from: string; to: string }> = [];
    const passageCount = rng.int(1, 2);
    for (let i = 0; i < passageCount; i++) {
        const from = rng.int(0, rooms.length - 1);
        let to = rng.int(0, rooms.length - 1);
        while (to === from || rooms[from].connections.includes(rooms[to].id)) {
            to = rng.int(0, rooms.length - 1);
        }
        secretPassages.push({ from: rooms[from].id, to: rooms[to].id });
    }

    return { rooms, seed, secretPassages };
}

function getDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

// ============================================
// DYNAMIC COLOR GENERATION
// ============================================

export interface RoomColors {
    background: string;
    accent: string;
    glow: string;
    text: string;
}

const MOOD_COLORS: Record<RoomMood, RoomColors> = {
    dark: {
        background: 'linear-gradient(135deg, #1a1a2e, #0f0f1a)',
        accent: '#4a0d0d',
        glow: 'rgba(74, 13, 13, 0.4)',
        text: '#a0a0a0',
    },
    bright: {
        background: 'linear-gradient(135deg, #2d3748, #1a202c)',
        accent: '#eab308',
        glow: 'rgba(234, 179, 8, 0.3)',
        text: '#e2e8f0',
    },
    eerie: {
        background: 'linear-gradient(135deg, #1a1a3e, #0a0a1f)',
        accent: '#6366f1',
        glow: 'rgba(99, 102, 241, 0.3)',
        text: '#c4b5fd',
    },
    warm: {
        background: 'linear-gradient(135deg, #2d1f1f, #1a1010)',
        accent: '#ea580c',
        glow: 'rgba(234, 88, 12, 0.3)',
        text: '#fed7aa',
    },
    cold: {
        background: 'linear-gradient(135deg, #1e3a5f, #0f1a2e)',
        accent: '#06b6d4',
        glow: 'rgba(6, 182, 212, 0.3)',
        text: '#a5f3fc',
    },
    dusty: {
        background: 'linear-gradient(135deg, #292524, #1c1917)',
        accent: '#a8a29e',
        glow: 'rgba(168, 162, 158, 0.2)',
        text: '#d6d3d1',
    },
    elegant: {
        background: 'linear-gradient(135deg, #1f1f2e, #0f0f1a)',
        accent: '#c9a227',
        glow: 'rgba(201, 162, 39, 0.3)',
        text: '#fef3c7',
    },
};

export function getRoomColors(mood: RoomMood): RoomColors {
    return MOOD_COLORS[mood];
}

// ============================================
// PARTICLE SYSTEM PARAMETERS
// ============================================

export interface ParticleConfig {
    count: number;
    sizeRange: [number, number];
    speedRange: [number, number];
    opacityRange: [number, number];
    color: string;
    type: 'dust' | 'fog' | 'spark' | 'snow';
}

export function getParticlesForMood(mood: RoomMood, rng: SeededRandom): ParticleConfig {
    const configs: Record<RoomMood, ParticleConfig> = {
        dark: {
            count: rng.int(20, 40),
            sizeRange: [2, 6],
            speedRange: [0.5, 2],
            opacityRange: [0.1, 0.3],
            color: '#4a0d0d',
            type: 'dust',
        },
        bright: {
            count: rng.int(10, 20),
            sizeRange: [1, 3],
            speedRange: [1, 3],
            opacityRange: [0.2, 0.5],
            color: '#fef08a',
            type: 'spark',
        },
        eerie: {
            count: rng.int(30, 50),
            sizeRange: [20, 60],
            speedRange: [0.2, 0.8],
            opacityRange: [0.05, 0.15],
            color: '#6366f1',
            type: 'fog',
        },
        warm: {
            count: rng.int(15, 25),
            sizeRange: [1, 4],
            speedRange: [0.8, 2.5],
            opacityRange: [0.3, 0.6],
            color: '#ea580c',
            type: 'spark',
        },
        cold: {
            count: rng.int(40, 60),
            sizeRange: [2, 5],
            speedRange: [0.5, 1.5],
            opacityRange: [0.3, 0.7],
            color: '#ffffff',
            type: 'snow',
        },
        dusty: {
            count: rng.int(30, 50),
            sizeRange: [1, 4],
            speedRange: [0.3, 1],
            opacityRange: [0.2, 0.4],
            color: '#a8a29e',
            type: 'dust',
        },
        elegant: {
            count: rng.int(10, 20),
            sizeRange: [1, 3],
            speedRange: [0.5, 1.5],
            opacityRange: [0.3, 0.6],
            color: '#c9a227',
            type: 'spark',
        },
    };

    return configs[mood];
}

// ============================================
// ANIMATION PARAMETER GENERATION
// ============================================

export interface AnimationParams {
    duration: number;
    delay: number;
    easing: string;
    direction: 'normal' | 'reverse' | 'alternate';
}

export function generateAnimationParams(rng: SeededRandom): AnimationParams {
    const easings = [
        'ease-in-out',
        'cubic-bezier(0.4, 0, 0.2, 1)',
        'cubic-bezier(0.65, 0, 0.35, 1)',
        'cubic-bezier(0.33, 1, 0.68, 1)',
    ];

    return {
        duration: rng.float(2, 8),
        delay: rng.float(0, 2),
        easing: rng.pick(easings),
        direction: rng.pick(['normal', 'reverse', 'alternate'] as const),
    };
}

// ============================================
// GENERATE UNIQUE SEED
// ============================================

export function generateSeed(): number {
    return Math.floor(Math.random() * 2147483647);
}

export function seedFromString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}
