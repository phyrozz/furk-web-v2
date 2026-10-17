import { useState } from 'react';
import { Dialog, DialogBackdrop, DialogDescription, DialogPanel, DialogTitle } from '@headlessui/react';
import { ArrowRight, Lightbulb, Play, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTutorialVideoUrl, type Tutorial } from '../../data/tutorials';
import TutorialVideo from './TutorialVideo';
import styles from './TutorialGuide.module.css';

interface TutorialGuideProps {
  tutorial: Tutorial | null;
  onClose: () => void;
  showAction?: boolean;
}

const TutorialGuide = ({ tutorial, onClose, showAction = true }: TutorialGuideProps) => {
  const [failedVideoUrl, setFailedVideoUrl] = useState<string>();
  if (!tutorial) return null;

  const videoUrl = getTutorialVideoUrl(tutorial.id, import.meta.env.VITE_CDN_URL);
  const hasVideo = Boolean(videoUrl);
  const videoFailed = Boolean(videoUrl && failedVideoUrl === videoUrl);

  return (
    <Dialog open onClose={onClose} className="relative z-[150]">
      <DialogBackdrop className={styles.backdrop} />
      <div className="fixed inset-0 overflow-y-auto p-3 sm:p-6">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel
            className={`flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)] ${
              hasVideo ? 'max-w-5xl' : 'max-w-2xl'
            }`}
          >
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-7 sm:py-5">
              <div className="min-w-0">
                <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-700">
                  <Lightbulb size={13} aria-hidden="true" />
                  Useful tips & tricks
                </p>
                <DialogTitle className="text-xl font-bold leading-tight text-gray-900 sm:text-2xl">
                  {tutorial.title}
                </DialogTitle>
                <DialogDescription className="mt-1.5 max-w-2xl text-sm leading-relaxed text-gray-600">
                  {tutorial.description}
                </DialogDescription>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close tutorial"
                className="shrink-0 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
              >
                <X size={21} aria-hidden="true" />
              </button>
            </header>

            <div
              className={`min-h-0 flex-1 overflow-y-auto ${
                hasVideo ? 'lg:grid lg:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.15fr)]' : ''
              }`}
            >
              {videoUrl && (
                <section aria-label="Video walkthrough" className={`${styles.videoPanel} flex flex-col items-center gap-3 px-4 py-5 sm:px-6 sm:py-6`}>
                  <div className={`${styles.videoLabel} flex w-full max-w-md items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em]`}>
                    <Play size={14} aria-hidden="true" />
                    Video walkthrough
                  </div>
                  <div className={`${styles.videoFrame} mx-auto shadow-2xl ring-1 ring-white/15`}>
                    {videoFailed ? (
                      <div className={styles.videoUnavailable}>
                        <p role="status">This video is unavailable right now. You can still follow the quick how-to guide.</p>
                      </div>
                    ) : (
                      <TutorialVideo
                        key={videoUrl}
                        src={videoUrl}
                        title={tutorial.title}
                        onError={() => setFailedVideoUrl(videoUrl)}
                      />
                    )}
                  </div>
                </section>
              )}

              <section className="p-5 sm:p-7 lg:p-8">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-gray-900">Quick how-to</h3>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                    {tutorial.steps.length} steps
                  </span>
                </div>
                <ol className={styles.steps} role="list">
                  {tutorial.steps.map((step, index) => (
                    <li key={step} className={styles.step}>
                      <span aria-hidden="true" className={styles.stepNumber}>
                        {index + 1}
                      </span>
                      <span className={styles.stepText}>{step}</span>
                    </li>
                  ))}
                </ol>
                {tutorial.tip && (
                  <div className="mt-5 flex items-start gap-3 rounded-2xl border border-primary-100 bg-primary-50 p-4 text-sm leading-relaxed text-primary-800">
                    <Lightbulb size={19} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <p>{tutorial.tip}</p>
                  </div>
                )}
              </section>
            </div>

            <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-gray-100 bg-white px-4 py-3 sm:px-7 sm:py-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-5 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
              >
                Got it
              </button>
              {showAction && (
                <Link
                  to={tutorial.action.to}
                  onClick={onClose}
                  className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                >
                  {tutorial.action.label}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              )}
            </footer>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

export default TutorialGuide;
