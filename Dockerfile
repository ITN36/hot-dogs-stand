# Utilizar una imagen ligera de Nginx basada en Alpine
FROM nginx:alpine

# Copiar el contenido del proyecto al directorio de Nginx
COPY . /usr/share/nginx/html

# Exponer el puerto 80 (estándar para Nginx y detectado por Render)
EXPOSE 80

# Usamos un comando de inicio que inyecta la variable de entorno en el archivo de configuración
# y luego arranca Nginx. Esto permite usar ADMIN_PASSWORD de Render en el frontend.
CMD ["/bin/sh", "-c", "sed -i \"s|PLACEHOLDER_PASSWORD|$ADMIN_PASSWORD|g\" /usr/share/nginx/html/assets/js/config.js && nginx -g \"daemon off;\""]
