import { Kubernetes } from "k6/x/kubernetes";
import {
  load,
  dump,
} from "https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.mjs";

export default function (yaml, iteration) {
  const kubernetes = new Kubernetes();
  let yamlObject = load(yaml);

  const name = yamlObject.metadata.name;
  const targetref = yamlObject.spec.scaleTargetRef.name;

  yamlObject.metadata.name = name + iteration;
  yamlObject.spec.scaleTargetRef.name = targetref + iteration;
  let newYaml = dump(yamlObject);

  kubernetes.apply(newYaml);
}
