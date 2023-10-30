#!/usr/bin/env bash

status=$(kubectl get testrun -n $1 k6-case -o jsonpath="{.status.stage}")
while [[ "$status" != "finished" && 
            "$status" != "stopped" &&
            "$status" != "error" ]]
do
	echo "Test in progress, current status: $status"
	sleep 30
	status=$(kubectl get testrun -n $1 k6-case -o jsonpath="{.status.stage}")
done

echo "Test finished with status $status"