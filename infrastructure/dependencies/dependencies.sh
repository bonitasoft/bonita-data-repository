#!/bin/bash
set -euo pipefail

# Include the script:
. $(dirname "$0")/common.sh

usage() {
    launch_command=`basename ${0}`
    echo "==========================================================================================================="
    echo "This script create a new branch with dependencies updating"
    echo ""
    echo "USAGE"
    echo "- ${launch_command} --version=<version> ---source-folder=<-source-folder> \\"
    echo "    [--branch=<branch> --output-path =<output-path> --file-name=<file-name> --commit-message=<commit-message>]"
    echo "- ${launch_command} --help"
    echo ""
    echo "MANDATORY ARGUMENTS"
    echo "    --version                 The version where generate the dependencies report"
    echo "    --source-folder           The folder with dependencies files to parse"
    echo ""
    echo "OPTIONAL ARGUMENTS"
    echo "    --branch                  The new branch to create in order to generate the dependencies report (default: doc/add-bonita-data-repositories-dependencies)"
    echo "    --output-path             Folder to add generate dependencies file (default: bonita-doc/md)"
    echo "    --file-name               The name of generated file (default: bonita-data-repositories-dependencies.md)"
    echo "    --commit-message          The message of the commit"
    echo "    --help                    Display this help"
    echo "EXAMPLE"
    echo "./dependencies.sh --version=7.10 --source-folder=../../zipArchives"
    echo "==========================================================================================================="
    exit 1
}

############################################ main code #####################################"""
for i in "$@"; do
    case $i in
        --branch=*)
            BRANCH="${i#*=}"
        shift
        ;;
        --version=*)
            VERSION="${i#*=}"
        shift
        ;;
        --file-name=*)
            FILENAME="${i#*=}"
        shift
        ;;
        --output-path=*)
            OUTPUT_PATH="${i#*=}"
        shift
        ;;
        --commit-message=*)
            COMMIT_MESSAGE="${i#*=}"
        shift
        ;;
        --source-folder=*)
            SOURCE_FOLDER="${i#*=}"
        shift
        ;;
        --help)
            usage
            exit 1
        ;;
    esac
done

BRANCH=${BRANCH:=doc/add-bonita-data-repositories-dependencies}
OUTPUT_PATH=${OUTPUT_PATH:=./modules/ROOT/pages}
COMMIT_MESSAGE=${COMMIT_MESSAGE:=chore(dependencies): Adding Bonita data-repo dependencies ${VERSION}}
FILENAME=${FILENAME:=bonita-data-repositories-dependencies.adoc}
SCRIPT_DIR=$(dirname "$0")
BASEDIR=$(dirname $(readlink -f "$0"))/../..


if [ -z "${VERSION}" ]; then echo "ERROR version is needed"; usage; fi
if [ -z "${SOURCE_FOLDER}" ]; then echo "ERROR source-folder is needed"; usage; fi

prepare_directory "bonita-doc"
git_clone_single_branch "bonita-doc" ${VERSION}
pushd bonita-doc

### Create new branch
git checkout -b ${BRANCH}

OUTPUT_FILE="${OUTPUT_PATH}/${FILENAME}"

# Create file if not exist
if [ ! -f ${OUTPUT_FILE} ]; then
    touch ${OUTPUT_FILE}
fi

FOLDER=${BASEDIR}/${SOURCE_FOLDER}

node ../${SCRIPT_DIR}/node_modules/@bonitasoft/dependency-list-to-markdown/src/generateMarkdownContent.js --folder=${FOLDER} --outputFile ${OUTPUT_FILE} --header="Bonita Data-repository dependencies ${VERSION}" --description="List all dependencies uses for Bonita Data-repository" --frontend

#Commit & Push
if [ -z "$(git status --porcelain)" ]; then
  echo "No changes in dependencies, nothing to commit."
else
  git add ${OUTPUT_FILE}
  git commit -m "${COMMIT_MESSAGE}"
  git push origin ${BRANCH}
fi

popd
