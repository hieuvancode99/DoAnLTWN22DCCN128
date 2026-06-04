import { create } from 'zustand';
import axiosInstance from '../lib/axios';

interface Filters {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  type?: string;
  page?: number;
  limit?: number;
  search?: string;
}

interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

interface TransactionStore {
  transactions: any[];
  loading: boolean;
  pagination: Pagination;
  filters: Filters;
  setFilters: (filters: Filters) => void;
  resetFilters: () => void;
  fetchTransactions: () => Promise<void>;
  addTransaction: (data: any) => Promise<{ success: boolean; data?: any; budgetWarning?: boolean; warningMessage?: string; message?: string }>;
  updateTransaction: (id: string, data: any) => Promise<{ success: boolean; data?: any; budgetWarning?: boolean; warningMessage?: string; message?: string }>;
  deleteTransaction: (id: string) => Promise<boolean>;
}

const initialFilters = {
  startDate: '',
  endDate: '',
  categoryId: '',
  type: '',
  page: 1,
  limit: 10,
  search: ''
};

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  loading: false,
  pagination: { total: 0, page: 1, pages: 1, limit: 10 },
  filters: initialFilters,

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },

  resetFilters: () => {
    set({ filters: initialFilters });
  },

  fetchTransactions: async () => {
    set({ loading: true });
    try {
      const { filters } = get();
      // Remove empty fields
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== undefined && v !== '')
      );

      const res = await axiosInstance.get('/transactions', { params });
      if (res.data.success) {
        set({
          transactions: res.data.data,
          pagination: res.data.pagination,
          loading: false
        });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('Fetch transactions error:', error);
      set({ loading: false });
    }
  },

  addTransaction: async (data) => {
    try {
      const res = await axiosInstance.post('/transactions', data);
      if (res.data.success) {
        await get().fetchTransactions();
        return {
          success: true,
          data: res.data.data,
          budgetWarning: res.data.budgetWarning,
          warningMessage: res.data.warningMessage
        };
      }
      return { success: false, message: res.data.message || 'Lỗi khi thêm giao dịch' };
    } catch (error: any) {
      console.error('Add transaction error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Có lỗi xảy ra khi gọi máy chủ'
      };
    }
  },

  updateTransaction: async (id, data) => {
    try {
      const res = await axiosInstance.put(`/transactions/${id}`, data);
      if (res.data.success) {
        await get().fetchTransactions();
        return {
          success: true,
          data: res.data.data,
          budgetWarning: res.data.budgetWarning,
          warningMessage: res.data.warningMessage
        };
      }
      return { success: false, message: res.data.message || 'Lỗi khi cập nhật giao dịch' };
    } catch (error: any) {
      console.error('Update transaction error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Có lỗi xảy ra khi gọi máy chủ'
      };
    }
  },

  deleteTransaction: async (id) => {
    try {
      const res = await axiosInstance.delete(`/transactions/${id}`);
      if (res.data.success) {
        await get().fetchTransactions();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Delete transaction error:', error);
      return false;
    }
  }
}));
