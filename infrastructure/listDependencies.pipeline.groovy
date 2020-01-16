#!/usr/bin/env groovy

timestamps {
    ansiColor('xterm') {
        node {
            stage('Checkout 🌍') {
                checkout scm
            }

            stage('Generate ⚙️') {
                sh './mvnw initialize -Pdependencies'
            }

            stage('Archive report 📰') {
                sh '''#!/bin/bash +x
set -euo pipefail
mkdir -p zipArchives
cd zipArchives

echo "Copy dependency reports into 'zipArchives'"

cp ../target/bonita-data-repository-dependencies.json .

echo "Copy done"
ls -lRh .
'''
                zip  zipFile: 'bonita-data-repository.zip',  dir: 'zipArchives', archive: true
            }
        }

    }
}