export const environment = {
  production: true,
  // IMPORTANTE: El frontend Angular se ejecuta en el navegador del usuario,
  // por lo que las peticiones HTTP salen desde el navegador, NO desde el contenedor Docker.
  // Por eso usamos localhost o la IP del servidor, NO los nombres de contenedores.
  
  // Para desarrollo local o cuando todo está en la misma máquina:
  authApiUrl: 'http://localhost:5001/api',      // Contenedor: auth-api (puerto 5001:80)
  segurosApiUrl: 'http://localhost:5002/api',   // Contenedor: seguros-api (puerto 5002:80)
  
  
};
