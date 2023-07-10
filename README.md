# Keda Performance

Keda Perf is a performance project designed to evaluate and benchmark the performance of [KEDA](https://keda.sh/). KEDA (Kubernetes-based Event-Driven Autoscaling) is a popular open-source project that provides event-driven scaling for container workloads on Kubernetes.

This repository contains a set of scripts and configurations that allow you to set up a performance testing environment for KEDA. By using Kedacore Perf, you can simulate high load scenarios and measure the performance characteristics of KEDA under different conditions.

## Features

- Perform load testing on KEDA to evaluate its performance
- Measure scalability and resource utilization of KEDA
- Simulate various event-driven workloads to analyze performance
- Collect and visualize performance metrics for analysis

## Getting Started

To get started with Kedacore Perf, follow these steps:

1. Clone this repository: `git clone git@github.com:kedacore/keda-performance.git`
2. Install the required dependencies. The dependencies are listed in the [requirements.txt](requirements.txt) file.
3. Set up a Kubernetes cluster. You can use any Kubernetes distribution or managed Kubernetes service of your choice.
4. Configure KEDA on your Kubernetes cluster. Refer to the official [KEDA documentation](https://keda.sh/docs/) for instructions on how to install and configure KEDA.
5. Customize the performance testing parameters in the [config.yaml](config.yaml) file according to your requirements.


## Configuration

The configuration file [config.yaml](config.yaml) allows you to customize various parameters for the performance testing. Some of the important configuration options include:

- **concurrent_requests**: The number of concurrent requests to generate during the performance test.
- **test_duration**: The duration of the performance test in seconds.
- **event_source**: The type of event source to use for generating events.
- **event_payload**: The payload data to send with each event.
- **scaling_mode**: The scaling mode to test (e.g., scaling based on CPU or custom metrics).
- **keda_scaling_options**: The configuration options specific to KEDA scaling.

Feel free to modify these parameters to suit your testing requirements.

## Results and Analysis

After running the performance test, Kedacore Perf collects various performance metrics, including response times, throughput, and resource utilization. The tool also provides visualization capabilities to analyze and interpret the test results.

The performance test results and analysis can be found in the [results](results) directory. You can explore the generated charts and graphs to gain insights into the performance characteristics of KEDA under the given test conditions.

## Contributing

Contributions to Kedacore Perf are welcome! If you find any issues or have ideas for enhancements, feel free to open an issue or submit a pull request. Please make sure to follow the [contribution guidelines](CONTRIBUTING.md) when contributing to this project.

## License

Kedacore Perf is licensed under the [MIT License](LICENSE). Feel free to use, modify, and distribute this project under the terms of the license.

## Acknowledgments

Kedacore Perf was inspired by the need for a comprehensive performance testing tool for KEDA. We would like to acknowledge the contributions of the KEDA community and the developers of other related open-source projects that have helped shape this tool.

## Contact

For any questions or inquiries, please contact the project maintainer:  
Maintainer: [Almudena Vivanco](mailto:almudena.vivanco@gmail.com)

You can also open an issue on GitHub for any technical concerns or bug reports.

## References

- KEDA Project: [https://github.com/kedacore]
