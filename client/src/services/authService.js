import api from './api'

export const login = async (email, password, role) => {
    const response = await api.post('/auth/login', { email, password, role })
    return response.data
}