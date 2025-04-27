import axios from 'axios';

const API_URL = 'http://localhost:5000/api/agent';

export interface RescheduleRequest {
  loan_id: number;
  new_due_date: string;
  reason: string;
}

export interface Reschedule {
  id: number;
  loan_id: number;
  old_due_date: string;
  new_due_date: string;
  reschedule_date: string;
  reason: string;
  rescheduled_by: number;
  loan?: {
    id: number;
    amount: number | string;
    loan_date: string;
    due_date: string;
    shop?: {
      id: number;
      name: string;
      location: string;
      agent?: {
        id: number;
        name: string;
        email: string;
        location: string;
      };
    };
  };
  rescheduler?: {
    id: number;
    name: string;
    email: string;
  };
}

export const scheduleService = {
  // Get all reschedules for assigned shops
  getReschedules: async (): Promise<Reschedule[]> => {
    const response = await axios.get(`${API_URL}/reschedules`);
    return response.data.data || [];
  },

  // Create new reschedule request
  createReschedule: async (data: RescheduleRequest) => {
    const response = await axios.post(`${API_URL}/create-reschedule`, data);
    return response.data;
  }
};