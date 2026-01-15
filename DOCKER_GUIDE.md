# 🐳 Guía de Docker para Seguros Frontend

Esta guía te ayudará a subir tu proyecto Angular a Docker paso a paso.

## 📋 Prerrequisitos

- ✅ Docker Desktop instalado y ejecutándose
- ✅ Proyecto Angular funcionando localmente

---

## 🚀 Paso 1: Preparar el proyecto

### 1.1 Crear archivo de entorno de producción (opcional pero recomendado)

Crea un archivo `src/environments/environment.prod.ts` con las URLs de producción:

```typescript
export const environment = {
  production: true,
  authApiUrl: 'http://tu-servidor-auth:5001/api',
  segurosApiUrl: 'http://tu-servidor-seguros:5002/api'
};
```

**Nota:** Ajusta las URLs según tu configuración de producción.

---

## 🐳 Paso 2: Construir la imagen Docker

Abre una terminal en la carpeta raíz del proyecto y ejecuta:

```bash
docker build -t seguros-frontend .
```

**Explicación:**
- `docker build`: Comando para construir una imagen
- `-t seguros-frontend`: Le da un nombre (tag) a la imagen
- `.`: Indica que el Dockerfile está en el directorio actual

**⏱️ Tiempo estimado:** 3-5 minutos (la primera vez puede tardar más)

---

## 🏃 Paso 3: Ejecutar el contenedor

### Opción A: Usando Docker directamente

```bash
docker run -d -p 8080:80 --name seguros-frontend seguros-frontend
```

**Explicación:**
- `docker run`: Ejecuta un contenedor
- `-d`: Ejecuta en segundo plano (detached)
- `-p 8080:80`: Mapea el puerto 80 del contenedor al puerto 8080 de tu máquina
- `--name seguros-frontend`: Le da un nombre al contenedor
- `seguros-frontend`: Nombre de la imagen a usar

### Opción B: Usando Docker Compose (Recomendado)

```bash
docker-compose up -d
```

**Explicación:**
- `docker-compose up`: Levanta los servicios definidos en docker-compose.yml
- `-d`: Ejecuta en segundo plano

---

## ✅ Paso 4: Verificar que funciona

1. Abre tu navegador
2. Ve a: `http://localhost:8080`
3. Deberías ver tu aplicación Angular funcionando

---

## 📝 Comandos útiles de Docker

### Ver contenedores en ejecución
```bash
docker ps
```

### Ver todos los contenedores (incluyendo detenidos)
```bash
docker ps -a
```

### Ver logs del contenedor
```bash
docker logs seguros-frontend
```

### Detener el contenedor
```bash
docker stop seguros-frontend
```

### Iniciar un contenedor detenido
```bash
docker start seguros-frontend
```

### Eliminar el contenedor
```bash
docker rm seguros-frontend
```

### Eliminar la imagen
```bash
docker rmi seguros-frontend
```

### Ver imágenes disponibles
```bash
docker images
```

### Detener y eliminar contenedor (todo en uno)
```bash
docker stop seguros-frontend && docker rm seguros-frontend
```

### Reconstruir después de cambios
```bash
# Detener y eliminar el contenedor actual
docker stop seguros-frontend && docker rm seguros-frontend

# Reconstruir la imagen
docker build -t seguros-frontend .

# Volver a ejecutar
docker run -d -p 8080:80 --name seguros-frontend seguros-frontend
```

O con Docker Compose:
```bash
docker-compose down
docker-compose up -d --build
```

---

## 🔧 Solución de problemas

### Error: "port is already allocated"
El puerto 8080 ya está en uso. Soluciones:
- Cambia el puerto en `docker-compose.yml` (ej: `8081:80`)
- O detén el proceso que usa el puerto 8080

### Error: "Cannot connect to Docker daemon"
- Verifica que Docker Desktop esté ejecutándose
- Reinicia Docker Desktop

### La aplicación no carga
- Verifica los logs: `docker logs seguros-frontend`
- Verifica que el contenedor esté corriendo: `docker ps`
- Verifica que puedas acceder a `http://localhost:8080`

### Cambios en el código no se reflejan
- Reconstruye la imagen: `docker build -t seguros-frontend .`
- Reinicia el contenedor: `docker restart seguros-frontend`

---

## 📦 Subir a Docker Hub (Opcional)

Si quieres compartir tu imagen o usarla en otros servidores:

### 1. Crear cuenta en Docker Hub
Ve a https://hub.docker.com y crea una cuenta

### 2. Iniciar sesión desde la terminal
```bash
docker login
```

### 3. Etiquetar tu imagen
```bash
docker tag seguros-frontend tu-usuario/seguros-frontend:latest
```

### 4. Subir la imagen
```bash
docker push tu-usuario/seguros-frontend:latest
```

### 5. Descargar en otro servidor
```bash
docker pull tu-usuario/seguros-frontend:latest
docker run -d -p 8080:80 --name seguros-frontend tu-usuario/seguros-frontend:latest
```

---

## 🎯 Resumen rápido

```bash
# 1. Construir
docker build -t seguros-frontend .

# 2. Ejecutar
docker run -d -p 8080:80 --name seguros-frontend seguros-frontend

# 3. Verificar
# Abre http://localhost:8080 en tu navegador

# 4. Ver logs (si hay problemas)
docker logs seguros-frontend

# 5. Detener
docker stop seguros-frontend

# 6. Eliminar
docker rm seguros-frontend
```

---

## 💡 Tips adicionales

1. **Desarrollo vs Producción**: Para desarrollo, sigue usando `ng serve`. Docker es mejor para producción.

2. **Variables de entorno**: Si necesitas cambiar URLs sin reconstruir, considera usar variables de entorno en Docker.

3. **Volúmenes**: Para desarrollo, puedes montar el código como volumen para ver cambios sin reconstruir.

4. **Multi-stage build**: El Dockerfile usa multi-stage build para mantener la imagen final pequeña (solo Nginx, sin Node.js).

---

¡Listo! Tu aplicación Angular ahora está corriendo en Docker. 🎉
