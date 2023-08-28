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
TF_GRAFANA_TOKEN ?= token

INJECT_FAULTS ?= -1

KEDA_VERSION ?= main

GRAFANA_PROMETHEUS_URL_PUSH ?= $(TF_GRAFANA_PROMETHEUS_URL)/api/prom/push
GRAFANA_PROMETHEUS_URL_QUERY ?= $(TF_GRAFANA_PROMETHEUS_URL)/api/prom
PROMETHEUS_NAMESPACE ?= prometheus-performance
K6_OPERATOR_NAMESPACE = k6-operator-system
REPO_URL ?= https://github.com/kedacore/keda-performance.git
REPO_BRANCH ?= main
TEST_CONFIG ?= config.json

##################################################
# Kubernetes context                             #
##################################################

az-login:
	@az login --service-principal -u $(TF_AZURE_SP_APP_ID) -p "$(AZURE_SP_KEY)" --tenant $(TF_AZURE_SP_TENANT)

get-cluster-context: az-login ## Get Azure cluster context.
	@az aks get-credentials \
		--name $(TEST_CLUSTER_NAME) \
		--subscription $(TF_AZURE_SUBSCRIPTION) \
		--resource-group $(TF_AZURE_RESOURCE_GROUP)

##################################################
# Deployments                                    #
##################################################

deploy: deploy-keda deploy-k6-operator deploy-prometheus

undeploy: clean-up-testing-namespaces undeploy-prometheus undeploy-k6-operator undeploy-keda	

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
	@helm upgrade --install prometheus \
					prometheus-community/prometheus \
					--set server.remoteWrite[0].url=$(GRAFANA_PROMETHEUS_URL_PUSH) \
					--set server.remoteWrite[0].basic_auth.username=$(TF_GRAFANA_PROMETHEUS_USER) \
					--set server.remoteWrite[0].basic_auth.password=$(TF_GRAFANA_PROMETHEUS_PASSWORD) \
					-f deps/prometheus/values.yaml \
					--namespace $(PROMETHEUS_NAMESPACE) \
					--create-namespace \
					--wait

undeploy-prometheus:
	helm uninstall prometheus -n $(PROMETHEUS_NAMESPACE)
	kubectl delete ns $(PROMETHEUS_NAMESPACE)

# we have to replace this with the helm chart when they release it
# https://github.com/grafana/k6-operator/pull/98
deploy-k6-operator:
	mkdir -p deps
	git clone https://github.com/grafana/k6-operator deps/k6-operator --depth 1	
	make -C deps/k6-operator deploy
	kubectl create secret generic k6-operator-cloud-token --from-literal="token=$(TF_GRAFANA_TOKEN)" -n $(K6_OPERATOR_NAMESPACE)
	kubectl label secret k6-operator-cloud-token -n $(K6_OPERATOR_NAMESPACE) "k6cloud=token"
	kubectl annotate secret k6-operator-cloud-token -n $(K6_OPERATOR_NAMESPACE) "kubernetes.io/service-account.name=k6-operator-controller"

undeploy-k6-operator:
	make -C deps/k6-operator delete
	rm -rf deps/k6-operator

clean-up-testing-namespaces:
	kubectl delete ns -l type=e2e

##################################################
# Grafana k6                                     #
##################################################

execute-k6: execute-k6-scaledobjects
	
execute-k6-scaledobjects:
	@for file in $(shell find ./configs/scaledobjects -maxdepth 1 -not -type d); do \
		make execute-k6-scaled-object-case TEST_CONFIG="$${file}" ; \
	done
	
execute-k6-scaled-object-case:
	@helm install k6-test \
		chart	\
		-n $(K6_OPERATOR_NAMESPACE) \
		--create-namespace \
		--set test.file=tests/test-scaledobject.js \
		--set test.config=$(TEST_CONFIG) \
		--set repo.url=$(REPO_URL) \
		--set repo.branch=$(REPO_BRANCH) \
		--set test.extraConfig.PROMETHEUS_URL=$(GRAFANA_PROMETHEUS_URL_QUERY) \
		--set test.extraConfig.PROMETHEUS_USER=$(TF_GRAFANA_PROMETHEUS_USER) \
		--set test.extraConfig.PROMETHEUS_PASSWORD=$(TF_GRAFANA_PROMETHEUS_PASSWORD) \
		--set test.extraConfig.INJECT_FAULTS=$(INJECT_FAULTS) \
		--set test.extraArgs="--out cloud"

	./hack/wait-test-case.sh $(K6_OPERATOR_NAMESPACE)

	helm uninstall k6-test -n $(K6_OPERATOR_NAMESPACE)
