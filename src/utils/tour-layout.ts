interface VerticalRect {
  top: number;
  height: number;
}

interface VisibleRegion {
  top: number;
  bottom: number;
}

/** Scroll a spotlight target into the space between the navbar and tour sheet. */
export function getTourScrollDelta(target: VerticalRect, region: VisibleRegion): number {
  const availableHeight = region.bottom - region.top;
  if (availableHeight <= 0) return 0;
  if (target.top >= region.top - 1 && target.top + target.height <= region.bottom + 1) return 0;

  const desiredTop = region.top + Math.max(0, (availableHeight - target.height) / 2);
  const delta = target.top - desiredTop;
  return Math.abs(delta) > 1 ? delta : 0;
}
