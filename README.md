# Mc-Schematic-Manager-Server

Minecraft Schematic asset manager developed for Gold Studio.
This application handles the storage / display and ease of access of all assets.
It uses FAWE to transform schematics and upload them to server for use.

[Live Demo](https://mc-schematic-manager.vercel.app/login) ✨

[Front End Repo](https://github.com/NikolaMilinkovic/mc-schematic-manager) ✨

## 💻 Built With

![javascript](https://skillicons.dev/icons?i=js,nodejs,express,mongodb&perline=10)

## Deploy On Hetzner (Docker)

This repository now includes:

- `Dockerfile`
- `.dockerignore`
- `docker-compose.yml`
- `.env.example`

### 1) Prepare server

On your Hetzner Ubuntu/Debian server:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# Install Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
	"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
	$(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
	sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Optional: run docker without sudo
sudo usermod -aG docker $USER
newgrp docker
```

### 2) Upload/clone project

```bash
git clone <your-repo-url>
cd mc-schematic-manager-server
```

### 3) Configure environment

```bash
cp .env.example .env
nano .env
```

Fill all required values, especially:

- `DATABASE_URL`
- `JWT_SECRET`
- `SESSION_SECRET`
- Cloudinary values

### 4) Build and start

```bash
docker compose up -d --build
docker compose logs -f
```

Server is available on `http://<server-ip>:3000`.

### 5) Recommended: Nginx + HTTPS

Use Nginx as reverse proxy on `80/443` and forward to `127.0.0.1:3000`, then issue TLS with Certbot.

If your frontend domain is different from the current CORS list, also update `allowedOrigins` in `app.js`.

### Useful commands

```bash
docker compose ps
docker compose logs -f app
docker compose restart app
docker compose pull && docker compose up -d --build
```
