import type { NextConfig } from "next";

/**
 * `/api/*` is proxied to the SentriX FastAPI backend so the browser makes
 * same-origin requests (no CORS config needed on the backend). Point
 * `BACKEND_ORIGIN` elsewhere for staging/prod; defaults to the local
 * `uvicorn app.main:app --port 8000`.
 */
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_ORIGIN}/:path*`,
      },
    ];
  },
};

export default nextConfig;
