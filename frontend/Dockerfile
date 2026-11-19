# Imagen del frontend Next.js en modo standalone (contexto de build: raíz del monorepo).
# Las variables NEXT_PUBLIC_* se incrustan en el build, por eso llegan como build args.
FROM node:22-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG NEXT_PUBLIC_CHAIN_ID=11155111
ARG NEXT_PUBLIC_ESCROW_ADDRESS=
ARG NEXT_PUBLIC_RPC_URL=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_CHAIN_ID=$NEXT_PUBLIC_CHAIN_ID \
    NEXT_PUBLIC_ESCROW_ADDRESS=$NEXT_PUBLIC_ESCROW_ADDRESS \
    NEXT_PUBLIC_RPC_URL=$NEXT_PUBLIC_RPC_URL \
    NEXT_OUTPUT=standalone \
    NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci -w frontend --include-workspace-root=false --ignore-scripts
COPY frontend frontend
RUN npm run build -w frontend

FROM node:22-alpine AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build /app/frontend/.next/standalone ./
COPY --from=build /app/frontend/.next/static frontend/.next/static
COPY --from=build /app/frontend/public frontend/public
USER node
EXPOSE 3000
CMD ["node", "frontend/server.js"]
