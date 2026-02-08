import { useEffect, useRef, useMemo } from 'react';
import { SeededRandom, getParticlesForMood, RoomMood } from '../utils/procedural';

interface Particle {
    x: number;
    y: number;
    size: number;
    speed: number;
    opacity: number;
    angle: number;
    wobble: number;
}

interface ProceduralBackgroundProps {
    mood: RoomMood;
    seed: number;
    className?: string;
}

export function ProceduralBackground({ mood, seed, className = '' }: ProceduralBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();
    const particlesRef = useRef<Particle[]>([]);

    const config = useMemo(() => {
        const rng = new SeededRandom(seed);
        return getParticlesForMood(mood, rng);
    }, [mood, seed]);

    // Initialize particles
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rng = new SeededRandom(seed + 1000);
        const particles: Particle[] = [];

        for (let i = 0; i < config.count; i++) {
            particles.push({
                x: rng.float(0, canvas.width),
                y: rng.float(0, canvas.height),
                size: rng.float(config.sizeRange[0], config.sizeRange[1]),
                speed: rng.float(config.speedRange[0], config.speedRange[1]),
                opacity: rng.float(config.opacityRange[0], config.opacityRange[1]),
                angle: rng.float(0, Math.PI * 2),
                wobble: rng.float(0, Math.PI * 2),
            });
        }

        particlesRef.current = particles;
    }, [config, seed]);

    // Animation loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Handle resize
        const handleResize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        let time = 0;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            time += 0.016; // ~60fps

            particlesRef.current.forEach(particle => {
                // Update position based on particle type
                switch (config.type) {
                    case 'dust':
                        particle.y -= particle.speed * 0.5;
                        particle.x += Math.sin(time + particle.wobble) * 0.5;
                        break;
                    case 'fog':
                        particle.x += Math.sin(time * 0.5 + particle.wobble) * particle.speed;
                        particle.y += Math.cos(time * 0.3 + particle.wobble) * particle.speed * 0.5;
                        break;
                    case 'spark':
                        particle.y -= particle.speed;
                        particle.x += Math.sin(time * 2 + particle.wobble) * 0.8;
                        particle.opacity = 0.3 + Math.sin(time * 4 + particle.wobble) * 0.3;
                        break;
                    case 'snow':
                        particle.y += particle.speed;
                        particle.x += Math.sin(time + particle.wobble) * 0.3;
                        break;
                }

                // Wrap around screen
                if (particle.y < -particle.size) particle.y = canvas.height + particle.size;
                if (particle.y > canvas.height + particle.size) particle.y = -particle.size;
                if (particle.x < -particle.size) particle.x = canvas.width + particle.size;
                if (particle.x > canvas.width + particle.size) particle.x = -particle.size;

                // Draw particle
                ctx.beginPath();

                if (config.type === 'fog') {
                    // Fog is drawn as blurry circles
                    const gradient = ctx.createRadialGradient(
                        particle.x, particle.y, 0,
                        particle.x, particle.y, particle.size
                    );
                    gradient.addColorStop(0, `${config.color}${Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')}`);
                    gradient.addColorStop(1, 'transparent');
                    ctx.fillStyle = gradient;
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    ctx.fill();
                } else if (config.type === 'spark') {
                    // Sparks have a glow effect
                    ctx.shadowBlur = particle.size * 2;
                    ctx.shadowColor = config.color;
                    ctx.fillStyle = config.color;
                    ctx.globalAlpha = particle.opacity;
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.globalAlpha = 1;
                } else {
                    // Regular particles
                    ctx.fillStyle = config.color;
                    ctx.globalAlpha = particle.opacity;
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [config]);

    return (
        <canvas
            ref={canvasRef}
            className={`procedural-background ${className}`}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
            }}
        />
    );
}

// Lightning effect component
interface LightningEffectProps {
    active: boolean;
    seed: number;
}

export function LightningEffect({ active, seed }: LightningEffectProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!active) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rng = new SeededRandom(seed);

        const drawLightning = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;

            // Flash effect
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw lightning bolt
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ffffff';
            ctx.beginPath();

            let x = rng.float(canvas.width * 0.3, canvas.width * 0.7);
            let y = 0;
            ctx.moveTo(x, y);

            while (y < canvas.height * 0.7) {
                x += rng.float(-30, 30);
                y += rng.float(20, 50);
                ctx.lineTo(x, y);

                // Branch
                if (rng.chance(0.3)) {
                    const branchX = x + rng.float(-50, 50);
                    const branchY = y + rng.float(30, 60);
                    ctx.moveTo(x, y);
                    ctx.lineTo(branchX, branchY);
                    ctx.moveTo(x, y);
                }
            }

            ctx.stroke();

            // Fade out
            setTimeout(() => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }, 100);
        };

        // Random lightning strikes
        const strike = () => {
            if (rng.chance(0.1)) {
                drawLightning();
            }
            setTimeout(strike, rng.int(3000, 8000));
        };

        const timeout = setTimeout(strike, rng.int(1000, 3000));

        return () => clearTimeout(timeout);
    }, [active, seed]);

    if (!active) return null;

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 10,
            }}
        />
    );
}
