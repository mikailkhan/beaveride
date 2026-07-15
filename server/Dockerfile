# Use the official Node.js 24 Alpine image (small and lightweight)
FROM node:24-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files first.
# Docker caches this layer, so npm install won't run again
# unless package.json or package-lock.json changes.
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Expose the application's port
EXPOSE 3000

# Run database migrations, seed initial data, then start the development server.
# "&&" means:
#   1. Run migrations.
#   2. Run seed script.
#   3. If both succeed, start the server.
#   4. If any fail, the container exits.
CMD ["sh", "-c", "npm run db:migrate && npm run db:seed && npm run dev"]
