// Pipeline CI/CD GitOps : tests, qualité (SonarQube), images (build once), Nexus, version écrite dans Git → Argo CD déploie.
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
      // Garde anti-boucle : le commit « deploy: … [skip ci] » écrit par Jenkins ne relance pas tout le pipeline
      stage('Garde GitOps') {
        steps {
          script {
            if (sh(script: 'git log -1 --pretty=%B', returnStdout: true).contains('[skip ci]')) {
              env.SKIP_CI = 'true'
              currentBuild.result = 'NOT_BUILT'
              echo 'Commit de déploiement écrit par Jenkins : rien à construire.'
            }
          }
        }
      }

      // Backend et frontend sont indépendants : on les exécute en même temps
      stage('Build') {
       when { expression { env.SKIP_CI != 'true' } }
       failFast true   // si une branche échoue, on arrête l'autre tout de suite
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
                    image 'portfolio-node-agent:22-npm11.6.2'  // agent préparé : versions figées
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
            when { expression { env.SKIP_CI != 'true' } }
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Images Docker') {
            when { expression { env.SKIP_CI != 'true' } }
            steps {
                sh "docker build -f backend/Dockerfile.ci -t ${REGISTRY}/portfolio-api:${IMAGE_TAG} backend/target"
                sh 'cp frontend/nginx.conf frontend/dist/frontend/nginx.conf'
                sh "docker build -f frontend/Dockerfile.ci -t ${REGISTRY}/portfolio-web:${IMAGE_TAG} frontend/dist/frontend"
            }
        }

        stage('Publication Nexus') {
            when { expression { env.SKIP_CI != 'true' } }
            steps {
                withCredentials([usernamePassword(credentialsId: 'nexus-docker', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
                    // 3 tentatives : absorbe un Nexus lent ou un raté réseau ponctuel
                    retry(3) {
                        sh 'echo "$NEXUS_PASS" | docker login $REGISTRY -u "$NEXUS_USER" --password-stdin'
                        sh "docker push ${REGISTRY}/portfolio-api:${IMAGE_TAG}"
                        sh "docker push ${REGISTRY}/portfolio-web:${IMAGE_TAG}"
                    }
                }
            }
            post {
                always {
                    sh 'docker logout $REGISTRY || true'
                    // les images sont dans Nexus : on libère le disque local
                    sh "docker rmi ${REGISTRY}/portfolio-api:${IMAGE_TAG} ${REGISTRY}/portfolio-web:${IMAGE_TAG} || true"
                }
            }
        }

        // CD GitOps : Jenkins ne touche plus au cluster, il écrit la nouvelle version dans Git.
        // Argo CD voit le commit et synchronise le cluster.
        stage('GitOps : version dans Git') {
            when { expression { env.SKIP_CI != 'true' } }
            steps {
                withCredentials([usernamePassword(credentialsId: 'github-push', usernameVariable: 'GH_USER', passwordVariable: 'GH_TOKEN')]) {
                    sh '''
                        git config user.name "Jenkins CI"
                        git config user.email "jenkins@portfolio.local"
                        git fetch origin main
                        git checkout -B main origin/main
                        sed -i "s/^  tag: .*/  tag: \\"${IMAGE_TAG}\\"   # mis à jour par Jenkins à chaque build (GitOps)/" helm/portfolio/values.yaml
                        git add helm/portfolio/values.yaml
                        git commit -m "deploy: portfolio ${IMAGE_TAG} [skip ci]"
                        # le jeton est masqué dans les logs Jenkins et n'est pas enregistré dans .git/config
                        git push "https://${GH_USER}:${GH_TOKEN}@github.com/Mansourtaleb/portfolio.git" HEAD:main
                    '''
                }
            }
        }

        // Jenkins attend qu'Argo CD ait déployé la nouvelle version (lecture seule sur le cluster)
        stage('Attente Argo CD') {
            when { expression { env.SKIP_CI != 'true' } }
            steps {
                withCredentials([file(credentialsId: 'kubeconfig-kind', variable: 'KUBECONFIG')]) {
                    timeout(time: 10, unit: 'MINUTES') {
                        // script { } : une expression Groovy (== 0) n'est pas une « étape » déclarative
                        script {
                            waitUntil(initialRecurrencePeriod: 15000) {
                                sh(script: "kubectl get deploy api web -n portfolio -o jsonpath='{.items[*].spec.template.spec.containers[0].image}' | tr ' ' '\\n' | grep -c ':${IMAGE_TAG}' | grep -q 2", returnStatus: true) == 0
                            }
                        }
                    }
                    sh 'kubectl rollout status deploy/api -n portfolio --timeout=5m'
                    sh 'kubectl rollout status deploy/web -n portfolio --timeout=5m'
                }
            }
        }

        // Test de fumée : le site répond-il vraiment après le déploiement ?
        stage('Smoke test') {
            when { expression { env.SKIP_CI != 'true' } }
            steps {
                retry(5) {
                    sleep 5
                    sh 'curl -fsS -o /dev/null http://host.docker.internal:8088/api/public/portfolio'
                }
            }
        }
    }

    post {
        success { echo "✅ Version ${IMAGE_TAG} publiée dans Nexus, écrite dans Git et déployée par Argo CD" }
        failure { echo "❌ Build en échec : regarde l'étape rouge" }
    }
}
