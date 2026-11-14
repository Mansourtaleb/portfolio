# Jenkins LTS (Java 21) + client Docker + plugins de base
FROM jenkins/jenkins:lts-jdk21
USER root
# On récupère uniquement le binaire "docker" (client) depuis l'image officielle
COPY --from=docker:27-cli /usr/local/bin/docker /usr/local/bin/docker
USER jenkins
RUN jenkins-plugin-cli --plugins git workflow-aggregator docker-workflow pipeline-stage-view junit