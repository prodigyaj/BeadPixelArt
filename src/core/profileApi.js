// Client for the profile & project storage API served by the dev/preview server

// Chosen once per browser session (survives refresh, cleared when the browser closes)
const SESSION_KEY = 'beadpixel.session';
// Remembered across sessions so the welcome screen can highlight the last user
const LAST_PROFILE_KEY = 'beadpixel.lastProfileId';

async function request(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

export const listProfiles = () => request('GET', '/api/profiles');

export const createProfile = (name) => request('POST', '/api/profiles', { name });

export const listProjects = (profileId) => request('GET', `/api/profiles/${profileId}/projects`);

export const getProject = (profileId, projectId) =>
  request('GET', `/api/profiles/${profileId}/projects/${projectId}`);

export const saveProject = (profileId, projectId, project) =>
  request('PUT', `/api/profiles/${profileId}/projects/${projectId}`, project);

export const deleteProject = (profileId, projectId) =>
  request('DELETE', `/api/profiles/${profileId}/projects/${projectId}`);

export const newProjectId = () => crypto.randomUUID();

/**
 * Who is using this browser session: { type: 'profile', profile } | { type: 'guest' } | null
 * (null means nobody has chosen yet, so the welcome screen is shown)
 */
export function loadSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export function storeSession(session) {
  if (session) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
  if (session?.type === 'profile') localStorage.setItem(LAST_PROFILE_KEY, session.profile.id);
}

export const loadLastProfileId = () => localStorage.getItem(LAST_PROFILE_KEY);
