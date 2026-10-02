FROM node:22-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 8888
CMD ["npm", "run", "dev:netlify", "--", "--offline", "--no-open", "--port", "8888"]
