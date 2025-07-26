import React, { useEffect, useState } from 'react';
import { Calendar, Users } from 'lucide-react';
import Button from '../../../common/Button';
import { MerchantDashboardService } from '../../../../services/merchant-dashboard/merchant-dashboard';
import PawLoading from '../../../common/PawLoading';

interface TodaysScheduleProps {
  onViewCalendar: () => void;
}

interface Appointment {
  id: string;
  service_name: string;
  booking_datetime: string;
  start_datetime: string | null;
  end_datetime: string | null;
  status: string;
}

const TodaysSchedule: React.FC<TodaysScheduleProps> = ({ onViewCalendar }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const service = new MerchantDashboardService();
        const data: any = await service.listAppointmentsToday();
        setAppointments(data.data || []);
      } catch (err) {
        setError('Failed to fetch appointments.');
        console.error('Error fetching appointments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const getDisplayTime = (appointment: Appointment) => {
    if (appointment.status === 'started' && appointment.start_datetime) {
      return `Started at ${new Date(appointment.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return `Booked for ${new Date(appointment.booking_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked':
        return 'text-blue-600';
      case 'started':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-cursive font-semibold text-gray-800">Today's Schedule</h2>
        <Users size={20} className="text-gray-500" />
      </div>
      {loading && <div className="flex justify-center items-center"><PawLoading /></div>}
      {error && <p className="text-center text-red-500">{error}</p>}
      {!loading && !error && (appointments.length === 0 ? (
        <div className="text-center py-8">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No appointments scheduled for today</p>
        </div>
      ) : (
        <div className="max-h-[220px] overflow-y-auto">
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">{appointment.service_name}</p>
                  <p className={`text-xs ${getStatusColor(appointment.status)} capitalize`}>
                    {appointment.status}
                  </p>
                </div>
                <p className="text-sm text-gray-700">
                  {getDisplayTime(appointment)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="text-center mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onViewCalendar}
        >
          View Calendar
        </Button>
      </div>
    </div>
  );
};

export default TodaysSchedule;