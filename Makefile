##################################################
# Variables                                      #
##################################################
SHELL           = /bin/bash

TEST_CLUSTER_NAME ?= cluster
TF_AZURE_SUBSCRIPTION ?= subscription
TF_AZURE_RESOURCE_GROUP ?= resource_group
TF_GRAFANA_PROMETHEUS_URL ?= url
TF_GRAFANA_PROMETHEUS_USER ?= user
TF_GRAFANA_PROMETHEUS_PASSWORD ?= password

KEDA_VERSION ?= main

.PHONY:
az-login:
	@az login --service-principal -u $(TF_AZURE_SP_APP_ID) -p "$(AZURE_SP_KEY)" --tenant $(TF_AZURE_SP_TENANT)

.PHONY: get-cluster-context
get-cluster-context: az-login ## Get Azure cluster context.
	@az aks get-credentials \
		--name $(TEST_CLUSTER_NAME) \
		--subscription $(TF_AZURE_SUBSCRIPTION) \
		--resource-group $(TF_AZURE_RESOURCE_GROUP)

deploy: deploy-keda deploy-prometheus

undeploy: undeploy-prometheus undeploy-keda

deploy-keda:
	mkdir -p deps
	git clone https://github.com/kedacore/keda deps/keda --depth 1
	VERSION=$(KEDA_VERSION) make -C deps/keda deploy

undeploy-keda:
	VERSION=$(KEDA_VERSION) make -C deps/keda undeploy
	rm -rf deps/keda

deploy-prometheus:
	helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
	helm repo update
	kubectl create ns performance-prometheus
	kubectl label ns/performance-prometheus type=e2e
	@helm upgrade --install prometheus \
					prometheus-community/prometheus \
					--set server.remoteWrite[0].url=$(TF_GRAFANA_PROMETHEUS_URL) \
					--set server.remoteWrite[0].basic_auth.username=$(TF_GRAFANA_PROMETHEUS_USER) \
					--set server.remoteWrite[0].basic_auth.password=$(TF_GRAFANA_PROMETHEUS_PASSWORD) \
					-f deps/prometheus/values.yaml \
					--namespace performance-prometheus \
					--wait

undeploy-prometheus:
	helm uninstall prometheus -n performance-prometheus
	kubectl delete ns performance-prometheus