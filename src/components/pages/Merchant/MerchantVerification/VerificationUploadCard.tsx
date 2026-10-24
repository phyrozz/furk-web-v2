import { useState } from 'react';
import { AlertCircle, Check, FileText, Film, Image, Upload, X } from 'lucide-react';
import type { UploadedFile, UploadRequirement } from './types';

interface VerificationUploadCardProps {
  requirement: UploadRequirement;
  upload?: UploadedFile | null;
  disabled: boolean;
  onFileChange: (requirement: UploadRequirement, file: File) => void;
  onRemove: (id: string) => void;
}

const VerificationUploadCard = ({ requirement, upload, disabled, onFileChange, onRemove }: VerificationUploadCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const Icon = requirement.type === 'video' ? Film : requirement.type === 'photo' ? Image : FileText;
  const isReady = upload?.status === 'success';
  const inputId = `file-${requirement.id}`;

  return (
    <div id={`upload-${requirement.id}`} className={`flex min-w-0 scroll-mt-24 flex-col rounded-xl border bg-white p-4 sm:p-5 ${upload?.error ? 'border-error-300' : isReady ? 'border-success-200' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <span className={`rounded-lg p-2 ${isReady ? 'bg-success-50 text-success-800' : 'bg-primary-50 text-primary-600'}`}><Icon size={18} aria-hidden="true" /></span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isReady ? 'bg-success-50 text-success-800' : 'bg-gray-100 text-gray-600'}`}>{isReady ? 'Ready' : requirement.required ? 'Required' : 'Optional'}</span>
      </div>
      <h4 className="mt-3 text-sm font-bold text-gray-900">{requirement.name}</h4>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-gray-600">{requirement.description}</p>
      {upload && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
          {upload.preview && requirement.type !== 'video' && <img src={upload.preview} alt={`Preview of ${requirement.name}`} className="mb-3 h-28 w-full rounded-md object-contain" />}
          {upload.preview && requirement.type === 'video' && <video src={upload.preview} controls preload="metadata" aria-label={`Preview of ${requirement.name}`} className="mb-3 h-28 w-full rounded-md bg-gray-900 object-contain" />}
          <div className="flex items-center gap-2">
            {isReady ? <Check size={16} className="shrink-0 text-success-800" aria-hidden="true" /> : <AlertCircle size={16} className="shrink-0 text-error-700" aria-hidden="true" />}
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-gray-800" title={upload.file.name}>{upload.file.name}</p><p className="mt-0.5 text-xs text-gray-500">{(upload.file.size / (1024 * 1024)).toFixed(2)} MB</p></div>
            <button type="button" onClick={() => onRemove(requirement.id)} disabled={disabled} aria-label={`Remove ${requirement.name}`} className="rounded-lg p-2 text-gray-500 hover:bg-error-50 hover:text-error-700 disabled:opacity-50"><X size={16} aria-hidden="true" /></button>
          </div>
        </div>
      )}
      {upload?.error && <p id={`${inputId}-error`} role="alert" className="mt-2 text-xs text-error-700">{upload.error}</p>}
      <label
        htmlFor={inputId}
        onDragOver={event => { event.preventDefault(); if (!disabled) setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={event => {
          event.preventDefault();
          setIsDragging(false);
          const file = event.dataTransfer.files[0];
          if (!disabled && file) onFileChange(requirement, file);
        }}
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-3 py-4 text-center transition-colors focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 ${isDragging ? 'border-primary-600 bg-primary-100' : 'border-primary-200 bg-primary-50/50 hover:border-primary-400 hover:bg-primary-50'} ${disabled ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input id={inputId} type="file" className="sr-only" accept={requirement.acceptedFormats.join(',')} disabled={disabled} aria-label={`${upload ? 'Replace' : 'Choose'} ${requirement.name}`} aria-invalid={Boolean(upload?.error)} aria-describedby={`${inputId}-formats${upload?.error ? ` ${inputId}-error` : ''}`} onChange={event => {
          const file = event.target.files?.[0];
          if (file) onFileChange(requirement, file);
          event.target.value = '';
        }} />
        <span className="inline-flex items-center gap-2 text-xs font-bold text-primary-700"><Upload size={16} aria-hidden="true" />{upload ? 'Replace file' : 'Choose a file or drop it here'}</span>
        <span id={`${inputId}-formats`} className="mt-1.5 text-xs leading-relaxed text-gray-500">{requirement.acceptedFormats.map(format => format.slice(1).toUpperCase()).join(', ')} · Up to {requirement.maxSize} MB</span>
      </label>
    </div>
  );
};

export default VerificationUploadCard;
