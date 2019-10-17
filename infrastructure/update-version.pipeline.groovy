#!/usr/bin/env groovy

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
                  git branch: params.BASE_BRANCH, url: 'git@github.com:bonitasoft/bonita-data-repository.git'
                }
            }

        }
        stage('Tag') {
            steps {
                script {
                    sh " git config --global push.default matching"
                    sh "./infrastructure/release.sh ${params.newVersion} false"

                }
            }
        }
    }
}