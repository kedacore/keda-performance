docker run --rm -it -u "$(id -u):$(id -g)" -v "${PWD}:/xk6" grafana/xk6 build v0.43.1 \
--output k6 \
--with github.com/szkiba/xk6-yaml@latest \
--with github.com/grafana/xk6-kubernetes \
--with github.com/grafana/xk6-disruptor


In Windows

docker run --rm -it -e GOOS=windows -u "$(id -u):$(id -g)" -v "${PWD}:/xk6" `
  grafana/xk6 build v0.43.1 --output k6.exe `
  --with github.com/szkiba/xk6-yaml@latest `
  --with github.com/grafana/xk6-kubernetes `
  --with github.com/grafana/xk6-disruptor 
