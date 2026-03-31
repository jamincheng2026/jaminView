import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
};

export default withNextIntl(nextConfig);
