"use client";

import React, { useEffect, useRef } from "react";

interface Particle {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    color: string;
    alpha: number;
    decay: number;
    size: number;
    gravity: number;
    friction: number;
    type: "spark" | "willow";
    shimmer?: boolean;
}

interface SmokeParticle {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    radius: number;
    maxRadius: number;
    alpha: number;
    decay: number;
    color: string;
}

interface AmbientFlash {
    x: number;
    y: number;
    z: number;
    color: string;
    radius: number;
    alpha: number;
    decay: number;
}

interface FireworkSpark {
    x: number;
    y: number;
    z: number;
    targetY: number;
    vy: number;
    color: string;
    exploded: boolean;
}

export function FireworksCanvas({ active = true }: { active?: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const sparksRef = useRef<FireworkSpark[]>([]);
    const smokeRef = useRef<SmokeParticle[]>([]);
    const flashesRef = useRef<AmbientFlash[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Resize handler
        const resizeCanvas = () => {
            const rect = canvas.parentElement?.getBoundingClientRect();
            canvas.width = (rect?.width || window.innerWidth) * window.devicePixelRatio;
            canvas.height = (rect?.height || 280) * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            canvas.style.width = "100%";
            canvas.style.height = "100%";
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        // Perspective Constants
        const FOV = 350;

        // Atmospheric Wind
        const WIND_X = 0.05;  // Very gentle drift to the right
        const WIND_Y = -0.005; // Faint upward draft

        // Thematic Juneteenth Colors:
        // - Gold (#D4AF37) & Green (#10B981) for the platform & Pan-African cultural roots
        // - Red (#FF2D2D), Blue (#3B82F6) & White (#FFFFFF) for the official Juneteenth Freedom Flag
        const getThematicColor = (): string => {
            const index = Math.floor(Math.random() * 5);
            if (index === 0) return "#D4AF37"; // Gold
            if (index === 1) return "#FF2D2D"; // Red
            if (index === 2) return "#3B82F6"; // Blue
            if (index === 3) return "#FFFFFF"; // White
            return "#10B981"; // Green
        };

        const getLogicalWidth = () => canvas.width / window.devicePixelRatio;
        const getLogicalHeight = () => canvas.height / window.devicePixelRatio;

        // Spawn a shooting star rising from the bottom
        const spawnFirework = (x?: number, targetY?: number, overrideColor?: string) => {
            const w = getLogicalWidth();
            const h = getLogicalHeight();
            
            // Constrain auto-spawns to sides (left 24% or right 24%) to keep center text 100% readable
            let startX: number;
            if (x !== undefined) {
                startX = x;
            } else {
                const side = Math.random() < 0.5 ? "left" : "right";
                if (side === "left") {
                    startX = Math.random() * (w * 0.24);
                } else {
                    startX = w * 0.76 + Math.random() * (w * 0.24);
                }
            }

            const finalY = targetY !== undefined ? targetY : h * 0.15 + Math.random() * h * 0.35;
            const color = overrideColor || getThematicColor();

            sparksRef.current.push({
                x: startX,
                y: h + 10,
                z: -50 + Math.random() * 100,
                targetY: finalY,
                vy: -(3.0 + Math.random() * 2.5), // Slower, realistic ascent
                color,
                exploded: false
            });
        };

        // Create 3D thematic star/nova explosion particles
        const createThematicExplosion = (x: number, y: number, z: number, color: string) => {
            // 1. Spawn Ambient Sky Flash (barely perceptible glow)
            flashesRef.current.push({
                x,
                y,
                z,
                color,
                radius: 180 + Math.random() * 100,
                alpha: 0.08, // Very subtle flash
                decay: 0.04
            });

            // 2. Spawn Volumetric Smoke Particles (fewer and smaller)
            const smokeCount = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < smokeCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 12;
                const sx = x + Math.cos(angle) * distance;
                const sy = y + Math.sin(angle) * distance;
                
                const speed = 0.1 + Math.random() * 0.25;
                const svx = Math.cos(angle) * speed;
                const svy = Math.sin(angle) * speed - 0.05;
                const svz = (Math.random() - 0.5) * 0.2;

                smokeRef.current.push({
                    x: sx,
                    y: sy,
                    z,
                    vx: svx,
                    vy: svy,
                    vz: svz,
                    radius: 8 + Math.random() * 6,
                    maxRadius: 28 + Math.random() * 16,
                    alpha: 0.08 + Math.random() * 0.04, // Extremely faint smoke
                    decay: 0.0015 + Math.random() * 0.0015,
                    color
                });
            }

            // 3. Spawn surrounding flying sparks
            const particleCount = 20 + Math.floor(Math.random() * 12);
            for (let i = 0; i < particleCount; i++) {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(Math.random() * 2 - 1);
                const force = 0.8 + Math.random() * 2.8;
                
                const isWillowDebris = Math.random() < 0.45;

                particlesRef.current.push({
                    x,
                    y,
                    z,
                    vx: Math.sin(phi) * Math.cos(theta) * force,
                    vy: Math.sin(phi) * Math.sin(theta) * force - 0.1,
                    vz: Math.cos(phi) * force,
                    // White-hot core or thematic color
                    color: Math.random() < 0.2 ? "#FFFFFF" : color,
                    alpha: 0.95,
                    decay: isWillowDebris ? 0.008 + Math.random() * 0.008 : 0.015 + Math.random() * 0.015,
                    size: isWillowDebris ? 0.8 + Math.random() * 0.6 : 1.2 + Math.random() * 1.0,
                    gravity: isWillowDebris ? 0.03 + Math.random() * 0.02 : 0.016 + Math.random() * 0.016,
                    friction: isWillowDebris ? 0.94 : 0.96,
                    type: isWillowDebris ? "willow" : "spark",
                    shimmer: isWillowDebris ? Math.random() < 0.8 : Math.random() < 0.2
                });
            }
        };

        // Click on parent container to spawn firework at depth z=0
        const handleParentClick = (e: MouseEvent) => {
            const parent = canvas.parentElement;
            if (!parent) return;
            const rect = parent.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            
            const color = getThematicColor();
            createThematicExplosion(clickX, clickY, 0, color);
            spawnFirework(clickX, clickY, color);
        };

        const parent = canvas.parentElement;
        if (parent) {
            parent.addEventListener("click", handleParentClick);
        }

        let animationFrameId: number;
        let lastSpawnTime = 0;

        // Main animation loop
        const tick = (timestamp: number) => {
            if (!active) return;

            const w = getLogicalWidth();
            const h = getLogicalHeight();
            const cx = w / 2;
            const cy = h / 2;

            // Draw a semi-transparent black overlay for motion trails
            ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
            ctx.fillRect(0, 0, w, h);

            // Auto-spawn fireworks periodically (slowed down drastically for a quiet background)
            if (timestamp - lastSpawnTime > 8000 + Math.random() * 8000) {
                spawnFirework();
                lastSpawnTime = timestamp;
            }

            // 1. Draw global ambient flashes
            const activeFlashes: AmbientFlash[] = [];
            for (const f of flashesRef.current) {
                f.alpha -= f.decay;
                if (f.alpha > 0) {
                    const scale = FOV / (FOV + f.z);
                    if (scale > 0) {
                        const projectedX = cx + (f.x - cx) * scale;
                        const projectedY = cy + (f.y - cy) * scale;
                        const radius = f.radius * scale;

                        ctx.save();
                        ctx.globalAlpha = f.alpha;
                        
                        const grad = ctx.createRadialGradient(
                            projectedX, projectedY, 0,
                            projectedX, projectedY, radius
                        );
                        
                        let rgb = "255, 255, 255";
                        if (f.color === "#D4AF37") rgb = "212, 175, 55";
                        else if (f.color === "#FF2D2D") rgb = "255, 45, 45";
                        else if (f.color === "#3B82F6") rgb = "59, 130, 246";
                        else if (f.color === "#FFFFFF") rgb = "255, 255, 255";
                        else if (f.color === "#10B981") rgb = "16, 185, 129";

                        grad.addColorStop(0, `rgba(${rgb}, 0.08)`); // Barely visible atmospheric glow
                        grad.addColorStop(1, `rgba(${rgb}, 0)`);

                        ctx.beginPath();
                        ctx.arc(projectedX, projectedY, radius, 0, Math.PI * 2);
                        ctx.fillStyle = grad;
                        ctx.fill();
                        ctx.restore();
                    }
                    activeFlashes.push(f);
                }
            }
            flashesRef.current = activeFlashes;

            // 2. Draw volumetric smoke particles (high performance, no canvas filters)
            const activeSmoke: SmokeParticle[] = [];
            for (const s of smokeRef.current) {
                s.vx += WIND_X * 0.01 + (Math.random() - 0.5) * 0.005;
                s.vy += WIND_Y * 0.01 + (Math.random() - 0.5) * 0.005;
                s.vx *= 0.98;
                s.vy *= 0.98;
                s.vz *= 0.98;
                
                s.x += s.vx;
                s.y += s.vy;
                s.z += s.vz;
                
                s.alpha -= s.decay;
                s.radius += (s.maxRadius - s.radius) * 0.015;

                if (s.alpha > 0) {
                    const scale = FOV / (FOV + s.z);
                    if (scale > 0) {
                        const projectedX = cx + (s.x - cx) * scale;
                        const projectedY = cy + (s.y - cy) * scale;
                        const radius = s.radius * scale;

                        ctx.save();
                        ctx.globalAlpha = s.alpha;

                        // Draw a single very soft radial gradient (no multiple drawing, no filters = fast!)
                        const grad = ctx.createRadialGradient(
                            projectedX, projectedY, 0,
                            projectedX, projectedY, radius
                        );

                        // Mix color to dark gray/charcoal
                        let rgbStart = "30, 30, 32";
                        if (s.color === "#D4AF37") rgbStart = "90, 80, 60";
                        else if (s.color === "#FF2D2D") rgbStart = "90, 40, 40";
                        else if (s.color === "#3B82F6") rgbStart = "40, 60, 90";
                        else if (s.color === "#FFFFFF") rgbStart = "90, 90, 90";
                        else if (s.color === "#10B981") rgbStart = "30, 80, 55";

                        const parts = rgbStart.split(",");
                        const lifePct = Math.max(0, Math.min(1, s.alpha / 0.12));
                        const r = Math.round(20 * (1 - lifePct) + parseInt(parts[0]) * lifePct);
                        const g = Math.round(20 * (1 - lifePct) + parseInt(parts[1]) * lifePct);
                        const b = Math.round(22 * (1 - lifePct) + parseInt(parts[2]) * lifePct);

                        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.06)`);
                        grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.02)`);
                        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

                        ctx.beginPath();
                        ctx.arc(projectedX, projectedY, radius, 0, Math.PI * 2);
                        ctx.fillStyle = grad;
                        ctx.fill();
                        ctx.restore();
                    }
                    activeSmoke.push(s);
                }
            }
            smokeRef.current = activeSmoke;

            // 3. Update & draw rising shooting star rockets
            const activeSparks: FireworkSpark[] = [];
            for (const spark of sparksRef.current) {
                spark.x += (Math.random() - 0.5) * 0.3;
                spark.y += spark.vy;

                // Spawn trace smoke behind rising rocket
                if (Math.random() < 0.12) {
                    smokeRef.current.push({
                        x: spark.x,
                        y: spark.y,
                        z: spark.z,
                        vx: (Math.random() - 0.5) * 0.05,
                        vy: 0.1,
                        vz: 0,
                        radius: 3,
                        maxRadius: 12 + Math.random() * 6,
                        alpha: 0.08,
                        decay: 0.015,
                        color: spark.color
                    });
                }

                const scale = FOV / (FOV + spark.z);
                if (scale > 0) {
                    const projectedX = cx + (spark.x - cx) * scale;
                    const projectedY = cy + (spark.y - cy) * scale;

                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(projectedX, projectedY);
                    
                    const tailX = projectedX + (Math.random() - 0.5) * 1.5;
                    const tailY = projectedY - (spark.vy * scale * 1.4);
                    ctx.lineTo(tailX, tailY);
                    
                    const grad = ctx.createLinearGradient(projectedX, projectedY, tailX, tailY);
                    grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
                    grad.addColorStop(0.4, spark.color);
                    grad.addColorStop(1, "rgba(0,0,0,0)");
                    
                    ctx.strokeStyle = grad;
                    ctx.lineWidth = 1.6 * scale;
                    ctx.lineCap = "round";
                    ctx.stroke();
                    ctx.restore();
                }

                if (spark.y <= spark.targetY && !spark.exploded) {
                    createThematicExplosion(spark.x, spark.y, spark.z, spark.color);
                    spark.exploded = true;
                }

                if (!spark.exploded && spark.y > 0) {
                    activeSparks.push(spark);
                }
            }
            sparksRef.current = activeSparks;

            // 4. Update & draw 3D explosion sparks
            const activeParticles: Particle[] = [];
            for (const p of particlesRef.current) {
                p.vx *= p.friction;
                p.vy *= p.friction;
                p.vz *= p.friction;
                p.vy += p.gravity;
                
                // Wind drift
                p.vx += WIND_X * 0.02;
                p.vy += WIND_Y * 0.02;

                p.x += p.vx;
                p.y += p.vy;
                p.z += p.vz;
                p.alpha -= p.decay;

                const scale = FOV / (FOV + p.z);
                
                if (scale > 0 && p.alpha > 0) {
                    const projectedX = cx + (p.x - cx) * scale;
                    const projectedY = cy + (p.y - cy) * scale;

                    ctx.save();
                    
                    // Shimmer/Twinkle flicker
                    let drawAlpha = p.alpha;
                    if (p.shimmer) {
                        drawAlpha *= 0.35 + Math.random() * 0.65;
                    }
                    ctx.globalAlpha = drawAlpha;

                    const radius = p.size * scale * (p.type === "willow" ? 1.0 : 2.5);
                    
                    // Willow particles leave trailing sub-pixel spark embers
                    if (p.type === "willow" && Math.random() < 0.22) {
                        particlesRef.current.push({
                            x: p.x - p.vx * 0.3,
                            y: p.y - p.vy * 0.3,
                            z: p.z,
                            vx: p.vx * 0.12 + (Math.random() - 0.5) * 0.15,
                            vy: p.vy * 0.12 + Math.random() * 0.1,
                            vz: p.vz * 0.12,
                            color: "#D4AF37",
                            alpha: p.alpha * 0.8,
                            decay: 0.03 + Math.random() * 0.03,
                            size: 0.6 + Math.random() * 0.5,
                            gravity: 0.035,
                            friction: 0.94,
                            type: "spark",
                            shimmer: true
                        });
                    }

                    // Drawing glowing spark (radial halo)
                    const grad = ctx.createRadialGradient(
                        projectedX, projectedY, 0,
                        projectedX, projectedY, radius
                    );

                    let colorGlow = p.color;
                    if (p.color.startsWith("#")) {
                        const rHex = parseInt(p.color.slice(1, 3), 16);
                        const gHex = parseInt(p.color.slice(3, 5), 16);
                        const bHex = parseInt(p.color.slice(5, 7), 16);
                        colorGlow = `rgba(${rHex}, ${gHex}, ${bHex}, 1)`;
                    } else if (!p.color.startsWith("rgba")) {
                        colorGlow = "rgba(255, 255, 255, 1)";
                    }
                    const colorFade = colorGlow.replace("1)", "0)").replace("1.0)", "0)");

                    grad.addColorStop(0, "rgba(255, 255, 255, 1)"); // Hot core
                    grad.addColorStop(0.2, colorGlow);
                    grad.addColorStop(1, colorFade);

                    ctx.beginPath();
                    ctx.arc(projectedX, projectedY, radius, 0, Math.PI * 2);
                    ctx.fillStyle = grad;
                    ctx.fill();
                    
                    ctx.restore();
                    activeParticles.push(p);
                }
            }
            particlesRef.current = activeParticles;

            animationFrameId = requestAnimationFrame(tick);
        };

        animationFrameId = requestAnimationFrame(tick);

        // Cleanup
        return () => {
            window.removeEventListener("resize", resizeCanvas);
            if (parent) {
                parent.removeEventListener("click", handleParentClick);
            }
            cancelAnimationFrame(animationFrameId);
        };
    }, [active]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none mix-blend-screen"
            style={{ display: "block", zIndex: 0 }}
        />
    );
}
