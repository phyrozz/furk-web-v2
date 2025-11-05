import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import Button from '../../../common/Button';
import MerchantNavbar from '../../../common/MerchantNavbar';
import { Service } from './types';
import ServiceList from './ServiceList';
import ServiceDetails from './ServiceDetails';
import { useNavigate } from 'react-router-dom';

const DEFAULT_LEFT_PANE_WIDTH = 4;

const ManageService = () => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [leftPaneCols, setLeftPaneCols] = useState(DEFAULT_LEFT_PANE_WIDTH);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const handleServiceStatusChange = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    setSelectedService(null);
  }, []);

  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - containerRect.left;
      const containerWidth = containerRect.width;
      const percentage = Math.max(0.2, Math.min(0.8, x / containerWidth));
      const cols = Math.round(percentage * 12);
      const clampedCols = Math.max(2, Math.min(10, cols));
      setLeftPaneCols(clampedCols);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    };

    const divider = document.getElementById('pane-divider');
    if (divider) {
      divider.addEventListener('mousedown', handleMouseDown);
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (divider) {
        divider.removeEventListener('mousedown', handleMouseDown);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      handleMouseUp();
    };
  }, [isMobile]);

  return (
    <>
      <MerchantNavbar />
      <div className="min-h-screen bg-gray-50 p-6 pt-24">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header with Add Service Button */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="font-bold font-cursive text-gray-900 text-2xl">Manage Services</h1>
              <div className="flex gap-2">
                <Button
                  onClick={() => navigate('/merchant/add-service')}
                  className="flex items-center gap-2"
                >
                  <Plus size={20} />
                  Add New Service
                </Button>
              </div>
            </div>

            {/* Mobile Layout */}
            {isMobile ? (
              <div className="flex flex-col gap-6">
                <ServiceList
                  selectedService={selectedService}
                  onSelectService={setSelectedService}
                  onServiceStatusChange={handleServiceStatusChange}
                  key={refreshTrigger}
                />
                {selectedService ? (
                  <ServiceDetails 
                    service={selectedService} 
                    onStatusChange={handleServiceStatusChange}
                  />
                ) : (
                  <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                    Select a service to view details
                  </div>
                )}
              </div>
            ) : (
              /* Split Pane Layout for Desktop */
              <div ref={containerRef} className="flex relative">
                {/* Service List */}
                <div
                  className="min-w-[320px] max-w-[800px] flex-shrink-0"
                  style={{ width: `${(leftPaneCols / 12) * 100}%` }}
                >
                  <ServiceList
                    selectedService={selectedService}
                    onSelectService={setSelectedService}
                    onServiceStatusChange={handleServiceStatusChange}
                    key={refreshTrigger}
                  />
                </div>

                {/* Resizer */}
                <div
                  id="pane-divider"
                  className="w-2 cursor-col-resize flex items-center justify-center bg-gray-200 hover:bg-blue-400 transition-colors"
                >
                  <div className="w-1 h-8 bg-gray-400 rounded-full"></div>
                </div>

                {/* Service Details */}
                <div className="flex-1 min-w-0">
                  {selectedService ? (
                    <ServiceDetails 
                      service={selectedService} 
                      onStatusChange={handleServiceStatusChange}
                    />
                  ) : (
                    <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                      Select a service to view details
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ManageService;