# Builder image
FROM registry.suse.com/bci/openjdk:17 AS builder

ARG VERSION
ARG TARGETOS
ARG TARGETARCH

COPY . /src
WORKDIR /src

RUN zypper refresh && \
    zypper install -y ca-certificates wget curl zip git awk nodejs20 npm20

RUN if [ "$TARGETARCH" = "amd64" ]; then \
    curl -fL https://github.com/coursier/launchers/raw/master/cs-x86_64-pc-${TARGETOS}.gz | gzip -d > cs; \
  elif [ "$TARGETARCH" = "arm64" ]; then \
    curl -fL https://github.com/VirtusLab/coursier-m1/releases/latest/download/cs-aarch64-pc-${TARGETOS}.gz | gzip -d > cs; \
  else \
    echo "Unsupported architecture: $ARCH"; \
    exit 1; \
  fi && \
    chmod +x cs && \
    export PATH="$PATH:/root/.local/share/coursier/bin" && \
    ./cs install scala:3.3.4 sbt:1.10.2 --install-dir /usr/local/bin

RUN npm install -g @angular/cli@14 && \
    npm install -g npm-force-resolutions

RUN bash build/build_manager.sh

# # Manager unitest
RUN if [ "$ARCH" = "amd64" ]; then \
  zypper addrepo https://download.opensuse.org/repositories/M17N:fonts/15.6/M17N:fonts.repo && \
  zypper --non-interactive --gpg-auto-import-keys refresh && \
  zypper install -y liberation-fonts && \
  wget https://dl.google.com/${OS}/direct/google-chrome-stable_current_${ARCH}.rpm && \
  wget https://dl.google.com/${OS}/${OS}_signing_key.pub && \
  rpm --import linux_signing_key.pub && \
  zypper install -y google-chrome-stable_current_x86_64.rpm; \
fi

# Base image
FROM registry.suse.com/bci/bci-micro:15.6 AS micro
FROM registry.suse.com/bci/bci-base:15.6 AS base

COPY --from=micro / /chroot/
RUN zypper --installroot /chroot -n --gpg-auto-import-keys in --no-recommends \
    python312 python312-pip iproute2 lsof procps grep awk && \
    cp /etc/resolv.conf /chroot/etc/resolv.conf && \
    chroot /chroot /usr/bin/python3.12 -m pip install --upgrade pip setuptools && \
    rm /chroot/usr/lib/python3.12/site-packages/distutils-precedence.pth && \
    zypper --installroot /chroot clean -a && \
    rm -rf /chroot/var/log/

FROM micro
WORKDIR /
COPY --from=base /chroot/ /
COPY --from=base /usr/sbin/useradd /usr/sbin
COPY --from=builder /src/stage /
COPY --from=builder /src/build/requirements.txt /

ENV JAVA_VERSION=17.0.12_p8-r0 \
    JAVA_HOME=/usr/lib/jvm/java-1.17-openjdk/jre \
    PATH=$PATH:/usr/lib/jvm/java-1.17-openjdk/jre/bin:/usr/lib/jvm/java-1.17-openjdk/bin \
    LANG=C.UTF-8 \
    PYTHONUNBUFFERED=1
    
RUN ln -s /usr/bin/python3.12 /usr/bin/python && \
    ln -s /usr/bin/python3.12 /usr/bin/python3  && \
    pip3 install --no-cache-dir -r /requirements.txt && \
    rm -r /root/.cache /requirements.txt
RUN cd /usr/bin/ && rm -rf basename chcon chgrp chmod chown chroot cksum dd df dircolors dirname du install install-info join locale localedef mkdir mkfifo mknod mktemp paste pathchk readlink realpath sync smidiff smidump smilink smiquery smistrip smixlate tee tiemout tload top truncate unlink watch

LABEL name="manager" \
      vendor="NeuVector Inc." \
      version=${VERSION} \
      release=${VERSION} \
      neuvector.image="neuvector/manager" \
      neuvector.role="manager" \
      neuvector.rev="git.xxxx"

ARG user=manager
RUN echo "$user:x:1000:1000::/nonexistent:/bin/bash" >> /etc/passwd && \
    echo "$user:x:1000:" >> /etc/group
USER $user

ENTRYPOINT ["java", "-Xms256m", "-Xmx2048m", "-Djdk.tls.rejectClientInitiatedRenegotiation=true", "-Dpekko.http.parsing.max-header-value-length=32k", "-jar", "/usr/local/bin/admin-assembly-1.0.jar"]
