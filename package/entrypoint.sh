#!/bin/bash
set -e

if [ -f /proc/sys/crypto/fips_enabled ] && [ "$(cat /proc/sys/crypto/fips_enabled)" -eq 1 ]; then
    echo "FIPS mode detected (via /proc/sys/crypto/fips_enabled)."
    JAVA_SECURITY_FILE="/usr/lib64/jvm/java-17-openjdk-17/conf/security/java.security.fips"
else
    echo "FIPS mode not detected. Using default security configuration."
    JAVA_SECURITY_FILE="/usr/lib64/jvm/java-17-openjdk-17/conf/security/java.security.default"
fi

exec java \
  -Xms256m \
  -Xmx2048m \
  -Djdk.tls.rejectClientInitiatedRenegotiation=true \
  --add-opens=java.base/java.lang=ALL-UNNAMED \
  --add-opens=java.base/java.lang.reflect=ALL-UNNAMED \
  --add-opens=java.base/java.util=ALL-UNNAMED \
  -Djava.security.properties=="$JAVA_SECURITY_FILE" \
  -jar /usr/local/bin/admin-assembly-1.0.jar