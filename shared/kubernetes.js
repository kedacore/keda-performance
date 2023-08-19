import { Kubernetes } from "k6/x/kubernetes";

const kubernetes = new Kubernetes();

export function applyManifest(yaml) {
  return kubernetes.apply(yaml);
}

export function deleteNamespace(namespace) {
  return kubernetes.delete("Namespace", namespace);
}
