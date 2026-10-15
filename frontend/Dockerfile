FROM nginx:alpine

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html formulario.html style.css app.js /usr/share/nginx/html/
COPY img/ /usr/share/nginx/html/img/

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
