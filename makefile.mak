# Variables
-include .env.local

IMAGE=$(DOCKER_URL)/$(IMAGE_NAME):$(TAG)
SITE_URL = http://localhost:$(HOST_PORT)
mkfile_path := $(abspath $(lastword $(MAKEFILE_LIST)))
# current_dir := $(notdir $(patsubst %/,%,$(dir $(mkfile_path))))
PWD := $(dir $(mkfile_path))

# Build the Docker image
build:
# cursor debug thingy
	@node -e "/* #region agent log */fetch('http://127.0.0.1:7796/ingest/70178dd3-976c-4e2f-a600-5d69868b9991',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'702d70'},body:JSON.stringify({sessionId:'702d70',runId:'pre-fix',hypothesisId:'H1',location:'makefile.mak:build',message:'Starting docker build from make',data:{image:'$(IMAGE)'},timestamp:Date.now()})}).catch(()=>{});/* #endregion */"
# actual build command
	docker build -f app/Dockerfile -t $(IMAGE) app

# Run the Docker container
run:
# cursor debug thingy
	@node -e "/* #region agent log */fetch('http://127.0.0.1:7796/ingest/70178dd3-976c-4e2f-a600-5d69868b9991',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'702d70'},body:JSON.stringify({sessionId:'702d70',runId:'pre-fix',hypothesisId:'H2',location:'makefile.mak:run',message:'Starting docker run from make',data:{container:'$(CONTAINER_NAME)',ports:'8080:80'},timestamp:Date.now()})}).catch(()=>{});/* #endregion */"
# actual build command
	docker run --name $(CONTAINER_NAME) --rm -d -p $(HOST_PORT):80 $(IMAGE)

# Stop and remove the container
clean:
# cursor debug thingy
	@node -e "/* #region agent log */fetch('http://127.0.0.1:7796/ingest/70178dd3-976c-4e2f-a600-5d69868b9991',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'702d70'},body:JSON.stringify({sessionId:'702d70',runId:'pre-fix',hypothesisId:'H3',location:'makefile.mak:clean',message:'Starting docker clean from make',data:{container:'$(CONTAINER_NAME)'},timestamp:Date.now()})}).catch(()=>{});/* #endregion */"
# actual clean command
	docker rm -f $(CONTAINER_NAME)

# Build image, run container, open site in default browser (Windows)
test: build
	$(MAKE) clean
	$(MAKE) run
	@powershell -NoProfile -Command "Start-Sleep -Seconds 1; Start-Process '$(SITE_URL)'"

push:
	docker push $(IMAGE)

.PHONY: build run test clean push