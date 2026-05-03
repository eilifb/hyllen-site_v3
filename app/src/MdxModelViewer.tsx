import { useEffect, useState, type CSSProperties } from 'react';
import { useHas3dModelArticle } from './has3dModelArticleContext';
import { prefetchModelViewer } from './modelViewerPrefetch';

/** Parse `getComputedStyle` color (hex or rgb[a]) → linear-ish luminance 0–1. */
function cssColorLuminance(css: string): number {
  const s = css.trim();
  let r = 0.5,
    g = 0.5,
    b = 0.5;
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    r = parseInt(h.slice(0, 2), 16) / 255;
    g = parseInt(h.slice(2, 4), 16) / 255;
    b = parseInt(h.slice(4, 6), 16) / 255;
  } else {
    const rgb = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i.exec(s);
    if (rgb) {
      r = Number(rgb[1]) / 255;
      g = Number(rgb[2]) / 255;
      b = Number(rgb[3]) / 255;
    }
  }
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

type OutlineBlend = 'SCREEN' | 'ALPHA';

interface OutlinePresentation {
  rimColor: string;
  blendMode: OutlineBlend;
  outlineStrength: number;
}

/**
 * Postprocessing recommends `ALPHA` blend for dark line art; `SCREEN` reads better
 * for light rims on dark page chrome. Split by `--text` luminance.
 */
function useOutlinePresentation(): OutlinePresentation {
  const [pres, setPres] = useState<OutlinePresentation>({
    rimColor: '#e2e6ef',
    blendMode: 'SCREEN',
    outlineStrength: 5.5,
  });

  useEffect(() => {
    const update = () => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue('--text');
      const lum = cssColorLuminance(raw);
      if (lum > 0.55) {
        setPres({
          rimColor: '#e8ecf4',
          blendMode: 'SCREEN',
          outlineStrength: 6,
        });
      } else {
        setPres({
          rimColor: '#0f1218',
          blendMode: 'ALPHA',
          outlineStrength: 5.5,
        });
      }
    };
    update();
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', update);
    return () => {
      mo.disconnect();
      mq.removeEventListener('change', update);
    };
  }, []);

  return pres;
}

/**
 * Lighting: `environment-image="legacy"` uses model-viewer’s procedural IBL
 * with a stronger overhead key than the default “neutral” map (no extra assets).
 *
 * Edge read: SSAO + outline (blend mode/theme from `postprocessing` + UI theme).
 */
const defaultViewerStyle: CSSProperties = {
  width: '100%',
  maxWidth: '560px',
  height: 'min(420px, 55vh)',
  margin: '0 auto',
  display: 'block',
  backgroundColor: 'color-mix(in srgb, var(--text) 8%, transparent)',
};

export interface MdxModelViewerProps {
  src: string;
  alt: string;
  style?: CSSProperties;
}

export default function MdxModelViewer({ src, alt, style }: MdxModelViewerProps) {
  const has3dArticle = useHas3dModelArticle();
  const outlinePres = useOutlinePresentation();

  useEffect(() => {
    if (has3dArticle) prefetchModelViewer();
  }, [has3dArticle]);

  if (!has3dArticle) return null;

  return (
    <model-viewer
      src={src}
      alt={alt}
      camera-controls
      touch-action="pan-y"
      environment-image="legacy"
      shadow-intensity="1"
      exposure="1.18"
      style={{ ...defaultViewerStyle, ...style }}
    >
      {/* https://modelviewer.dev/docs/mve */}
      <effect-composer render-mode="quality">
        <ssao-effect strength={1.35} />
        <outline-effect
          color={outlinePres.rimColor}
          strength={outlinePres.outlineStrength}
          smoothing={0}
          opacity={1}
          blend-mode={outlinePres.blendMode}
        />
        <color-grade-effect
          tonemapping="aces_filmic"
          contrast={0.18}
          saturation={0.05}
          brightness={0.03}
        />
      </effect-composer>
    </model-viewer>
  );
}
