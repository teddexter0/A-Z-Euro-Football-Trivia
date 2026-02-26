// Socket.io is handled by server.js (custom Node.js server).
// This endpoint exists only as a health check.
export default function SocketHandler(req, res) {
  res.json({ status: 'ok', message: 'Socket.io is running via custom server' });
}
