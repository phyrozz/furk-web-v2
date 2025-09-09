import React, { useState, useEffect } from 'react';
import Button from '../../../common/Button';
import { ToastService } from '../../../../services/toast/toast-service';
import { MerchantProfileService } from '../../../../services/profile/merchant-profile-service';
import MerchantNavbar from '../../../common/MerchantNavbar';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import useScreenSize from '../../../../hooks/useScreenSize';
import TimeInput from '../../../common/TimeInput';
import PawLoading from '../../../common/PawLoading';

export interface BreakHour {
  id?: number;
  day_of_week: number; // 0 = Monday ... 6 = Sunday
  break_start: string | null;
  break_end: string | null;
  label?: string;
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

const SetBreakHoursPage: React.FC = () => {
  const [breaks, setBreaks] = useState<BreakHour[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const dataService = new MerchantProfileService();
  const navigate = useNavigate();
  const { isMobile } = useScreenSize();

  useEffect(() => {
    const fetchBreakHours = async () => {
      try {
        setIsLoading(true);
        const response = await dataService.getMerchantDetails();
        if (response?.data?.break_hours) {
          setBreaks(response.data.break_hours);
        } else {
          setBreaks([]);
        }
      } catch (error) {
        console.error('Failed to fetch break hours:', error);
        ToastService.show('Failed to load break hours.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBreakHours();
  }, []);

  const handleAddBreak = (day: number) => {
    setBreaks([
      ...breaks,
      { day_of_week: day, break_start: "12:00", break_end: "13:00", label: "Break" },
    ]);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const breaksToSave = breaks.filter(break_ => break_.break_start && break_.break_end);
      await dataService.updateMerchantBreakHours(breaksToSave);
      ToastService.show("Break hours updated successfully!");
      const response = await dataService.getMerchantDetails();
      if (response?.data?.break_hours) {
        setBreaks(response.data.break_hours);
      }
    } catch (err: any) {
      console.error("Failed to save breaks:", err);
      ToastService.show(err.response?.data?.error || "Failed to update break hours.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = (index: number) => {
    setBreaks(breaks.filter((_, i) => i !== index));
  };

  return (
    <div className="sm:px-0 px-4 pb-6 select-none">
      <MerchantNavbar />
      <div className="container mx-auto flex flex-row justify-start items-center gap-4 mt-24 mb-4">
        <Button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
          variant='outline'
        >
          <ArrowLeft size={20} />
          {!isMobile && 'Back'}
        </Button>
        <h1 className="font-cursive text-2xl font-bold">Set Break Hours</h1>
      </div>

      {isLoading && <div className="flex justify-center items-center w-full h-96">
        <PawLoading />
      </div>}

      {!isLoading && <div className="container mx-auto p-8 bg-white rounded-xl shadow overflow-auto">
        <div className="space-y-4">
          {daysOfWeek.map((day) => {
            const dayBreaks = breaks.filter(b => b.day_of_week === day.id);
            return (
              <div key={day.id} className="mb-6">
                <div className="flex items-center justify-between">
                  <label className="font-medium">{day.name}</label>
                  <Button
                    variant="ghost"
                    onClick={() => handleAddBreak(day.id)}
                    className="flex items-center text-sm text-primary-600"
                    icon={<Plus size={16} />}
                  >
                    Add Break
                  </Button>
                </div>
                
                {dayBreaks.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {dayBreaks.map((break_, idx) => (
                      <div key={idx} className="flex items-center space-x-4">
                        <TimeInput
                          value={break_.break_start ? new Date(`1970-01-01T${break_.break_start}`) : null}
                          onChange={(value: Date | null) => {
                            const updated = [...breaks];
                            const index = breaks.findIndex((b, i) => b.day_of_week === day.id && i === idx);
                            updated[index].break_start = value?.toTimeString().split(' ')[0].slice(0, 5) || null;
                            setBreaks(updated);
                          }}
                          className="w-48 min-w-48"
                        />
                        <span>-</span>
                        <TimeInput
                          value={break_.break_end ? new Date(`1970-01-01T${break_.break_end}`) : null}
                          onChange={(value: Date | null) => {
                            const updated = [...breaks];
                            const index = breaks.findIndex((b, i) => b.day_of_week === day.id && i === idx);
                            updated[index].break_end = value?.toTimeString().split(' ')[0].slice(0, 5) || null;
                            setBreaks(updated);
                          }}
                          className="w-48 min-w-48"
                        />
                        <input
                          type="text"
                          value={break_.label || ""}
                          placeholder="Label"
                          onChange={(e) => {
                            const updated = [...breaks];
                            const index = breaks.findIndex((b, i) => b.day_of_week === day.id && i === idx);
                            updated[index].label = e.target.value;
                            setBreaks(updated);
                          }}
                          className="px-3 py-2 border rounded-md w-48"
                        />
                        <Button
                          variant="ghost"
                          onClick={() => handleRemove(breaks.indexOf(break_))}
                          className="text-red-500 hover:text-red-700"
                          icon={<Trash2 size={18} />}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm mt-1">No breaks set</p>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-end mt-6">
          <Button
            onClick={handleSave}
            loading={isLoading}
            disabled={isLoading}
            icon={<Save size={18} />}
          >
            Save
          </Button>
        </div>
      </div>}
    </div>
  );
};

export default SetBreakHoursPage;
