import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  let token = localStorage.getItem('token');
  
  // Limpiar el token de espacios en blanco
  if (token) {
    token = token.trim();
  }
  
  // Log detallado para debug (solo para UpdateMyInfo)
  const isUpdateMyInfo = req.url.includes('UpdateMyInfo');
  
  if (isUpdateMyInfo) {
    console.log('=== Auth Interceptor (UpdateMyInfo) ===');
    console.log('URL:', req.url);
    console.log('Method:', req.method);
    console.log('Token presente:', !!token);
    if (token) {
      console.log('Token completo:', token);
      console.log('Token length:', token.length);
      // Decodificar el token para ver su contenido (solo para debug)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
      } catch (e) {
        console.log('No se pudo decodificar el token');
      }
    }
  }
  
  if (token) {
    // Clonar la petición y agregar el header de Authorization
    // No agregamos Content-Type manualmente, Angular lo maneja automáticamente
    const authHeader = `Bearer ${token}`;
    const cloned = req.clone({
      setHeaders: {
        'Authorization': authHeader
      }
    });
    
    // Log detallado de headers
    if (isUpdateMyInfo) {
      console.log('Authorization header completo:', authHeader);
      console.log('Headers después del interceptor:');
      cloned.headers.keys().forEach(key => {
        const value = cloned.headers.get(key);
        if (key === 'Authorization') {
          console.log(`  ${key}:`, value?.substring(0, 30) + '...');
        } else {
          console.log(`  ${key}:`, value);
        }
      });
      console.log('=====================================');
    }
    
    return next(cloned);
  }
  
  // Si no hay token, continuar sin modificar
  if (isUpdateMyInfo) {
    console.log('No hay token, continuando sin Authorization header');
    console.log('=====================================');
  }
  
  return next(req);
};
