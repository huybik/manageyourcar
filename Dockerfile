#--------------------------------------------------------------------------
# Stage 1: Build the React Client
#--------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install *all* dependencies (including dev)
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the client application
# This should generate the output in /app/dist/public based on vite.config.ts
RUN npm run build

#--------------------------------------------------------------------------
# Stage 2: Setup Production Server Environment
#--------------------------------------------------------------------------
FROM node:20-alpine

WORKDIR /app

# Copy package files and install *only* production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy necessary server files and shared code from the source
COPY server ./server
COPY shared ./shared
COPY drizzle.config.ts .
# Copy migrations - might be needed if server runs them, or for reference
# If migrations are run externally, this can be omitted.
COPY migrations ./migrations

# Copy the built client assets from the builder stage
COPY --from=builder /app/dist/public ./dist/public

# Set environment to production
ENV NODE_ENV=production

# Expose the port the server listens on (from server/index.ts)
EXPOSE 5000

# Add a basic healthcheck (optional but recommended)
# Adjust the path if you have a specific healthcheck endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Set the user to run the application (security best practice)
USER node

# Command to run the server application
CMD ["node", "server/index.js"]