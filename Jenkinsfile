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
        mvn "clean verify"
    }
}


def mvn(args) {
    sh """
     # Set this environment variable is mandatory to build UID in ymci  
     export LANG='en_US.UTF-8'
     ./mvnw ${args}
    """
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
