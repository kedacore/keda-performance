import { Kubernetes } from "k6/x/kubernetes";

export default function (yaml) {
  const kubernetes = new Kubernetes();
  kubernetes.apply(yaml);
}
