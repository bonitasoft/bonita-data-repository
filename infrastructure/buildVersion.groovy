pipeline {
    agent any
    options {
        timestamps()
    }
    stages {
        stage('Build and deploy') {
            configFileProvider([configFile(fileId: 'maven-settings', variable: 'MAVEN_SETTINGS')]) {
                sh("./mvnw -s ${MAVEN_SETTINGS} --no-transfer-progress -B deploy -DskipTests -DaltDeploymentRepository=${env.ALT_DEPLOYMENT_REPOSITORY_TAG}")
            }
        }
    }
}