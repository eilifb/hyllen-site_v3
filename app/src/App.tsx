import './App.css';
import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import ProjectsPage from './ProjectsPage';
import ProjectArticlePage from './ProjectArticlePage';

type ThemeMode = 'dark' | 'light' | 'auto';
type SoundName = 'chesto' | 'ikuzeyo';

interface Animation {
  string: string;
  sheet: HTMLImageElement;
  width: number;
  height: number;
  xStart: number;
  yStart: number;
  yEndOffset: number;
  xEndOffset: number;
  nextAnimation: () => string | null;
  delays: number[];
  soundclip: SoundName | null;
}

interface AnimationState {
  cols: number;
  currentFrameIndex: number;
  frameStartTime: number;
  accumulatedTime: number;
  currentAnimation: Animation | null;
  animations: Record<string, Animation>;
  isFlipped: boolean;
  canvasOffset: { x: number; y: number };
  widestSprite: number;
  tallestSprite: number;
  /** HiDPI: backing store = logical size x pixelRatio */
  pixelRatio: number;
  logicalCanvasW: number;
  logicalCanvasH: number;
}

function readInitialThemeMode(): ThemeMode {
  const mode = localStorage.getItem('themeMode');
  if (mode === 'dark' || mode === 'light' || mode === 'auto') return mode;
  const legacy = localStorage.getItem('theme');
  if (legacy === 'dark' || legacy === 'light') return legacy;
  return 'dark';
}

function getResponsiveDefaultScale(): number {
  if (typeof window === 'undefined') return 2;
  if (window.innerWidth <= 768) return 1;
  return 2;
}

