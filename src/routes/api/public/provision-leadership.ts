import { createFileRoute } from '@tanstack/react-router';

async function handle({ request }: { request: Request }) {
  const { handleLeadershipRequest } = await import('@/server/leadership-handler.server');
  return handleLeadershipRequest(request);
}

export const Route = createFileRoute('/api/public/provision-leadership')({
  server: {
    handlers: {
      POST: handle,
      OPTIONS: handle,
      GET: () => Response.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'POST, OPTIONS', 'Cache-Control': 'no-store' } }),
    },
  },
});