import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * The IA moved from "a prompt library with a tracker bolted on" to five
   * stages of one application. These are the old URLs.
   *
   * Permanent (308) because they are never coming back, and because applicants
   * bookmark these pages in July and return to them in December — a temporary
   * redirect would leave a stale bookmark pointing at a 404 the moment we
   * stopped serving it.
   */
  async redirects() {
    return [
      { source: "/my-schools", destination: "/secondaries", permanent: true },
      { source: "/overlap", destination: "/secondaries", permanent: true },
      { source: "/interview-prep", destination: "/interviews", permanent: true },
    ];
  },
};

export default nextConfig;
