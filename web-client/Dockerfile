# Estágio 1: Build do frontend
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Estágio 2: Apache servindo arquivos estáticos
FROM httpd:alpine

COPY --from=build /app/dist/ /usr/local/apache2/htdocs/

COPY spa.conf /usr/local/apache2/conf/extra/spa.conf

RUN echo "Include conf/extra/spa.conf" >> /usr/local/apache2/conf/httpd.conf

EXPOSE 80

CMD ["httpd", "-D", "FOREGROUND"]
