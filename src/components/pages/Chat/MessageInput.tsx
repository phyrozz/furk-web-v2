import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Loader2, Send } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import styles from './Chat.module.css';

interface Props {
  onSend: (message: string) => void | Promise<void>;
}

export default function MessageInput({ onSend }: Props) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const busy = useRef(false);
  const errorId = useId();

  const submitMessage = async () => {
    if (!message.trim() || busy.current) return;
    busy.current = true;
    setSending(true);
    setError(false);
    try {
      await onSend(message.trim());
      setMessage('');
    } catch {
      setError(true);
    } finally {
      busy.current = false;
      setSending(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submitMessage();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // A mobile Return key adds a line. Hardware keyboards also support Enter to send.
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      event.preventDefault();
      void submitMessage();
    }
  };

  return (
    <form className={styles.composer} onSubmit={handleSubmit} aria-label="Send a message">
      {error && <p id={errorId} className={styles.sendError} role="alert">Your message couldn’t be sent. Your draft is saved here; try sending again.</p>}
      <div className={styles.composerRow}>
        <TextareaAutosize
          value={message}
          minRows={1}
          maxRows={5}
          onChange={event => { setMessage(event.target.value); setError(false); }}
          onKeyDown={handleKeyDown}
          readOnly={sending}
          aria-label="Message"
          aria-describedby={error ? errorId : undefined}
          placeholder="Write a message…"
        />
        <button type="submit" disabled={!message.trim() || sending} className={styles.sendButton} aria-label={sending ? 'Sending message' : 'Send message'} onMouseDown={event => event.preventDefault()}>
          {sending ? <Loader2 size={20} className={styles.spinner} aria-hidden="true" /> : <Send size={20} aria-hidden="true" />}
          <span>Send</span>
        </button>
      </div>
      {/* <p id={hintId} className={styles.composerHint}>Enter to send · Shift + Enter for a new line</p> */}
    </form>
  );
}
