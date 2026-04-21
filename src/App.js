import './App.css';
import { useEffect, useRef, useState } from 'react';

function App() {
  const canvasRef = useRef(null);
  const animationStateRef = useRef({
    cols: 10,
    currentFrameIndex: 0,
    frameStartTime: 0,
    accumulatedTime: 0,
    currentAnimation: null,
    animations: {},
    isFlipped: false,
    canvasOffset: { x: 0, y: 0 },
    widestSprite: 0,
    tallestSprite: 0,
  });
  const audioRef = useRef({
    chesto: new Audio('/static/audio/chesto.wav'),
    ikuzeyo: new Audio('/static/audio/ikuzeyo.wav'),
  });

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('muted') === 'true');
  const [scale, setScale] = useState(2);
  const [canvasHeight, setCanvasHeight] = useState(200);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('muted', String(isMuted));
    Object.values(audioRef.current).forEach((sound) => {
      sound.muted = isMuted;
    });
  }, [isMuted]);

  useEffect(() => {
    let isMounted = true;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    ctx.imageSmoothingEnabled = false;

    const state = animationStateRef.current;
    let rafId = null;

    const playSound = (name) => {
      if (isMuted) return;
      const audio = audioRef.current[name];
      if (!audio) return;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    };

    const updateCanvasOffset = () => {
      canvas.style.left = `${Math.floor(state.canvasOffset.x)}px`;
      canvas.style.top = `${Math.floor(state.canvasOffset.y)}px`;
    };

    const updateLayout = () => {
      const nextHeight = Math.max(1, Math.ceil(state.tallestSprite * scale));
      setCanvasHeight(nextHeight);
      canvas.width = Math.max(1, Math.round(state.widestSprite * scale));
      canvas.height = nextHeight;
    };

    const stopAnimation = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const drawFrame = () => {
      const anim = state.currentAnimation;
      if (!anim) return;
      const row = Math.floor(state.currentFrameIndex / state.cols);
      const col = state.currentFrameIndex % state.cols;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      if (state.isFlipped) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(
        anim.sheet,
        Math.floor(col * anim.width),
        Math.floor(row * anim.height),
        Math.ceil(anim.width),
        Math.ceil(anim.height),
        Math.floor(anim.xStart * scale),
        Math.floor(anim.yStart * scale),
        Math.ceil(anim.width * scale),
        Math.ceil(anim.height * scale),
      );

      ctx.restore();
    };

    const startAnimation = (name) => {
      const baseAnimation = state.animations[name];
      if (!baseAnimation) return;
      stopAnimation();
      state.currentAnimation = { ...baseAnimation };
      state.currentFrameIndex = 0;
      state.frameStartTime = 0;
      state.accumulatedTime = 0;
      drawFrame();
      if (state.currentAnimation.soundclip) {
        playSound(state.currentAnimation.soundclip);
      }
      rafId = requestAnimationFrame(animationLoop);
    };

    const animationLoop = (timestamp) => {
      const anim = state.currentAnimation;
      if (!anim) return;
      if (!state.frameStartTime) state.frameStartTime = timestamp;

      const frameDuration = anim.delays[Math.min(state.currentFrameIndex, anim.delays.length - 1)] || 70;
      state.accumulatedTime += timestamp - state.frameStartTime;
      state.frameStartTime = timestamp;

      while (state.accumulatedTime >= frameDuration) {
        state.accumulatedTime -= frameDuration;
        drawFrame();
        state.currentFrameIndex += 1;

        if (state.currentFrameIndex >= anim.delays.length) {
          const xDelta = Math.round(anim.xEndOffset * scale);
          const yDelta = Math.round(anim.yEndOffset * scale);
          if (state.isFlipped) {
            state.canvasOffset.x -= xDelta;
            state.canvasOffset.y -= yDelta;
          } else {
            state.canvasOffset.x += xDelta;
            state.canvasOffset.y += yDelta;
          }

          updateCanvasOffset();

          const bounds = canvas.getBoundingClientRect();
          if (bounds.right + xDelta > window.innerWidth && !state.isFlipped) {
            state.isFlipped = true;
          } else if (bounds.left - xDelta < 0 && state.isFlipped) {
            state.isFlipped = false;
          }

          const next = anim.nextAnimation();
          if (next) {
            startAnimation(next);
          }
          return;
        }
      }

      rafId = requestAnimationFrame(animationLoop);
    };

    const loadDelays = async (jsonPath) => {
      try {
        const response = await fetch(jsonPath);
        const delays = await response.json();
        return delays.map((delay) => parseInt(delay, 10));
      } catch {
        return Array(94).fill(70);
      }
    };

    const loadImage = (path) =>
      new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = path;
      });

    const loadSprite = async (
      name,
      pathname,
      xStart,
      yStart,
      yEndOffset,
      xEndOffset,
      nextAnimation,
      soundclip = null,
    ) => {
      const [sheet, delays] = await Promise.all([
        loadImage(`${pathname}_spritesheet.png`),
        loadDelays(`${pathname}_frame_delay.json`),
      ]);

      return {
        string: name,
        sheet,
        width: Math.floor(sheet.width / state.cols),
        height: Math.floor(sheet.height / Math.max(1, Math.ceil(delays.length / state.cols))),
        xStart,
        yStart,
        yEndOffset,
        xEndOffset,
        nextAnimation,
        delays,
        soundclip,
      };
    };

    const initialize = async () => {
      try {
        const loadedAnimations = await Promise.all([
          loadSprite('stance', '/static/images/makoto/makoto-stance', 24, 3, 0, 0, () => 'stance'),
          loadSprite('hayate', '/static/images/makoto/makoto-hayate', 0, 0, 0, 93, () => 'stance'),
          loadSprite('startup', '/static/images/makoto/makoto-hayate-startup', 0, 0, 0, 0, () => 'windup', 'ikuzeyo'),
          loadSprite('windup', '/static/images/makoto/makoto-hayate-windup', 0, 0, 0, 0, () => 'hold'),
          loadSprite('hold', '/static/images/makoto/makoto-hayate-hold', 0, 0, 0, 0, () => 'hold'),
          loadSprite('end', '/static/images/makoto/makoto-hayate-end', 0, 0, 0, 93, () => 'stance', 'chesto'),
        ]);

        loadedAnimations.forEach((anim) => {
          state.animations[anim.string] = anim;
          state.tallestSprite = Math.max(state.tallestSprite, anim.height);
          state.widestSprite = Math.max(state.widestSprite, anim.width);
        });

        if (!isMounted) return;
        updateLayout();
        updateCanvasOffset();
        startAnimation('stance');
      } catch (error) {
        // Keep page usable even if an asset is missing.
        // eslint-disable-next-line no-console
        console.error('Failed to initialize sprite animation', error);
      }
    };

    initialize();

    const handleMouseDown = () => {
      if (state.currentAnimation?.string === 'stance') {
        startAnimation('startup');
      }
    };

    const handleMouseUp = () => {
      const name = state.currentAnimation?.string;
      if (name === 'windup' || name === 'hold') {
        startAnimation('end');
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);

    return () => {
      isMounted = false;
      stopAnimation();
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMuted, scale]);

  const canResize = animationStateRef.current.currentAnimation?.string === 'stance';

  return (
    <div className="app-root">
      <div className="toggles">
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={theme === 'dark'}
            onChange={(event) => setTheme(event.target.checked ? 'dark' : 'light')}
          />
          <span>Dark Mode</span>
        </label>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={!isMuted}
            onChange={() => setIsMuted((prev) => !prev)}
          />
          <span>{isMuted ? 'Muted' : 'Volume On'}</span>
        </label>
      </div>

      <main className="main-container">
        <section className="top-section">
          <div className="center-row">
            <img
              src="/static/images/hyllen-logo-burning.gif"
              alt="Hyllen logo"
              className="hero-logo"
            />
          </div>

          <div className="gallery-row">
            <img src="/static/images/hyller/hylle_1.png" alt="Hylle 1" className="gallery-image" />
            <img src="/static/images/hyller/hylle_2.png" alt="Hylle 2" className="gallery-image" />
            <img src="/static/images/hyller/hylle_3.png" alt="Hylle 3" className="gallery-image" />
            <img src="/static/images/hyller/hylle_4.png" alt="Hylle 4" className="gallery-image" />
          </div>
        </section>

        <section className="animation-section">
          <div className="canvas-container" style={{ height: `${canvasHeight}px` }}>
            <canvas ref={canvasRef} id="sprite-canvas" />
          </div>

          <div className="button-row">
            <button
              type="button"
              className="icon-btn scaledown-btn"
              onClick={() => canResize && setScale((prev) => Math.max(0.5, prev - 0.5))}
            >
              <img src="/static/images/makoto/makoto_face_minus.png" alt="Scale down animation" className="pixel-img button-face" />
            </button>
            <button
              type="button"
              className="icon-btn scaleup-btn"
              onClick={() => canResize && setScale((prev) => Math.min(8, prev + 0.5))}
            >
              <img src="/static/images/makoto/makoto_face_plus.png" alt="Scale up animation" className="pixel-img button-face" />
            </button>
            <button
              type="button"
              className="chesto-btn"
              onClick={() => {
                if (isMuted) return;
                const clip = audioRef.current.chesto;
                clip.currentTime = 0;
                clip.play().catch(() => {});
              }}
            >
              チェストー！
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
