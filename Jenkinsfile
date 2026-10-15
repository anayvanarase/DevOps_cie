pipeline {
agent {
label 'local1'
}


environment {
    APP_NAME = 'demo-app'
    IMAGE_NAME = 'demo-app'
    IMAGE_TAG = "build-${env.BUILD_NUMBER}"
    K8S_DEPLOYMENT = 'demo-app'
}

stages {
    stage('Checkout') {
        steps {
            echo 'Checking out source code from Git repository...'
            checkout scm

            sh '''
                echo "Running on WSL agent"
                echo "Current workspace:"
                pwd
                echo "Checking repository files:"
                ls -la
            '''
        }
    }

    stage('Verify Tools') {
        steps {
            echo 'Checking required tools on the WSL agent...'

            sh '''
                set -e

                echo "Checking Node.js..."
                node --version
                npm --version

                echo "Checking Docker..."
                docker --version

                echo "Checking kubectl..."
                kubectl version --client
            '''
        }
    }

    stage('Install & Test') {
        steps {
            echo 'Installing dependencies and executing unit tests...'

            dir('app') {
                sh '''
                    set -e

                    npm ci
                    npm test
                '''
            }
        }
    }

    stage('Build Docker Image') {
        steps {
            echo "Building Docker image: ${IMAGE_NAME}:${IMAGE_TAG}"

            sh '''
                set -e

                docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" app
                docker tag "${IMAGE_NAME}:${IMAGE_TAG}" "${IMAGE_NAME}:latest"

                echo "Docker image built successfully."
                docker images "${IMAGE_NAME}"
            '''
        }
    }

    stage('Deploy to Kubernetes') {
        steps {
            echo "Deploying image to Kubernetes deployment '${K8S_DEPLOYMENT}'..."

            script {
                def k8sConnected = sh(
                    script: 'kubectl cluster-info >/dev/null 2>&1',
                    returnStatus: true
                ) == 0

                if (k8sConnected) {
                    sh '''
                        set -e

                        echo "Connected to Kubernetes cluster:"
                        kubectl config current-context

                        echo "Updating deployment image..."
                        kubectl set image \
                            deployment/${K8S_DEPLOYMENT} \
                            ${APP_NAME}=${IMAGE_NAME}:${IMAGE_TAG}

                        echo "Waiting for rollout to complete..."
                        kubectl rollout status \
                            deployment/${K8S_DEPLOYMENT} \
                            --timeout=120s

                        echo "Checking deployed pods..."
                        kubectl get pods -l app=${APP_NAME} -o wide
                    '''
                } else {
                    error(
                        'Cannot connect to Kubernetes. Check the WSL agent kubeconfig and cluster status.'
                    )
                }
            }
        }
    }
}

post {
    always {
        echo "Jenkins pipeline execution finished for build #${env.BUILD_NUMBER}."
    }

    success {
        echo 'SUCCESS: Tests, Docker build, and Kubernetes deployment completed.'
    }

    failure {
        echo 'FAILURE: Pipeline execution failed. Check the Console Output.'
    }
}


}
