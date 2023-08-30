import * as prometheus from "../shared/prometheus.js";
import * as kubernetes from "../shared/kubernetes.js";
import * as utils from "../shared/utils.js";
import * as mock from "../shared/mock.js";
import * as workload from "../shared/scaledobject-workload.js";

import { sleep } from "k6";
import { describe } from "https://jslib.k6.io/k6chaijs/4.3.4.3/index.js";
import exec from 'k6/execution';
import { ServiceDisruptor } from 'k6/x/disruptor';

const TrendKEDAInternalLatency = utils.generateTrend("keda_internal_latency", true);

export const options = {
  //vus: 1,
  setupTimeout: "15m",
  teardownTimeout: "10m",  
}

export function setup() {
  const testCaseName = exec.test.options.ext.loadimpact.name;
  const scaledObjectCount = exec.test.options.ext.keda.scaledobjects;
  const metricsPerScaledObject = exec.test.options.ext.keda.metricsPerScaledobject;
  const casePrefix = utils.generatePrefix(testCaseName);
  mock.setExecutionPrefix(casePrefix);
  workload.setExecutionPrefix(casePrefix);

  console.log(`Executing test case: ${testCaseName} - ${casePrefix}`);

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
  utils.waitForResourceCount(
    workload.getNamespaceName(),
    "scaled_object",
    scaledObjectCount,
    20,
    15
  );

  // Wait a minute to stabilizate prometheus metrics before the test
  sleep(60);
}

export default function () {
  workload.setExecutionPrefix(utils.generatePrefix(exec.test.options.ext.loadimpact.name));  
  var lags = prometheus.getLags(workload.getNamespaceName());
  lags.forEach(lag => {  
    console.log(lag)  
    TrendKEDAInternalLatency.add(lag.value, { resource: lag.resource });
  });
  sleep(5);
}

export function disrupt(data) {
  if (__ENV.INJECT_FAULTS != "1") {
    return;
  }

  console.log('disrupt working');
  const fault = {
    averageDelay: "500ms",
  };

  mock.setExecutionPrefix(utils.generatePrefix(exec.test.options.ext.loadimpact.name));
  const svcDisruptor = new ServiceDisruptor("mock-service", mock.getNamespaceName());
  svcDisruptor.injectHTTPFaults(fault, "120s", { ProxyPort: 8000 });
}


export function teardown() {
  const casePrefix = utils.generatePrefix(exec.test.options.ext.loadimpact.name);
  mock.setExecutionPrefix(casePrefix);
  workload.setExecutionPrefix(casePrefix);
  describe("Cleanup resources", () => {
    kubernetes.deleteNamespace(workload.getNamespaceName());
    kubernetes.deleteNamespace(mock.getNamespaceName());

    utils.waitForResourceCount(
      workload.getNamespaceName(),
      "scaled_object",
      0,
      20,
      15
    );
  });
}
