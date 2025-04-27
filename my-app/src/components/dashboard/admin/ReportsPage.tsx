import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { adminService } from '../../../services/adminService';

interface Report {
  name: string;
  date: string;
  url: string;
  amount?: string;
  shopName?: string;
  agentName?: string;
}

const exportToExcel = (reports: Report[]) => {
  const worksheet = XLSX.utils.json_to_sheet(reports.map(report => ({
    'Report Name': report.name,
    'Date': new Date(report.date).toLocaleDateString(),
    'Amount': report.amount ? `₹${Number(report.amount).toLocaleString()}` : '-',
    'Shop': report.shopName || '-',
    'Agent': report.agentName || '-'
  })));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reports');
  XLSX.writeFile(workbook, 'Reports.xlsx');
};

const exportToPDF = (reports: Report[]) => {
  const doc = new jsPDF();
  doc.text('Collection Reports', 14, 10);
  doc.autoTable({
    head: [['Report Name', 'Date', 'Amount', 'Shop', 'Agent']],
    body: reports.map((report) => [
      report.name,
      new Date(report.date).toLocaleDateString(),
      report.amount ? `₹${Number(report.amount).toLocaleString()}` : '-',
      report.shopName || '-',
      report.agentName || '-'
    ]),
  });
  doc.save('Reports.pdf');
};

export const ReportsPage = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [customDates, setCustomDates] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    loadReports();
  }, [reportType, customDates]);

  const loadReports = async () => {
    try {
      setLoading(true);
      let data: Report[] = [];

      if (reportType === 'daily') {
        data = await adminService.getDailyReports();
      } else if (reportType === 'weekly') {
        data = await adminService.getWeeklyReports();
      } else if (reportType === 'custom') {
        const { startDate, endDate } = customDates;
        if (startDate && endDate) {
          data = await adminService.getCustomReports(startDate, endDate);
        } else {
          setError('Please select both start and end dates for custom reports.');
          return;
        }
      }

      setReports(data);
      setError('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomDates((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-6 bg-white dark:bg-dark-card rounded-lg shadow-md">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Reports</h1>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Report Type</label>
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value as 'daily' | 'weekly' | 'custom')}
          className="block w-full border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-dark-input dark:text-white"
        >
          <option value="daily">Daily Report</option>
          <option value="weekly">Weekly Report</option>
          <option value="custom">Custom Report</option>
        </select>
      </div>

      {reportType === 'custom' && (
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={customDates.startDate}
              onChange={handleDateChange}
              className="block w-full border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-dark-input dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
            <input
              type="date"
              name="endDate"
              value={customDates.endDate}
              onChange={handleDateChange}
              className="block w-full border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-dark-input dark:text-white"
            />
          </div>
        </div>
      )}

      <div className="mb-4 flex space-x-4">
        <button
          onClick={() => exportToExcel(reports)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Export to Excel
        </button>
        <button
          onClick={() => exportToPDF(reports)}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Export to PDF
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center mt-4">{error}</div>
      ) : (
        <div>
          {reports.length === 0 ? (
            <p className="text-gray-500 dark:text-dark-300">No reports available.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
              <thead className="bg-gray-50 dark:bg-dark-card">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-300 uppercase tracking-wider">Report Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-300 uppercase tracking-wider">Shop</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-300 uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-600">
                {reports.map((report, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {report.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-300">
                      {new Date(report.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-300">
                      {report.amount ? `₹${Number(report.amount).toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-300">
                      {report.shopName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-300">
                      {report.agentName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <a href={report.url} target="_blank" rel="noopener noreferrer" 
                         className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300">
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};