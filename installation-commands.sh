# Crear nuevo proyecto Angular
ng new multicotizacion-seguros --routing --style=scss

# Navegar al directorio del proyecto
cd multicotizacion-seguros

# Instalar Angular Material
ng add @angular/material

# Instalar dependencias adicionales
npm install @angular/flex-layout
npm install chart.js ng2-charts
npm install ngx-translate/core ngx-translate/http-loader

# Generar módulos principales
ng generate module auth --routing
ng generate module dashboard --routing
ng generate module quotes --routing
ng generate module history --routing
ng generate module core
ng generate module shared

# Generar servicios principales
ng generate service auth/services/auth
ng generate service quotes/services/quotes
ng generate service core/services/error-handler
ng generate service core/services/loading

# Generar guards e interceptors
ng generate guard core/guards/auth
ng generate interceptor core/interceptors/auth
ng generate interceptor core/interceptors/error

# Generar componentes principales
ng generate component auth/components/login
ng generate component dashboard/components/dashboard-layout
ng generate component quotes/components/quote-form
ng generate component quotes/components/quote-results
ng generate component quotes/components/quote-comparison
ng generate component history/components/quotes-history
ng generate component shared/components/loading-spinner
ng generate component shared/components/confirmation-dialog
