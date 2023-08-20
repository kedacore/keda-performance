import prometheus from "k6/x/prometheusread";

export function getResourcesCount(namespace, type) {
  if (__ENV.PROMETHEUS_URL != "") {
    var client = prometheus.newPrometheusClient(
      __ENV.PROMETHEUS_URL,
      __ENV.PROMETHEUS_USER,
      __ENV.PROMETHEUS_PASSWORD
    );
    var end = new Date();
    var start = new Date(end.getTime() - 60 * 1000);
    var period = "minute";

    var response = client.queryRange(
      `keda_resource_totals{namespace="${namespace}",type="${type}"}`,
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
    console.log(
      `Query: keda_resource_totals{namespace="${namespace}",type="${type}".
      Start: ${start.toISOString()}. 
      End ${end.toISOString()}. 
      Period: ${period}.
      Response: ${response}.
      Value: ${lastValue[1]}`
    );
    return lastValue[1];
  }
  return scaledObjectCount;
}

export function getLag(namespace) {
  if (__ENV.PROMETHEUS_URL != "") {
    var client = prometheus.newPrometheusClient(
      __ENV.PROMETHEUS_URL,
      __ENV.PROMETHEUS_USER,
      __ENV.PROMETHEUS_PASSWORD
    );
    var end = new Date();
    var start = new Date(end.getTime() - 60 * 1000);
    var period = "minute";

    var response = client.queryRange(
      `max(keda_internal_scale_loop_latency{namespace="${namespace}"})`,
      start.toISOString(),
      end.toISOString(),
      period
    );
    var lastItem = response[response.length - 1];
    var jsonBytes = lastItem.marshalJSON();
    var { _, values } = JSON.parse(String.fromCharCode(...jsonBytes));
    var lastValue = values[values.length - 1];
    console.log(
      `Query: max(keda_internal_scale_loop_latency{namespace="${namespace}"})".
      Start: ${start.toISOString()}. 
      End ${end.toISOString()}. 
      Period: ${period}.
      Response: ${response}.
      Value: ${lastValue[1]}`
    );
    return lastValue[1];
  }
}
