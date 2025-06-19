import { getApiUrl, getEndpoint } from '../lib/config';

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
    const apiUrl = getApiUrl('account');
    const endpoint = getEndpoint('account', 'passwordResetRequest');

    const response = await fetch(`${apiUrl}${endpoint}`, {
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
    const apiUrl = getApiUrl('account');
    const endpoint = getEndpoint('account', 'passwordValidateToken', token);

    const response = await fetch(`${apiUrl}${endpoint}`, {
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
    const apiUrl = getApiUrl('account');
    const endpoint = getEndpoint('account', 'passwordResetConfirm');

    const response = await fetch(`${apiUrl}${endpoint}`, {
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