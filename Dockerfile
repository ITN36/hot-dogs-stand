# Utilizar una imagen ligera de Nginx basada en Alpine
FROM nginx:alpine

# Copiar el contenido del proyecto al directorio de Nginx para servir archivos estáticos
COPY . /usr/share/nginx/html

# Exponer el puerto 80 (estándar para Nginx y detectado por Render)
EXPOSE 80

# Arrancar Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]
