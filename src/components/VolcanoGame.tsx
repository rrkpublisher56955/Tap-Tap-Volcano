import { useEffect, useRef, useState, useCallback } from "react";
import { sound } from "../lib/audio";
import { type CharacterSkin } from "../lib/skins";
import {
  TypeSafeSystemOneDirector,
  type TypeSafeRunEvaluation,
  type ClimbSessionTelemetry,
  type PacingModeOption,
} from "../lib/typesafe-director";
import { ytPlayables } from "../lib/yt-playables";
import {
  Flame,
  Trophy,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Zap,
  Shield,
  BrainCircuit,
} from "lucide-react";

export type PlatformType = "normal" | "bounce" | "double" | "freeze" | "anchor";

export interface Platform {
  id: number;
  x: number;
  y: number;
  w: number;
  createdAt: number;
  life: number;
  type: PlatformType;
  used?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  rot?: number;
  vRot?: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

interface LightningArc {
  segments: { x: number; y: number }[];
  alpha: number;
  createdAt: number;
}

const W = 420;
const H = 680;
const GRAVITY = 0.52;
const MOVE_SPEED = 3.8;
const JUMP_FORCE = -11.2;
const BOUNCE_FORCE = -18.2;
const DOUBLE_JUMP_FORCE = -12.6;
const PLATFORM_W = 74;
const PLATFORM_H = 13;
const PLAYER_W = 24;
const PLAYER_H = 30;
const PLATFORM_LIFE_NORMAL = 2600;
const HIGH_SCORE_KEY = "ttv_highscore_v2";

interface VolcanoGameProps {
  activeSkin: CharacterSkin;
  onOpenTelemetry?: () => void;
  onTelemetryUpdate?: (evalData: TypeSafeRunEvaluation, telem: ClimbSessionTelemetry) => void;
  onPacingUpdate?: (pacing: PacingModeOption, streak: number) => void;
}

export function VolcanoGame({
  activeSkin,
  onOpenTelemetry,
  onTelemetryUpdate,
  onPacingUpdate,
}: VolcanoGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPausedRef = useRef(false);

  // Live game state reference for high-frequency physics loop (zero React re-render overhead)
  const stateRef = useRef({
    px: W / 2 - PLAYER_W / 2,
    py: H - 140,
    vx: 0,
    vy: 0,
    scaleX: 1,
    scaleY: 1,
    tilt: 0,
    walkFrame: 0,
    onGround: false,
    doubleAvail: false,
    doubleUsed: false,
    freezeUntil: 0, // Cryo freeze timestamp
    shakeIntensity: 0,
    platforms: [] as Platform[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    lightningArcs: [] as LightningArc[],
    lavaY: H,
    cameraY: 0,
    height: 0,
    best: 0,
    keys: { left: false, right: false },
    gameOver: false,
    startTime: 0,
    blocksPlaced: 0,
    powerUpsAcquired: 0,
    doubleJumpsTriggered: 0,
    consecutiveStreak: 0,
    lastPlaceTime: 0,
    pidCounter: 1,
    blinkTimer: 0,
    isBlinking: false,
    pacingMode: "measured_ascent" as PacingModeOption,
    isClutchActive: false,
  });

  const [hud, setHud] = useState({
    height: 0,
    best: 0,
    gameOver: false,
    doubleAvail: false,
    isFrozen: false,
    streak: 0,
    biomeName: "Caldera Floor",
    pacingMode: "measured_ascent" as PacingModeOption,
  });

  const [runEvaluation, setRunEvaluation] = useState<TypeSafeRunEvaluation | null>(null);

  // Load high score
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HIGH_SCORE_KEY);
      const val = saved ? parseInt(saved, 10) : 0;
      if (Number.isFinite(val) && val > 0) {
        stateRef.current.best = val;
        setHud((h) => ({ ...h, best: val }));
      }
    } catch {
      /* ignore storage read error */
    }
  }, []);

  // YouTube Playables pause/resume hooks
  useEffect(() => {
    const unpause = ytPlayables.onPause(() => {
      isPausedRef.current = true;
    });
    const unresume = ytPlayables.onResume(() => {
      isPausedRef.current = false;
    });
    return () => {
      unpause();
      unresume();
    };
  }, []);

  const spawnParticles = useCallback(
    (x: number, y: number, color: string, count = 8, speed = 2.5, isRockFragment = false) => {
      const pList = stateRef.current.particles;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const mag = (Math.random() * 0.7 + 0.3) * speed;
        pList.push({
          x,
          y,
          vx: Math.cos(angle) * mag,
          vy: Math.sin(angle) * mag - (isRockFragment ? 0.5 : 1.2),
          color,
          size: isRockFragment ? Math.random() * 4 + 2 : Math.random() * 3 + 1.5,
          alpha: 1,
          life: 0,
          maxLife: isRockFragment ? Math.random() * 35 + 25 : Math.random() * 25 + 18,
          rot: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.2,
        });
      }
    },
    [],
  );

  const addFloatingText = useCallback((x: number, y: number, text: string, color = "#fbbf24") => {
    stateRef.current.floatingTexts.push({
      id: Math.random(),
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -1.2,
    });
  }, []);

  const triggerCameraShake = useCallback((intensity = 6) => {
    stateRef.current.shakeIntensity = intensity;
  }, []);

  // Reset & start run
  const reset = useCallback(() => {
    const s = stateRef.current;
    const now = performance.now();
    s.px = W / 2 - PLAYER_W / 2;
    s.py = H - 140;
    s.vx = 0;
    s.vy = 0;
    s.scaleX = 1;
    s.scaleY = 1;
    s.tilt = 0;
    s.walkFrame = 0;
    s.onGround = false;
    s.doubleAvail = false;
    s.doubleUsed = false;
    s.freezeUntil = 0;
    s.shakeIntensity = 0;
    s.particles = [];
    s.floatingTexts = [];
    s.lightningArcs = [];
    s.platforms = [
      {
        id: s.pidCounter++,
        x: W / 2 - 75,
        y: H - 90,
        w: 150,
        createdAt: now + 999999,
        life: 999999,
        type: "normal",
      },
    ];
    s.lavaY = H;
    s.cameraY = 0;
    s.height = 0;
    s.gameOver = false;
    s.startTime = now;
    s.blocksPlaced = 0;
    s.powerUpsAcquired = 0;
    s.doubleJumpsTriggered = 0;
    s.consecutiveStreak = 0;
    s.lastPlaceTime = 0;
    s.pacingMode = "measured_ascent";
    s.isClutchActive = false;

    setHud({
      height: 0,
      best: s.best,
      gameOver: false,
      doubleAvail: false,
      isFrozen: false,
      streak: 0,
      biomeName: "Caldera Floor",
      pacingMode: "measured_ascent",
    });
    setRunEvaluation(null);

    if (onPacingUpdate) {
      onPacingUpdate("measured_ascent", 0);
    }
  }, [onPacingUpdate]);

  // Pick platform type based on climb height & TypeSafe System One Dynamic Director
  const pickPlatformType = useCallback(
    (height: number, isClutch: boolean, pacing: PacingModeOption): PlatformType => {
      const roll = Math.random();
      // Below 20m: pure normal platforms to establish cadence
      if (height < 20) return "normal";

      // Query dynamic weights from TypeSafe S1 Director
      const telemetry: ClimbSessionTelemetry = {
        climbHeightMeters: height,
        runDurationSeconds: Math.floor((performance.now() - stateRef.current.startTime) / 1000),
        tapFrequencyPerSec:
          stateRef.current.blocksPlaced /
          Math.max(1, (performance.now() - stateRef.current.startTime) / 1000),
        averageVelocityY: stateRef.current.vy,
        distanceToLavaMeters: Math.max(
          0,
          (stateRef.current.lavaY - (stateRef.current.py + PLAYER_H)) / 10,
        ),
        crumbleStressCount: stateRef.current.blocksPlaced,
        powerUpsAcquired: stateRef.current.powerUpsAcquired,
        doubleJumpsTriggered: stateRef.current.doubleJumpsTriggered,
        consecutiveQuickPlacements: stateRef.current.consecutiveStreak,
      };

      const weights = TypeSafeSystemOneDirector.computeDynamicWeights(
        telemetry,
        isClutch,
        pacing,
      );

      if (roll < weights.bounceChance) return "bounce";
      if (roll < weights.bounceChance + weights.doubleChance) return "double";
      if (roll < weights.bounceChance + weights.doubleChance + weights.freezeChance) return "freeze";
      if (
        roll <
        weights.bounceChance + weights.doubleChance + weights.freezeChance + weights.anchorChance
      ) {
        return "anchor";
      }
      return "normal";
    },
    [],
  );

  // Place platform directly beneath climber
  const placePlatform = useCallback(() => {
    const s = stateRef.current;
    if (s.gameOver || isPausedRef.current) return;

    const now = performance.now();
    const type = pickPlatformType(s.height, s.isClutchActive, s.pacingMode);
    const width = type === "anchor" ? PLATFORM_W * 1.35 : PLATFORM_W;
    const lifeTime = type === "anchor" ? 4800 : PLATFORM_LIFE_NORMAL;

    s.platforms.push({
      id: s.pidCounter++,
      x: s.px + PLAYER_W / 2 - width / 2,
      y: s.py + PLAYER_H + 2,
      w: width,
      createdAt: now,
      life: lifeTime,
      type,
    });

    s.blocksPlaced++;

    // Combo streak calculation
    if (s.lastPlaceTime > 0 && now - s.lastPlaceTime < 950) {
      s.consecutiveStreak++;
      if (s.consecutiveStreak >= 3 && s.consecutiveStreak % 2 === 1) {
        addFloatingText(
          s.px,
          s.py - 10,
          `${s.consecutiveStreak}× FLOW`,
          s.consecutiveStreak > 6 ? "#38bdf8" : "#fbbf24",
        );
      }
    } else {
      s.consecutiveStreak = 1;
    }
    s.lastPlaceTime = now;

    // Tactile Audio feedback
    sound.playPlacePlatform();

    // Squash on placement (Apple fluid motion spring response)
    s.scaleY = 0.88;
    s.scaleX = 1.12;

    // Platform placement sparks
    spawnParticles(s.px + PLAYER_W / 2, s.py + PLAYER_H + 2, activeSkin.trailColor, 5, 2.0);

    // Limit active platforms in memory
    if (s.platforms.length > 130) {
      s.platforms.splice(0, s.platforms.length - 130);
    }
  }, [pickPlatformType, spawnParticles, addFloatingText, activeSkin.trailColor]);

  // Handle tap interaction (Mobile touch / Mouse click / Space bar)
  const handleTap = useCallback(() => {
    const s = stateRef.current;
    if (s.gameOver || isPausedRef.current) return;

    // If airborne with double jump power-up available, fire double jump!
    if (!s.onGround && s.doubleAvail && !s.doubleUsed) {
      s.vy = DOUBLE_JUMP_FORCE;
      s.doubleUsed = true;
      s.doubleAvail = false;
      s.doubleJumpsTriggered++;
      sound.playDoubleJump();
      triggerCameraShake(4);
      spawnParticles(s.px + PLAYER_W / 2, s.py + PLAYER_H, "#60a5fa", 16, 4.0);
      addFloatingText(s.px, s.py - 12, "2× BOOST!", "#60a5fa");
      setHud((h) => ({ ...h, doubleAvail: false }));
      return;
    }

    placePlatform();
  }, [placePlatform, spawnParticles, addFloatingText, triggerCameraShake]);

  // Main high-performance game loop with Retina canvas
  useEffect(() => {
    reset();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Support Retina scaling up to 3x for 8K-sharp rendering
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    // Signal YouTube Playables that first frame is rendered
    ytPlayables.notifyFirstFrameReady();
    ytPlayables.notifyGameReady();

    // Keyboard controls
    const onKey = (e: KeyboardEvent, isDown: boolean) => {
      const s = stateRef.current;
      if (e.code === "ArrowLeft" || e.code === "KeyA") s.keys.left = isDown;
      if (e.code === "ArrowRight" || e.code === "KeyD") s.keys.right = isDown;
      if (isDown && (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW")) {
        e.preventDefault();
        handleTap();
      }
      if (isDown && e.code === "Enter" && s.gameOver) {
        reset();
      }
    };

    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    // Pointer down with instant feedback (Apple response-first principle)
    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      if (s.gameOver) return;
      handleTap();
    };

    canvas.addEventListener("pointerdown", onPointerDown);

    let rafId = 0;
    let lastTime = performance.now();
    let lastTelemetryPush = 0;
    let lastHudPush = 0;
    let nextLightningTime = performance.now() + 5000;

    const gameLoop = (now: number) => {
      const dt = Math.min(32, now - lastTime);
      lastTime = now;
      const s = stateRef.current;

      if (!s.gameOver && !isPausedRef.current) {
        // Horizontal steering with running gait cycle
        if (s.keys.left) {
          s.vx = -MOVE_SPEED;
          s.tilt = -0.15;
          s.walkFrame += dt * 0.015;
        } else if (s.keys.right) {
          s.vx = MOVE_SPEED;
          s.tilt = 0.15;
          s.walkFrame += dt * 0.015;
        } else {
          s.vx *= 0.82;
          s.tilt *= 0.8;
          s.walkFrame *= 0.8;
        }

        // Vertical gravity
        s.vy += GRAVITY;
        if (s.vy > 14.5) s.vy = 14.5;

        // Position update
        s.px += s.vx;
        s.py += s.vy;

        // Screen boundary wrap
        if (s.px < -PLAYER_W) s.px = W;
        if (s.px > W) s.px = -PLAYER_W;

        // Spring restoration for character squash & stretch
        s.scaleX += (1 - s.scaleX) * 0.18;
        s.scaleY += (1 - s.scaleY) * 0.18;

        // Camera shake decay
        if (s.shakeIntensity > 0) {
          s.shakeIntensity *= 0.88;
          if (s.shakeIntensity < 0.1) s.shakeIntensity = 0;
        }

        // Eye blinking animation
        s.blinkTimer += dt;
        if (s.blinkTimer > 2800) {
          s.isBlinking = true;
          if (s.blinkTimer > 2940) {
            s.isBlinking = false;
            s.blinkTimer = 0;
          }
        }

        // Platform collision detection (when descending)
        s.onGround = false;
        if (s.vy >= 0) {
          for (const p of s.platforms) {
            const withinX = s.px + PLAYER_W > p.x && s.px < p.x + p.w;
            const feet = s.py + PLAYER_H;
            const prevFeet = feet - s.vy;

            if (withinX && prevFeet <= p.y + 2 && feet >= p.y && feet <= p.y + PLATFORM_H + 9) {
              s.py = p.y - PLAYER_H;

              // Handle platform types
              if (p.type === "bounce") {
                s.vy = BOUNCE_FORCE;
                s.scaleY = 0.65;
                s.scaleX = 1.35;
                sound.playBounce();
                triggerCameraShake(8);
                spawnParticles(p.x + p.w / 2, p.y, "#4ade80", 16, 4.0);
                addFloatingText(s.px, s.py - 14, "BOUNCE!", "#4ade80");
                s.powerUpsAcquired++;
              } else if (p.type === "freeze") {
                s.vy = JUMP_FORCE;
                s.scaleY = 0.8;
                s.scaleX = 1.2;
                s.freezeUntil = now + 3500;
                sound.playFreeze();
                triggerCameraShake(4);
                spawnParticles(p.x + p.w / 2, p.y, "#38bdf8", 20, 4.0);
                addFloatingText(s.px, s.py - 14, "FROZEN 3.5s!", "#38bdf8");
                s.powerUpsAcquired++;
              } else {
                s.vy = JUMP_FORCE;
                s.scaleY = 0.82;
                s.scaleX = 1.18;
                sound.playJump();
              }

              if (p.type === "double") {
                s.doubleAvail = true;
                s.powerUpsAcquired++;
                spawnParticles(p.x + p.w / 2, p.y, "#60a5fa", 12, 3.0);
              }

              p.used = true;
              s.doubleUsed = false;
              s.onGround = true;
              break;
            }
          }
        }

        // Smooth camera follow (Apple critically damped spring)
        const targetCam = Math.min(0, s.py - H * 0.44);
        if (targetCam < s.cameraY) {
          s.cameraY += (targetCam - s.cameraY) * 0.16;
        }

        // Height calculation (meters)
        const currentMeters = Math.max(0, Math.floor((H - 140 - s.py) / 9.5));
        if (currentMeters > s.height) s.height = currentMeters;
        if (currentMeters > s.best) {
          s.best = currentMeters;
          try {
            localStorage.setItem(HIGH_SCORE_KEY, String(currentMeters));
          } catch {
            /* ignore storage write error */
          }
          ytPlayables.sendScore(currentMeters);
        }

        // Volcanic Lightning generator for high biomes (150m+)
        if (s.height >= 150 && now > nextLightningTime) {
          nextLightningTime = now + 4000 + Math.random() * 5000;
          generateLightningArc(s.lightningArcs, W, H, s.cameraY);
        }

        // Lava pacing curve: Calm start -> Frantic finish
        const isFrozen = s.freezeUntil > now;
        if (!isFrozen) {
          const elapsedSec = (now - s.startTime) / 1000;
          const baseSpeed = 0.24 + elapsedSec * 0.007;
          const heightBoost = s.height * 0.0055;

          // Apply dynamic clutch rescue speed dampening if player is close to magma
          const clutchMultiplier = s.isClutchActive ? 0.85 : 1.0;
          const lavaSpeed = Math.min(1.68, (baseSpeed + heightBoost) * clutchMultiplier);
          s.lavaY -= lavaSpeed * (dt / 16);

          // Lava floor cannot lag infinitely below player
          const maxLavaDistance = s.py + H * 0.76;
          if (s.lavaY > maxLavaDistance) s.lavaY = maxLavaDistance;
        }

        // Crumble platforms when time expires
        s.platforms = s.platforms.filter((p) => {
          const age = now - p.createdAt;
          if (age >= p.life) {
            // Disintegrate particles with rock fragments
            spawnParticles(p.x + p.w / 2, p.y + PLATFORM_H / 2, "#78350f", 8, 2.5, true);
            sound.playCrumble();
            return false;
          }
          // Remove if engulfed in lava or far off screen
          return p.y < s.lavaY + 60 && p.y > s.py - H * 2.5;
        });

        // Game Over condition: player submerged in lava
        if (s.py + PLAYER_H >= s.lavaY - 4) {
          s.gameOver = true;
          sound.playGameOver();
          triggerCameraShake(12);
          spawnParticles(s.px + PLAYER_W / 2, s.py + PLAYER_H, "#f97316", 32, 5.0);

          // Report final score to YouTube Playables
          ytPlayables.sendScore(s.height);

          // Generate TypeSafe System One run debrief evaluation
          const finalTelemetry: ClimbSessionTelemetry = {
            climbHeightMeters: s.height,
            runDurationSeconds: Math.floor((now - s.startTime) / 1000),
            tapFrequencyPerSec: s.blocksPlaced / Math.max(1, (now - s.startTime) / 1000),
            averageVelocityY: s.vy,
            distanceToLavaMeters: Math.max(0, (s.lavaY - (s.py + PLAYER_H)) / 10),
            crumbleStressCount: s.blocksPlaced,
            powerUpsAcquired: s.powerUpsAcquired,
            doubleJumpsTriggered: s.doubleJumpsTriggered,
            consecutiveQuickPlacements: s.consecutiveStreak,
          };

          const evaluation = TypeSafeSystemOneDirector.evaluateLiveSession(finalTelemetry);
          setRunEvaluation(evaluation);
          if (onTelemetryUpdate) {
            onTelemetryUpdate(evaluation, finalTelemetry);
          }

          setHud({
            height: s.height,
            best: s.best,
            gameOver: true,
            doubleAvail: false,
            isFrozen: false,
            streak: 0,
            biomeName: getBiomeName(s.height),
            pacingMode: evaluation.pacingMode.selected,
          });
        }

        // Periodic TypeSafe System One background telemetry sampling (every 1.2s)
        if (now - lastTelemetryPush > 1200) {
          lastTelemetryPush = now;
          const liveTelemetry: ClimbSessionTelemetry = {
            climbHeightMeters: s.height,
            runDurationSeconds: Math.floor((now - s.startTime) / 1000),
            tapFrequencyPerSec: s.blocksPlaced / Math.max(1, (now - s.startTime) / 1000),
            averageVelocityY: s.vy,
            distanceToLavaMeters: Math.max(0, (s.lavaY - (s.py + PLAYER_H)) / 10),
            crumbleStressCount: s.blocksPlaced,
            powerUpsAcquired: s.powerUpsAcquired,
            doubleJumpsTriggered: s.doubleJumpsTriggered,
            consecutiveQuickPlacements: s.consecutiveStreak,
          };
          const liveEval = TypeSafeSystemOneDirector.evaluateLiveSession(liveTelemetry);
          s.pacingMode = liveEval.pacingMode.selected;
          s.isClutchActive = liveEval.clutchRescueEligible.isAffirmative;

          if (onTelemetryUpdate) {
            onTelemetryUpdate(liveEval, liveTelemetry);
          }
          if (onPacingUpdate) {
            onPacingUpdate(s.pacingMode, s.consecutiveStreak);
          }
        }

        // Throttled HUD update (smooth 60fps presentation)
        if (now - lastHudPush > 80) {
          lastHudPush = now;
          setHud((prev) => ({
            height: s.height,
            best: s.best,
            gameOver: s.gameOver,
            doubleAvail: s.doubleAvail,
            isFrozen: s.freezeUntil > now,
            streak: s.consecutiveStreak,
            biomeName: getBiomeName(s.height),
            pacingMode: s.pacingMode,
          }));
        }
      }

      // Update particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity
        p.life++;
        p.alpha = 1 - p.life / p.maxLife;
        if (p.rot !== undefined && p.vRot !== undefined) {
          p.rot += p.vRot;
        }
        if (p.life >= p.maxLife) {
          s.particles.splice(i, 1);
        }
      }

      // Update floating texts
      for (let i = s.floatingTexts.length - 1; i >= 0; i--) {
        const ft = s.floatingTexts[i];
        ft.y += ft.vy;
        ft.alpha -= 0.022;
        if (ft.alpha <= 0) {
          s.floatingTexts.splice(i, 1);
        }
      }

      // Update lightning arcs
      for (let i = s.lightningArcs.length - 1; i >= 0; i--) {
        const arc = s.lightningArcs[i];
        arc.alpha -= 0.04;
        if (arc.alpha <= 0) {
          s.lightningArcs.splice(i, 1);
        }
      }

      // ==========================================
      // RENDERING PIPELINE (8K-Quality Museum Aesthetic)
      // ==========================================
      ctx.clearRect(0, 0, W, H);

      // Camera Shake offset
      const shakeX = s.shakeIntensity > 0 ? (Math.random() - 0.5) * s.shakeIntensity : 0;
      const shakeY = s.shakeIntensity > 0 ? (Math.random() - 0.5) * s.shakeIntensity : 0;

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // 1. Dynamic Biome Background Gradient & Atmospheric Plume
      renderBiomeBackground(ctx, s.height, H, W, now);

      // 2. Parallax ambient volcano embers, sulfur mist & heat shimmer
      renderAmbientEmbers(ctx, s.cameraY, now, s.height);

      // 3. Volcanic Lightning Arcs
      renderLightning(ctx, s.lightningArcs);

      ctx.save();
      ctx.translate(0, -s.cameraY);

      // 4. Render Platforms with progressive fracture cracks
      renderPlatforms(ctx, s.platforms, now);

      // 5. Render Player Character with active skin & running locomotion
      renderPlayer(ctx, s, activeSkin, now);

      // 6. Render Particle Sparks & Debris
      for (const p of s.particles) {
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        if (p.rot !== undefined) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // 7. Floating Text Popups
      for (const ft of s.floatingTexts) {
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
        ctx.fillStyle = ft.color;
        ctx.textAlign = "center";
        ctx.fillText(ft.text, ft.x, ft.y);
      }
      ctx.globalAlpha = 1;

      // 8. Dynamic Multi-wave Rising Lava with Molten Core
      renderLava(ctx, s.lavaY, s.freezeUntil > now, now);

      ctx.restore();

      // 9. Proximity Heat Vignette (when lava is close to screen bottom)
      const lavaScreenDist = s.lavaY - s.cameraY;
      if (lavaScreenDist < H + 120) {
        const dangerFactor = Math.min(1, Math.max(0, 1 - (lavaScreenDist - H * 0.4) / (H * 0.6)));
        if (dangerFactor > 0.05) {
          const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.75);
          vig.addColorStop(0, "rgba(239, 68, 68, 0)");
          vig.addColorStop(1, `rgba(220, 38, 38, ${dangerFactor * 0.4})`);
          ctx.fillStyle = vig;
          ctx.fillRect(0, 0, W, H);
        }
      }

      ctx.restore();

      rafId = requestAnimationFrame(gameLoop);
    };

    rafId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      canvas.removeEventListener("pointerdown", onPointerDown);
    };
  }, [
    reset,
    handleTap,
    activeSkin,
    onTelemetryUpdate,
    onPacingUpdate,
    addFloatingText,
    spawnParticles,
    triggerCameraShake,
  ]);

  return (
    <div className="relative w-full max-w-[420px] mx-auto select-none">
      {/* Apple-style Stats Bar */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* Height Meter */}
        <div className="rounded-[18px] bg-[#1d1d1f]/75 backdrop-blur-2xl border border-white/[0.08] border-t-white/[0.14] p-3 shadow-lg">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-0.5">
            <Flame className="w-3 h-3 text-amber-400" />
            Height
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-200 tabular-nums font-mono">
            {hud.height}
            <span className="text-xs text-amber-400/80 ml-0.5">m</span>
          </div>
        </div>

        {/* Best Record */}
        <div className="rounded-[18px] bg-[#1d1d1f]/75 backdrop-blur-2xl border border-white/[0.08] border-t-white/[0.14] p-3 shadow-lg">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-0.5">
            <Trophy className="w-3 h-3 text-amber-300" />
            Best
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white tabular-nums font-mono">
            {hud.best}
            <span className="text-xs text-white/60 ml-0.5">m</span>
          </div>
        </div>

        {/* Status / Power-up State */}
        <div className="rounded-[18px] bg-[#1d1d1f]/75 backdrop-blur-2xl border border-white/[0.08] border-t-white/[0.14] p-3 shadow-lg flex flex-col justify-center text-center">
          {hud.isFrozen ? (
            <div className="text-xs font-bold text-sky-300 flex items-center justify-center gap-1 animate-pulse">
              <Shield className="w-3.5 h-3.5" />
              <span>FROZEN</span>
            </div>
          ) : hud.doubleAvail ? (
            <div className="text-xs font-bold text-sky-400 flex items-center justify-center gap-1 animate-pulse">
              <Zap className="w-3.5 h-3.5" />
              <span>2× JUMP</span>
            </div>
          ) : hud.streak >= 3 ? (
            <div className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{hud.streak}× FLOW</span>
            </div>
          ) : (
            <div className="text-[11px] font-medium text-white/50 truncate">{hud.biomeName}</div>
          )}
        </div>
      </div>

      {/* Main Game Stage */}
      <div className="relative rounded-[24px] overflow-hidden border border-white/[0.12] border-t-white/[0.2] shadow-[0_25px_60px_rgba(0,0,0,0.8)] bg-black">
        <canvas
          ref={canvasRef}
          className="touch-none block w-full h-auto cursor-pointer"
          style={{ aspectRatio: `${W}/${H}` }}
        />

        {/* In-game Tap Prompt (Early run) */}
        {hud.height < 5 && !hud.gameOver && (
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 text-center pointer-events-none animate-bounce">
            <span className="px-4 py-2 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-xs font-medium text-white/95 shadow-2xl">
              Tap anywhere to build platform
            </span>
          </div>
        )}

        {/* Apple-style Game Over Sheet */}
        {hud.gameOver && (
          <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 z-20">
            <div className="w-full max-w-xs rounded-[24px] bg-[#1d1d1f]/95 border border-white/15 p-5 text-center text-white shadow-[0_30px_70px_rgba(0,0,0,0.9)]">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 mx-auto flex items-center justify-center text-rose-400 mb-2.5 shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                <Flame className="w-6 h-6" />
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-white mb-0.5">
                Submerged in Magma
              </h2>
              <p className="text-xs text-white/60 mb-3.5">The caldera claimed your ascent</p>

              {/* Stats pill container */}
              <div className="rounded-xl bg-white/[0.05] border border-white/[0.08] p-3 mb-3 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-white/70">
                  <span>Climb Reached</span>
                  <span className="font-bold font-mono text-base text-amber-300">
                    {hud.height}m
                  </span>
                </div>
                <div className="flex justify-between items-center text-white/70">
                  <span>Personal Best</span>
                  <span className="font-bold font-mono text-white">
                    {hud.best}m
                    {hud.height === hud.best && hud.height > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                        NEW
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center text-white/70">
                  <span>Biome Reached</span>
                  <span className="text-white/90 font-medium">{hud.biomeName}</span>
                </div>
              </div>

              {/* TypeSafe S1 Tactical Debrief Card */}
              {runEvaluation && (
                <div className="rounded-xl bg-sky-950/30 border border-sky-500/25 p-2.5 mb-4 text-left">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-sky-300 uppercase tracking-wider mb-1">
                    <BrainCircuit className="w-3 h-3 text-sky-400" />
                    <span>AI Coaching: {runEvaluation.coachingRecommendation.badge}</span>
                  </div>
                  <div className="text-xs font-semibold text-white/90 mb-0.5">
                    {runEvaluation.coachingRecommendation.headline}
                  </div>
                  <p className="text-[11px] text-white/60 leading-tight">
                    {runEvaluation.coachingRecommendation.tacticalTip}
                  </p>
                </div>
              )}

              {/* Restart CTA Pill */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={reset}
                  className="w-full py-3 rounded-full bg-[#0066cc] hover:bg-[#0071e3] active:scale-95 text-white font-semibold text-sm transition-all shadow-[0_2px_14px_rgba(0,102,204,0.45)] flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Climb Again</span>
                </button>

                {onOpenTelemetry && (
                  <button
                    type="button"
                    onClick={onOpenTelemetry}
                    className="w-full py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] active:scale-95 text-white/80 hover:text-white text-xs font-medium transition-all"
                  >
                    View TypeSafe S1 Telemetry
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tactile On-Screen Touch Steering Controls (Apple Fluid Motion) */}
      <div className="flex items-center justify-between mt-3 px-1">
        <div className="flex gap-2">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              stateRef.current.keys.left = true;
            }}
            onPointerUp={() => {
              stateRef.current.keys.left = false;
            }}
            onPointerLeave={() => {
              stateRef.current.keys.left = false;
            }}
            className="w-14 h-12 rounded-2xl bg-[#1d1d1f]/80 backdrop-blur-2xl border border-white/[0.08] border-t-white/[0.15] active:bg-white/20 active:scale-95 transition-all flex items-center justify-center text-white/80 shadow-md touch-none"
            aria-label="Steer Left"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              stateRef.current.keys.right = true;
            }}
            onPointerUp={() => {
              stateRef.current.keys.right = false;
            }}
            onPointerLeave={() => {
              stateRef.current.keys.right = false;
            }}
            className="w-14 h-12 rounded-2xl bg-[#1d1d1f]/80 backdrop-blur-2xl border border-white/[0.08] border-t-white/[0.15] active:bg-white/20 active:scale-95 transition-all flex items-center justify-center text-white/80 shadow-md touch-none"
            aria-label="Steer Right"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Tap Spawn Button (supplementing canvas tap) */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            handleTap();
          }}
          className="flex-1 ml-3 h-12 rounded-2xl bg-gradient-to-r from-amber-600 to-rose-600 active:scale-95 text-white font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-[0_4px_16px_rgba(245,158,11,0.35)] transition-all touch-none"
        >
          <Zap className="w-4 h-4" />
          <span>TAP / PLACE BLOCK</span>
        </button>
      </div>
    </div>
  );
}

