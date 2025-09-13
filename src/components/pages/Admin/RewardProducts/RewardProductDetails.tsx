import React, { useEffect, useState } from 'react';
import { RewardProduct } from '../../../../models/reward-product';
import DateUtils from '../../../../utils/date-utils';
import { ExpandIcon, X, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../../common/Button';
import UpdateRewardProductForm from './UpdateRewardProduct';

interface Props {
  rewardProduct: RewardProduct | null;
  onUpdated?: (updated: RewardProduct) => void;
}

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 1000 : -1000, opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 1000 : -1000, opacity: 0 })
};

const RewardProductDetails: React.FC<Props> = ({ rewardProduct, onUpdated }) => {
  // --- ALL hooks declared here (top-level) ---
  const [imageModalOpen, setImageModalOpen] = useState<boolean>(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // attachments array is always safe to use
  const attachments = rewardProduct?.attachments ?? [];

  // Reset index when product identity changes (safe: optional chaining + null coalesce)
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [rewardProduct?.id ?? null]);

  // Clamp index when attachments length changes to avoid out-of-bounds index
  useEffect(() => {
    if (attachments.length === 0) {
      setCurrentImageIndex(0);
      return;
    }
    setCurrentImageIndex(prev => Math.min(prev, attachments.length - 1));
  }, [attachments.length]);

  // helpers
  const nextImage = () => {
    if (attachments.length === 0) return;
    setCurrentImageIndex(prev => (prev === attachments.length - 1 ? 0 : prev + 1));
  };

  const previousImage = () => {
    if (attachments.length === 0) return;
    setCurrentImageIndex(prev => (prev === 0 ? attachments.length - 1 : prev - 1));
  };

  const handleEditSuccess = (updatedFields: Partial<RewardProduct>) => {
    // close editor
    setIsEditing(false);

    // optimistic merged product
    if (!rewardProduct) return;
    const updated: RewardProduct = {
      ...rewardProduct,
      ...updatedFields,
      modified_at: new Date().toISOString()
    };
    onUpdated?.(updated);
  };

  // --- safe early return AFTER hooks ---
  if (!rewardProduct) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        Select a product to view details
      </div>
    );
  }

  // current image (safe fallback)
  const safeImage = attachments[currentImageIndex] ?? '';

  return (
    <div className="bg-white rounded-lg shadow p-6 select-none">
      <AnimatePresence>
        {imageModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setImageModalOpen(false)}
            key="image-modal"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={safeImage}
                alt="Product Image"
                className="max-h-[80vh] max-w-[90vw] rounded-lg"
              />
              <button
                onClick={() => setImageModalOpen(false)}
                className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-1 hover:bg-opacity-75"
              >
                <X size={24} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Details</h2>
        <Button
          variant="ghost"
          icon={<Edit2 size={16} />}
          onClick={() => setIsEditing(true)}
        >
          Edit
        </Button>
      </div>

      {isEditing ? (
        <UpdateRewardProductForm
          product={rewardProduct}
          onSuccess={handleEditSuccess}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="space-y-4">
          {attachments.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Images</p>
              <div className="relative h-64 overflow-hidden rounded-lg">
                <AnimatePresence initial={false} custom={currentImageIndex}>
                  <motion.div
                    key={`${rewardProduct.id}-${currentImageIndex}`} // ensure animation re-mounts correctly per product+index
                    custom={currentImageIndex}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: 'spring', stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 }
                    }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    onDragEnd={(e, { offset, velocity }) => {
                      const swipe = Math.abs(offset.x) * velocity.x;
                      const threshold = 10000;
                      if (swipe < -threshold) nextImage();
                      else if (swipe > threshold) previousImage();
                    }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <img
                      src={safeImage}
                      alt={`Product image ${currentImageIndex + 1}`}
                      className="w-full h-64 object-cover"
                      onClick={() => setImageModalOpen(true)}
                    />
                    <button
                      className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 rounded-lg hover:bg-opacity-75"
                      onClick={() => setImageModalOpen(true)}
                    >
                      <ExpandIcon size={16} className="text-white" />
                    </button>
                    <button
                      className="absolute left-2 p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-75"
                      onClick={(e) => {
                        e.stopPropagation();
                        previousImage();
                      }}
                    >
                      <ChevronLeft size={24} className="text-white" />
                    </button>
                    <button
                      className="absolute right-2 p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-75"
                      onClick={(e) => {
                        e.stopPropagation();
                        nextImage();
                      }}
                    >
                      <ChevronRight size={24} className="text-white" />
                    </button>
                  </motion.div>
                </AnimatePresence>

                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
                  {attachments.map((_, index) => (
                    <button
                      key={index}
                      className={`w-3 h-3 rounded-full ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'} hover:bg-white/75`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 select-text cursor-default mt-4">
            <div>
              <p className="text-sm text-gray-500">Product Name</p>
              <p className="text-gray-900 break-words">{rewardProduct.product_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Business Name</p>
              <p className="text-gray-900 break-words">{rewardProduct.sponsor_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="text-gray-900 break-words">{rewardProduct.description}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Required Furkoins</p>
              <p className="text-gray-900 break-words">{rewardProduct.required_furkoins}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Stock</p>
              <p className="text-gray-900 break-words">{rewardProduct.stock}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created At</p>
              <p className="text-gray-900 break-words">{DateUtils.formatDateStringFromTimestamp(rewardProduct.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Modified At</p>
              <p className="text-gray-900 break-words">{DateUtils.formatDateStringFromTimestamp(rewardProduct.modified_at)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardProductDetails;
