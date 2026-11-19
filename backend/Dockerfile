# Imagen de la API (contexto de build: raíz del monorepo).
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
# --ignore-scripts evita el postinstall que instala contracts/ (no se necesita aquí)
RUN npm ci -w backend --include-workspace-root=false --ignore-scripts
COPY backend backend
RUN npm run build -w backend

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci -w backend --include-workspace-root=false --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=build /app/backend/dist backend/dist
# Carpeta de imágenes subidas (UPLOAD_DIR); en producción conviene un volumen o almacenamiento externo
RUN mkdir -p backend/uploads && chown node:node backend/uploads
USER node
WORKDIR /app/backend
EXPOSE 3001
CMD ["node", "dist/main.js"]