// ==========================================
// RENDER HELPERS
// ==========================================

function getBiomeName(height: number): string {
  if (height < 50) return "Caldera Floor";
  if (height < 150) return "Sulfur Vent";
  if (height < 300) return "Obsidian Throat";
  return "Summit Sky Apex";
}

function generateLightningArc(
  arcs: LightningArc[],
  w: number,
  h: number,
  cameraY: number,
) {
  const startX = Math.random() * w;
  const startY = cameraY - 20;
  const segments: { x: number; y: number }[] = [{ x: startX, y: startY }];

  let curX = startX;
  let curY = startY;
  for (let i = 0; i < 7; i++) {
    curX += (Math.random() - 0.5) * 60;
    curY += Math.random() * 80 + 30;
    segments.push({ x: curX, y: curY });
  }

  arcs.push({
    segments,
    alpha: 0.9,
    createdAt: performance.now(),
  });

  if (arcs.length > 3) {
    arcs.shift();
  }
}

function renderLightning(ctx: CanvasRenderingContext2D, arcs: LightningArc[]) {
  for (const arc of arcs) {
    ctx.strokeStyle = `rgba(224, 231, 255, ${arc.alpha})`;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "#818cf8";
    ctx.shadowBlur = 12;

    ctx.beginPath();
    arc.segments.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    ctx.shadowBlur = 0;
  }
}

