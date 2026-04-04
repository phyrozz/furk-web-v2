import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, X } from 'lucide-react';
import Button from '../../common/Button';
import packageJson from '../../../../package.json';

const STORAGE_KEY = 'furk_home_version_unlocked';

const HiddenPreviewDrawer = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsUnlocked(localStorage.getItem(STORAGE_KEY) === 'true');

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.shiftKey && event.altKey && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        const nextUnlocked = localStorage.getItem(STORAGE_KEY) !== 'true';
        localStorage.setItem(STORAGE_KEY, String(nextUnlocked));
        setIsUnlocked(nextUnlocked);
        setIsOpen(nextUnlocked);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isUnlocked) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/95 px-4 py-2 text-sm font-semibold text-primary-700 shadow-lg backdrop-blur transition hover:bg-primary-50"
        aria-label="Open hidden version preview"
      >
        <Eye size={16} />
        Version
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 py-6 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl"
              initial={{ y: 36, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-primary-100 bg-gradient-to-r from-primary-50 via-white to-amber-50 px-5 py-4">
                <div>
                  <h2 className="mt-1 font-cursive text-2xl font-bold text-gray-800">
                    Debug Info
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    color="primary"
                    size="sm"
                    onClick={() => {
                      localStorage.removeItem(STORAGE_KEY);
                      setIsOpen(false);
                      setIsUnlocked(false);
                    }}
                  >
                    Hide
                  </Button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                    aria-label="Close preview"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <div className="rounded-2xl border border-primary-100 bg-[radial-gradient(circle_at_top_left,_rgba(156,122,84,0.18),_transparent_32%),linear-gradient(180deg,_#fffaf4_0%,_#ffffff_100%)] p-6">
                  <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="font-cursive text-3xl font-bold text-gray-900">
                        Furk UI v{packageJson.version}
                      </h3>
                      <p className="mt-2 max-w-lg text-base leading-7 text-gray-700">
                        This is a private homepage-only version marker. Normal visitors will not see it unless you unlock it with <span className="font-semibold text-gray-900">Shift + Alt + V</span>.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                      Shortcut
                    </p>
                    <p className="mt-2 text-sm text-gray-700">
                      Press <span className="font-semibold text-gray-900">Shift + Alt + V</span> anywhere on the homepage to toggle this panel.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                      Visibility
                    </p>
                    <p className="mt-2 text-sm text-gray-700">
                      Stored locally in your browser only, so random visitors never see it by default.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HiddenPreviewDrawer;
