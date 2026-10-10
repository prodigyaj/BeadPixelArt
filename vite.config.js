import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdns from 'multicast-dns';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { profileStorePlugin } from './server/profileStore.js';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

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

const certDir = path.resolve(os.homedir(), '.vite-plugin-mkcert');
const certFile = path.join(certDir, 'cert.pem');
const keyFile = path.join(certDir, 'key.pem');

const httpsConfig =
  fs.existsSync(certFile) && fs.existsSync(keyFile)
    ? {
        cert: fs.readFileSync(certFile),
        key: fs.readFileSync(keyFile),
      }
    : true;

// https://vite.dev/config/
export default defineConfig({
  // Expose this machine's LAN IP so the Wi-Fi access modal shows a reachable address
  define: {
    __LAN_IP__: JSON.stringify(getLocalIp()),
  },
  plugins: [
    react(),
    localMdnsPlugin(),
    // Saved profiles & projects are stored on the machine running the server
    profileStorePlugin({ dataDir: path.join(projectRoot, 'data') }),
  ],
  server: {
    host: true, // Listen on all local interfaces (0.0.0.0)
    port: 5173,
    allowedHosts: true, // Accept beadstudio.local, aj.local, IP, and any custom local host
    https: httpsConfig,
  },
});
