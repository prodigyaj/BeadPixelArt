// Profile & Project Storage API (honor system: profiles are just names, no passwords)
// Data lives as JSON files on whichever machine runs the server:
//   data/profiles.json                         -> [{ id, name, createdAt }]
//   data/projects/<profileId>/<projectId>.json -> full saved project
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const ID_PATTERN = /^[a-zA-Z0-9-]{1,64}$/;
const MAX_BODY_BYTES = 25 * 1024 * 1024; // uploaded images are stored inline as data URIs
const MAX_NAME_LENGTH = 60;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function createStore(dataDir) {
  const profilesFile = path.join(dataDir, 'profiles.json');
  const projectsDir = (profileId) => path.join(dataDir, 'projects', profileId);
  const projectFile = (profileId, projectId) => path.join(projectsDir(profileId), `${projectId}.json`);

  async function readJson(file, fallback) {
    try {
      return JSON.parse(await fs.readFile(file, 'utf8'));
    } catch (err) {
      if (err.code === 'ENOENT') return fallback;
      throw err;
    }
  }

  // Write to a temp file first so a crash mid-write never leaves a truncated JSON file
  async function writeJson(file, value) {
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(value, null, 2));
    await fs.rename(tmp, file);
  }

  async function getProfile(profileId) {
    const profiles = await readJson(profilesFile, []);
    const profile = profiles.find((p) => p.id === profileId);
    if (!profile) throw new HttpError(404, 'Profile not found');
    return profile;
  }

  return {
    listProfiles: () => readJson(profilesFile, []),

    // Signing in with an existing name (case-insensitive) returns that profile
    async createProfile(rawName) {
      const name = String(rawName ?? '').trim().slice(0, MAX_NAME_LENGTH);
      if (!name) throw new HttpError(400, 'Name is required');
      const profiles = await readJson(profilesFile, []);
      const existing = profiles.find((p) => p.name.toLowerCase() === name.toLowerCase());
      if (existing) return existing;
      const profile = { id: crypto.randomUUID(), name, createdAt: new Date().toISOString() };
      await writeJson(profilesFile, [...profiles, profile]);
      return profile;
    },

    async listProjects(profileId) {
      await getProfile(profileId);
      let files = [];
      try {
        files = await fs.readdir(projectsDir(profileId));
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }
      const projects = await Promise.all(
        files
          .filter((f) => f.endsWith('.json'))
          .map((f) => readJson(path.join(projectsDir(profileId), f), null))
      );
      // Summaries only; the full project (including the image) is fetched on open
      return projects
        .filter(Boolean)
        .map(({ id, name, createdAt, updatedAt, columns, rows, threading }) => {
          // beadProgress: { [col]: beads strung }; older projects only stored completedThreads
          const counts = threading?.beadProgress
            ? Object.values(threading.beadProgress).map((n) => Math.min(n, rows))
            : (threading?.completedThreads || []).map(() => rows);
          const beadsDone = counts.reduce((acc, n) => acc + n, 0);
          return {
            id,
            name,
            createdAt,
            updatedAt,
            columns,
            rows,
            completedThreadCount: counts.filter((n) => n >= rows).length,
            percentDone: columns * rows ? Math.round((beadsDone / (columns * rows)) * 100) : 0
          };
        })
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },

    async getProject(profileId, projectId) {
      await getProfile(profileId);
      const project = await readJson(projectFile(profileId, projectId), null);
      if (!project) throw new HttpError(404, 'Project not found');
      return project;
    },

    async saveProject(profileId, projectId, data) {
      await getProfile(profileId);
      if (!data || typeof data !== 'object') throw new HttpError(400, 'Project data is required');
      const name = String(data.name ?? '').trim().slice(0, MAX_NAME_LENGTH) || 'Untitled Project';
      const existing = await readJson(projectFile(profileId, projectId), null);
      const now = new Date().toISOString();
      const project = {
        ...data,
        id: projectId,
        name,
        createdAt: existing?.createdAt || now,
        updatedAt: now
      };
      await writeJson(projectFile(profileId, projectId), project);
      return project;
    },

    async deleteProject(profileId, projectId) {
      await getProfile(profileId);
      try {
        await fs.unlink(projectFile(profileId, projectId));
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }
    }
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new HttpError(413, 'Project is too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch {
        reject(new HttpError(400, 'Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, value) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(value === undefined ? '' : JSON.stringify(value));
}

function createApiMiddleware(store) {
  return async (req, res, next) => {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith('/api/')) return next();

    const parts = url.pathname.split('/').filter(Boolean).slice(1); // drop 'api'
    try {
      // Reject anything that could escape the data directory
      if (parts.slice(1).some((p, i) => i % 2 === 0 && !ID_PATTERN.test(p))) {
        throw new HttpError(400, 'Invalid id');
      }
      const [resource, profileId, sub, projectId] = parts;
      const route = `${req.method} ${[resource, profileId && ':p', sub, projectId && ':j'].filter(Boolean).join('/')}`;

      switch (route) {
        case 'GET profiles':
          return sendJson(res, 200, await store.listProfiles());
        case 'POST profiles':
          return sendJson(res, 200, await store.createProfile((await readBody(req)).name));
        case 'GET profiles/:p/projects':
          return sendJson(res, 200, await store.listProjects(profileId));
        case 'GET profiles/:p/projects/:j':
          return sendJson(res, 200, await store.getProject(profileId, projectId));
        case 'PUT profiles/:p/projects/:j':
          return sendJson(res, 200, await store.saveProject(profileId, projectId, await readBody(req)));
        case 'DELETE profiles/:p/projects/:j':
          await store.deleteProject(profileId, projectId);
          return sendJson(res, 204);
        default:
          throw new HttpError(404, 'Not found');
      }
    } catch (err) {
      if (!(err instanceof HttpError)) console.error('[Profiles API]', err);
      sendJson(res, err.status || 500, { error: err.status ? err.message : 'Server error' });
    }
  };
}

// Vite plugin: serves the profile API from both `vite` (dev) and `vite preview`
export function profileStorePlugin({ dataDir }) {
  const middleware = createApiMiddleware(createStore(dataDir));
  return {
    name: 'bead-profile-store',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    }
  };
}
