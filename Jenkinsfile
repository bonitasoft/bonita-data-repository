#!/usr/bin/env groovy
import static groovy.json.JsonOutput.toJson

properties([[$class: 'BuildDiscarderProperty', strategy: [$class: 'LogRotator', artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '', numToKeepStr: '3']]])


node('studio-7.15') {
    def currentBranch = env.BRANCH_NAME
    def isBaseBranch = currentBranch == 'master' || currentBranch == 'dev' || currentBranch?.startsWith('release-') || currentBranch?.matches('7\\..+\\.x')

    slackStage('🌍 Setup', isBaseBranch) {
        checkout scm
    }

    slackStage('🔧 Build', isBaseBranch) {
        def mvnArgs = 'verify'
      //  if (isBaseBranch) {
            mvnArgs = "deploy -Psign -DmacSignServiceURL=${env.MAC_SIGN_SERVICE_URL} -DaltDeploymentRepository=${env.ALT_DEPLOYMENT_REPOSITORY_SNAPSHOTS}"
      //  }
        mvn "${mvnArgs}"


    }

    slackStage('📦 Archive', isBaseBranch) {
        archiveArtifacts 'target/*.zip,target/binaries/*'
    }

}


def mvn(args) {
    configFileProvider([configFile(fileId: 'maven-settings', variable: 'MAVEN_SETTINGS')]) {
        sh("./mvnw -s ${MAVEN_SETTINGS} --no-transfer-progress -B ${args}")
    }
}

def slackStage(def name, boolean isBaseBranch, Closure body) {
    try {
        stage(name) {
            body()
        }
    } catch (e) {
        if (isBaseBranch) {
            def attachment = [
                    title     : "bonita-data-repository/${env.BRANCH_NAME} build is failing!",
                    title_link: env.BUILD_URL,
                    text      : "Stage ${name} has failed"
            ]

            slackSend(color: 'danger', channel: '#uid', attachments: toJson([attachment]))
        }
        throw e
    }
}
