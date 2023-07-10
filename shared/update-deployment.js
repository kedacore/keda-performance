import { Kubernetes } from "k6/x/kubernetes";
import { describe, expect } from "https://jslib.k6.io/k6chaijs/4.3.4.3/index.js";
import { load, dump } from "https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.mjs";


export default function (yaml,iteration) {
    const kubernetes = new Kubernetes();
    let yamlObject = load(yaml)
    
    const name = yamlObject.metadata.name

    yamlObject.metadata.name = name + iteration
    let newYaml = dump(yamlObject)

    kubernetes.apply(newYaml)

}

