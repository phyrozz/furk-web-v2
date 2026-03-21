import Modal from '../../common/Modal';
import PawLoading from '../../common/PawLoading';

interface ProfileImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName?: string;
  step: 'uploading' | 'applying';
}

const ProfileImageUploadModal = ({ isOpen, onClose, fileName, step }: ProfileImageUploadModalProps) => {
  const isUploading = step === 'uploading';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Updating profile photo">
      <div className="flex flex-col items-center text-center py-2">
        <PawLoading size={72} />
        <h4 className="mt-6 text-lg font-semibold text-gray-900">
          {isUploading ? 'Uploading your photo' : 'Applying your new profile photo'}
        </h4>
        <p className="mt-2 text-sm text-gray-600 max-w-md">
          {isUploading
            ? 'Please keep this window open while we send your image to storage.'
            : 'Your photo has been uploaded. We are finishing the update so it appears on your profile.'}
        </p>
        {fileName && (
          <div className="mt-4 rounded-full bg-gray-100 px-4 py-2 text-xs font-medium text-gray-700">
            {fileName}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ProfileImageUploadModal;
