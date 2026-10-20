import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Description, Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { ArrowLeft, ArrowRight, Info, X } from 'lucide-react';
import { petOwnerTourSteps } from '../../data/pet-owner-tour';
import { getTourScrollDelta } from '../../utils/tour-layout';
import styles from './PetOwnerTourDialog.module.css';

interface Props {
  stepIndex: number;
  onPause: (restoreFocus?: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}

interface Rect { top: number; left: number; width: number; height: number }

export default function PetOwnerTourDialog({ stepIndex, onPause, onBack, onNext }: Props) {
  const step = petOwnerTourSteps[stepIndex];
  const panelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [highlight, setHighlight] = useState<Rect | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [actionReady, setActionReady] = useState(false);
  const maskId = `pet-owner-tour-${useId().replace(/:/g, '')}`;

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    panelRef.current?.querySelector('[data-tour-body]')?.scrollTo(0, 0);
  }, [stepIndex]);

  useLayoutEffect(() => {
    let frame = 0;
    let scrolledTarget: HTMLElement | null = null;
    let observedTarget: HTMLElement | null = null;
    const resizeObserver = new ResizeObserver(() => schedule());

    const measure = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const viewport = window.visualViewport;
      const width = viewport?.width ?? window.innerWidth;
      const height = viewport?.height ?? window.innerHeight;
      const offsetTop = viewport?.offsetTop ?? 0;
      const mobileTarget = width < 768 && step.mobileTargetId ? document.getElementById(step.mobileTargetId) : null;
      const target = mobileTarget || (step.targetId ? document.getElementById(step.targetId) : null);
      const action = step.action ? document.getElementById(step.action.targetId) : null;
      setActionReady(!!action?.getClientRects().length && !(action instanceof HTMLButtonElement && action.disabled));

      if (!target || !target.getClientRects().length) {
        setHighlight(null);
        setPosition(null);
        return;
      }

      if (observedTarget !== target) {
        if (observedTarget) resizeObserver.unobserve(observedTarget);
        resizeObserver.observe(target);
        observedTarget = target;
      }

      let rect = target.getBoundingClientRect();
      const mobile = width < 768;
      // Clear a desktop position before measuring the mobile sheet after rotation.
      if (mobile && panel.style.top) {
        setPosition(null);
        schedule();
        return;
      }
      const visibleBottom = mobile
        ? panel.getBoundingClientRect().top - 18
        : offsetTop + height - 16;
      const scrollDelta = mobile
        ? getTourScrollDelta(rect, { top: offsetTop + 86, bottom: visibleBottom - 6 })
        : scrolledTarget !== target ? rect.top - (offsetTop + Math.max(80, (height - rect.height) / 2)) : 0;
      if (Math.abs(scrollDelta) > 1) {
        window.scrollBy({ top: scrollDelta, behavior: 'instant' });
        scrolledTarget = target;
        rect = target.getBoundingClientRect();
      }

      const left = Math.max(6, rect.left - 6);
      const top = Math.max(offsetTop + (mobile ? 80 : 6), rect.top - 6);
      const bottom = Math.min(visibleBottom, rect.bottom + 6);
      setHighlight(bottom > top ? { left, top, width: Math.max(0, Math.min(width - 6, rect.right + 6) - left), height: bottom - top } : null);

      if (mobile) {
        setPosition(null);
        return;
      }
      const gap = 18;
      const panelWidth = panel.offsetWidth;
      const panelHeight = panel.offsetHeight;
      let panelLeft = rect.right + gap;
      let panelTop = rect.top;
      if (panelLeft + panelWidth > width - 16) {
        if (rect.left - gap - panelWidth >= 16) {
          panelLeft = rect.left - gap - panelWidth;
        } else {
          panelLeft = (width - panelWidth) / 2;
          panelTop = rect.bottom + gap + panelHeight <= offsetTop + height - 16
            ? rect.bottom + gap : rect.top - gap - panelHeight;
        }
      }
      setPosition({
        left: Math.max(16, Math.min(panelLeft, width - panelWidth - 16)),
        top: Math.max(offsetTop + 16, Math.min(panelTop, offsetTop + height - panelHeight - 16)),
      });
    };

    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    }

    const mutationObserver = new MutationObserver(schedule);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    resizeObserver.observe(document.body);
    if (panelRef.current) resizeObserver.observe(panelRef.current);
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    window.visualViewport?.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('scroll', schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      window.visualViewport?.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('scroll', schedule);
    };
  }, [step]);

  const openAction = () => {
    const target = step.action && document.getElementById(step.action.targetId);
    if (!target || !actionReady) return;
    onPause(false);
    // Let the dialog release its focus trap before opening the real form.
    requestAnimationFrame(() => {
      target.focus({ preventScroll: true });
      target.click();
    });
  };

  return (
    <>
    {/* Allow even the last control on a short page to scroll above the sheet. */}
    {step.targetId && <div aria-hidden="true" className={styles.scrollSpace} />}
    <Dialog open onClose={() => onPause()} initialFocus={headingRef} className={styles.root}>
      <svg className={styles.backdrop} aria-hidden="true" width="100%" height="100%">
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />
            {highlight && <rect width={highlight.width} height={highlight.height} x={highlight.left} y={highlight.top} rx="16" fill="black" />}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="#211d18" fillOpacity="0.68" mask={`url(#${maskId})`} />
      </svg>
      {highlight && <div aria-hidden="true" className={styles.highlight} style={highlight} />}
      <DialogPanel
        ref={panelRef}
        className={`${styles.panel} ${!step.targetId ? styles.welcome : ''}`}
        style={position ? { ...position, bottom: 'auto', transform: 'none' } : undefined}
      >
        <div className={styles.header}>
          <p className={styles.counter} aria-live="polite" aria-atomic="true">Step {stepIndex + 1} of {petOwnerTourSteps.length}</p>
          <button type="button" onClick={() => onPause()} className={styles.close} aria-label="Pause tour">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.progress} aria-hidden="true">
          {petOwnerTourSteps.map((item, index) => <span key={item.title} data-filled={index <= stepIndex} />)}
        </div>
        <div className={styles.body} data-tour-body>
          <DialogTitle as="h2" ref={headingRef} tabIndex={-1} className={styles.title}>{step.title}</DialogTitle>
          <Description className={styles.description}>{step.description}</Description>
          <ol className={styles.instructions}>
            {step.items.map((item, index) => (
              <li key={item}><span aria-hidden="true">{index + 1}</span><p>{item}</p></li>
            ))}
          </ol>
          <div className={styles.note}><Info size={18} aria-hidden="true" /><p>{step.note}</p></div>
          {step.action && <button type="button" className={styles.action} disabled={!actionReady} onClick={openAction}>{step.action.label}<ArrowRight size={17} aria-hidden="true" /></button>}
        </div>
        <div className={styles.footer}>
          <div className={styles.controls}>
            <button type="button" className={styles.back} disabled={stepIndex === 0} onClick={onBack}><ArrowLeft size={17} aria-hidden="true" />Back</button>
            <button type="button" className={styles.next} onClick={onNext}>{step.nextLabel}<ArrowRight size={17} aria-hidden="true" /></button>
          </div>
          <button type="button" className={styles.skip} onClick={() => onPause()}>Skip for now · continue anytime</button>
        </div>
      </DialogPanel>
    </Dialog>
    </>
  );
}
