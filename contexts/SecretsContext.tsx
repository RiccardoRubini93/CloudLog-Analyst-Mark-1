import React, { createContext, useContext, useState, useEffect } from 'react';
import { SecretsContextType } from '../types';

const SecretsContext = createContext<SecretsContextType | undefined>(undefined);

export const SecretsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projectId, setProjectId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [isEnvManaged, setIsEnvManaged] = useState(false);

  const loadFromEnv = () => {
    console.log("[SecretsContext] Scanning for environment variables...");

    // Helper to safely get env var from multiple potential sources
    const getEnvValue = (key: string): string | undefined => {
      // 1. Check standard process.env (Node/Webpack/Build-time)
      if (process.env[key]) return process.env[key];

      // 2. Check import.meta.env (Vite)
      try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
          // @ts-ignore
          return import.meta.env[key];
        }
      } catch (e) { /* ignore */ }

      // 3. Check window._env_ (Runtime injection pattern common in Docker/Cloud Run)
      // @ts-ignore
      if (typeof window !== 'undefined' && window._env_ && window._env_[key]) {
        // @ts-ignore
        return window._env_[key];
      }

      return undefined;
    };

    // Define potential key names (Standard, Vite-prefixed, React-prefixed)
    const pidKeys = ['GCP_PROJECT_ID', 'VITE_GCP_PROJECT_ID', 'REACT_APP_GCP_PROJECT_ID'];
    const tokenKeys = ['GCP_ACCESS_TOKEN', 'VITE_GCP_ACCESS_TOKEN', 'REACT_APP_GCP_ACCESS_TOKEN'];

    let foundPid: string | undefined;
    let foundToken: string | undefined;

    // Scan for Project ID
    for (const key of pidKeys) {
      const val = getEnvValue(key);
      if (val) {
        console.log(`[SecretsContext] Found Project ID in ${key}`);
        foundPid = val;
        break;
      }
    }

    // Scan for Access Token
    for (const key of tokenKeys) {
      const val = getEnvValue(key);
      if (val) {
        console.log(`[SecretsContext] Found Access Token in ${key} (length: ${val.length})`);
        foundToken = val;
        break;
      }
    }

    if (foundPid && foundToken) {
      console.log("[SecretsContext] Successfully loaded GCP credentials from environment.");
      setProjectId(foundPid);
      setAccessToken(foundToken);
      sessionStorage.setItem('gcp_project_id', foundPid);
      sessionStorage.setItem('gcp_access_token', foundToken);
      setIsEnvManaged(true);
      return true;
    } else {
      console.warn("[SecretsContext] Failed to find both GCP_PROJECT_ID and GCP_ACCESS_TOKEN in any standard location.");
      if (!foundPid) console.warn(" - Missing Project ID");
      if (!foundToken) console.warn(" - Missing Access Token");
      return false;
    }
  };

  // Load from session storage or env on mount
  useEffect(() => {
    // Try env first
    if (loadFromEnv()) return;

    // Fallback to session storage
    const storedProject = sessionStorage.getItem('gcp_project_id');
    const storedToken = sessionStorage.getItem('gcp_access_token');
    if (storedProject) setProjectId(storedProject);
    if (storedToken) setAccessToken(storedToken);
  }, []);

  const setSecrets = (pid: string, token: string) => {
    setProjectId(pid);
    setAccessToken(token);
    sessionStorage.setItem('gcp_project_id', pid);
    sessionStorage.setItem('gcp_access_token', token);
    setIsEnvManaged(false); // If manually set, it's no longer purely env managed
  };

  const clearSecrets = () => {
    setProjectId('');
    setAccessToken('');
    setIsEnvManaged(false);
    sessionStorage.removeItem('gcp_project_id');
    sessionStorage.removeItem('gcp_access_token');
  };

  return (
    <SecretsContext.Provider value={{ 
      projectId, 
      accessToken, 
      setSecrets, 
      clearSecrets,
      hasSecrets: !!projectId && !!accessToken,
      isEnvManaged,
      loadFromEnv
    }}>
      {children}
    </SecretsContext.Provider>
  );
};

export const useSecrets = () => {
  const context = useContext(SecretsContext);
  if (context === undefined) {
    throw new Error('useSecrets must be used within a SecretsProvider');
  }
  return context;
};