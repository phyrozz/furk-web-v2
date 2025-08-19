import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Calendar, Hash } from 'lucide-react';
import AdminNavbar from '../../common/AdminNavbar';
import { ToastService } from '../../../services/toast/toast-service';

const PromosPage = () => {
  const [form, setForm] = useState({
    code: '',
    points: 0,
    threshold: 0,
    startDate: '',
    endDate: ''
  });

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || form.points <= 0) {
      ToastService.show('Promo code and points must be valid');
      return;
    }
    ToastService.show('Promo created successfully');
    setForm({ code: '', points: 0, threshold: 0, startDate: '', endDate: '' });
  }, [form]);

  return (
    <>
      <AdminNavbar />
      <div className="min-h-screen bg-gray-50 p-6 pt-24">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <PlusCircle className="text-green-600" />
              Create Promo Code
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Promo Code</label>
                <div className="flex items-center border rounded-lg p-2">
                  <Hash className="text-gray-500 mr-2" />
                  <input
                    type="text"
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    className="w-full outline-none"
                    placeholder="Enter code"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">Reward Points</label>
                <input
                  type="number"
                  name="points"
                  value={form.points}
                  onChange={handleChange}
                  className="border rounded-lg p-2 w-full"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Threshold Quantity</label>
                <input
                  type="number"
                  name="threshold"
                  value={form.threshold}
                  onChange={handleChange}
                  className="border rounded-lg p-2 w-full"
                  min="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Start Date</label>
                  <div className="flex items-center border rounded-lg p-2">
                    <Calendar className="text-gray-500 mr-2" />
                    <input
                      type="date"
                      name="startDate"
                      value={form.startDate}
                      onChange={handleChange}
                      className="w-full outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium">End Date</label>
                  <div className="flex items-center border rounded-lg p-2">
                    <Calendar className="text-gray-500 mr-2" />
                    <input
                      type="date"
                      name="endDate"
                      value={form.endDate}
                      onChange={handleChange}
                      className="w-full outline-none"
                    />
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold shadow-md hover:bg-green-700"
              >
                Create Promo
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default PromosPage;
