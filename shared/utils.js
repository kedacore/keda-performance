import * as prometheus from "./prometheus.js";

import { sleep } from "k6";
import crypto from "k6/crypto";
import { Trend } from "k6/metrics";

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
      `expected resource count not reached afer ${tries * interval
      } seconds. Expected ${expected}, got ${currentScaledObjectCount}`
    );
  }
}

export function generatePrefix(testCase) {
  return crypto.md5(testCase, "hex");
}

export function generateTrend(name, isTime) {
  var trend = new Trend(name, isTime);
  return trend;
}
