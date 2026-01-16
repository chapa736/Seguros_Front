export const environment = {
  production: true,
  // IMPORTANTE: El frontend Angular se ejecuta en el navegador del usuario,
  // por lo que las peticiones HTTP salen desde el navegador, NO desde el contenedor Docker.
  // Por eso usamos localhost o la IP del servidor, NO los nombres de contenedores.
  
  // Para desarrollo local o cuando todo está en la misma máquina:
  authApiUrl: 'https://auth-api-hscra6bsgahsepdb.westus2-01.azurewebsites.net/api',
  segurosApiUrl: 'https://seguros-api-allr-hycycshxhsgah8eq.westus2-01.azurewebsites.net/api', 
  
  
};
