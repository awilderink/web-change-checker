
# Use the official Bun image
FROM oven/bun:1 AS base

# Install dependencies for Puppeteer and Xvfb
# puppeteer-real-browser needs a display, so we use xvfb
RUN apt-get update && apt-get install -y \
    xvfb \
    chromium \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libxss1 \
    libgtk-3-0 \
    libxshmfence1 \
    libglu1 \
    fonts-liberation \
    libappindicator3-1 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
# puppeteer-real-browser will download its own chrome, but we need to ensure it works
RUN bun install

# Copy source
COPY . .

# Ensure data directory exists and has correct permissions
RUN mkdir -p /app/data && chmod 777 /app/data

# Build Next.js
RUN bun run build

# Expose port
EXPOSE 3000

# Start command
# We use xvfb-run to provide a virtual display for the browser
CMD ["xvfb-run", "--auto-servernum", "--server-args='-screen 0 1280x800x24'", "bun", "run", "start"]
