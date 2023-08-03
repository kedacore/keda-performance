import deploynamespace from "./shared/namespace-operations.js";
import deployment from "./shared/create-deployment.js";
import updatedeployment from "./shared/update-deployment.js";
import updatesscaleobject from "./shared/update-scaleobject.js";
import deletenamespace from "./shared/delete-namespace.js";

import { sleep, check } from "k6";
import { Gauge } from "k6/metrics";
import prometheus from "k6/x/prometheusread";

const workloaddeployment = open("./workload/workload-deployment.yaml");
const workloadnamespace = open("./workload/workload-namespace.yaml");
const yamlscaleobject = open("./workload/workload-scaleobject.yaml");
const mockdeployment = open("./mock/mock-deployment.yaml");
const mocknamespace = open("./mock/mock-namespace.yaml");
const mockservice = open("./mock/mock-service.yaml");

export const GaugeKEDAInternalLatency = new Gauge("keda_internal_latency");
const scaledObjectCount = 1000;

export const options = {
  vus: 1,
  setupTimeout: "20m",
  duration: "5m",
  ext: {
    loadimpact: {
      // Project: kedacore
      projectID: 3645343,
      // Test runs with the same name groups test runs together
      name: "ScaleObjects",
    },
  },
  thresholds: {
    keda_internal_latency: ["value<100"],
  },
};

export function setup() {
  console.debug;
  deploynamespace(mocknamespace);
  deployment(mockdeployment);
  deployment(mockservice);
  deploynamespace(workloadnamespace);

  for (var iteration = 0; iteration < scaledObjectCount; iteration++) {
    console.log(`${iteration} of ${scaledObjectCount} created`);
    updatedeployment(workloaddeployment, iteration);
    updatesscaleobject(yamlscaleobject, iteration);
  }

  let currentScaledObjectCount = 0;
  let tries = 0;
  do {
    tries++;
    sleep(15);
    currentScaledObjectCount = getResourcesCount("scaled_object");
  } while (currentScaledObjectCount < scaledObjectCount && tries < 6);
}

export default function () {
  checkLag();
  sleep(15);
}

export function teardown() {
  console.debug;
  deletenamespace(mocknamespace);
  deletenamespace(workloadnamespace);
  sleep(10);
}

function checkLag() {
  if (__ENV.PROMETHEUS_URL != "") {
    var client = prometheus.newPrometheusClient(
      __ENV.PROMETHEUS_URL,
      __ENV.PROMETHEUS_USER,
      __ENV.PROMETHEUS_PASSWORD
    );
    var end = new Date();
    var start = new Date(end.getTime() - 30 * 1000);
    var period = "minute";

    var response = client.queryRange(
      "max(keda_internal_scale_loop_latency)",
      start.toISOString(),
      end.toISOString(),
      period
    );
    var lastItem = response[response.length - 1];
    var jsonBytes = lastItem.marshalJSON();
    var { _, values } = JSON.parse(String.fromCharCode(...jsonBytes));
    var lastValue = values[values.length - 1];
    GaugeKEDAInternalLatency.add(lastValue[1]);
  }
}

function getResourcesCount(type) {
  if (__ENV.PROMETHEUS_URL != "") {
    var client = prometheus.newPrometheusClient(
      __ENV.PROMETHEUS_URL,
      __ENV.PROMETHEUS_USER,
      __ENV.PROMETHEUS_PASSWORD
    );
    var end = new Date();
    var start = new Date(end.getTime() - 30 * 1000);
    var period = "minute";

    var response = client.queryRange(
      `keda_resource_totals{type="${type}"}`,
      start.toISOString(),
      end.toISOString(),
      period
    );
    var lastItem = response[response.length - 1];
    if (lastItem == undefined) {
      return 0;
    }
    var jsonBytes = lastItem.marshalJSON();
    var { _, values } = JSON.parse(String.fromCharCode(...jsonBytes));

    var lastValue = values[values.length - 1];
    return lastValue[1];
  }
  return scaledObjectCount;
}
