import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type Divish = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        'model-viewer': Divish & {
          src?: string;
          alt?: string;
          poster?: string;
          loading?: string;
          exposure?: string | number;
          'shadow-intensity'?: string | number;
          'shadow-softness'?: string | number;
          /** Built-in probes: `"legacy"` (stronger key/overhead-style IBL), `"neutral"`, or an HDR/JPG URL. */
          'environment-image'?: string | null;
          'skybox-image'?: string | null;
          'tone-mapping'?: string;
          'camera-controls'?: boolean;
          'touch-action'?: string;
        };
        /** @google/model-viewer-effects */
        'effect-composer': Divish & {
          'render-mode'?: 'performance' | 'quality';
          msaa?: number;
        };
        'outline-effect': Divish & {
          color?: string;
          strength?: number;
          smoothing?: number;
          /** @see postprocessing BlendFunction */
          'blend-mode'?: string;
          opacity?: number;
        };
        /** Screen-space contact shadows — helps read creases before the outline pass. */
        'ssao-effect': Divish & {
          strength?: number;
          'blend-mode'?: string;
          opacity?: number;
        };
        /** Tonemapping + grade; recommended last in pipeline. */
        'color-grade-effect': Divish & {
          tonemapping?: string;
          brightness?: number;
          contrast?: number;
          saturation?: number;
          hue?: number;
        };
      }
    }
  }
}

export {};
