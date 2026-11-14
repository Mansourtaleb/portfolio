# Jenkins LTS (Java 21) + client Docker + Helm + plugins de base
FROM jenkins/jenkins:lts-jdk21
USER root
# On récupère uniquement le binaire "docker" (client) depuis l'image officielle
COPY --from=docker:27-cli /usr/local/bin/docker /usr/local/bin/docker
# Helm, même version que sur le poste (passée avec --build-arg HELM_VERSION=vX.Y.Z)
ARG HELM_VERSION
RUN curl -fsSL "https://get.helm.sh/helm-${HELM_VERSION}-linux-amd64.tar.gz" | tar -xz -C /tmp \
    && mv /tmp/linux-amd64/helm /usr/local/bin/helm && rm -rf /tmp/linux-amd64
USER jenkins
RUN jenkins-plugin-cli --plugins git workflow-aggregator docker-workflow pipeline-stage-view junit
