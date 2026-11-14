// Pipeline CI du portfolio : build + tests back/front, puis images Docker.
pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))  // garde les 10 derniers builds
        disableConcurrentBuilds()                       // un seul build à la fois
        timeout(time: 30, unit: 'MINUTES')
    }

    triggers {
        pollSCM('H/5 * * * *')  // vérifie GitHub toutes les ~5 min (pas de webhook vers localhost)
    }

    environment {
        IMAGE_TAG = "1.0.${env.BUILD_NUMBER}"
    }

    stages {
        stage('Backend : build + tests') {
            agent {
                docker {
                    image 'eclipse-temurin:21-jdk'
                    // cache Maven + accès Docker pour Testcontainers
                    args '-v maven-repo:/root/.m2 -v /var/run/docker.sock:/var/run/docker.sock -e TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal'
                    reuseNode true
                }
            }
            steps {
                dir('backend') {
                    sh 'chmod +x mvnw && ./mvnw -B verify'
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