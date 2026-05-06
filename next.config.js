/** @type {import('next').NextConfig} */
const nextConfig = {
  // basePath apenas em produção (quando rodar atrás do proxy)
  basePath: process.env.NODE_ENV === "production" ? "/programa/sistema" : "",
  trailingSlash: false,
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig;
