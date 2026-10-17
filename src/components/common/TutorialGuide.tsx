import { useState } from 'react';
import { Dialog, DialogBackdrop, DialogDescription, DialogPanel, DialogTitle } from '@headlessui/react';
import { ArrowRight, Lightbulb, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTutorialVideoUrl, type Tutorial } from '../../data/tutorials';

interface TutorialGuideProps {
  tutorial: Tutorial | null;
  onClose: () => void;
  showAction?: boolean;
}

const TutorialGuide = ({ tutorial, onClose, showAction = true }: TutorialGuideProps) => {
  const [failedVideoUrl, setFailedVideoUrl] = useState<string>();
  if (!tutorial) return null;

  const videoUrl = getTutorialVideoUrl(tutorial.id, import.meta.env.VITE_CDN_URL);

  return (
    <Dialog open onClose={onClose} className="relative z-[150]">
      <DialogBackdrop className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel className="w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl sm:p-8">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary-600">Useful tips & tricks</p>
                <DialogTitle className="text-2xl font-bold text-gray-900">{tutorial.title}</DialogTitle>
                <DialogDescription className="mt-2 text-sm leading-relaxed text-gray-600">
                  {tutorial.description}
                </DialogDescription>
              </div>
              <button type="button" onClick={onClose} aria-label="Close tutorial" className="rounded-full p-2 text-gray-500 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500">
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            {videoUrl && failedVideoUrl !== videoUrl && (
              <div className="mb-6 overflow-hidden rounded-2xl bg-black">
                <video
                  key={videoUrl}
                  src={videoUrl}
                  controls
                  playsInline
                  preload="none"
                  aria-label={`${tutorial.title} video tutorial`}
                  onError={() => setFailedVideoUrl(videoUrl)}
                  className="aspect-video w-full object-contain"
                >
                  Your browser does not support video playback. Follow the written guide below.
                </video>
              </div>
            )}
            {videoUrl && failedVideoUrl === videoUrl && (
              <p role="status" className="mb-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                This video is unavailable right now. You can still follow the quick guide below.
              </p>
            )}

            <h3 className="mb-4 font-semibold text-gray-900">Quick how-to</h3>
            <ol className="space-y-4">
              {tutorial.steps.map((step, index) => (
                <li key={step} className="flex items-start gap-3 text-sm leading-relaxed text-gray-700">
                  <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">{index + 1}</span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
            {tutorial.tip && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl bg-primary-50 p-4 text-sm leading-relaxed text-primary-800">
                <Lightbulb size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
                <p>{tutorial.tip}</p>
              </div>
            )}
            <div className="mt-7 flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-5">
              <button type="button" onClick={onClose} className="rounded-full px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500">Got it</button>
              {showAction && (
                <Link to={tutorial.action.to} onClick={onClose} className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500">
                  {tutorial.action.label}<ArrowRight size={16} aria-hidden="true" />
                </Link>
              )}
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

export default TutorialGuide;
