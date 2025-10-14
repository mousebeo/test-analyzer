
import { AnalysisResult, Session } from '../types';

const SESSIONS_KEY = 'analysisSessions';

/**
 * Retrieves all saved analysis sessions from localStorage.
 * @returns An array of Session objects.
 */
export function getSessions(): Session[] {
  try {
    const sessionsJson = localStorage.getItem(SESSIONS_KEY);
    if (!sessionsJson) {
      return [];
    }
    const sessions = JSON.parse(sessionsJson) as Session[];
    // Sort by timestamp descending (newest first)
    return sessions.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Failed to retrieve sessions from localStorage:", error);
    return [];
  }
}

/**
 * Saves a new analysis result as a session in localStorage.
 * @param result The AnalysisResult to save.
 * @param files The array of files used for the analysis, to generate a name.
 * @returns The newly created Session object.
 */
export function saveSession(result: AnalysisResult, files: File[]): Session {
  const sessions = getSessions();
  
  const name = files.length > 0
    ? files.map(f => f.name).join(', ').substring(0, 50) + (files.map(f => f.name).join(', ').length > 50 ? '...' : '')
    : 'K8s Log Analysis';

  const newSession: Session = {
    id: `session_${Date.now()}`,
    name: name || "Analysis Session",
    timestamp: Date.now(),
    result: result,
  };

  sessions.unshift(newSession); // Add to the beginning

  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error("Failed to save session to localStorage:", error);
  }

  return newSession;
}

/**
 * Retrieves a single session by its ID.
 * @param id The ID of the session to retrieve.
 * @returns The Session object, or undefined if not found.
 */
export function getSession(id: string): Session | undefined {
  const sessions = getSessions();
  return sessions.find(session => session.id === id);
}

/**
 * Deletes a session from localStorage by its ID.
 * @param id The ID of the session to delete.
 */
export function deleteSession(id: string): void {
  let sessions = getSessions();
  sessions = sessions.filter(session => session.id !== id);
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error("Failed to delete session from localStorage:", error);
  }
}

/**
 * Clears all saved sessions from localStorage.
 */
export function clearAllSessions(): void {
    try {
        localStorage.removeItem(SESSIONS_KEY);
    } catch (error) {
        console.error("Failed to clear sessions from localStorage:", error);
    }
}
