const API_BASE_URL = 'http://localhost:8081/account-api/api';

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

export interface TokenValidationResponse {
  success: boolean;
  data?: {
    valid: boolean;
    email: string;
    expiresAt: string;
  };
}

export const passwordResetService = {
  async requestReset(email: string): Promise<PasswordResetResponse> {
    const response = await fetch(`${API_BASE_URL}/password/reset-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error('Error al solicitar el restablecimiento de contraseña');
    }

    return response.json();
  },

  async validateToken(token: string): Promise<TokenValidationResponse> {
    const response = await fetch(`${API_BASE_URL}/password/validate-token/${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Token inválido o expirado');
    }

    return response.json();
  },

  async resetPassword(token: string, newPassword: string): Promise<PasswordResetResponse> {
    const response = await fetch(`${API_BASE_URL}/password/reset-confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword }),
    });

    if (!response.ok) {
      throw new Error('Error al restablecer la contraseña');
    }

    return response.json();
  },
}; 