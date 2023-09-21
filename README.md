# Keda Performance

This repository includes resources in order to benchmark keda core using [K6](https://k6.io/docs/) load tool.

## K6 Load Tool

Grafana k6 is an open-source load testing tool that makes performance testing easy and productive for engineering teams. k6 is free, developer-centric, and extensible.

k6 is developed by Grafana Labs and the community.

Keda organization chose k6 as it is a golang based tool even though the scripting is done in javascript. Being built in golang allows our community to contribute to different extensions in order to extend k6 capabilities.

Keda organization chose k6 as well to simulate traffic as part of chaos experiments, trigger them from your k6 tests or inject different types of faults in Kubernetes with [xk6-disruptor](https://k6.io/docs/javascript-api/xk6-disruptor/).

Another reason to choose K6 is the integration with grafana that allows us to have observability during the tests.

## Prerequisites

- [k6](https://k6.io/)
- [docker](https://www.docker.com/) installed
- [xk6](https://github.com/grafana/xk6) extension builder for the following extensions.
- [xk6-input-prometheus](https://github.com/JorTurFer/xk6-input-prometheus) for acceptance criteria.
- [xk6-disruptor](https://k6.io/docs/javascript-api/xk6-disruptor/) to inject delays in the metrics api.
- [xk6-kubernetes](https://github.com/grafana/xk6-kubernetes) to interact with kubectl.
- `kubectl` logged into a Kubernetes cluster.
- [prometheus](https://prometheus.io/docs/prometheus/latest/configuration/configuration/) as metrics source
- Each load test need additional requirements. For example, `test-scaledobjects.js` requires env variables `PROMETHEUS_URL`, `PROMETHEUS_USER` and `PROMETHEUS_PASSWORD`
- Each scenario might have different configs to simulate the needed workloads.

## Running tests

### Tests Repository Organization

**configs**/ contains the configurations to execute K6

**shared**/ contains functions needed within the loadtest

**deps**/ dependencies outside the test such as prometheus configuration

### All tests

     ENV.PROMETHEUS_URL
     ENV.PROMETHEUS_USER
     ENV.PROMETHEUS_PASSWORD

=======

### Running Locally Specific test

In order to execute the tests we need to build the binary. To do so, check [DockerFile](https://github.com/kedacore/test-tools/blob/main/k6-runner/Dockerfile) where the extensions needed are specified.

e.g.

```bash
docker run --rm -it -u "$(id -u):$(id -g)" -v "${PWD}:/xk6" grafana/xk6 build v0.43.1 \
  --output k6 \
  --with  github.com/JorTurFer/xk6-input-prometheus \
  --with github.com/grafana/xk6-kubernetes \
  --with github.com/grafana/xk6-disruptor
```

If you want to execute a test you will need to modify the config file to match the test that suits your case.

The parameters to change are inside the config json file in the following section:

"keda": {
"scaledobjects": 1,
"metricsPerScaledobject": 10
}

```bash

./k6 run tests/test-scaledobject.js --env INJECT_FAULTS=1  --config configs/scaledobjects/1so10m.json
```

### Running workflow Specific test

You can run tests from the workflows enable in github in the following [url](https://github.com/kedacore/keda-performance/actions/workflows/execute-performance.yaml).

## Adding Scenarios

Adding different scenarios as needed is enabled via PR.

#### ⚠⚠ Important: ⚠⚠

Add a new scenario following [k6 documentation](https://k6.io/docs/using-k6/scenarios/advanced-examples/) in json format

```json
"keda": {
"scaledobjects": int,
"metricsPerScaledobject": int 
}
```

Where **scaledobjects** is the number of objects to scale
and **metricsPerScaledobject** is the number of metrics that will be considered in order to scale.

#### **Example Scenario:**

Scenario without Fault Injects:

```json
{
  "scenarios": {
    "load": {
      "tags": { "scenario": "default" },
      "executor": "constant-vus",
      "vus": 1,
      "exec": "default",
      "duration": "5m"
    }
  },
  "ext": {
    "loadimpact": {
      "projectID": xxxxxxx,
      "name": "x-ScaleObjects-y-Metrics"
    },
    "keda": {
      "scaledobjects": x,
      "metricsPerScaledobject": y
    }
  },
  "thresholds": {
    "keda_internal_latency": ["p(95) < 7", "p(99) < 15", "max < 20"]
  }
}
```

Scenario with Fault Injects:

```json
{
  "scenarios": {
    "load": {
      "tags": { "scenario": "default" },
      "executor": "constant-vus",
      "vus": 1,
      "exec": "default",
      "duration": "9m"
    },
    "disrupt": {
      "tags": { "scenario": "chaos" },
      "executor": "shared-iterations",
      "iterations": 1,
      "vus": 1,
      "exec": "disrupt",
      "startTime": "1m"
    }
  },
  "ext": {
    "loadimpact": {
      "projectID": xxxxxxx,
      "name": "x-ScaleObjects-y-Metrics"
    },
    "keda": {
      "scaledobjects": x,
      "metricsPerScaledobject": y
    }
  },
  "thresholds": {
    "keda_internal_latency": ["p(90)<1", "p(95) < 7", "p(99) < 15", "max < 20"]
  }
}
```

#### Notes

For Tests including disrupt we have to notice that the threshold should consider the disrupt phase as a percentage of the total execution time of the test. E.g.

> total execution time: 10m \
> total disruption time: 1m \
> then the percentile that should be considered without any disruption would be p90 ( 1 min out of 10 min)

## Load Test infrastructure

> TODO
 