function renderBiomeBackground(
  ctx: CanvasRenderingContext2D,
  height: number,
  h: number,
  w: number,
  now: number,
) {
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  if (height < 50) {
    // Caldera Floor: Searing Molten Basalt
    bg.addColorStop(0, "#19081a");
    bg.addColorStop(0.6, "#280a14");
    bg.addColorStop(1, "#3f0a10");
  } else if (height < 150) {
    // Sulfur Vent: Golden Amber Steam
    bg.addColorStop(0, "#1c0d0a");
    bg.addColorStop(0.6, "#2e1208");
    bg.addColorStop(1, "#3c160a");
  } else if (height < 300) {
    // Obsidian Throat: Crystalline Violet Glass
    bg.addColorStop(0, "#0f081d");
    bg.addColorStop(0.6, "#1a0b2e");
    bg.addColorStop(1, "#260e38");
  } else {
    // Summit Sky Apex: Stratosphere & Celestial Stars
    bg.addColorStop(0, "#050510");
    bg.addColorStop(0.5, "#0b0b22");
    bg.addColorStop(1, "#1c0d28");
  }

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Subtle ambient caldera chimney walls (parabolic volcanic throat)
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w * 0.12, 0);
  ctx.lineTo(w * 0.04, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(w, 0);
  ctx.lineTo(w * 0.88, 0);
  ctx.lineTo(w * 0.96, h);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

function renderAmbientEmbers(
  ctx: CanvasRenderingContext2D,
  cameraY: number,
  now: number,
  height: number,
) {
  // Rising atmospheric embers & sparkles
  for (let i = 0; i < 40; i++) {
    const x = (i * 87 + Math.sin(now * 0.001 + i) * 16) % W;
    const y = (((i * 49 - now * 0.045 + cameraY * 0.2) % H) + H) % H;
    const sz = (i % 3) + 1;

    let emberColor = "rgba(251, 191, 36, 0.15)";
    if (height >= 150 && height < 300) {
      emberColor = "rgba(192, 132, 252, 0.18)"; // Obsidian throat purple sparks
    } else if (height >= 300) {
      emberColor = "rgba(147, 197, 253, 0.22)"; // Celestial summit stars
    }

    ctx.fillStyle = emberColor;
    ctx.fillRect(x, y, sz, sz);
  }
}

function renderPlatforms(ctx: CanvasRenderingContext2D, platforms: Platform[], now: number) {
  for (const p of platforms) {
    const age = now - p.createdAt;
    const lifeRatio = Math.min(1, age / p.life);

    // Fade out during last 30% of lifespan
    const alpha = lifeRatio > 0.7 ? 1 - (lifeRatio - 0.7) / 0.3 : 1;
    ctx.globalAlpha = Math.max(0, alpha);

    let baseColor = "#8a5a3b";
    let edgeColor = "#452b1b";
    let glowColor = "transparent";

    if (p.type === "bounce") {
      baseColor = "#22c55e";
      edgeColor = "#14532d";
      glowColor = "rgba(34, 197, 94, 0.4)";
    } else if (p.type === "double") {
      baseColor = "#3b82f6";
      edgeColor = "#1e3a8a";
      glowColor = "rgba(59, 130, 246, 0.4)";
    } else if (p.type === "freeze") {
      baseColor = "#38bdf8";
      edgeColor = "#0369a1";
      glowColor = "rgba(56, 189, 248, 0.5)";
    } else if (p.type === "anchor") {
      baseColor = "#52525b";
      edgeColor = "#27272a";
      glowColor = "rgba(161, 161, 170, 0.2)";
    }

    // Subtle vibration on verge of collapse (> 88% life)
    const shudderX = lifeRatio > 0.88 && p.type !== "anchor" ? (Math.random() - 0.5) * 1.8 : 0;

    // Shadow / bottom rim
    ctx.fillStyle = edgeColor;
    ctx.fillRect(p.x + shudderX, p.y, p.w, PLATFORM_H + 3);

    // Main surface
    ctx.fillStyle = baseColor;
    ctx.fillRect(p.x + shudderX, p.y, p.w, PLATFORM_H);

    // Platform glow on power-ups
    if (glowColor !== "transparent") {
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x + shudderX - 1, p.y - 1, p.w + 2, PLATFORM_H + 2);
    }

    // Top highlight rim (Apple light refraction)
    ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
    ctx.fillRect(p.x + shudderX, p.y, p.w, 2);

    // Power-up iconography
    if (p.type === "bounce") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(p.x + shudderX + p.w / 2 - 6, p.y + 3, 12, 2);
      ctx.fillRect(p.x + shudderX + p.w / 2 - 3, p.y + 7, 6, 2);
    } else if (p.type === "double") {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("2×", p.x + shudderX + p.w / 2, p.y + 10);
    } else if (p.type === "freeze") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(p.x + shudderX + p.w / 2 - 4, p.y + 4, 8, 4);
    } else if (p.type === "anchor") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(p.x + shudderX + p.w / 2 - 8, p.y + 5, 16, 2);
    }

    // Progressive Crumbling Fracture Lines (Glowing with heat at >70%)
    if (lifeRatio > 0.45 && p.type !== "anchor") {
      ctx.strokeStyle = lifeRatio > 0.72 ? "#f97316" : "rgba(0,0,0,0.65)";
      ctx.lineWidth = lifeRatio > 0.72 ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(p.x + shudderX + p.w * 0.25, p.y);
      ctx.lineTo(p.x + shudderX + p.w * 0.35, p.y + PLATFORM_H);
      ctx.moveTo(p.x + shudderX + p.w * 0.65, p.y);
      ctx.lineTo(p.x + shudderX + p.w * 0.6, p.y + PLATFORM_H);
      if (lifeRatio > 0.72) {
        ctx.moveTo(p.x + shudderX + p.w * 0.45, p.y + 2);
        ctx.lineTo(p.x + shudderX + p.w * 0.52, p.y + PLATFORM_H - 1);
      }
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }
}

