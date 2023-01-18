pipeline {
    agent any
    options {
        timestamps()
    }
    stages {
        stage('Build and deploy') {
            steps {
                configFileProvider([configFile(fileId: 'maven-settings', variable: 'MAVEN_SETTINGS')]) {
                    sh("./mvnw -s ${MAVEN_SETTINGS} --no-transfer-progress -B deploy -Psign -DmacSignServiceURL=${env.MAC_SIGN_SERVICE_URL}  -DskipTests -DaltDeploymentRepository=${env.ALT_DEPLOYMENT_REPOSITORY_STAGING}")
                }
            }
        }
    }
}
