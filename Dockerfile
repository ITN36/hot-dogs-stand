# Utilizar una imagen ligera de Node.js basada en Alpine
FROM node:18-alpine

# Crear el directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias e instalarlas
COPY package*.json ./
RUN npm install

# Copiar el resto del código del proyecto
COPY . .

# Exponer el puerto (Render lo detectará automáticamente)
EXPOSE 3000

# Comando para iniciar el servidor
CMD ["npm", "start"]
