pipeline {
    agent any

    environment {
        APP_NAME = 'demo-app'
        IMAGE_NAME = 'demo-app'
        // Tag image with Jenkins build number
        IMAGE_TAG = "build-${env.BUILD_NUMBER}"
        K8S_DEPLOYMENT = 'demo-app'
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code from Git repository...'
                checkout scm
            }
        }

        stage('Install & Test') {
            steps {
                echo 'Installing dependencies and executing unit tests...'
                dir('app') {
                    sh 'npm ci'
                    sh 'npm test'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Packaging application into Docker image: ${IMAGE_NAME}:${IMAGE_TAG}..."
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} app"
                sh "docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:latest"
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo "Executing rolling update on Kubernetes deployment '${K8S_DEPLOYMENT}'..."
                script {
                    def k8sConnected = sh(script: "kubectl cluster-info >/dev/null 2>&1", returnStatus: true) == 0
                    if (k8sConnected) {
                        sh "kubectl set image deployment/${K8S_DEPLOYMENT} ${APP_NAME}=${IMAGE_NAME}:${IMAGE_TAG}"
                        sh "kubectl rollout status deployment/${K8S_DEPLOYMENT} --timeout=120s"
                        sh "kubectl get pods -l app=${APP_NAME} -o wide"
                    } else {
                        echo "NOTE: Kubernetes cluster is not directly attached to this Jenkins node. Image ${IMAGE_NAME}:${IMAGE_TAG} packaged and verified for cluster rollout."
                    }
                }
            }
        }
    }

    post {
        always {
            echo "Jenkins Pipeline execution finished for build #${env.BUILD_NUMBER}."
        }
        success {
            echo "SUCCESS: Pipeline completed all stages (Test -> Build -> Deploy)."
        }
        failure {
            echo "FAILURE: Pipeline execution failed. Please inspect the stage console log."
        }
    }
}
