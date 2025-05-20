import { useLocation, useNavigate } from 'react-router-dom';
import { PawPrint as Paw } from 'lucide-react';
import { motion } from 'framer-motion';
import ResetPasswordForm from './ResetPasswordForm';

const ResetPasswordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userType = location.state?.userType || 'user';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-md w-full space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="flex justify-center"
          variants={itemVariants}
        >
          <Paw size={64} className="text-primary-600" />
        </motion.div>

        <motion.div
          className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10"
          variants={itemVariants}
        >
          <ResetPasswordForm
            userType={userType}
            onCancel={() => navigate('/login')}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;