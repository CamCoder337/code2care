import path from 'path'
import { fileURLToPath } from 'url'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration pour Vercel
  output: 'standalone',

  // Optimisations des images
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: [],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Configuration du compilateur
  compiler: {
    // Supprimer les console.log en production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Optimisations du bundle
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },

  // Configuration ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Configuration TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },

  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },

  // Configuration des redirections si nécessaire
  async redirects() {
    return []
  },

  // Configuration des rewrites si nécessaire
  async rewrites() {
    return []
  },

  // Variables d'environnement publiques
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Configuration du serveur en développement
  devIndicators: {
    position: 'bottom-right',
  },

  // Configuration pour la production
  productionBrowserSourceMaps: false,

  // Optimisation du bundle
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimisations additionnelles du webpack
    if (!dev && !isServer) {
      // Réduire la taille du bundle
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname),
      }
    }

    // Configuration pour les workers si nécessaire
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: { loader: 'worker-loader' },
    })

    return config
  },

  // Configuration des pages statiques (si applicable)
  trailingSlash: false,

  // Configuration de la génération statique
  generateEtags: true,

  // Configuration de la compression
  compress: true,
}

export default nextConfig