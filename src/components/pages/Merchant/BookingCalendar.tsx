import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { MerchantBookingsService } from '../../../services/merchant-bookings/merchant-bookings';
import Select from '../../common/Select';
import MerchantNavbar from '../../common/MerchantNavbar';
import Modal from '../../common/Modal';
import { motion } from 'framer-motion';
import Button from '../../common/Button';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import PawLoading from '../../common/PawLoading';

const localizer = momentLocalizer(moment);

interface BookingEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  status: string;
  bookingDetails: any;
  allDay?: boolean;
  resource?: any;
  isPending?: boolean;
}

const BookingCalendar: React.FC = () => {
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<View>('month');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);
  const [startLoading, setStartLoading] = useState<boolean>(false);
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);
  const [completeLoading, setCompleteLoading] = useState<boolean>(false);
  const bookingsService = new MerchantBookingsService();

  const statusOptions = [
    { value: 'All', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingsService.listBookings(statusFilter, startDate, endDate);
      const formattedEvents: BookingEvent[] = response.data.map((booking: any) => {
        const eventDate = booking.start_datetime || booking.booking_datetime;
        const endDate = booking.end_datetime || moment(booking.booking_datetime).add(1, 'hour').toDate();
        
        return {
          id: booking.id,
          title: `${booking.service.name} - ${booking.user.first_name} ${booking.user.last_name}`,
          start: moment(eventDate).toDate(),
          end: moment(endDate).toDate(),
          status: booking.status,
          bookingDetails: booking,
          allDay: false,
          resource: booking.service.name,
          isPending: !booking.start_datetime && !booking.end_datetime
        };
      });
      setEvents(formattedEvents);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setLoading(false);
    }
  };

  const handleSelectEvent = (event: BookingEvent) => {
    setSelectedEvent(event.bookingDetails);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, startDate, endDate]);

  const handleNavigate = (newDate: Date) => {
    let firstDay, lastDay;
    
    if (currentView === 'agenda') {
      firstDay = moment(newDate).startOf('month').subtract(1, 'month').toDate();
      lastDay = moment(newDate).endOf('month').add(1, 'month').toDate();
    } else {
      firstDay = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
      lastDay = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0);
    }
    
    setStartDate(firstDay);
    setEndDate(lastDay);
  };

  const handleViewChange = (view: View) => {
    setCurrentView(view);
    if (view === 'agenda') {
      const firstDay = moment(startDate).subtract(1, 'month').toDate();
      const lastDay = moment(endDate).add(1, 'month').toDate();
      setStartDate(firstDay);
      setEndDate(lastDay);
    }
  };

  const eventPropGetter = (event: BookingEvent) => {
    let backgroundColor = '';
    let color = '#ffffff';
    
    switch (event.status) {
      case 'pending':
        backgroundColor = '#ffc107';
        color = '#000000';
        break;
      case 'confirmed':
        backgroundColor = '#28a745';
        break;
      case 'in_progress':
        backgroundColor = '#007bff';
        break;
      case 'completed':
        backgroundColor = '#6c757d';
        break;
      case 'cancelled':
        backgroundColor = '#dc3545';
        break;
      default:
        backgroundColor = '#6c757d';
    }
    
    return { 
      style: { 
        backgroundColor,
        color
      } 
    };
  };

  const formats = {
    agendaDateFormat: 'MMM D',
    agendaTimeFormat: 'hh:mm A',
    agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) => {
      return `${moment(start).format('hh:mm A')} - ${moment(end).format('hh:mm A')}`;
    }
  };

  return (
    <>
      <MerchantNavbar />
      <div className="p-6 pt-24 h-screen overflow-y-hidden flex flex-col cursor-default container mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-cursive font-bold">Bookings</h1>
          <Button icon={isControlsCollapsed ? <ChevronDownIcon /> : <ChevronUpIcon />} onClick={() => setIsControlsCollapsed(!isControlsCollapsed)} variant='ghost'>
            {isControlsCollapsed ? 'Show' : 'Hide'}
          </Button>
        </div>
        
        <motion.div 
          className={isControlsCollapsed ? "overflow-hidden" : "overflow-show"}
          animate={{ 
            height: isControlsCollapsed ? 0 : "auto",
          }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <Select
                options={statusOptions}
                value={{ value: statusFilter, label: statusOptions.find(opt => opt.value === statusFilter)?.label }}
                onChange={(selectedOption: { value: string; label: string | undefined } | null) => {
                  if (selectedOption) {
                    setStatusFilter(selectedOption.value);
                  }
                }}
                getOptionLabel={(option: { value: string; label: string | undefined; }) => option.label || ''}
              />
            </div>
            <div className="grid grid-cols-2 lg:flex md:items-center gap-2 lg:space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-[#ffc107]" />
                <span className="text-xs md:text-sm">Pending</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-[#28a745]" />
                <span className="text-xs md:text-sm">Confirmed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-[#007bff]" />
                <span className="text-xs md:text-sm">In Progress</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-[#6c757d]" />
                <span className="text-xs md:text-sm">Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-[#dc3545]" />
                <span className="text-xs md:text-sm">Cancelled</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="h-full flex-1 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
              <PawLoading />
            </div>
          )}
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            onNavigate={handleNavigate}
            onView={handleViewChange}
            eventPropGetter={eventPropGetter}
            onSelectEvent={handleSelectEvent}
            defaultView="month"
            views={['month', 'week', 'day', 'agenda']}
            formats={formats}
            length={30}
          />
        </div>
      </div>

      {/* <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Action"
      >
        <div className="p-4">
          <p className="mb-4">Are you sure you want to {actionType === 'confirm' ? 'confirm' : 'cancel'} this booking?</p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsConfirmModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              loading={submitLoading}
              onClick={executeAction}
            ></Button>
          </div>
        </div>
      </Modal> */}

      {selectedEvent && (
        <Modal isOpen={isModalOpen} onClose={closeModal} title="Booking Details">
          <div className="p-4 cursor-default">
              <div className="space-y-4">
                <p><strong>Service:</strong> {selectedEvent.service.name}</p>
                <p><strong>Customer:</strong> {selectedEvent.user.first_name} {selectedEvent.user.last_name}</p>
                <p><strong>Requested Date:</strong> {moment(selectedEvent.booking_datetime || selectedEvent.start_datetime).format('MMMM Do YYYY, h:mm a')}</p>
                {selectedEvent.start_datetime && (
                  <>
                    <p><strong>Start:</strong> {moment(selectedEvent.start_datetime).format('MMMM Do YYYY, h:mm a')}</p>
                    <p><strong>End:</strong> {moment(selectedEvent.end_datetime).format('MMMM Do YYYY, h:mm a')}</p>
                  </>
                )}
                <p><strong>Status:</strong> {selectedEvent.status}</p>
                <p><strong>Payment Status:</strong> {selectedEvent.payment_status}</p>
                {selectedEvent.remarks && <p><strong>Remarks:</strong> {selectedEvent.remarks}</p>}
              </div>

              <div className="space-y-4">
                <div className="pt-4">
                  <div className="flex gap-2 justify-end">
                    {selectedEvent.status === 'pending' && (
                      <Button
                        loading={confirmLoading}
                        onClick={async () => {
                          setConfirmLoading(true);
                          await bookingsService.confirmBooking(selectedEvent.id);
                          setConfirmLoading(false);
                          fetchBookings();
                          closeModal();
                        }}
                      >
                        Confirm Booking
                      </Button>
                    )}
                    
                    {selectedEvent.status === 'confirmed' && (
                      <>
                        <Button
                          loading={cancelLoading}
                          variant="outline"
                          color="red"
                          onClick={async () => {
                            setCancelLoading(true);
                            await bookingsService.cancelBooking(selectedEvent.id);
                            setCancelLoading(false);
                            fetchBookings();
                            closeModal();
                          }}
                        >
                          Cancel Booking
                        </Button>
                        <Button
                          loading={startLoading}
                          onClick={async () => {
                            setStartLoading(true);
                            await bookingsService.startService(selectedEvent.id);
                            setStartLoading(false);
                            fetchBookings();
                            closeModal();
                          }}
                        >
                          Start Service
                        </Button>
                      </>
                    )}
                    
                    {selectedEvent.status === 'in_progress' && (
                      <Button
                        loading={completeLoading}
                        onClick={async () => {
                          setCompleteLoading(true);
                          await bookingsService.completeService(selectedEvent.id);
                          setCompleteLoading(false);
                          fetchBookings();
                          closeModal();
                        }}
                      >
                        Complete Service
                      </Button>
                    )}
                  </div>
                </div>
              </div>
          </div>
        </Modal>
      )}


    </>
  );
};

export default BookingCalendar;