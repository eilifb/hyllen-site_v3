import { useMemo, useState } from 'react';
import { ICON_404_FILENAMES } from './404_icons';

const ICON_BASE = '/static/images/icons/lain/';

export default function NotFoundPage() {
  const iconUrl = useMemo(() => {
    const names = ICON_404_FILENAMES;
    if (names.length === 0) return null;
    const index = Math.floor(Math.random() * names.length);
    const file = names[index];
    return file ? `${ICON_BASE}${encodeURIComponent(file)}` : null;
  }, []);

  const [showIcon, setShowIcon] = useState(Boolean(iconUrl));

  return (
    <section className="not-found-page" aria-labelledby="not-found-heading">
      <h1 id="not-found-heading" className="not-found-code">
        404
      </h1>
      <p className="not-found-detail">page not found</p>

      {iconUrl && showIcon ? (
        <img
          className="not-found-face"
          src={iconUrl}
          alt=""
          width={200}
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setShowIcon(false)}
        />
      ) : null}
    </section>
  );
}
