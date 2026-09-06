import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import mdns from 'multicast-dns';
import os from 'os';

// Detect active local IPv4 address
function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

// Local mDNS Responder Plugin: responds to queries for beadstudio.local, beadpixel.local, aj.local
function localMdnsPlugin() {
  return {
    name: 'vite-local-mdns-responder',
    configureServer(server) {
      try {
        const responder = mdns();
        const localIp = getLocalIp();
        const hostnames = ['beadstudio.local', 'beadpixel.local', 'aj.local'];

        responder.on('query', (query) => {
          if (!query.questions) return;
          const match = query.questions.find((q) =>
            hostnames.some((h) => q.name && q.name.toLowerCase() === h.toLowerCase())
          );
          if (match) {
            responder.respond({
              answers: [
                {
                  name: match.name,
                  type: 'A',
                  ttl: 120,
                  data: localIp,
                },
              ],
            });
          }
        });

        // Broadcast announcements to local subnet
        hostnames.forEach((host) => {
          try {
            responder.respond({
              answers: [
                {
                  name: host,
                  type: 'A',
                  ttl: 120,
                  data: localIp,
                },
              ],
            });
          } catch (e) {
            // Ignore broadcast warning
          }
        });

        server.httpServer?.on('close', () => {
          try {
            responder.destroy();
          } catch (e) {}
        });

        console.log(`\n📡 [Local DNS] mDNS responder active for:`);
        console.log(`   👉 https://beadstudio.local:5173/`);
        console.log(`   👉 https://aj.local:5173/`);
        console.log(`   👉 https://${localIp}:5173/\n`);
      } catch (err) {
        console.warn('[Local DNS] Notice:', err.message);
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    localMdnsPlugin(),
  ],
  server: {
    host: true, // Listen on all local interfaces (0.0.0.0)
    port: 5173,
    allowedHosts: true, // Accept beadstudio.local, aj.local, IP, and any custom local host
  },
});
