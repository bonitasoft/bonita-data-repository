#!/usr/bin/env groovy
def tag = params.TAG_NAME
pipeline {
    agent any
    options {
        timestamps()
        skipDefaultCheckout true
    }
    stages {
        stage('Init') {
            steps{
                script{
                    configGitCredentialHelper()
                    git branch: params.BASE_BRANCH, credentialsId: 'github', url: 'https://github.com/bonitasoft/bonita-data-repository.git'
                }
            }

        }
        stage('Tag') {
            when {
                expression { params.TAG }
            }
            steps {
                script {
                    withCredentials([usernamePassword(
                            credentialsId: 'github',
                            passwordVariable: 'GIT_PASSWORD',
                            usernameVariable: 'GIT_USERNAME')]) {
                        sh "./infrastructure/release.sh ${tag}" true
                    }
                }
            }
        }
    }
}

def configGitCredentialHelper() {
    sh """#!/bin/bash +x
        set -e
        echo "Using the git cache credential helper to be able to perform native git commands without passing authentication parameters"
        # Timeout in seconds, ensure we have enough time to perform the whole process between the initial clone and the final branch push
        git config --global credential.helper 'cache --timeout=18000'
    """
}
