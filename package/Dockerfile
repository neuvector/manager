# Builder image
FROM registry.suse.com/bci/openjdk:17 AS builder

ARG TARGETOS
ARG TARGETARCH

COPY admin /src/admin
COPY cli /src/cli
COPY common /src/common
COPY images /src/images
COPY licenses /src/licenses
COPY java.security /src/java.security
COPY package /src/package
COPY project /src/project
COPY scripts /src/scripts
COPY build.sbt .scalafix.conf .scalafmt.conf /src/

WORKDIR /src

RUN zypper refresh && \
    zypper install -y wget curl zip git awk nodejs20 npm20 && \
    npm install -g npm@10.9.2 && \
    hash -r

ARG VERSION

ARG CS_VERSION=v2.1.18
RUN if [ "$TARGETARCH" = "amd64" ]; then \
    curl -fL https://github.com/coursier/coursier/releases/download/${CS_VERSION}/cs-x86_64-pc-${TARGETOS}.gz | gzip -d > cs; \
  elif [ "$TARGETARCH" = "arm64" ]; then \
    curl -fL https://github.com/VirtusLab/coursier-m1/releases/download/${CS_VERSION}/cs-aarch64-pc-${TARGETOS}.gz | gzip -d > cs; \
  else \
    echo "Unsupported architecture: $ARCH"; \
    exit 1; \
  fi && \
    chmod +x cs && \
    export PATH="$PATH:/root/.local/share/coursier/bin" && \
    ./cs install scala:3.3.4 sbt:1.10.2 --install-dir /usr/local/bin

RUN npm install -g @angular/cli@14 && \
    npm install -g npm-force-resolutions

RUN sed -i -e 's/interim.*xxxx/'"$VERSION"'/g' ./common/src/main/resources/application.conf
RUN bash package/build_manager.sh

# Manager unitest
RUN if [ "$ARCH" = "amd64" ]; then \
  zypper addrepo https://download.opensuse.org/repositories/M17N:fonts/15.6/M17N:fonts.repo && \
  rpm --import https://download.opensuse.org/repositories/M17N/15.6/repodata/repomd.xml.key && \
  zypper --non-interactive refresh && \
  zypper install -y liberation-fonts && \
  wget https://dl.google.com/${OS}/direct/google-chrome-stable_current_${ARCH}.rpm && \
  wget https://dl.google.com/${OS}/${OS}_signing_key.pub && \
  rpm --import linux_signing_key.pub && \
  zypper install -y google-chrome-stable_current_x86_64.rpm; \
fi

# Base image
FROM registry.suse.com/bci/bci-micro:15.6 AS micro
FROM registry.suse.com/bci/bci-base:15.6 AS base

COPY --from=builder /src/package/requirements.txt /chroot/requirements.txt
COPY --from=micro / /chroot/

RUN zypper refresh && zypper --installroot /chroot -n in --no-recommends \
    python312 python312-pip iproute2 lsof procps grep awk && \
    cp /etc/resolv.conf /chroot/etc/resolv.conf && \
    chroot /chroot /usr/bin/python3.12 -m pip install --upgrade pip setuptools && \
    rm /chroot/usr/lib/python3.12/site-packages/distutils-precedence.pth && \
    zypper --installroot /chroot clean -a && \
    rm -rf /chroot/var/log/

# Create proper symbolic links for Python and pip
RUN ln -sf /usr/bin/python3.12 /chroot/usr/bin/python3 && \
    ln -sf /usr/bin/python3.12 /chroot/usr/bin/python && \
    ln -sf /usr/bin/pip3.12 /chroot/usr/bin/pip3 && \
    ln -sf /usr/bin/pip3.12 /chroot/usr/bin/pip

# Install requirements and clean up
RUN chroot /chroot /bin/sh -c "pip install --no-cache-dir -r /requirements.txt && \
    rm -rf /root/.cache /requirements.txt"
    
# Remove unnecessary binaries to reduce image size
RUN cd /chroot/usr/bin/ && \
    rm -rf basename chcon chgrp chmod chown chroot cksum dd df dircolors \
    dirname du install install-info join locale localedef mkdir mkfifo \
    mknod mktemp paste pathchk readlink realpath sync smidiff smidump \
    smilink smiquery smistrip smixlate tee tiemout tload top truncate \
    unlink watch

FROM micro
ARG VERSION
ARG COMMIT
WORKDIR /
COPY --from=base /chroot/ /
COPY --from=base /usr/sbin/useradd /usr/sbin
COPY --from=builder /usr/lib64/jvm /usr/lib64/jvm
COPY --from=builder /usr/lib64/lib*.so* /usr/lib64/
COPY --from=builder /src/stage /
COPY EULA.pdf /licenses/

ENV JAVA_HOME=/usr/lib64/jvm/java-17-openjdk-17 \
    PATH=/usr/lib64/jvm/java-17-openjdk-17/bin:$PATH \
    LD_LIBRARY_PATH=/usr/lib64 \
    LANG=C.UTF-8 \
    PYTHONUNBUFFERED=1

LABEL "name"="manager" \
      "vendor"="SUSE Security" \
      "neuvector.image"="neuvector/manager" \
      "neuvector.role"="manager" \
      "neuvector.rev"="${COMMIT}" \
      "io.artifacthub.package.logo-url"=https://avatars2.githubusercontent.com/u/19367275 \
      "io.artifacthub.package.readme-url"="https://raw.githubusercontent.com/neuvector/manager/${VERSION}/README.md" \
      "org.opencontainers.image.description"="SUSE Security Manager" \
      "org.opencontainers.image.title"="SUSE Security Manager" \
      "org.opencontainers.image.source"="https://github.com/neuvector/manager/" \
      "org.opencontainers.image.version"="${VERSION}" \
      "org.opensuse.reference"="neuvector/manager:${VERSION}"

ARG user=manager
RUN echo "$user:x:1000:1000::/nonexistent:/bin/bash" >> /etc/passwd && \
    echo "$user:x:1000:" >> /etc/group
USER $user

ENTRYPOINT ["java", "-Xms256m", "-Xmx2048m", "-Djdk.tls.rejectClientInitiatedRenegotiation=true", "-Dpekko.http.parsing.max-header-value-length=32k", "-jar", "/usr/local/bin/admin-assembly-1.0.jar"]
