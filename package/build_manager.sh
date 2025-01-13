#!/bin/bash
set -e

STAGE_DIR=stage

export CHROME_BIN=/usr/bin/google-chrome

rm -rf admin/target
pushd admin/webapp
if [[ $# > 0 ]]; then
    case $1 in
        -d)
        mkdir -p /root/.ivy2
        ln -s /prebuild/manager/cache /root/.ivy2/cache
        ;;
        *)
        ;;
    esac
fi
npm install --legacy-peer-deps 2>&1
if [ $? -eq 0 ]; then
    echo npm package installation SUCCEED
else
    npm cache clean --force 2>&1
    sleep 10
    npm install 2>&1
    if [ $? -eq 0 ]; then
        echo npm package installation SUCCEED
    else
        echo ================================
        echo npm package installation FAILED
        echo ================================
        exit 1
    fi
fi
npm run build 2>&1
if [ $? -eq 0 ]; then
    echo UI build SUCCEED
else
    echo ================================
    echo UI build FAILED
    echo ================================
    exit 1
fi
popd
env JAVA_OPTS="-Xms2g -Xmx3g" sbt admin/assembly
zip -d admin/target/scala-3.3.4/admin-assembly-1.0.jar rest-management-private-classpath\*
rm -rf admin/webapp/root/.sass-cache

mkdir -p ${STAGE_DIR}/licenses/ ${STAGE_DIR}/usr/local/bin/ ${STAGE_DIR}/usr/lib64/jvm/java-17-openjdk-17/conf/security/
cp licenses/* ${STAGE_DIR}/licenses/
cp cli/cli ${STAGE_DIR}/usr/local/bin/
cp cli/cli.py ${STAGE_DIR}/usr/local/bin/
cp -r cli/prog ${STAGE_DIR}/usr/local/bin/
cp scripts/* ${STAGE_DIR}/usr/local/bin/
cp java.security ${STAGE_DIR}/usr/lib64/jvm/java-17-openjdk-17/conf/security/java.security.fips
cp admin/target/scala-3.3.4/admin-assembly-1.0.jar ${STAGE_DIR}/usr/local/bin/