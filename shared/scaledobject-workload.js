import { getMockEndpoint } from "./mock.js";

const testNamespace = "scaledobject-test-ns";

export function getWorkloadNamespaceManifest() {
  return `apiVersion: v1
kind: Namespace
metadata:
  name: ${testNamespace}
  labels:
    k6.io/created_by: xk6-kubernetes
    type: e2e`;
}

export function getWorkloadDeploymentManifest(index) {
  return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: workload-${index}
  namespace: ${testNamespace}
spec:
  replicas: 0
  selector:
    matchLabels:
      app: workload-${index}
  template:
    metadata:
      labels:
        app: workload-${index}
    spec:
      containers:
        - name: nginx
          image: nginxinc/nginx-unprivileged
          ports:
            - containerPort: 80
              protocol: TCP`;
}

export function getWorkloadScaledObjectManifest(index, metricsPerWorkload) {
  let triggers = "";
  for (let i = 0; i < metricsPerWorkload; i++) {
    triggers = triggers.concat(`    - metadata:
        method: query
        targetValue: "1"
        url: ${getMockEndpoint()}
        valueLocation: value
      name: metric-${i}
      type: metrics-api`);
  }

  return `apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: scaledobject-${index}
  namespace: ${testNamespace}
spec:
  cooldownPeriod: 1
  maxReplicaCount: 2
  minReplicaCount: 0
  pollingInterval: 1
  scaleTargetRef:
    name: workload-${index}
  triggers:
${triggers}`;
}

export function getNamespaceName() {
  return testNamespace;
}
