import axios from 'axios';

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

const API_URL = 'http://localhost:8081/account-api/api';

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>(`${API_URL}/cuenta/login`, credentials);
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