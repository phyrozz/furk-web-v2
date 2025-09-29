export interface UploadedFile {
  file: File;
  preview: string;
  type: 'image' | 'video' | 'document';
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
  const getFileType = (file: File): 'image' | 'video' | 'document' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
  };

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
        preview: URL.createObjectURL(file),
        type: getFileType(file)
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

  const renderFilePreview = (file: UploadedFile) => {
    switch (file.type) {
      case 'image':
        return (
          <img
            src={file.preview}
            alt={`Preview ${file.file.name}`}
            className="w-full h-40 object-cover rounded-lg"
          />
        );
      case 'video':
        return (
          <video
            src={file.preview}
            className="w-full h-40 object-cover rounded-lg"
            controls
          />
        );
      case 'document':
        return (
          <div className="w-full h-40 bg-gray-100 rounded-lg flex flex-col items-center justify-center p-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-600 text-center truncate w-full">
              {file.file.name}
            </p>
          </div>
        );
    }
  };

  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <div className="mt-2 grid grid-cols-2 gap-4">
        {files.map((file, index) => (
          <div key={index} className="relative">
            {renderFilePreview(file)}
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