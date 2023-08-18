import * as config from "../shared/configuration.js";
import * as prometheus from "../shared/prometheus.js";
import * as kubernetes from "../shared/kubernetes.js";
import * as utils from "../shared/utils.js";
import * as mock from "../shared/mock.js";
import * as workload from "../shared/scaledobject-workload.js";

import { sleep } from "k6";
import { describe } from "https://jslib.k6.io/k6chaijs/4.3.4.3/index.js";
import { Gauge } from "k6/metrics";

export const GaugeKEDAInternalLatency = new Gauge("keda_internal_latency");
let scaledObjectCount = config.getTargetScalableObjectCount();
let metricsPerScaledObject = config.getTargetMetricCount();

export const options = {
  vus: 1,
  setupTimeout: "20m",
  teardownTimeout: "2m",
  duration: "5m",
  ext: {
    loadimpact: {
      // Project: kedacore
      projectID: 3645343,
      name: `${scaledObjectCount}-ScaleObjects-${metricsPerScaledObject}-Metrics`,
    },
  },
  thresholds: {
    keda_internal_latency: ["value<100"],
  },
};

export function setup() {
  // Deploy the mock
  kubernetes.applyManifest(mock.getMockNamespaceManifest());
  kubernetes.applyManifest(mock.getMockDeploymentManifest(10));
  kubernetes.applyManifest(mock.getMockServiceManifest());

  // Deploy the load
  kubernetes.applyManifest(workload.getWorkloadNamespaceManifest());
  for (let i = 0; i < scaledObjectCount; i++) {
    kubernetes.applyManifest(workload.getWorkloadDeploymentManifest(i));
    kubernetes.applyManifest(
      workload.getWorkloadScaledObjectManifest(i, metricsPerScaledObject)
    );
  }

  // Wait until KEDA has starting to process all the load
  utils.waitForResourceCount("scaled_object", scaledObjectCount, 6, 15);
}

export default function () {
  GaugeKEDAInternalLatency.add(prometheus.getLag());
  sleep(15);
}

export function teardown() {
  describe("Cleanup resources", () => {
    kubernetes.deleteNamespace(workload.getNamespaceName());
    kubernetes.deleteNamespace(mock.getNamespaceName());

    utils.waitForResourceCount("scaled_object", scaledObjectCount, 6, 15);
  });
}