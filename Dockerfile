# ---------- Base ----------
FROM node:22-alpine

# ---------- Workdir ----------
WORKDIR /app

# ---------- Install deps ----------
COPY package*.json ./
RUN npm install

# ---------- Copy source ----------
COPY . .

# ---------- Build ----------
RUN npm run build

# ---------- Runtime ----------
EXPOSE 8080

ENV PORT=8080
CMD ["npm", "run", "start"]
