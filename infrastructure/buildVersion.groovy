def mavenProfiles = '-Pmacos-codesign'
pipeline {
    agent any
    options {
        timestamps()
        ansiColor('xterm')
    }
    environment {
        JAVA_HOME = "${env.JAVA_HOME_17}"
        ESIGNER_CREDS = credentials('eSigner')
        ESIGNER_CREDENTIAL_ID = credentials('eSignerCredentialId')
        ESIGNER_TOTP = credentials('eSignerTOTP')
    }
    stages {
        stage('Build and deploy') {
            steps {
                configFileProvider([configFile(fileId: 'maven-settings', variable: 'MAVEN_SETTINGS')]) {
                    script {
                        if(params.sign) {
                            mavenProfiles += ',windows-codesign'
                        }
                    }
                    sh("./mvnw -s ${MAVEN_SETTINGS} --no-transfer-progress -B deploy ${mavenProfiles} -DmacSignServiceURL=${env.MAC_SIGN_SERVICE_URL}  -DskipTests -DaltDeploymentRepository=${env.ALT_DEPLOYMENT_REPOSITORY_STAGING}")
                }
            }
        }
    }
}
