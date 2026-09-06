import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Agent View — Kernel',
    short_name: 'Agent View',
    description:
      'A live view of an AI agent driving a real cloud browser on Kernel, with its reasoning and tool calls broken out around the browser.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0d0a',
    theme_color: '#0b0d0a',
    icons: [
      {
        src: '/kernel/logo-kernel-square.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}
