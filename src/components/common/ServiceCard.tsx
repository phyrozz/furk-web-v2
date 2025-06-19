import { motion } from 'framer-motion';
import Button from './Button';

interface ServiceCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  imageUrl?: string;
  onClick?: () => void;
  isImageLoaded?: boolean;
  onImageLoad?: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  description,
  icon,
  imageUrl,
  onClick,
  isImageLoaded = true,
  onImageLoad,
}) => {
  return (
    <motion.div
      className="bg-white rounded-xl shadow-md overflow-hidden h-full flex flex-col transition-all hover:shadow-lg"
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isImageLoaded ? 1 : 0, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {imageUrl && (
        <div className="h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onLoad={onImageLoad}
          />
        </div>
      )}
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex items-center mb-3">
          <div className="text-primary-500 mr-3">
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <p className="text-gray-600 mb-4 flex-grow">{description}</p>
        {/* <Button
          variant="outline"
          onClick={onClick}
          fullWidth
        >
          Learn More
        </Button> */}
      </div>
    </motion.div>
  );
};

export default ServiceCard;