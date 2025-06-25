import React, { useState, useEffect } from 'react';
import Button from '../../../common/Button';
import { ToastService } from '../../../../services/toast/toast-service';
import { MerchantProfileService } from '../../../../services/profile/merchant-profile-service';
import MerchantNavbar from '../../../common/MerchantNavbar';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import useScreenSize from '../../../../hooks/useScreenSize';
import TimeInput from '../../../common/TimeInput';
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

const SetBusinessHoursPage: React.FC = () => {
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const dataService = new MerchantProfileService();
  const localStorageService = new LocalStorageService();
  const navigate = useNavigate();
  const { isMobile } = useScreenSize();

  useEffect(() => {
    // Fetch existing business hours when the component mounts
    const fetchBusinessHours = async () => {
      try {
        setIsLoading(true);
        const response = await dataService.getMerchantDetails();
        if (response?.data?.business_hours) {
          setBusinessHours(response.data?.business_hours);
        } else {
          // Initialize with default empty hours if none exist
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

  const handleTimeChange = (dayId: number, type: 'open' | 'close', value: string) => {
    setBusinessHours(prevHours => {
      const newHours = [...prevHours];
      const index = newHours.findIndex(hour => hour.day_of_week === dayId);
      if (index > -1) {
        if (type === 'open') {
          newHours[index].open_time = value ? `${value}:00` : null;
        } else {
          newHours[index].close_time = value ? `${value}:00` : null;
        }
      } else {
        // Add new entry if it doesn't exist (shouldn't happen with initial mapping)
        newHours.push({
          day_of_week: dayId,
          open_time: type === 'open' ? `${value}:00` : null,
          close_time: type === 'close' ? `${value}:00` : null,
        });
      }
      return newHours;
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Filter out days with no times set if desired, or send all
      const hoursToSave = businessHours
        .filter(hour => hour.open_time && hour.close_time)
        .map(hour => ({
          ...hour,
          open_time: hour.open_time?.includes(':00') ? hour.open_time : `${hour.open_time}:00`,
          close_time: hour.close_time?.includes(':00') ? hour.close_time : `${hour.close_time}:00`
        }));
      await dataService.updateMerchantBusinessHours(hoursToSave);
      ToastService.show('Business hours updated successfully!');
      localStorageService.setHasBusinessHours(true);
      navigate('/merchant/dashboard');
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
          onClick={() => navigate('/merchant/dashboard')}
          className="flex items-center gap-2"
          variant='outline'
        >
          <ArrowLeft size={20} /> 
          {!isMobile && 'Back'}
        </Button>
        <h1 className="font-cursive text-2xl font-bold">Set Business Hours</h1>
      </div>
      
      { isLoading && <div className="flex justify-center items-center w-full h-96">
        <PawLoading />
      </div> }

      { !isLoading && <div className="container mx-auto p-8 bg-white rounded-xl shadow overflow-auto">
        <div className="space-y-4">
          {daysOfWeek.map(day => {
            const currentHours = businessHours.find(h => h.day_of_week === day.id);
            return (
              <div key={day.id} className="flex items-center space-x-4">
                <label className="w-32 font-medium">{day.name}</label>
                <TimeInput 
                  value={currentHours?.open_time ? new Date(`1970-01-01T${currentHours.open_time}`) : null}
                  onChange={(value: Date | null) => handleTimeChange(day.id, 'open', value?.toTimeString().split(' ')[0].slice(0, 5) || '')}
                  className="w-48 min-w-48"
                />
                {/* <input
                  type="time"
                  className="border rounded-md p-2 w-32"
                  value={currentHours?.open_time?.replace(':00', '') || ''}
                  onChange={(e) => handleTimeChange(day.id, 'open', e.target.value)}
                /> */}
                <span>-</span>
                <TimeInput 
                  value={currentHours?.close_time ? new Date(`1970-01-01T${currentHours.close_time}`) : null}
                  onChange={(value: Date | null) => handleTimeChange(day.id, 'close', value?.toTimeString().split(' ')[0].slice(0, 5) || '')}
                  className="w-48 min-w-48"
                />
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
      </div> }
    </div>
  );
};

export default SetBusinessHoursPage;