function renderPlayer(
  ctx: CanvasRenderingContext2D,
  s: {
    px: number;
    py: number;
    scaleX: number;
    scaleY: number;
    tilt: number;
    walkFrame: number;
    doubleAvail: boolean;
    doubleUsed: boolean;
    isBlinking: boolean;
  },
  skin: CharacterSkin,
  now: number,
) {
  ctx.save();
  ctx.translate(s.px + PLAYER_W / 2, s.py + PLAYER_H / 2);
  ctx.rotate(s.tilt);
  ctx.scale(s.scaleX, s.scaleY);

  const hw = PLAYER_W / 2;
  const hh = PLAYER_H / 2;

  // Double jump aura halo
  if (s.doubleAvail && !s.doubleUsed) {
    const pulse = Math.sin(now * 0.01) * 3;
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      -hw - 3 - pulse,
      -hh - 3 - pulse,
      PLAYER_W + 6 + pulse * 2,
      PLAYER_H + 6 + pulse * 2,
    );
  }

  // Character body rounded capsule
  ctx.fillStyle = skin.bodyColor;
  ctx.beginPath();
  ctx.roundRect(-hw, -hh, PLAYER_W, PLAYER_H, 6);
  ctx.fill();

  // Headband / Visor with dynamic trailing flutter
  ctx.fillStyle = skin.headBandColor;
  ctx.fillRect(-hw, -hh + 5, PLAYER_W, 6);

  // Trailing headband ribbon
  const ribbonFlutter = Math.sin(now * 0.015) * 4;
  ctx.fillStyle = skin.headBandColor;
  ctx.fillRect(-hw - 4, -hh + 6 + ribbonFlutter * 0.3, 4, 4);

  // Eyes (or blinking slit) with glossy catchlight
  ctx.fillStyle = skin.eyeColor;
  if (s.isBlinking) {
    ctx.fillRect(-hw + 4, -hh + 7, 5, 1.5);
    ctx.fillRect(-hw + 14, -hh + 7, 5, 1.5);
  } else {
    ctx.fillRect(-hw + 5, -hh + 6, 3.5, 4);
    ctx.fillRect(-hw + 14, -hh + 6, 3.5, 4);

    // Eye catch-light reflection
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-hw + 6, -hh + 6, 1.2, 1.2);
    ctx.fillRect(-hw + 15, -hh + 6, 1.2, 1.2);
  }

  // Running feet stride locomotion
  const footOffset = Math.sin(s.walkFrame) * 3;
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.fillRect(-hw + 2, hh - 4 + footOffset, 7, 4);
  ctx.fillRect(hw - 9, hh - 4 - footOffset, 7, 4);

  ctx.restore();
}

