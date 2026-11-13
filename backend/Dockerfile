# ---------- Étape 1 : construction ----------
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Dépendances d'abord (mises en cache tant que pom.xml ne change pas)
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline

# Puis le code source
COPY src src
RUN ./mvnw -B -q package -DskipTests

# ---------- Étape 2 : exécution ----------
FROM eclipse-temurin:21-jre
WORKDIR /app

# Ne jamais exécuter en root
RUN useradd --system --create-home spring && mkdir -p /home/spring/.models && chown spring:spring /home/spring/.models
USER spring

COPY --from=build /app/target/*.jar app.jar

# Dossier du modèle d'embeddings (monté en volume pour ne pas le retélécharger)
ENV EMBEDDINGS_DIR=/home/spring/.models
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s \
  CMD wget -qO- http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]