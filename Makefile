.PHONY: jar

REPO_REL_URL = 10.1.127.12:5000
STAGE_DIR = stage

copy_mgr:
	cp manager/licenses/* ${STAGE_DIR}/licenses/
	cp manager/cli/cli ${STAGE_DIR}/usr/local/bin/
	cp -r manager/cli/prog ${STAGE_DIR}/usr/local/bin/
	cp manager/scripts/* ${STAGE_DIR}/usr/local/bin/
	cp manager/java.security ${STAGE_DIR}/usr/lib/jvm/java-11-openjdk/lib/security/java.security
	cp manager/admin/target/scala-2.11/admin-assembly-1.0.jar ${STAGE_DIR}/usr/local/bin/

stage_init:
	rm -rf ${STAGE_DIR}; mkdir -p ${STAGE_DIR}
	mkdir -p ${STAGE_DIR}/usr/local/bin/
	mkdir -p ${STAGE_DIR}/licenses/
	mkdir -p ${STAGE_DIR}/usr/lib/jvm/java-11-openjdk/lib/security/

stage_mgr: stage_init copy_mgr

pull_base:
	docker pull $(REPO_REL_URL)/neuvector/manager_base:jdk11

manager_image: pull_base stage_mgr
	docker build --build-arg NV_TAG=$(NV_TAG) --no-cache=true -t neuvector/manager -f manager/Dockerfile.manager .

jar:
	@echo "Pulling images ..."
	docker pull $(REPO_REL_URL)/neuvector/store
	docker pull $(REPO_REL_URL)/neuvector/build:latest
	@echo "Making $@ ..."
	docker volume rm prebuild_manager || true
	docker run --rm --name store -v prebuild_manager:/prebuild/manager $(REPO_REL_URL)/neuvector/store
	@echo "Running build ..."
	docker run --rm -ia STDOUT --name build -v prebuild_manager:/prebuild/manager -v $(CURDIR):/manager -w /manager --entrypoint ./make_jar.sh $(REPO_REL_URL)/neuvector/build:latest
	docker volume rm prebuild_manager
