// Pipeline CI du portfolio : tests, qualité (SonarQube), images Docker.
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
    }

    stages {
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
                        // guillemets simples : le token est lu par le shell, jamais écrit en clair dans le script
                        sh 'chmod +x mvnw && ./mvnw -B verify org.sonarsource.scanner.maven:sonar-maven-plugin:sonar -Dsonar.projectKey=portfolio-api -Dsonar.projectName=portfolio-api -Dsonar.host.url=$SONAR_HOST_URL -Dsonar.token=$SONAR_AUTH_TOKEN'
                    }
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'backend/target/surefire-reports/*.xml'
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

        stage('Frontend : build') {
            agent {
                docker {
                    image 'node:22-alpine'
                    args '-v npm-cache:/root/.npm'
                    reuseNode true
                }
            }
            steps {
                dir('frontend') {
                    sh 'npm install -g npm@11.6.2 && npm ci && npx ng build --configuration production'
                }
            }
        }

        stage('Images Docker') {
            steps {
                sh "docker build -t portfolio-api:${IMAGE_TAG} backend"
                sh "docker build -t portfolio-web:${IMAGE_TAG} frontend"
            }
        }
    }

    post {
        success { echo "✅ Build ${IMAGE_TAG} OK" }
        failure { echo "❌ Build en échec : regarde l'étape rouge" }
    }
}