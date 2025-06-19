import axios from 'axios';
import { getApiUrl, getEndpoint } from '../lib/config';

interface LoginCredentials {
  vEmail: string;
  vPassword: string;
}

interface Usuario {
  vapellidoPaterno: string;
  vapellidoMaterno: string;
  dfechaCreacion: string;
  vemail: string;
  iusuarioId: number;
  vnombre: string;
  vpassword: null;
}

interface LoginResponse {
  usuario: Usuario;
  token: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const apiUrl = getApiUrl('account');
    const endpoint = getEndpoint('account', 'login');
    const response = await axios.post<LoginResponse>(`${apiUrl}${endpoint}`, credentials);
    return response.data;
  },

  setToken(token: string) {
    localStorage.setItem('token', token);
    // Configurar el token para todas las futuras peticiones
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  removeToken() {
    localStorage.removeItem('token');
    // Eliminar el token de las futuras peticiones
    delete axios.defaults.headers.common['Authorization'];
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}; 