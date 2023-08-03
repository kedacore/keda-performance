import { Kubernetes } from "k6/x/kubernetes";
import { describe } from "https://jslib.k6.io/k6chaijs/4.3.4.3/index.js";
import { load } from "https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.mjs";

export default function (yaml) {
  const kubernetes = new Kubernetes();

  describe("YAML-based resources", () => {
    let yamlObject = load(yaml);
    const name = yamlObject.metadata.name;

    describe("Remove our Namespace to cleanup", () => {
      kubernetes.delete("Namespace", name);
    });
  });
}
