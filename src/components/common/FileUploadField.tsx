import { useState } from 'react';

export interface UploadedFile {
  file: File;
  preview: string;
}

interface FileUploadFieldProps {
  label: string;
  required?: boolean;
  accept?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  helperText?: string;
}

const FileUploadField = ({
  label,
  required = false,
  accept = '*/*',
  maxFiles = 5,
  maxSizeMB = 5,
  files,
  onFilesChange,
  helperText
}: FileUploadFieldProps) => {
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    // Filter files by size
    const validFiles = selectedFiles.filter(file => file.size <= maxSizeBytes);

    if (validFiles.length < selectedFiles.length) {
      console.warn(`Some files were skipped because they exceed the ${maxSizeMB}MB size limit`);
    }

    // Create preview URLs and add new files
    const newFiles = await Promise.all(
      validFiles.map(async (file) => ({
        file,
        preview: URL.createObjectURL(file)
      }))
    );

    // Combine with existing files, respecting maxFiles limit
    const updatedFiles = [...files, ...newFiles].slice(0, maxFiles);
    onFilesChange(updatedFiles);

    // Reset input value to allow uploading the same file again
    event.target.value = '';
  };

  const handleFileDelete = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    onFilesChange(updatedFiles);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="mt-2 grid grid-cols-2 gap-4">
        {files.map((file, index) => (
          <div key={index} className="relative">
            <img
              src={file.preview}
              alt={`Preview ${index + 1}`}
              className="w-full h-40 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={() => handleFileDelete(index)}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              ×
            </button>
          </div>
        ))}
        {files.length < maxFiles && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center">
            <label className="cursor-pointer text-center">
              <input
                type="file"
                accept={accept}
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <span className="text-primary-600 hover:text-primary-500">
                Upload File
              </span>
            </label>
          </div>
        )}
      </div>
      {helperText && (
        <p className="mt-2 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default FileUploadField;