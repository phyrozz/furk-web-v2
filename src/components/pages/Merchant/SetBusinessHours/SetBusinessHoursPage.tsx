import React, { useState, useEffect } from 'react';
import Button from '../../../common/Button';
import { ToastService } from '../../../../services/toast/toast-service';
import { MerchantProfileService } from '../../../../services/profile/merchant-profile-service';
import MerchantNavbar from '../../../common/MerchantNavbar';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import useScreenSize from '../../../../hooks/useScreenSize';
import PawLoading from '../../../common/PawLoading';
import { LocalStorageService } from '../../../../services/local-storage/local-storage-service';

export interface BusinessHour {
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
}

const daysOfWeek = [
  { id: 0, name: 'Monday' },
  { id: 1, name: 'Tuesday' },
  { id: 2, name: 'Wednesday' },
  { id: 3, name: 'Thursday' },
  { id: 4, name: 'Friday' },
  { id: 5, name: 'Saturday' },
  { id: 6, name: 'Sunday' },
];

// convert 24h "HH:mm" to 12h { time: "H:mm", period: "AM"|"PM" }
const to12h = (time24: string | null) => {
  if (!time24) return { time: '', period: 'AM' as const };
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return { time: `${displayHour}:${m.toString().padStart(2, '0')}`, period };
};

// convert 12h { time: "H:mm", period: "AM"|"PM" } to 24h "HH:mm"
const to24h = (time12: string, period: 'AM' | 'PM') => {
  if (!time12) return null;
  let [h, m] = time12.split(':').map(Number);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
};

const timeOptions = [
  '12:00', '12:15', '12:30', '12:45',
  '1:00', '1:15', '1:30', '1:45',
  '2:00', '2:15', '2:30', '2:45',
  '3:00', '3:15', '3:30', '3:45',
  '4:00', '4:15', '4:30', '4:45',
  '5:00', '5:15', '5:30', '5:45',
  '6:00', '6:15', '6:30', '6:45',
  '7:00', '7:15', '7:30', '7:45',
  '8:00', '8:15', '8:30', '8:45',
  '9:00', '9:15', '9:30', '9:45',
  '10:00', '10:15', '10:30', '10:45',
  '11:00', '11:15', '11:30', '11:45',
];

const SetBusinessHoursPage: React.FC = () => {
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const dataService = new MerchantProfileService();
  const localStorageService = new LocalStorageService();
  const navigate = useNavigate();
  const { isMobile } = useScreenSize();

  useEffect(() => {
    const fetchBusinessHours = async () => {
      try {
        setIsLoading(true);
        const response = await dataService.getMerchantDetails();
        if (response?.data?.business_hours) {
          setBusinessHours(response.data.business_hours);
        } else {
          setBusinessHours(daysOfWeek.map(day => ({
            day_of_week: day.id,
            open_time: null,
            close_time: null,
          })));
        }
      } catch (error) {
        console.error('Failed to fetch business hours:', error);
        ToastService.show('Failed to load business hours.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBusinessHours();
  }, []);

  const handleTimeChange = (
    dayId: number,
    type: 'open' | 'close',
    field: 'time' | 'period',
    value: string
  ) => {
    setBusinessHours(prev => {
      const copy = [...prev];
      let idx = copy.findIndex(h => h.day_of_week === dayId);
      if (idx === -1) {
        copy.push({ day_of_week: dayId, open_time: null, close_time: null });
        idx = copy.length - 1;
      }
      const current24 = copy[idx][type === 'open' ? 'open_time' : 'close_time'];
      const { time, period } = to12h(current24);

      const newTime = field === 'time' ? value : time;
      const newPeriod = field === 'period' ? (value as 'AM' | 'PM') : period;

      const updated24 = to24h(newTime, newPeriod as 'AM' | 'PM');
      if (type === 'open') copy[idx].open_time = updated24;
      else copy[idx].close_time = updated24;

      return copy;
    });
  };

  const handleClearTimes = (dayId: number) => {
    setBusinessHours(prev => {
      const copy = [...prev];
      const idx = copy.findIndex(h => h.day_of_week === dayId);
      if (idx > -1) {
        copy[idx].open_time = null;
        copy[idx].close_time = null;
      }
      return copy;
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const hoursToSave = businessHours
        .filter(h => h.open_time && h.close_time)
        .map(h => ({
          ...h,
          open_time: h.open_time,
          close_time: h.close_time,
        }));
      await dataService.updateMerchantBusinessHours(hoursToSave);
      ToastService.show('Business hours updated successfully!');
      localStorageService.setHasBusinessHours(true);
      navigate(-1);
    } catch (error) {
      console.error('Failed to save business hours:', error);
      ToastService.show('Failed to save business hours.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sm:px-0 px-4">
      <MerchantNavbar />
      <div className="container mx-auto flex flex-row justify-start items-center gap-4 mt-24 mb-4">
        <Button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
          variant="outline"
        >
          <ArrowLeft size={20} />
          {!isMobile && 'Back'}
        </Button>
        <h1 className="font-cursive text-2xl font-bold">Set Business Hours</h1>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center w-full h-96">
          <PawLoading />
        </div>
      )}

      {!isLoading && (
        <div className="container mx-auto p-8 bg-white rounded-xl shadow overflow-auto">
          <div className="space-y-4">
            {daysOfWeek.map(day => {
              const current = businessHours.find(h => h.day_of_week === day.id);
              const open12 = to12h(current?.open_time ?? null);
              const close12 = to12h(current?.close_time ?? null);

              return (
                <div key={day.id} className="flex items-center space-x-4">
                  <label className="w-32 font-medium">{day.name}</label>

                  {/* Open time */}
                  <select
                    className="w-32 border rounded px-2 py-1"
                    value={open12.time}
                    onChange={e =>
                      handleTimeChange(day.id, 'open', 'time', e.target.value)
                    }
                  >
                    <option value="">--</option>
                    {timeOptions.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <select
                    className="w-20 border rounded px-2 py-1"
                    value={open12.period}
                    onChange={e =>
                      handleTimeChange(day.id, 'open', 'period', e.target.value)
                    }
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>

                  <span>-</span>

                  {/* Close time */}
                  <select
                    className="w-32 border rounded px-2 py-1"
                    value={close12.time}
                    onChange={e =>
                      handleTimeChange(day.id, 'close', 'time', e.target.value)
                    }
                  >
                    <option value="">--</option>
                    {timeOptions.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <select
                    className="w-20 border rounded px-2 py-1"
                    value={close12.period}
                    onChange={e =>
                      handleTimeChange(day.id, 'close', 'period', e.target.value)
                    }
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>

                  <Button
                    variant="ghost"
                    onClick={() => handleClearTimes(day.id)}
                    className="p-2"
                    icon={<X size={16} />}
                  >
                    Clear
                  </Button>
                </div>
              );
            })}
          </div>
          <div className="flex w-full justify-end items-center">
            <Button
              onClick={handleSave}
              loading={isLoading}
              disabled={isLoading}
              icon={<Save />}
              className="mt-6"
            >
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SetBusinessHoursPage;