function App() {
  const location = useLocation();
  const appVersion = import.meta.env.VITE_APP_VERSION ?? '0.0.0';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationStateRef: MutableRefObject<AnimationState> = useRef<AnimationState>({
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
    pixelRatio: 1,
    logicalCanvasW: 0,
    logicalCanvasH: 0,
  });
  const audioRef = useRef<Record<SoundName, HTMLAudioElement>>({
    chesto: new Audio('/static/audio/chesto.wav'),
    ikuzeyo: new Audio('/static/audio/ikuzeyo.wav'),
  });

  const [themeMode, setThemeMode] = useState<ThemeMode>(readInitialThemeMode);
  const [isMuted, setIsMuted] = useState<boolean>(
    () => localStorage.getItem('muted') === 'true',
  );
  const [scale, setScale] = useState<number>(getResponsiveDefaultScale);
  const [canvasHeight, setCanvasHeight] = useState<number>(200);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState<boolean>(false);
  const themeDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const resolve = (): 'dark' | 'light' => {
      if (themeMode === 'auto') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }
      return themeMode;
    };

    const apply = () => {
      document.documentElement.setAttribute('data-theme', resolve());
    };

    apply();
    localStorage.setItem('themeMode', themeMode);

    if (themeMode !== 'auto') return undefined;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem('muted', String(isMuted));
    Object.values(audioRef.current).forEach((sound) => {
      sound.muted = isMuted;
    });
  }, [isMuted]);

  useEffect(() => {
    if (!themeMenuOpen) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (
        themeDropdownRef.current &&
        target &&
        !themeDropdownRef.current.contains(target)
      ) {
        setThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [themeMenuOpen]);

  useEffect(() => {
    setSidebarOpen(false);
    setThemeMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let isMounted = true;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    const state = animationStateRef.current;
    const snapCssPx = (px: number, dpr: number) => Math.round(px * dpr) / dpr;

    const applyPixelRatioToContext = () => {
      ctx.imageSmoothingEnabled = false;
      if (typeof ctx.imageSmoothingQuality === 'string') {
        ctx.imageSmoothingQuality = 'low';
      }
    };
    let rafId: number | null = null;

    const playSound = (name: SoundName) => {
      if (isMuted) return;
      const audio = audioRef.current[name];
      if (!audio) return;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    };

    const updateCanvasOffset = () => {
      const dpr = state.pixelRatio || 1;
      const container = canvas.parentElement;
      const containerWidth = container ? container.clientWidth : window.innerWidth;
      const centeredLeft = (containerWidth - state.logicalCanvasW) / 2;
      const leftPx = snapCssPx(centeredLeft + state.canvasOffset.x, dpr);
      const topPx = snapCssPx(state.canvasOffset.y, dpr);
      canvas.style.left = `${leftPx}px`;
      canvas.style.top = `${topPx}px`;
      canvas.style.transform = 'none';
    };

    const updateLayout = () => {
      const logicalW = Math.max(1, Math.round(state.widestSprite * scale));
      const logicalH = Math.max(1, Math.ceil(state.tallestSprite * scale));
      const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 3);

      state.logicalCanvasW = logicalW;
      state.logicalCanvasH = logicalH;
      state.pixelRatio = dpr;

      setCanvasHeight(logicalH);

      canvas.width = Math.max(1, Math.round(logicalW * dpr));
      canvas.height = Math.max(1, Math.round(logicalH * dpr));
      canvas.style.width = `${logicalW}px`;
      canvas.style.height = `${logicalH}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      applyPixelRatioToContext();
    };

    const stopAnimation = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const drawFrame = () => {
      const anim = state.currentAnimation;
      if (!anim) return;
      const row = Math.floor(state.currentFrameIndex / state.cols);
      const col = state.currentFrameIndex % state.cols;

      const dpr = state.pixelRatio || 1;
      const lw = state.logicalCanvasW || canvas.width;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      applyPixelRatioToContext();

      ctx.save();

      if (state.isFlipped) {
        ctx.translate(lw, 0);
        ctx.scale(-1, 1);
      }

      // Bleed protection: inset source sampling so neighboring frame pixels
      // cannot leak at specific DPR/viewport combinations.
      const srcInset = anim.width > 2 && anim.height > 2 ? 1 : 0;
      const srcX = Math.floor(col * anim.width) + srcInset;
      const srcY = Math.floor(row * anim.height) + srcInset;
      const srcW = Math.max(1, Math.ceil(anim.width - srcInset * 2));
      const srcH = Math.max(1, Math.ceil(anim.height - srcInset * 2));
      const dstX = Math.floor((anim.xStart + srcInset) * scale);
      const dstY = Math.floor((anim.yStart + srcInset) * scale);
      const dstW = Math.max(1, Math.ceil(srcW * scale));
      const dstH = Math.max(1, Math.ceil(srcH * scale));

      ctx.drawImage(anim.sheet, srcX, srcY, srcW, srcH, dstX, dstY, dstW, dstH);

      ctx.restore();
    };

    const startAnimation = (name: string) => {
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

    const animationLoop = (timestamp: number) => {
      const anim = state.currentAnimation;
      if (!anim) return;
      if (!state.frameStartTime) state.frameStartTime = timestamp;

      const frameDuration =
        anim.delays[Math.min(state.currentFrameIndex, anim.delays.length - 1)] || 70;
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

    const loadDelays = async (jsonPath: string): Promise<number[]> => {
      try {
        const response = await fetch(jsonPath);
        const delays: unknown = await response.json();
        if (!Array.isArray(delays)) return Array(94).fill(70);
        return delays.map((delay) => parseInt(String(delay), 10));
      } catch {
        return Array(94).fill(70);
      }
    };

    const loadImage = (path: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = path;
      });

    const loadSprite = async (
      name: string,
      pathname: string,
      xStart: number,
      yStart: number,
      yEndOffset: number,
      xEndOffset: number,
      nextAnimation: () => string | null,
      soundclip: SoundName | null = null,
    ): Promise<Animation> => {
      const [sheet, delays] = await Promise.all([
        loadImage(`${pathname}_spritesheet.png`),
        loadDelays(`${pathname}_frame_delay.json`),
      ]);

      return {
        string: name,
        sheet,
        width: Math.floor(sheet.width / state.cols),
        height: Math.floor(
          sheet.height / Math.max(1, Math.ceil(delays.length / state.cols)),
        ),
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
        state.canvasOffset.x = 0;
        state.canvasOffset.y = 0;
        state.isFlipped = false;
        updateLayout();
        updateCanvasOffset();
        startAnimation('stance');
      } catch (error) {
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

    const handleResize = () => {
      if (!state.widestSprite) return;
      updateLayout();
      updateCanvasOffset();
      drawFrame();
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      stopAnimation();
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
    };
  }, [isMuted, scale]);

  const canResize = animationStateRef.current.currentAnimation?.string === 'stance';

  const closeSidebar = () => {
    setSidebarOpen(false);
    setThemeMenuOpen(false);
  };

  const pickThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    setThemeMenuOpen(false);
  };

  const themeToggleIcon =
    themeMode === 'light'
      ? 'bi-sun-fill'
      : themeMode === 'dark'
        ? 'bi-moon-stars-fill'
        : 'bi-circle-half';

  return (
    <div className="app-root">
      <button
        type="button"
        className="menu-trigger"
        onClick={() => setSidebarOpen((open) => !open)}
        aria-expanded={sidebarOpen}
        aria-controls="site-sidebar"
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
      >
        {sidebarOpen ? (
          <span className="menu-icon-x" aria-hidden>
            ×
          </span>
        ) : (
          <span className="menu-icon-hamburger" aria-hidden>
            <span className="menu-bar" />
            <span className="menu-bar" />
            <span className="menu-bar" />
          </span>
        )}
      </button>

      <header className="top-bar" aria-label="Site header">
        <h1 className="site-title">Hyllen</h1>
      </header>

      <div
        className={`sidebar-backdrop${sidebarOpen ? ' is-visible' : ''}`}
        onClick={closeSidebar}
        aria-hidden={!sidebarOpen}
      />

      <aside
        id="site-sidebar"
        className={`site-sidebar${sidebarOpen ? ' is-open' : ''}`}
        aria-hidden={!sidebarOpen}
      >
        <div className="sidebar-inner">
          <div className="sidebar-title">{`Hyllen v${appVersion}`}</div>
          <div className="sidebar-sep" role="separator" />

          <div className="sidebar-actions">
            <button
              type="button"
              className="sidebar-action-btn"
              onClick={() => setIsMuted((prev) => !prev)}
              aria-pressed={isMuted}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              <i
                className={`bi ${isMuted ? 'bi-volume-mute-fill' : 'bi-volume-up-fill'}`}
                aria-hidden
              />
            </button>

            <div className="dropdown sidebar-theme-dropdown" ref={themeDropdownRef}>
              <button
                type="button"
                className="sidebar-action-btn dropdown-toggle sidebar-theme-toggle"
                onClick={() => setThemeMenuOpen((open) => !open)}
                aria-expanded={themeMenuOpen}
                aria-haspopup="true"
                aria-label="Color theme"
              >
                <i className={`bi ${themeToggleIcon}`} aria-hidden />
              </button>
              <ul
                className={`dropdown-menu dropdown-menu-end shadow${themeMenuOpen ? ' show' : ''}`}
              >
                <li>
                  <button
                    type="button"
                    className={`dropdown-item${themeMode === 'light' ? ' active' : ''}`}
                    onClick={() => pickThemeMode('light')}
                  >
                    <i className="bi bi-sun-fill me-2" aria-hidden />
                    Light
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={`dropdown-item${themeMode === 'dark' ? ' active' : ''}`}
                    onClick={() => pickThemeMode('dark')}
                  >
                    <i className="bi bi-moon-stars-fill me-2" aria-hidden />
                    Dark
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={`dropdown-item${themeMode === 'auto' ? ' active' : ''}`}
                    onClick={() => pickThemeMode('auto')}
                  >
                    <i className="bi bi-circle-half me-2" aria-hidden />
                    Auto
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="sidebar-sep" role="separator" />

          <a
            className="sidebar-link-btn"
            href="https://github.com/eilifb/"
            target="_blank"
            rel="noreferrer"
            aria-label="Open Eilif B GitHub profile"
          >
            <span>GitHub</span>
            <i className="bi bi-github" aria-hidden />
          </a>

          <div className="sidebar-sep" role="separator" />

          <Link
            className="sidebar-link-btn"
            to="/projects"
            aria-label="Open projects page"
          >
            <span>Projects</span>
            <i className="bi bi-circle-square" aria-hidden />
          </Link>
        </div>
      </aside>

      <main className="main-container">
        <Routes>
          <Route
            path="/"
            element={
              <div className="home-landing">
                <section className="animation-section">
                  <div
                    className="canvas-container"
                    style={{ height: `${canvasHeight}px` }}
                  >
                    <canvas ref={canvasRef} id="sprite-canvas" />
                  </div>

                  <div className="button-row">
                    <button
                      type="button"
                      className="icon-btn scaledown-btn"
                      onClick={() =>
                        canResize && setScale((prev) => Math.max(0.5, prev - 0.5))
                      }
                    >
                      <img
                        src="/static/images/makoto/makoto_face_minus.png"
                        alt="Scale down animation"
                        className="pixel-img button-face"
                      />
                    </button>
                    <button
                      type="button"
                      className="icon-btn scaleup-btn"
                      onClick={() =>
                        canResize && setScale((prev) => Math.min(8, prev + 0.5))
                      }
                    >
                      <img
                        src="/static/images/makoto/makoto_face_plus.png"
                        alt="Scale up animation"
                        className="pixel-img button-face"
                      />
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
              </div>
            }
          />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:slug" element={<ProjectArticlePage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
