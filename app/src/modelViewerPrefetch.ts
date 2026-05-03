/** One dynamic chunk pair per session; safe to call from article page and MdxModelViewer. */
let modelViewerImportPromise: Promise<void> | null = null;

export function prefetchModelViewer(): void {
  if (!modelViewerImportPromise) {
    modelViewerImportPromise = Promise.all([
      import('@google/model-viewer'),
      import('@google/model-viewer-effects'),
    ]).then(() => undefined);
  }
  void modelViewerImportPromise.catch(() => {});
}
