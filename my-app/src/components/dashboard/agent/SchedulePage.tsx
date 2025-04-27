import { useState, useEffect } from 'react';
import { scheduleService, type Reschedule } from '../../../services/scheduleService';
import { HiOutlineClock } from 'react-icons/hi';

export const SchedulePage = () => {
  const [schedules, setSchedules] = useState<Reschedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await scheduleService.getReschedules();
      setSchedules(data);
    } catch (err: Error | unknown) {
      const error = err instanceof Error ? err.message : 'Failed to load schedules';
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Loan Schedule</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-dark-200">
            A list of all rescheduled loans and their new due dates.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="mt-8 flex flex-col">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-dark-600">
                <thead className="bg-gray-50 dark:bg-dark-card">
                  <tr>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Shop</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Loan Amount</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">New Due Date</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Reason</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Requested On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-dark-600 bg-white dark:bg-dark-card">
                  {schedules.map((schedule) => (
                    <tr key={schedule.id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white">
                        {schedule.loan?.shop?.name || '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white">
                        ₹{schedule.loan?.amount.toLocaleString() || '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/20 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400">
                          <HiOutlineClock className="mr-1 h-4 w-4" />
                          {new Date(schedule.new_due_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white">
                        {schedule.reason}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-dark-400">
                        {new Date(schedule.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {schedules.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-dark-300">No rescheduled loans found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};