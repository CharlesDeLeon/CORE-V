import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
})

// automatically attach JWT Token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    console.log('[API Interceptor] Token from localStorage:', token ? 'Present' : 'Missing')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
        console.log('[API Interceptor] Authorization header added')
    }
    return config
})

export const getNotifications = ()    => api.get('/notifications')
export const getUnreadCount   = ()    => api.get('/notifications/unread')
export const markOneRead      = (id)  => api.patch(`/notifications/${id}/read`)
export const markAllRead      = ()    => api.patch('/notifications/read-all')

export default api