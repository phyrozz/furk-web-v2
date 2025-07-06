import React, { useState } from 'react';
import Modal from '../../common/Modal';
import Input from '../../common/Input';
import { Rating } from 'react-simple-star-rating';
import { PetServicesService } from '../../../services/pet-services/pet-services';

interface ReviewDialogProps {
  serviceId: number;
  onReviewSubmit: () => void;
}

export interface ReviewForm {
  rating: number;
  service_id: number;
  review: string;
  review_title: string;
}

const ReviewDialog: React.FC<ReviewDialogProps> = ({ serviceId, onReviewSubmit }) => {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [review, setReview] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const onClose = () => setIsOpen(false);

  const dataService = new PetServicesService();

  const handleRating = (rate: number) => {
    setRating(rate);
  };

  const handleSubmit = async () => {
    const data: ReviewForm = {
      rating: rating * 2,
      service_id: serviceId,
      review: review,
      review_title: title,
    };
    await dataService.submitReview(data);
    onReviewSubmit();
    onClose();
  };

  return (
    <Modal
      title="Write a Review"
      showConfirm
      showCancel
      onConfirm={() => {
        handleSubmit();
      }}
      onClose={() => {
        onClose();
      }}
      isOpen={isOpen}
      confirmDisabled={rating === 0}
    >
      <div className="space-y-4">
        <div>
          <p>How was the experience with the service? Leave a review to earn extra reward points.</p>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Rating
          </label>
          <div className="flex w-full justify-start items-center">
            <Rating
              onClick={handleRating}
              initialValue={rating}
              size={24}
              allowFraction={true}
              SVGstyle={{ "display": "inline" }}
              transition
            />
          </div>
        </div>
        
        <Input
          id="review-title"
          label="Review Title (Optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title for your review"
          maxLength={100}
        />

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Review (Optional)
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={4}
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Write your review here"
            maxLength={1000}
          />
        </div>
      </div>
    </Modal>
  );
}

export default ReviewDialog;