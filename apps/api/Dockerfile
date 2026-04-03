FROM python:3.12-slim

WORKDIR /app

# Installer system-avhengigheter inkl. Playwright/Chromium-krav
RUN apt-get update && apt-get install -y \
    git \
    curl \
    build-essential \
    wget \
    gnupg \
    ca-certificates \
    # Playwright / Chromium runtime-avhengigheter
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libcairo2 \
    libxshmfence1 \
    libx11-xcb1 \
    libxcb-dri3-0 \
    fonts-liberation \
    xvfb \
    libasound2t64 \
    && rm -rf /var/lib/apt/lists/*

# Kopier requirements og installer Python-pakker
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Installer Playwright og Chromium (med alle system-avhengigheter)
RUN playwright install chromium --with-deps

# Kopier kildekode
COPY . .

# Opprett workspace-mappe
RUN mkdir -p /tmp/sine_workspaces

# Eksponér port
EXPOSE 8000

# Start serveren med PORT fra miljøvariabel (Railway setter denne)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
