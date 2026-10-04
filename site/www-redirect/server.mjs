// Permanently redirects every request to the canonical apex domain.
import http from 'node:http';
const target = (process.env.REDIRECT_TO || 'https://awesomedataviz.com').replace(/\/$/, '');
http.createServer((req, res) => {
  res.writeHead(301, { location: target + (req.url || '/'), 'cache-control': 'public, max-age=86400' });
  res.end();
}).listen(process.env.PORT || 8080, '0.0.0.0');
