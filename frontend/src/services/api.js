import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
};

// Student API
export const studentAPI = {
    // Profile
    getProfile: () => api.get('/students/profile'),
    updateProfile: (data) => api.put('/students/profile', data),
    
    // Outpass
    applyOutpass: (data) => api.post('/students/outpass', data),
    getOutpassHistory: (params = {}) => api.get('/students/outpass', { params }),
    getActiveOutpass: () => api.get('/students/outpass/active'),
    getOutpassDetails: (id) => api.get(`/students/outpass/${id}`),
    
    // Notifications
    getNotifications: (params = {}) => api.get('/students/notifications', { params }),
    
    // Return confirmation
    confirmReturn: (outpassId) => api.post(`/students/return-confirm/${outpassId}`),
    
    // Statistics
    getStats: () => api.get('/students/stats'),
};

// Warden API
export const wardenAPI = {
    getPendingRequests: (params = {}) => api.get('/wardens/pending', { params }),
    getAllOutpasses: (params = {}) => api.get('/wardens/outpass', { params }),
    approveOutpass: (id, data) => api.put(`/wardens/outpass/${id}`, data),
    getStudentDetails: (studentId) => api.get(`/wardens/students/${studentId}`),
};

// Watchman API
export const watchmanAPI = {
    scanQR: (data) => api.post('/watchmen/scan', data),
    getTodayLogs: () => api.get('/watchmen/logs/today'),
    getPendingReturns: () => api.get('/watchmen/pending-returns'),
    getMyLogs: (params = {}) => api.get('/watchmen/my-logs', { params }),
};

// Admin API
export const adminAPI = {
    getDashboardStats: () => api.get('/admin/dashboard'),
    getReports: (params = {}) => api.get('/admin/reports', { params }),
    getSystemLogs: (params = {}) => api.get('/admin/logs', { params }),
};

export default api; 