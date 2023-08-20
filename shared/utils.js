import * as prometheus from "./prometheus.js";

import { sleep } from "k6";
import crypto from "k6/crypto";
import { Gauge } from "k6/metrics";

export function waitForResourceCount(
  namespace,
  type,
  expected,
  maxTries,
  interval
) {
  let currentScaledObjectCount = 0;
  let tries = 0;
  do {
    tries++;
    sleep(interval);
    currentScaledObjectCount = prometheus.getResourcesCount(namespace, type);
  } while (currentScaledObjectCount != expected && tries < maxTries);
  if (currentScaledObjectCount != expected) {
    throw Error(
      `expected resource count not reached afer ${
        tries * interval
      } seconds. Expected ${expected}, got ${currentScaledObjectCount}`
    );
  }
}

export function waitForLagStabilization(
  namespace,
  threshold,
  maxTries,
  interval
) {
  let lag = 0;
  let tries = 0;
  do {
    tries++;
    sleep(interval);
    lag = prometheus.getLag(namespace);
  } while (lag > threshold && tries < maxTries);
  if (lag > threshold) {
    throw Error(`lag not stabilized after ${tries * interval} seconds.`);
  }
}

export function generatePrefix(testCase) {
  return crypto.md5(testCase, "hex");
}

export function generateGauge(name) {
  var gauge = new Gauge(name);
  return gauge;
}
