# ---------- Étape 1 : build Angular ----------
FROM node:22-alpine AS build
WORKDIR /app
# Même version de npm que sur le poste de dev (lock file identique)
RUN npm install -g npm@11.6.2
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx ng build --configuration production

# ---------- Étape 2 : Nginx sert les fichiers ----------
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1