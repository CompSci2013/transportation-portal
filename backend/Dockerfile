FROM node:18-alpine

WORKDIR /app

# Copy package files (will be created in container)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose API port
EXPOSE 3000

# Development command
CMD ["npm", "run", "dev"]
