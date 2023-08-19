import deploynamespace from "../shared/namespace-operations.js";
import deployment from "../shared/create-deployment.js";
import updatedeployment from "../shared/update-deployment.js";
import updatesscaleobject from "../shared/update-scaleobject.js";
import deletenamespace from "../shared/delete-namespace.js";
import {
  describe,
  expect,
} from "https://jslib.k6.io/k6chaijs/4.3.4.3/index.js";

import { group, sleep } from "k6";
import exec from "k6/execution";
import { PodDisruptor } from "k6/x/disruptor";
import { ServiceDisruptor } from "k6/x/disruptor";

const workloaddeployment = open("./workload/workload-deployment.yaml");
const workloadnamespace = open("./workload/workload-namespace.yaml");
const yamlscaleobject = open("./workload/workload-scaleobject.yaml");
const mockdeployment = open("./mock/mock-deployment.yaml");
const mocknamespace = open("./mock/mock-namespace.yaml");
const mockservice = open("./mock/mock-service.yaml");

export const options = {
  scenarios: {
    setup: {
      executor: "shared-iterations",
      iterations: 1,
      vus: 1,
      exec: "setup",
      startTime: "0s",
    },
    load: {
      executor: "constant-arrival-rate",
      rate: 1,
      preAllocatedVUs: 1,
      maxVUs: 10,
      exec: "default",
      startTime: "10s",
      duration: "300s",
    },
    disrupt: {
      executor: "shared-iterations",
      iterations: 1,
      vus: 1,
      exec: "disrupt",
      startTime: "10s",
    },
    teardown: {
      executor: "shared-iterations",
      iterations: 1,
      vus: 1,
      exec: "teardown",
      startTime: "600s",
    },
  },
  ext: {
    loadimpact: {
      // Project: kedacore
      projectID: 3645343,
      // Test runs with the same name groups test runs together
      name: "ScaleObjects",
    },
  },
};

export function setup() {
  console.debug;

  deploynamespace(mocknamespace);
  deployment(mockdeployment);
  deployment(mockservice);
  deploynamespace(workloadnamespace);
  sleep(4);
}

export default function () {
  // Access the K6 execution context and retrieve the iteration number
  const iteration = exec.scenario.iterationInTest;
  updatedeployment(workloaddeployment, iteration);
  sleep(5);
  updatesscaleobject(yamlscaleobject, iteration);
}

export function disrupt(data) {
  if (__ENV.INJECT_FAULTS != "1") {
    return;
  }

  const fault = {
    averageDelay: "3s",
  };

  const svcDisruptor = new ServiceDisruptor("metrics-api-test-service", "mock");
  svcDisruptor.injectHTTPFaults(fault, "60s", { ProxyPort: 8000 });

  /*
  const selector = {
    namespace: 'mock',
        select: {
            labels: {
                app: "metrics-api-test-metrics-server"
            }
          }
    };

  const podDisruptor = new PodDisruptor(selector);
  podDisruptor.injectHTTPFaults(fault, "1m");

 */
}

export function teardown() {
  console.debug;
  deletenamespace(mocknamespace);
  deletenamespace(workloadnamespace);
  sleep(10);
}
