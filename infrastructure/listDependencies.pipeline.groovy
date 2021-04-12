#!/usr/bin/env groovy
def minorVersion = params.bonitaDocVersion
def branchDocName = params.docBranchName

timestamps {
    ansiColor('xterm') {
        node {
            stage('Checkout 🌍') {
                checkout scm
            }

            stage('Generate ⚙️') {
                sh './mvnw initialize -Pdependencies'
                stash name: 'bonita-data-repository-dependencies', includes: 'target/bonita-data-repository-dependencies.adoc'
            }

            stage('Update documentation ✏️') {
                if (params.createPR) {
                    configGitCredentialHelper()
                    checkout([$class: 'GitSCM', branches: [[name: "*/${params.branchOrTagName}"]],
                          userRemoteConfigs: [[url: 'https://github.com/bonitasoft/bonita-data-repository.git',
                          credentialsId: 'github', refspec:"+refs/${params.gitRefs}/${params.branchOrTagName}:refs/remotes/origin/${params.branchOrTagName}"]]])
                    unstash "bonita-data-repository-dependencies"
                    println "Start generation file"
                    sh "./infrastructure/dependencies/dependencies.sh --version=${minorVersion} --source-folder=target --file-name=bonita-data-repository-dependencies.adoc --branch=${branchDocName}"
                    println "File generated"

                    println "Start pull request creation"
                    withCredentials([
                            usernamePassword(
                                    credentialsId: 'github',
                                    usernameVariable: 'GITHUB_USERNAME',
                                    passwordVariable: 'GITHUB_API_TOKEN')
                    ]) {
                        sh "./infrastructure/utils/create_pull_request.sh \\" +
                                "--repository='bonita-doc' \\" +
                                "--github-username=${GITHUB_USERNAME} \\" +
                                "--github-api-token=${GITHUB_API_TOKEN} \\" +
                                "--pr-title='doc(uid) List dependencies for version ${minorVersion}'  \\" +
                                "--pr-base-branch-name=${minorVersion} \\" +
                                "--pr-head-branch-name=${branchDocName}"
                        println "Pull request created"
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
