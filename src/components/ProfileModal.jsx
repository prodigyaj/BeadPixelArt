import React, { useState, useEffect, useCallback } from 'react';
import { User, X, LogOut, Save, FolderOpen, Trash2, Plus, CopyPlus, UserX } from 'lucide-react';
import {
  listProfiles,
  createProfile,
  listProjects,
  getProject,
  saveProject,
  deleteProject,
  newProjectId,
  loadLastProfileId
} from '../core/profileApi.js';

const formatDate = (iso) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

// Mounted only while open, so state initializes fresh from props each time
export function ProfileModal({
  isWelcome, // startup screen: must pick a profile or continue as guest before using the app
  onContinueAsGuest,
  onClose,
  currentProfile,
  onChangeProfile,
  currentProject, // { id, name } of the project being edited, or null
  onChangeCurrentProject,
  getProjectData, // () => serializable snapshot of the current design + threading status
  onLoadProject // (project) => restores a saved project into the app
}) {
  const [profiles, setProfiles] = useState([]);
  const [projects, setProjects] = useState([]);
  const [newProfileName, setNewProfileName] = useState('');
  const [projectName, setProjectName] = useState(currentProject?.name || '');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  // Runs an API action with shared busy/error handling
  const run = useCallback(async (action) => {
    setIsBusy(true);
    setError(null);
    setStatus(null);
    try {
      return await action();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsBusy(false);
    }
  }, []);

  const refresh = useCallback(
    () =>
      run(async () => {
        if (currentProfile) {
          try {
            setProjects(await listProjects(currentProfile.id));
          } catch (err) {
            // Profile was removed from the server's data folder; fall back to the picker
            if (err.message === 'Profile not found') {
              onChangeProfile(null);
              return;
            }
            throw err;
          }
        } else {
          setProfiles(await listProfiles());
        }
      }),
    [run, currentProfile, onChangeProfile]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  // After signing in, stay open on the project list only if there is something to resume
  const signIn = async (profile) => {
    const existingProjects = await listProjects(profile.id);
    setProjects(existingProjects);
    setProjectName('');
    onChangeCurrentProject(null);
    onChangeProfile(profile, { keepOpen: existingProjects.length > 0 });
  };

  const handleSignIn = (profile) => run(() => signIn(profile));

  const handleCreateProfile = (e) => {
    e.preventDefault();
    run(async () => {
      const profile = await createProfile(newProfileName);
      setNewProfileName('');
      await signIn(profile);
    });
  };

  // Most recently used profile first, so returning users can continue with one click
  const lastProfileId = loadLastProfileId();
  const sortedProfiles = [...profiles].sort((a, b) => (b.id === lastProfileId) - (a.id === lastProfileId));

  const handleSave = (asNew) =>
    run(async () => {
      const id = asNew || !currentProject ? newProjectId() : currentProject.id;
      const saved = await saveProject(currentProfile.id, id, { ...getProjectData(), name: projectName });
      onChangeCurrentProject({ id: saved.id, name: saved.name });
      setProjectName(saved.name);
      setProjects(await listProjects(currentProfile.id));
      setStatus(`Saved “${saved.name}”`);
    });

  const handleOpen = (summary) =>
    run(async () => {
      const project = await getProject(currentProfile.id, summary.id);
      onLoadProject(project);
      onChangeCurrentProject({ id: project.id, name: project.name });
      onClose();
    });

  const handleDelete = (summary) => {
    if (!window.confirm(`Delete “${summary.name}”? This cannot be undone.`)) return;
    run(async () => {
      await deleteProject(currentProfile.id, summary.id);
      if (currentProject?.id === summary.id) onChangeCurrentProject(null);
      setProjects(await listProjects(currentProfile.id));
    });
  };

  return (
    <div className="modal-overlay" onClick={isWelcome ? undefined : onClose}>
      <div className="modal-content" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
        <div className="panel-header" style={{ justifyContent: 'space-between' }}>
          <h2 className="panel-title" style={{ fontSize: '1.05rem', margin: 0 }}>
            <User size={18} />
            <span>
              {currentProfile
                ? `${currentProfile.name}'s Projects`
                : isWelcome
                  ? 'Welcome to BeadPixel Art Studio'
                  : 'Choose Your Profile'}
            </span>
          </h2>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {currentProfile && (
              <button
                className="btn btn-sm"
                onClick={() => {
                  onChangeProfile(null);
                  onChangeCurrentProject(null);
                }}
                title="Switch to a different profile"
              >
                <LogOut size={14} />
                <span>Switch</span>
              </button>
            )}
            {!isWelcome && (
              <button className="btn btn-sm" onClick={onClose} aria-label="Close modal">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div style={{ fontSize: '0.78rem', color: '#FCA5A5', background: 'rgba(239, 68, 68, 0.12)', padding: '0.5rem 0.7rem', borderRadius: 'var(--radius-md)' }}>
            {error}
          </div>
        )}
        {status && (
          <div style={{ fontSize: '0.78rem', color: '#A7F3D0', background: 'rgba(16, 185, 129, 0.12)', padding: '0.5rem 0.7rem', borderRadius: 'var(--radius-md)' }}>
            {status}
          </div>
        )}

        {!currentProfile ? (
          <>
            <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: 0 }}>
              No password needed — pick your name to see your saved projects, or create a new profile. Profiles are stored on the computer running BeadPixel Studio.
            </p>

            {sortedProfiles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span className="control-label">Continue as</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {sortedProfiles.map((p) => (
                    <button
                      key={p.id}
                      className={`btn ${p.id === lastProfileId ? 'btn-primary' : ''}`}
                      onClick={() => handleSignIn(p)}
                      disabled={isBusy}
                      title={p.id === lastProfileId ? 'Last used on this browser' : undefined}
                    >
                      <User size={14} />
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <span className="control-label">Create a new profile</span>

            <form onSubmit={handleCreateProfile} style={{ display: 'flex', gap: '0.4rem' }}>
              <input
                type="text"
                placeholder="New profile name"
                value={newProfileName}
                maxLength={60}
                onChange={(e) => setNewProfileName(e.target.value)}
                style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
              />
              <button type="submit" className="btn btn-primary" disabled={isBusy || !newProfileName.trim()}>
                <Plus size={14} />
                <span>Create</span>
              </button>
            </form>

            {isWelcome && (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.76rem', color: '#94A3B8', textAlign: 'left' }}>
                  Just exploring? Guests can design freely but can't save projects.
                </span>
                <button className="btn" onClick={onContinueAsGuest} disabled={isBusy}>
                  <UserX size={14} />
                  <span>Continue as Guest</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Save current design */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span className="control-label">
                {currentProject ? `Editing “${currentProject.name}”` : 'Save the current design and threading progress'}
              </span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="text"
                  placeholder="Project name"
                  value={projectName}
                  maxLength={60}
                  onChange={(e) => setProjectName(e.target.value)}
                  style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                />
                <button className="btn btn-primary" onClick={() => handleSave(false)} disabled={isBusy}>
                  <Save size={14} />
                  <span>Save</span>
                </button>
                {currentProject && (
                  <button className="btn" onClick={() => handleSave(true)} disabled={isBusy} title="Save as a separate new project">
                    <CopyPlus size={14} />
                    <span>Save as New</span>
                  </button>
                )}
              </div>
            </div>

            {/* Saved projects */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span className="control-label">Saved Projects ({projects.length})</span>
              {projects.length === 0 && (
                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>No saved projects yet.</span>
              )}
              {projects.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.65rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${currentProject?.id === p.id ? 'rgba(99, 102, 241, 0.6)' : 'var(--border-subtle)'}`,
                    background: 'rgba(15, 23, 42, 0.5)'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                      {p.columns}×{p.rows} • {p.percentDone ?? 0}% done ({p.completedThreadCount}/{p.columns} threads) • {formatDate(p.updatedAt)}
                    </div>
                  </div>
                  <button className="btn btn-sm" onClick={() => handleOpen(p)} disabled={isBusy}>
                    <FolderOpen size={13} />
                    <span>Open</span>
                  </button>
                  <button className="btn btn-sm" onClick={() => handleDelete(p)} disabled={isBusy} aria-label={`Delete ${p.name}`}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
