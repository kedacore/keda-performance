export function getTargetScalableObjectCount() {
  if (__ENV.TARGET_SCALABLEDOBJECTS != undefined) {
    return parseInt(__ENV.TARGET_SCALABLEDOBJECTS);
  }
  return 1000;
}

export function getTargetMetricCount() {
  if (__ENV.TARGET_METRICS != undefined) {
    return parseInt(__ENV.TARGET_METRICS);
  }
  return 1;
}
