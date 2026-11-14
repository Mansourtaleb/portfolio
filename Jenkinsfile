// Pipeline CI : tests, qualité (SonarQube), images (build once), publication Nexus.
pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
    }

    triggers {
        pollSCM('H/5 * * * *')
    }

    environment {
        IMAGE_TAG = "1.0.${env.BUILD_NUMBER}"
        REGISTRY  = 'localhost:8083'
    }

    stages {
      // Backend et frontend sont indépendants : on les exécute en même temps
      stage('Build') {
       parallel {
        stage('Backend : tests + analyse') {
            agent {
                docker {
                    image 'eclipse-temurin:21-jdk'
                    args '-v maven-repo:/root/.m2 -v /var/run/docker.sock:/var/run/docker.sock -e TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal'
                    reuseNode true
                }
            }
            steps {
                dir('backend') {
                    withSonarQubeEnv('sonarqube') {
                        sh 'chmod +x mvnw && ./mvnw -B -s ../infra/maven/settings.xml verify org.sonarsource.scanner.maven:sonar-maven-plugin:sonar -Dsonar.projectKey=portfolio-api -Dsonar.projectName=portfolio-api -Dsonar.host.url=$SONAR_HOST_URL -Dsonar.token=$SONAR_AUTH_TOKEN'
                    }
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'backend/target/surefire-reports/*.xml'
                }
            }
        }

        stage('Frontend : build') {
            agent {
                docker {
                    image 'node:24-alpine'  // embarque npm 11 : plus besoin d'installer npm à chaque build
                    args '-v npm-cache:/root/.npm'
                    reuseNode true
                }
            }
            steps {
                dir('frontend') {
                    sh 'npm ci --prefer-offline --no-audit --no-fund && npx ng build --configuration production'
                }
            }
        }
       }
      }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Images Docker') {
            steps {
                sh "docker build -f backend/Dockerfile.ci -t ${REGISTRY}/portfolio-api:${IMAGE_TAG} backend/target"
                sh 'cp frontend/nginx.conf frontend/dist/frontend/nginx.conf'
                sh "docker build -f frontend/Dockerfile.ci -t ${REGISTRY}/portfolio-web:${IMAGE_TAG} frontend/dist/frontend"
            }
        }

        stage('Publication Nexus') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'nexus-docker', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
                    sh 'echo "$NEXUS_PASS" | docker login $REGISTRY -u "$NEXUS_USER" --password-stdin'
                    sh "docker push ${REGISTRY}/portfolio-api:${IMAGE_TAG}"
                    sh "docker push ${REGISTRY}/portfolio-web:${IMAGE_TAG}"
                }
            }
            post {
                always { sh 'docker logout $REGISTRY || true' }
            }
        }
    }

    post {
        success { echo "✅ ${REGISTRY}/portfolio-api:${IMAGE_TAG} et portfolio-web:${IMAGE_TAG} publiées" }
        failure { echo "❌ Build en échec : regarde l'étape rouge" }
    }
}