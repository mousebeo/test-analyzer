
// services/kubernetesService.ts

// Simulate API call latency
const fakeAPICall = <T>(data: T, delay = 500): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(data), delay));

// Mock Data
const mockData = {
  namespaces: [
    { name: 'default' },
    { name: 'kube-system' },
    { name: 'monitoring' },
  ],
  workloads: {
    default: {
      Deployment: ['frontend-app', 'backend-api'],
      StatefulSet: ['database-cluster'],
    },
    'kube-system': {
      Deployment: ['coredns', 'metrics-server'],
      StatefulSet: [],
    },
    monitoring: {
      Deployment: ['prometheus-server', 'grafana'],
      StatefulSet: ['loki-stack'],
    },
  },
  pods: {
    'frontend-app': ['frontend-app-7b5b7c9c8c-abcde', 'frontend-app-7b5b7c9c8c-fghij'],
    'backend-api': ['backend-api-6f4d8b9d7d-12345'],
    'database-cluster': ['database-cluster-0', 'database-cluster-1'],
    'coredns': ['coredns-558bd4d5db-klmnp', 'coredns-558bd4d5db-qrstu'],
    'metrics-server': ['metrics-server-57fd679fcd-vwxyz'],
    'prometheus-server': ['prometheus-server-86c5c846d7-ab123'],
    'grafana': ['grafana-5d6b7c8f9g-cd456'],
    'loki-stack': ['loki-stack-0'],
  },
  containers: {
    'frontend-app-7b5b7c9c8c-abcde': ['nginx', 'sidecar-proxy'],
    'frontend-app-7b5b7c9c8c-fghij': ['nginx', 'sidecar-proxy'],
    'backend-api-6f4d8b9d7d-12345': ['api-service'],
    'database-cluster-0': ['postgres'],
    'database-cluster-1': ['postgres'],
    'coredns-558bd4d5db-klmnp': ['coredns'],
    'coredns-558bd4d5db-qrstu': ['coredns'],
    'metrics-server-57fd679fcd-vwxyz': ['metrics-server'],
    'prometheus-server-86c5c846d7-ab123': ['prometheus', 'config-reloader'],
    'grafana-5d6b7c8f9g-cd456': ['grafana'],
    'loki-stack-0': ['loki'],
  },
};

// Mock Service Functions
export const parseKubeconfig = async (file: File): Promise<boolean> => {
  // In a real app, you'd parse this. Here, we just simulate success.
  console.log('Parsing kubeconfig file:', file.name);
  return fakeAPICall(true, 300);
};

export const getNamespaces = async (): Promise<string[]> => {
  return fakeAPICall(mockData.namespaces.map(ns => ns.name));
};

export const getWorkloads = async (namespace: string, type: 'Deployment' | 'StatefulSet'): Promise<string[]> => {
  const nsWorkloads = mockData.workloads[namespace as keyof typeof mockData.workloads];
  if (!nsWorkloads) return fakeAPICall([]);
  return fakeAPICall(nsWorkloads[type] || []);
};

export const getPods = async (namespace: string, workloadName: string): Promise<string[]> => {
    const pods = mockData.pods[workloadName as keyof typeof mockData.pods];
    return fakeAPICall(pods || []);
};

export const getContainers = async (namespace: string, podName: string): Promise<string[]> => {
    const containers = mockData.containers[podName as keyof typeof mockData.containers];
    return fakeAPICall(containers || []);
};

export const fetchLogs = async (namespace: string, podName: string, containerName: string): Promise<string> => {
  const logContent = `
[2024-05-21T10:00:05Z] INFO: Starting container ${containerName} in pod ${podName} (namespace: ${namespace}).
[2024-05-21T10:00:06Z] INFO: Application listener started on port 8080.
[2024-05-21T10:01:15Z] DEBUG: Received request GET /api/health
[2024-05-21T10:01:15Z] DEBUG: Responding with 200 OK
[2024-05-21T10:02:30Z] WARN: Database connection pool nearing capacity. Used connections: 8/10.
[2024-05-21T10:03:00Z] INFO: User 'admin' logged in successfully.
[2024-05-21T10:04:45Z] ERROR: Failed to process message from queue 'tasks'. NullPointerException at com.example.Processor:123
java.lang.NullPointerException
    at com.example.Processor.process(Processor.java:123)
    at com.example.QueueListener.onMessage(QueueListener.java:45)
    ... 12 more
[2024-05-21T10:05:00Z] DEBUG: Received request POST /api/data
[2024-05-21T10:05:01Z] DEBUG: Responding with 201 Created
-- End of mock logs for ${containerName}/${podName} --
  `;
  return fakeAPICall(logContent.trim(), 1000);
};