function renderLava(ctx: CanvasRenderingContext2D, lavaY: number, isFrozen: boolean, now: number) {
  const time = now / 240;

  // Multi-layered Molten Gradient
  const grad = ctx.createLinearGradient(0, lavaY, 0, lavaY + 220);
  if (isFrozen) {
    grad.addColorStop(0, "#bae6fd");
    grad.addColorStop(0.2, "#38bdf8");
    grad.addColorStop(0.6, "#0284c7");
    grad.addColorStop(1, "#082f49");
  } else {
    grad.addColorStop(0, "#ffffff"); // Blazing white-hot center
    grad.addColorStop(0.08, "#fef08a"); // Incandescent yellow core
    grad.addColorStop(0.24, "#f97316"); // Molten orange
    grad.addColorStop(0.55, "#dc2626"); // Crimson magma
    grad.addColorStop(1, "#450a0a"); // Deep basalt crust
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, lavaY, W, H * 2.5);

  // Animated Sine Wave Crest (Dual-frequency wave for realistic fluid physics)
  ctx.fillStyle = isFrozen ? "#e0f2fe" : "#ffffff";
  ctx.beginPath();
  ctx.moveTo(0, lavaY);
  for (let x = 0; x <= W; x += 8) {
    const wave = isFrozen
      ? 1
      : Math.sin(x * 0.04 + time) * 4.5 + Math.cos(x * 0.08 - time * 0.6) * 2.2;
    ctx.lineTo(x, lavaY + wave);
  }
  ctx.lineTo(W, lavaY + 14);
  ctx.lineTo(0, lavaY + 14);
  ctx.closePath();
  ctx.fill();

  // Boiling Magma Bubbles
  if (!isFrozen) {
    ctx.fillStyle = "rgba(254, 240, 138, 0.75)";
    for (let i = 0; i < 6; i++) {
      const bx = (i * 75 + Math.sin(time + i) * 18) % W;
      const by = lavaY + 14 + ((i * 11 + time * 12) % 28);
      ctx.beginPath();
      ctx.arc(bx, by, (i % 3) + 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
