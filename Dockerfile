FROM node:18-slim

# Install Ghostscript for high-quality PDF compression
RUN apt-get update && apt-get install -y ghostscript && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source
COPY . .

# Build the application
RUN npm run build

# Expose the application port
EXPOSE 3001

# Create uploads directory with proper permissions
RUN mkdir -p uploads && chmod 777 uploads

# Create a non-root user to run the application
RUN useradd -m paperflowuser && chown -R paperflowuser:paperflowuser /app

# Switch to non-root user
USER paperflowuser

# Start the application
CMD ["npm", "run", "start:prod"]
