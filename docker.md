# Docker

## Build

```
docker build -t gabrielraeder/slack-proxy:0.02 .
```

## Run locally

```
docker run -d -p 8081:3000 gabrielraeder/slack-proxy:0.02
```

## Run in production (behind a reverse proxy / TLS-terminating edge)

`NODE_ENV=production` enables the HTTP -> HTTPS redirect in `server.js`, so any
request that reaches the container over plain HTTP gets redirected.

```
docker run -d -p 8081:3000 -e NODE_ENV=production gabrielraeder/slack-proxy:0.02
```

## Push to Docker Hub

```
docker login
docker push gabrielraeder/slack-proxy:0.02
```

## Notes

- The container listens on port 3000 internally (`EXPOSE 3000` in the
  `Dockerfile`); map it to whatever host port you want with `-p`.
- `GET /healthz` returns 200 and is excluded from the HTTPS redirect, since
  platform health checks (e.g. DigitalOcean App Platform) hit the container
  directly over HTTP, bypassing the TLS edge.
- On DigitalOcean App Platform, TLS is terminated at the platform's edge, so
  the container never needs a certificate/private key directly.
- On a Droplet, put a reverse proxy (Caddy, Nginx + Certbot) in front to
  terminate TLS; the container itself only ever speaks plain HTTP.
