import { KubeConnection } from '../types';

const CONNECTIONS_KEY = 'kubeConnections';

type KubeConnectionPayload = Omit<KubeConnection, 'id' | 'name'>;

/**
 * Retrieves all saved Kubernetes connections from localStorage.
 * @returns An array of KubeConnection objects, sorted by name.
 */
export function getConnections(): KubeConnection[] {
  try {
    const connectionsJson = localStorage.getItem(CONNECTIONS_KEY);
    if (!connectionsJson) {
      return [];
    }
    const connections = JSON.parse(connectionsJson) as KubeConnection[];
    return connections.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Failed to retrieve Kubernetes connections from localStorage:", error);
    return [];
  }
}

/**
 * Saves a new Kubernetes connection configuration to localStorage.
 * @param data The connection data to save.
 * @returns The newly created KubeConnection object.
 */
export function saveConnection(data: KubeConnectionPayload): KubeConnection {
  const connections = getConnections();
  
  const name = `${data.namespace} / ${data.workload} / ${data.container}`;

  const newConnection: KubeConnection = {
    id: `conn_${Date.now()}`,
    name,
    ...data
  };

  // Avoid saving duplicates of the exact same path
  const existing = connections.find(c => c.name === newConnection.name);
  if (existing) {
    return existing;
  }

  connections.push(newConnection);

  try {
    localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(connections));
  } catch (error) {
    console.error("Failed to save Kubernetes connection to localStorage:", error);
  }

  return newConnection;
}

/**
 * Deletes a connection from localStorage by its ID.
 * @param id The ID of the connection to delete.
 */
export function deleteConnection(id: string): void {
  let connections = getConnections();
  connections = connections.filter(conn => conn.id !== id);
  try {
    localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(connections));
  } catch (error) {
    console.error("Failed to delete Kubernetes connection from localStorage:", error);
  }
}