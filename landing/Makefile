# Makefile to simplify commands

AWS_PROFILE=auschildcare
AWS_ACCOUNT=874536534479
AWS_REGION=ap-southeast-2
SERVICE_IMAGE?=auschildcare-landing
SERVICE_TAG?=latest
SERVICE_PORT?=7500
CONTAINER=$(shell docker ps -a -q --filter name="$(SERVICE_IMAGE)" --format="{{.ID}}")
ECS_SERVICE_KEY=prod-ecs-service-landing
ECS_CLUSTER=$(shell aws ecs list-clusters | jq -r '.clusterArns[0]')
ECS_SERVICE=$(shell aws ecs list-services --cluster '$(ECS_CLUSTER)' |  jq -r '.serviceArns[] | select(. | contains("$(ECS_SERVICE_KEY)"))')

default: build

deploy: docker-login tag push update-service

.PHONY: dist

build:
	# Build docker ...
	docker build --build-arg HTTP_PROXY=${HTTP_PROXY} -t $(SERVICE_IMAGE):$(SERVICE_TAG) .

run:
	# Run docker...
	docker run -d --name $(SERVICE_IMAGE) -p $(SERVICE_PORT):$(SERVICE_PORT) \
	  -e APP_ENV=prod \
	  $(SERVICE_IMAGE):$(SERVICE_TAG)

run-it:
	# Run docker...
	docker run --privileged -it -p $(SERVICE_PORT):$(SERVICE_PORT) \
	  -e APP_ENV=prod \
	  $(SERVICE_IMAGE):$(SERVICE_TAG) /bin/sh

stop:
	# Stop & remove docker...
ifneq ("$(CONTAINER)","")
	docker stop $(CONTAINER)
	docker rm $(CONTAINER)
endif

docker-login:
	# Login ecr...
	$$(aws ecr get-login --no-include-email)

tag:
	# Tag image...
	docker tag $(SERVICE_IMAGE):$(SERVICE_TAG) $(AWS_ACCOUNT).dkr.ecr.$(AWS_REGION).amazonaws.com/$(SERVICE_IMAGE):$(SERVICE_TAG)

push:
	# Push image...
	docker push $(AWS_ACCOUNT).dkr.ecr.$(AWS_REGION).amazonaws.com/$(SERVICE_IMAGE):$(SERVICE_TAG)

update-service:
	# Update ecs service...
	aws ecs update-service --cluster $(ECS_CLUSTER) --service $(ECS_SERVICE) --force-new-deployment

docker-cleanup:
	docker volume rm $$(docker volume ls -qf dangling=true) && docker volume prune && docker system prune -a
