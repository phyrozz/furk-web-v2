import { motion, AnimatePresence } from 'framer-motion';
import React, { useEffect, useState, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { loginService } from '../../services/auth/auth-service';
import { userNotificationsService } from '../../services/user-notifications/user-notifications';
import { Loader, AlertTriangle, X, PawPrint, Heart } from 'lucide-react';

interface BookingProgress {
  user_id: string;
  service_id: string;
  service_name: string;
  booking_status: string;
  modified_at: string;
}

const statusConfig = {
  PENDING: {
    icon: Loader,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-50',
    message: 'Processing your pet service booking'
  },
  IN_PROGRESS: {
    icon: PawPrint,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    message: 'Your pet is being cared for'
  },
  COMPLETED: {
    icon: Heart,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    message: 'Pet service completed'
  },
  ERROR: {
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    message: 'Something went wrong'
  }
};

interface BookingProgressTrackerProps {
  isAuthenticated: boolean;
}

const BookingProgressTracker: React.FC<BookingProgressTrackerProps> = ({ isAuthenticated }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [progress, setProgress] = useState<BookingProgress | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const INITIAL_RECONNECT_DELAY = 1000;
  const hasConnectedRef = useRef(false);

  const connect = async () => {
    const authenticated = await loginService.isAuthenticated();
    if (!authenticated) return;

    const token = localStorage.getItem('cognitoIdToken');
    if (!token) return;

    const websocketUrl = 'wss://5ylewlt03g.execute-api.ap-southeast-1.amazonaws.com/dev/';
    
    if (wsRef.current) return;

    const ws = new WebSocket(`${websocketUrl}?token=${token}`);

    ws.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket message:', data);
        // If the websocket sends a single booking progress, update the state
        if (data && typeof data === 'object' && data.booking_status) {
          setProgress(data);
        } else if (Array.isArray(data) && data.length > 0) {
          // If it sends a list, find the most recent one and update
          const mostRecent = data.sort((a: BookingProgress, b: BookingProgress) => new Date(b.modified_at).getTime() - new Date(a.modified_at).getTime())[0];
          setProgress(mostRecent);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = (event) => {
      if (!event.wasClean) {
        console.log(`WebSocket Disconnected: ${event.code} ${event.reason}`);
      }
      setIsConnected(false);
      wsRef.current = null;

      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(
          INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current),
          30000
        );
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current += 1;
          connect();
        }, delay);
      } else {
        console.log('Max reconnection attempts reached');
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    wsRef.current = ws;

    if (hasConnectedRef.current) return;
    hasConnectedRef.current = true;
  };

  useEffect(() => {
    if (!isAuthenticated) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setProgress(null);
      return;
    }

    const fetchAndConnect = async () => {
      try {
        const inProgressServices = await userNotificationsService.listInProgressServices(1, 0);
        if (inProgressServices.data && inProgressServices.data.length > 0) {
          const mostRecent = inProgressServices.data.sort((a: BookingProgress, b: BookingProgress) => new Date(b.modified_at).getTime() - new Date(a.modified_at).getTime())[0];
          setProgress(mostRecent);
        }
      } catch (error) {
        console.error('Failed to fetch in-progress services:', error);
      }
      connect();
    };

    fetchAndConnect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated]);

  const getStatusConfig = (status: string) => {
    const normalizedStatus = status.toUpperCase();
    return statusConfig[normalizedStatus as keyof typeof statusConfig] || statusConfig.ERROR;
  };

  const handleClose = () => {
    setProgress(null);
  };

  return (
    isAuthenticated && <AnimatePresence>
      {progress && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed w-full bottom-0 left-0 right-0 p-4 z-50"
        >
          <div className="container mx-auto max-w-md">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Booking</h3>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsCollapsed(!isCollapsed)}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                      aria-label={isCollapsed ? 'Expand booking tracker' : 'Collapse booking tracker'}
                    >
                      {isCollapsed ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                    {!isConnected && (
                      <div className="flex items-center text-yellow-500 text-sm">
                        <Loader className="animate-spin mr-2" />
                        Reconnecting...
                      </div>
                    )}
                    {progress.booking_status === 'completed' &&
                      <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                        aria-label="Close booking tracker"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    }
                  </div>
                </div>
                <motion.div
                  initial={false}
                  animate={{ height: isCollapsed ? 0 : 'auto', opacity: isCollapsed ? 0 : 1 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <a href={"/services/" + progress.service_id}>
                    <div className={`rounded-lg p-4 ${getStatusConfig(progress.booking_status).bgColor}`}>
                      <div className="flex items-center">
                        <div className={`${getStatusConfig(progress.booking_status).color} mr-4`}>
                          {React.createElement(getStatusConfig(progress.booking_status).icon, {
                            className: progress.booking_status === 'PENDING' ? 'animate-spin h-8 w-8' : 'h-8 w-8'
                          })}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{progress.service_name}</p>
                          <p className="text-sm text-gray-600">{getStatusConfig(progress.booking_status).message}</p>
                        </div>
                      </div>
                    </div>
                  </a>
                
                  <div className="h-2 w-full bg-gray-200">
                    <motion.div
                      className="h-full bg-primary-600"
                      initial={{ width: "0%" }}
                      animate={{
                        width: progress.booking_status === 'COMPLETED' ? "100%" : "66%"
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BookingProgressTracker;