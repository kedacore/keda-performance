import * as prometheus from "./prometheus.js";
import { sleep } from "k6";
import crypto from "k6/crypto";

export function waitForResourceCount(type, expected, maxTries, interval) {
  let currentScaledObjectCount = 0;
  let tries = 0;
  do {
    tries++;
    sleep(interval);
    currentScaledObjectCount = prometheus.getResourcesCount(type);
  } while (currentScaledObjectCount != expected && tries < maxTries);
  if (tries > maxTries) {
    throw Error(
      `expected resource count not reached afer ${tries} tries. Expected ${expected}, got ${currentScaledObjectCount}`
    );
  }
}

export function generatePrefix(testCase) {
  return crypto.md5(testCase, "hex");
}
