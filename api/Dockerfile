FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

COPY wait-for-it.sh .
RUN chmod +x wait-for-it.sh

RUN if [ ! -f .env ]; then cp .env.example .env; fi

RUN npm run build

FROM node:22-bookworm-slim AS prod

USER node
ENV NODE_ENV=production

WORKDIR /app

COPY --chown=node:node package*.json ./
RUN npm ci --only=production

COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/.env ./
COPY --from=builder --chown=node:node /app/wait-for-it.sh ./
RUN chmod +x wait-for-it.sh

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
