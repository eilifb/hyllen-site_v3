import type { ImgHTMLAttributes, SyntheticEvent } from 'react';
import { useCallback, useState } from 'react';

/** Hides MDX figures when `/static/images/...` is missing from the deployment. */
export default function MdxArticleImage({
  onError: onErrorProp,
  alt,
  ...rest
}: ImgHTMLAttributes<HTMLImageElement>) {
  const [hidden, setHidden] = useState(false);
  const onError = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      onErrorProp?.(event);
      setHidden(true);
    },
    [onErrorProp],
  );
  if (hidden) return null;
  return <img {...rest} alt={alt ?? ''} onError={onError} />;
}
