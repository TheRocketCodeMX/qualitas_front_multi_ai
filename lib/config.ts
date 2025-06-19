export const config = {
  api: {
    accountApi: process.env.NEXT_PUBLIC_ACCOUNT_API_URL || 'http://localhost:8081/account-api',
    cotizacionApi: process.env.NEXT_PUBLIC_COTIZACION_API_URL || 'http://localhost:8080/cotizacion-api',
  },
  endpoints: {
    account: {
      login: '/api/cuenta/login',
      passwordResetRequest: '/api/password/reset-request',
      passwordValidateToken: (token: string) => `/api/password/validate-token/${token}`,
      passwordResetConfirm: '/api/password/reset-confirm',
    },
    cotizacion: {
      masiva: '/api/cotizacion-masiva',
      cargarExcel: '/api/cotizacion-masiva/cargar-excel',
      cotizar: '/api/cotizacion-masiva/cotizar',
      consultarEstado: '/api/cotizacion-masiva/consultar-estado',
      consultarEstadoLote: (idLote: number) => `/api/cotizacion-masiva/consultar-estado/${idLote}`,
    }
  }
}

export const getApiUrl = (apiType: 'account' | 'cotizacion') => {
  return config.api[`${apiType}Api` as keyof typeof config.api] as string;
}

export const getEndpoint = (apiType: 'account' | 'cotizacion', endpointKey: string, params?: any) => {
  const endpoints = config.endpoints[apiType];
  const endpoint = endpoints[endpointKey as keyof typeof endpoints];
  
  if (typeof endpoint === 'function') {
    return (endpoint as Function)(params);
  }
  
  return endpoint as string;
} 