const namespaceBase = "mock-ns";
const serviceName = "mock-service";

let namespace = namespaceBase;

export function getMockNamespaceManifest() {
  return `apiVersion: v1
kind: Namespace
metadata:
  name: ${namespace}
  labels:
    k6.io/created_by: xk6-kubernetes
    type: e2e`;
}

export function getMockDeploymentManifest(replicas) {
  return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: mock-server
  namespace: ${namespace}
spec:
  replicas: ${replicas}
  selector:
    matchLabels:
      app: mock-server
  template:
    metadata:
      labels:
        app: mock-server
    spec:
      containers:
        - name: metrics
          image: ghcr.io/kedacore/tests-metrics-api
          ports:
            - containerPort: 8080
              protocol: TCP`;
}

export function getMockServiceManifest() {
  return `apiVersion: v1
kind: Service
metadata:
  name: ${serviceName}
  namespace: ${namespace}
spec:
  ports:
    - protocol: TCP
      port: 8080
      targetPort: 8080
  selector:
    app: mock-server`;
}

export function getMockEndpoint() {
  return `http://${serviceName}.${namespace}:8080/api/value`;
}

export function getNamespaceName() {
  return namespace;
}

export function setExecutionPrefix(id) {
  namespace = `${id}-${namespaceBase}`;
}
