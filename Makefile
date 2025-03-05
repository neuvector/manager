.PHONY: jar

STAGE_DIR = stage
BASE_IMAGE_TAG = latest
BUILD_IMAGE_TAG = v3

copy_mgr:
	cp manager/licenses/* ${STAGE_DIR}/licenses/
	cp manager/cli/cli ${STAGE_DIR}/usr/local/bin/
	cp manager/cli/cli.py ${STAGE_DIR}/usr/local/bin/
	cp -r manager/cli/prog ${STAGE_DIR}/usr/local/bin/
	cp manager/scripts/* ${STAGE_DIR}/usr/local/bin/
	cp manager/java.security ${STAGE_DIR}/usr/lib/jvm/java-17-openjdk/lib/security/java.security
	cp manager/admin/target/scala-3.3.5/admin-assembly-1.0.jar ${STAGE_DIR}/usr/local/bin/
	cp manager/package/entrypoint.sh ${STAGE_DIR}/entrypoint.sh

stage_init:
	rm -rf ${STAGE_DIR}; mkdir -p ${STAGE_DIR}
	mkdir -p ${STAGE_DIR}/usr/local/bin/
	mkdir -p ${STAGE_DIR}/licenses/
	mkdir -p ${STAGE_DIR}/usr/lib/jvm/java-17-openjdk/lib/security/

stage_mgr: stage_init copy_mgr

pull_base:
	docker pull neuvector/manager_base:${BASE_IMAGE_TAG}

manager_image: pull_base stage_mgr
	docker build --build-arg NV_TAG=$(NV_TAG) --build-arg BASE_IMAGE_TAG=${BASE_IMAGE_TAG} --no-cache=true -t neuvector/manager -f manager/Dockerfile.manager .

jar:
	@echo "Pulling images ..."
	docker pull neuvector/build_manager:${BUILD_IMAGE_TAG}
	@echo "Making $@ ..."
	docker run --rm -ia STDOUT --name build -v prebuild_manager:/prebuild/manager -v $(CURDIR):/manager -w /manager --entrypoint ./make_jar.sh neuvector/build_manager:${BUILD_IMAGE_TAG}

RUNNER := docker
IMAGE_BUILDER := $(RUNNER) buildx
MACHINE := neuvector
BUILDX_ARGS ?= --sbom=true --attest type=provenance,mode=max
DEFAULT_PLATFORMS := linux/amd64,linux/arm64,linux/x390s,linux/riscv64

COMMIT = $(shell git rev-parse --short HEAD)
ifeq ($(VERSION),)
	# Define VERSION, which is used for image tags or to bake it into the
	# compiled binary to enable the printing of the application version,
	# via the --version flag.
	CHANGES = $(shell git status --porcelain --untracked-files=no)
	ifneq ($(CHANGES),)
		DIRTY = -dirty
	endif


	COMMIT = $(shell git rev-parse --short HEAD)
	VERSION = $(COMMIT)$(DIRTY)

	# Override VERSION with the Git tag if the current HEAD has a tag pointing to
	# it AND the worktree isn't dirty.
	GIT_TAG = $(shell git tag -l --contains HEAD | head -n 1)
	ifneq ($(GIT_TAG),)
		ifeq ($(DIRTY),)
			VERSION = $(GIT_TAG)
		endif
	endif
endif

ifeq ($(TAG),)
	TAG = $(VERSION)
	ifneq ($(DIRTY),)
		TAG = dev
	endif
endif

TARGET_PLATFORMS ?= linux/amd64,linux/arm64
STAGE_DIR=stage
REPO ?= neuvector
IMAGE = $(REPO)/manager:$(TAG)
BUILD_ACTION = --load

buildx-machine:
	docker buildx ls
	@docker buildx ls | grep $(MACHINE) || \
	docker buildx create --name=$(MACHINE) --platform=$(DEFAULT_PLATFORMS)

test-image:
	# Instead of loading image, target all platforms, effectivelly testing
	# the build for the target architectures.
	$(MAKE) build-image BUILD_ACTION="--platform=$(TARGET_PLATFORMS)"

build-image: buildx-machine ## build (and load) the container image targeting the current platform.
	$(IMAGE_BUILDER) build -f package/Dockerfile \
		--builder $(MACHINE) $(IMAGE_ARGS) \
		--build-arg VERSION=$(VERSION) --build-arg COMMIT=$(COMMIT) -t "$(IMAGE)" $(BUILD_ACTION) .
	@echo "Built $(IMAGE)"

push-image: buildx-machine
	$(IMAGE_BUILDER) build -f package/Dockerfile \
		--builder $(MACHINE) $(IMAGE_ARGS) $(IID_FILE_FLAG) $(BUILDX_ARGS) \
		--build-arg VERSION=$(VERSION) --build-arg COMMIT=$(COMMIT) --platform=$(TARGET_PLATFORMS) -t "$(REPO)/$(IMAGE_PREFIX)manager:$(TAG)" --push .
	@echo "Pushed $(REPO)/$(IMAGE_PREFIX)manager:$(TAG)"