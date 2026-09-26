# Casa Bareque — static 3D structure served by Python's built-in HTTP server.
# Inside the container the app listens on :80 by default (Docker convention).
# Override with:  docker run -e PORT=8080 -p 8080:8080 <image>

FROM python:3.12-alpine

WORKDIR /app

# Copy only what's needed to serve the site
COPY index.html main.js medidas.js cercha.js house.js ./

# Default port inside the container
ENV PORT=80
EXPOSE ${PORT}

# Serve on 0.0.0.0 so it's reachable from the host through the published port.
# Shell form lets us expand ${PORT}; exec form via sh -c does the substitution.
CMD ["sh", "-c", "python3 -m http.server ${PORT} --bind 0.0.0.0"]
