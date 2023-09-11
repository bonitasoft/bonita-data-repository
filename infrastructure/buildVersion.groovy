pipeline {
    agent any
    options {
        timestamps()
    }
    stages {
        stage('Build and deploy') {
            steps {
                configFileProvider([configFile(fileId: 'maven-settings', variable: 'MAVEN_SETTINGS')]) {
                    def withSignProfile = params.sign ? '-Psign' : ''
                    sh("./mvnw -s ${MAVEN_SETTINGS} --no-transfer-progress -B deploy ${withSignProfile} -DsignServiceURL=${env.SIGN_SERVICE_URL} -DmacSignServiceURL=${env.MAC_SIGN_SERVICE_URL}  -DskipTests -DaltDeploymentRepository=${env.ALT_DEPLOYMENT_REPOSITORY_STAGING}")
                }
            }
        }
    }
}
