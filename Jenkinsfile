#!/usr/bin/env groovy
import static groovy.json.JsonOutput.toJson

properties([[$class: 'BuildDiscarderProperty', strategy: [$class: 'LogRotator', artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '', numToKeepStr: '3']]])


node {
    def currentBranch = env.BRANCH_NAME
    def isBaseBranch = currentBranch == 'master' || currentBranch == 'dev'

    slackStage('🌍 Setup', isBaseBranch) {
        checkout scm
    }

    slackStage('🔧 Build', isBaseBranch) {
        def mvnArgs = 'verify'
        if (isBaseBranch) {
            mvnArgs = "deploy -DaltDeploymentRepository=${env.ALT_DEPLOYMENT_REPOSITORY_SNAPSHOTS}"
        }
        mvn "${mvnArgs}"


    }

    slackStage('📦 Archive', isBaseBranch) {
        archiveArtifacts 'target/*.zip,target/binaries/*,target/tests/*.html'
        publishHTML([allowMissing: false, alwaysLinkToLastBuild: false, keepAll: false,
                     reportDir: './target/tests/',
                     reportFiles: 'data-repostory-test-report.html',
                     reportName: 'data-repostory-test-report', reportTitles: ''])
    }

}


def mvn(args) {
    sh "./mvnw  --no-transfer-progress  ${args}"
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
