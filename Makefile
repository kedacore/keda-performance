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

KEDA_VERSION ?= main

GRAFANA_PROMETHEUS_URL_PUSH ?= $(TF_GRAFANA_PROMETHEUS_URL)/api/prom/push
GRAFANA_PROMETHEUS_URL_QUERY ?= $(TF_GRAFANA_PROMETHEUS_URL)/api/prom
PROMETHEUS_NAMESPACE ?= prometheus-performance

K6_ENVS ?= PROMETHEUS_URL="$(GRAFANA_PROMETHEUS_URL_QUERY)" PROMETHEUS_USER="$(TF_GRAFANA_PROMETHEUS_USER)" PROMETHEUS_PASSWORD="$(TF_GRAFANA_PROMETHEUS_PASSWORD)"

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

deploy: deploy-keda deploy-prometheus

undeploy: clean-up-testing-namespaces undeploy-prometheus undeploy-keda	

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

clean-up-testing-namespaces:
	kubectl delete ns -l type=e2e

##################################################
# Grafana k6                                     #
##################################################

generate-k6:
	go install go.k6.io/xk6/cmd/xk6@latest
	xk6 build \
		--output ./k6 \
		--with github.com/szkiba/xk6-yaml@latest \
		--with github.com/grafana/xk6-kubernetes@latest \
		--with github.com/grafana/xk6-disruptor@latest \
		--with github.com/JorTurFer/xk6-input-prometheus

login-k6:
	@./k6 login cloud --token $(TF_GRAFANA_TOKEN)

execute-k6: execute-k6-scaledobjects-cases

execute-k6-scaledobjects-cases: 
	# Increasing ScaledObject count (10, 100, 1000 metrics in total)
	@$(K6_ENVS) TARGET_SCALABLEDOBJECTS=10 TARGET_METRICS=1 ./k6 run --out cloud tests/test-scaledobject.js
	@$(K6_ENVS) TARGET_SCALABLEDOBJECTS=100 TARGET_METRICS=1 ./k6 run --out cloud tests/test-scaledobject.js
	@$(K6_ENVS) TARGET_SCALABLEDOBJECTS=1000 TARGET_METRICS=1 ./k6 run --out cloud tests/test-scaledobject.js

	# Increasing metrics per ScaledObject (10, 100, 1000 metrics in total)
	@$(K6_ENVS) TARGET_SCALABLEDOBJECTS=10 TARGET_METRICS=1 ./k6 run --out cloud tests/test-scaledobject.js
	@$(K6_ENVS) TARGET_SCALABLEDOBJECTS=10 TARGET_METRICS=10 ./k6 run --out cloud tests/test-scaledobject.js
	@$(K6_ENVS) TARGET_SCALABLEDOBJECTS=10 TARGET_METRICS=100 ./k6 run --out cloud tests/test-scaledobject.js

	# Switching between ScaledObject count and metrics per ScaledObject (1000 metrics in total)
	@$(K6_ENVS) TARGET_SCALABLEDOBJECTS=20 TARGET_METRICS=50 ./k6 run --out cloud tests/test-scaledobject.js
	@$(K6_ENVS) TARGET_SCALABLEDOBJECTS=100 TARGET_METRICS=10 ./k6 run --out cloud tests/test-scaledobject.js
	@$(K6_ENVS) TARGET_SCALABLEDOBJECTS=500 TARGET_METRICS=2 ./k6 run --out cloud tests/test-scaledobject.js
