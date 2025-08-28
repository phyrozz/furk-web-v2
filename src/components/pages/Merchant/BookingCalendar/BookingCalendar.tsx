import React, { useState, useEffect, useRef } from 'react';
import { Calendar, momentLocalizer, SlotInfo, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { MerchantBookingsService } from '../../../../services/merchant-bookings/merchant-bookings';
import Select from '../../../common/Select';
import MerchantNavbar from '../../../common/MerchantNavbar';
import { motion } from 'framer-motion';
import Button from '../../../common/Button';
import { ChevronDownIcon, ChevronUpIcon, DownloadIcon, PrinterIcon, SettingsIcon } from 'lucide-react';
import PawLoading from '../../../common/PawLoading';
import Input from '../../../common/Input';
import { useDebounce } from 'use-debounce';
import BookingDetails from './BookingDetails';
import { ContextMenu } from '../../../common/ContextMenu';

moment.updateLocale('en', {
  week: {
    dow: 1, // monday
  }
})
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

interface MerchantClosure {
  id: number;
  merchant_id: number;
  start_datetime: string;
  end_datetime: string;
  reason: string;
  created_at: string;
  updated_at: string;
}

interface MerchantHours {
  id: number;
  open_time: string;
  close_time: string;
  day_of_week: number;
}

const BookingCalendar: React.FC = () => {
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [merchantClosures, setMerchantClosures] = useState<MerchantClosure[]>([]);
  const [merchantHours, setMerchantHours] = useState<MerchantHours[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), -9));
  const [endDate, setEndDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10));
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isBookingDetailsOpen, setIsBookingDetailsOpen] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<View>('month');
  const [isControlsCollapsed, setIsControlsCollapsed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword] = useDebounce(keyword, 500);
  const bookingsService = new MerchantBookingsService();

  const contextMenuContainerRef = useRef<HTMLDivElement>(null);

  const statusOptions = [
    { value: 'All', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const contextMenuItems = [
    {
      label: 'Export Calendar',
      onClick: () => console.log('Export calendar clicked'),
    },
    {
      label: 'Print Schedule',
      onClick: () => console.log('Print schedule clicked'),
      icon: <PrinterIcon />,
    },
    {
      label: 'Settings',
      onClick: () => console.log('Settings clicked'),
      icon: <SettingsIcon />,
    }
  ];

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response: any = await bookingsService.listBookings(statusFilter, startDate, endDate, debouncedKeyword);
      const formattedEvents: BookingEvent[] = response.data.bookings.map((booking: any) => {
        const eventDate = booking.start_datetime || booking.booking_datetime;
        let startDateTime;
        let endDateTime;
        let isAllDay = false;
        
        if (booking.end_datetime) {
          endDateTime = booking.end_datetime;
        } else if (booking.status === 'in_progress') {
          startDateTime = moment(eventDate).startOf('day').toDate();
          endDateTime = moment(eventDate).endOf('day').toDate();
          isAllDay = true;
        } else {
          endDateTime = moment(booking.booking_datetime).add(1, 'hour').toDate();
        }
        
        return {
          id: booking.id,
          title: `${booking.service.name} - ${booking.user.first_name} ${booking.user.last_name}`,
          start: booking.status === 'in_progress' ? startDateTime : moment(eventDate).toDate(),
          end: moment(endDateTime).toDate(),
          status: booking.status,
          bookingDetails: booking,
          allDay: isAllDay,
          resource: booking.service.name,
          isPending: !booking.start_datetime && !booking.end_datetime
        };
      });
      
      setEvents(formattedEvents);
      setMerchantClosures(response.data.merchant_closures || []);
      setMerchantHours(response.data.merchant_hours || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setLoading(false);
    }
  };

  const handleSelectEvent = (event: BookingEvent) => {
    setSelectedEvent(event.bookingDetails);
    setIsBookingDetailsOpen(true);
  };

  const handleCloseBookingDetails = () => {
    setIsBookingDetailsOpen(false);
    setSelectedEvent(null);
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, startDate, endDate, debouncedKeyword]);

  const handleNavigate = (newDate: Date) => {
    let firstDay, lastDay;
    
    if (currentView === 'agenda') {
      firstDay = moment(newDate).subtract(10, 'days').toDate();
      lastDay = moment(newDate).add(1, 'month').add(10, 'days').toDate();
    } else {
      firstDay = new Date(newDate.getFullYear(), newDate.getMonth(), -9);
      lastDay = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 10);
    }
    
    setStartDate(firstDay);
    setEndDate(lastDay);
  };

  const handleViewChange = (view: View) => {
    setCurrentView(view);
    if (view === 'agenda') {
      const firstDay = moment(startDate).add(1, 'month').subtract(10, 'days').toDate();
      const lastDay = moment(startDate).add(2, 'month').add(10, 'days').toDate();
      setStartDate(firstDay);
      setEndDate(lastDay);
    }
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
  };

  const eventPropGetter = (event: BookingEvent) => {
    let backgroundColor = '';
    let color = '#ffffff';
    
    switch (event.status) {
      case 'pending':
        backgroundColor = '#fde047';
        color = '#000000';
        break;
      case 'confirmed':
        backgroundColor = '#93c5fd';
        color = '#000000';
        break;
      case 'in_progress':
        backgroundColor = '#d8b4fe';
        color = '#000000';
        break;
      case 'completed':
        backgroundColor = '#86efac';
        color = '#000000';
        break;
      case 'cancelled':
        backgroundColor = '#fca5a5';
        color = '#000000';
        break;
      default:
        backgroundColor = '#d1d5db';
        color = '#000000';
    }
    
    return { 
      style: { 
        backgroundColor,
        color
      } 
    };
  };

  const dayPropGetter = (date: Date) => {
    const isDateInClosure = merchantClosures.some(closure => {
      const closureStart = moment(closure.start_datetime).startOf('day');
      const closureEnd = moment(closure.end_datetime).endOf('day');
      return moment(date).isBetween(closureStart, closureEnd, 'day', '[]');
    });
    
    const momentDow = moment(date).day();
    const merchantDow = momentDow === 0 ? 6 : momentDow - 1; // Convert Sunday=0 to 6, Mon-Sat to 0-5
    const isDateInBusinessHours = merchantHours.some(merchantHour => {
      return merchantDow === merchantHour.day_of_week;
    });

    if (isDateInClosure) {
      return {
        style: {
          backgroundColor: '#a1a1a1',
          cursor: 'not-allowed',
          opacity: 1
        }
      };
    }

    if (isDateInBusinessHours) {
      return {
        style: {
          backgroundColor: '#ffffff',
          cursor: 'allowed',
          opacity: 1,
        }
      }
    }
    return {
      style: {
        backgroundColor: '#a1a1a1',
        cursor: 'not-allowed',
        opacity: 1,
      }
    };
  };

  const slotPropGetter = (date: Date) => {
    const momentDow = moment(date).day();
    const merchantDow = momentDow === 0 ? 6 : momentDow - 1;
    
    const dayHours = merchantHours.find(h => h.day_of_week === merchantDow);
    
    if (!dayHours) {
      return {
        style: {
          backgroundColor: '#a1a1a1',
          cursor: 'not-allowed'
        }
      };
    }
    
    const currentHour = moment(date).format('HH:mm:ss');
    const isWithinBusinessHours = currentHour >= dayHours.open_time && currentHour <= dayHours.close_time;
    
    return {
      style: {
        backgroundColor: isWithinBusinessHours ? '#ffffff' : '#a1a1a1'
      }
    };
  };

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    console.log("Slot info: ", slotInfo);
  }

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
      <div className="p-6 pt-24 min-h-screen flex flex-col cursor-default container mx-auto">
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
            <div className="flex sm:flex-row flex-col items-start gap-2">
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
              <Input 
                id="search"
                placeholder="Search..."
                value={keyword}
                onChange={handleSearch}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 lg:flex md:items-center gap-2 lg:space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-yellow-300" />
                <span className="text-xs md:text-sm">Pending</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-blue-300" />
                <span className="text-xs md:text-sm">Confirmed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-purple-300" />
                <span className="text-xs md:text-sm">In Progress</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-green-300" />
                <span className="text-xs md:text-sm">Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-red-300" />
                <span className="text-xs md:text-sm">Cancelled</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-[#a1a1a1]" />
                <span className="text-xs md:text-sm">Closed</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div ref={contextMenuContainerRef} className="flex-1 relative min-h-[500px]">
          {loading && (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
              <PawLoading />
            </div>
          )}
          <ContextMenu items={contextMenuItems} triggerOn='right' containerRef={contextMenuContainerRef} />
          <Calendar
            localizer={localizer}
            events={events}
            selectable
            startAccessor="start"
            endAccessor="end"
            style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}
            onNavigate={handleNavigate}
            onView={handleViewChange}
            eventPropGetter={eventPropGetter}
            dayPropGetter={dayPropGetter}
            slotPropGetter={slotPropGetter}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            defaultView="month"
            views={['month', 'week', 'day', 'agenda']}
            formats={formats}
            length={30}
          />
        </div>
      </div>

      {selectedEvent && (
        <BookingDetails
          isOpen={isBookingDetailsOpen}
          onClose={handleCloseBookingDetails}
          bookingId={selectedEvent.id}
          onUpdate={fetchBookings}
        />
      )}
    </>
  );
};

export default BookingCalendar;
