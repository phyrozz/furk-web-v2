import { useEffect, useRef, useState } from 'react';
import { BookOpen, ChevronRight, Lightbulb, Shuffle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSuggestedTutorials, getTutorialsForAudience, type Tutorial, type TutorialAudience } from '../../data/tutorials';
import TutorialGuide from './TutorialGuide';

interface FloatingTutorialsProps {
  audience: TutorialAudience;
  pathname: string;
}

const FloatingTutorials = ({ audience, pathname }: FloatingTutorialsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState(() => getSuggestedTutorials(audience, pathname));
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isExpanded || selectedTutorial) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsExpanded(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded, selectedTutorial]);

  const shuffleTopics = () => {
    const shuffled = [...getTutorialsForAudience(audience)];
    for (let index = shuffled.length - 1; index > 0; index--) {
      const next = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[next]] = [shuffled[next], shuffled[index]];
    }
    setSuggestions(shuffled.slice(0, 3));
  };

  return (
    <>
      <div
        ref={containerRef}
        className={`fixed ${audience === 'pet-owner' ? 'bottom-[calc(7rem_+_env(safe-area-inset-bottom))] lg:bottom-6' : 'bottom-[max(1.5rem,env(safe-area-inset-bottom))]'} left-4 z-30 flex flex-col items-start gap-3 ${audience === 'merchant' ? 'lg:left-[calc(var(--merchant-navbar-width,18rem)+1rem)]' : ''}`}
      >
        {isExpanded && (
          <section id="floating-tutorial-topics" aria-labelledby="floating-tutorial-heading" className="max-h-[calc(100dvh-8rem)] w-80 max-w-[calc(100vw-2rem)] space-y-3 overflow-y-auto rounded-3xl border border-primary-100 bg-white/95 p-4 shadow-xl backdrop-blur">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 id="floating-tutorial-heading" className="font-bold text-gray-900">A little help, one tap away</h2>
                <p className="mt-1 text-xs text-gray-500">Quick guides for {audience === 'merchant' ? 'merchants' : 'pet owners'}</p>
              </div>
              <button type="button" aria-label="Hide tutorial topics" onClick={() => { setIsExpanded(false); toggleRef.current?.focus(); }} className="rounded-full p-2 text-gray-500 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"><X size={18} aria-hidden="true" /></button>
            </div>
            <div className="space-y-2" aria-live="polite">
              {suggestions.map((tutorial) => (
                <button
                  key={tutorial.id}
                  type="button"
                  aria-haspopup="dialog"
                  onClick={() => setSelectedTutorial(tutorial)}
                  className="flex w-full items-center gap-3 rounded-full border border-primary-100 bg-primary-50 px-4 py-3 text-left text-sm font-medium text-primary-800 transition-colors hover:border-primary-300 hover:bg-primary-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
                >
                  <BookOpen size={17} className="shrink-0" aria-hidden="true" />
                  <span className="flex-1">{tutorial.title}</span>
                  <ChevronRight size={16} className="shrink-0" aria-hidden="true" />
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 pt-1 text-xs font-semibold">
              <button type="button" onClick={shuffleTopics} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-gray-600 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"><Shuffle size={14} aria-hidden="true" />More topics</button>
              <Link to="/help" onClick={() => setIsExpanded(false)} className="rounded-lg px-2 py-2 text-primary-700 hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500">All guides →</Link>
            </div>
          </section>
        )}
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={isExpanded}
          aria-controls="floating-tutorial-topics"
          onClick={() => setIsExpanded((expanded) => !expanded)}
          className="inline-flex min-h-12 items-center gap-2 rounded-full border border-primary-200 bg-white px-4 py-3 text-sm font-semibold text-primary-800 shadow-lg transition-colors hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        >
          <Lightbulb size={21} className="text-primary-600" aria-hidden="true" />Tips & Tricks
        </button>
      </div>
      <TutorialGuide tutorial={selectedTutorial} onClose={() => setSelectedTutorial(null)} />
    </>
  );
};

export default FloatingTutorials;
