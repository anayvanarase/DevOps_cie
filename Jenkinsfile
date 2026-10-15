pipeline {
    agent {
        label 'local1'
    }

    stages {
        stage('Test Agent') {
            steps {
                bat 'echo Jenkins agent is working'
                bat 'hostname'
                bat 'whoami'
            }
        }
    }

    post {
        always {
            echo 'Pipeline execution finished.'
        }
    }
}
