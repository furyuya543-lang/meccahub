/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.steamstatic.com' },
      { protocol: 'https', hostname: 'avatars.akamai.steamstatic.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      // Steam Workshop preview images
      { protocol: 'https', hostname: 'steamuserimages-a.akamaihd.net' },
      { protocol: 'https', hostname: 'steamcdn-a.akamaihd.net' },
      { protocol: 'https', hostname: 'clan.akamai.steamstatic.com' },
      { protocol: 'https', hostname: 'cloud.steamusercontent.com' },
      { protocol: 'https', hostname: '*.steamstatic.com' },
    ],
  },
};

module.exports = nextConfig;
