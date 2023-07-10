import deploynamespace from "./shared/namespace-operations.js"
import deployment from "./shared/create-deployment.js"
import updatedeployment from "./shared/update-deployment.js"
import updatesscaleobject from "./shared/update-scaleobject.js"
import deletenamespace from "./shared/delete-namespace.js"

import { group, sleep } from "k6";
import exec from 'k6/execution';
import { Kubernetes } from 'k6/x/kubernetes';

const workloaddeployment = open("./workload/workload-deployment.yaml")
const workloadnamespace = open("./workload/workload-namespace.yaml")
const yamlscaleobject = open ("./workload/workload-scaleobject.yaml")
const mockdeployment = open("./mock/mock-deployment.yaml")
const mocknamespace = open("./mock/mock-namespace.yaml")
const mockservice = open("./mock/mock-service.yaml")


export const options = {
  vus: 1,
  duration: '10m',
  ext: {
    loadimpact: {
      // Project: kedacore
      projectID: 3645343,
      // Test runs with the same name groups test runs together
      name: 'ScaleObjects'
    }
  }
};


export function setup() {
    console.debug
  
    deploynamespace(mocknamespace);
    deployment(mockdeployment);
    deployment(mockservice);
    deploynamespace(workloadnamespace);
    sleep(4);
  
  }

  export default function () {
    // Access the K6 execution context and retrieve the iteration number
   const iteration = exec.scenario.iterationInTest;
  
   updatedeployment(workloaddeployment,iteration);
   sleep(5);
   updatesscaleobject(yamlscaleobject,iteration);
  
  }

  export function teardown() {
    console.debug
    deletenamespace(mocknamespace);
    deletenamespace(workloadnamespace);
    sleep(10);
  }
