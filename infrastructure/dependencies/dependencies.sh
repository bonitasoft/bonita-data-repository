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
    echo "    --file-name               The name of generated file"
    echo ""
    echo "OPTIONAL ARGUMENTS"
    echo "    --branch                  The new branch to create in order to generate the dependencies report (default: doc/add-bonita-data-repositories-dependencies)"
    echo "    --output-path             Folder to add generate dependencies file (default: ./modules/ROOT/pages)"
    echo "    --commit-message          The message of the commit"
    echo "    --help                    Display this help"
    echo "EXAMPLE"
    echo "./dependencies.sh --version=7.12 --source-folder=./target --file-name=bonita-data-repositories-dependencies.adoc"
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
SCRIPT_DIR=$(dirname "$0")
BASEDIR=$(dirname $(readlink -f "$0"))/../..

if [ -z "${GITHUB_USERNAME}" ]; then echo "ERROR GITHUB_USERNAME is needed"; usage; fi
if [ -z "${GITHUB_API_TOKEN}" ]; then echo "ERROR GITHUB_API_TOKEN is needed"; usage; fi

if [ -z "${VERSION}" ]; then echo "ERROR version is needed"; usage; fi
if [ -z "${SOURCE_FOLDER}" ]; then echo "ERROR source-folder is needed"; usage; fi
if [ -z "${FILENAME}" ]; then echo "ERROR file-name is needed"; usage; fi

prepare_directory "bonita-doc"
git_clone_single_branch "bonita-doc" "${VERSION}"
pushd bonita-doc

### Create new branch
git checkout -b "${BRANCH}"

SOURCE_FILE="${BASEDIR}/${SOURCE_FOLDER}/${FILENAME}"
OUTPUT_FILE="${OUTPUT_PATH}/${FILENAME}"
cp -f "${SOURCE_FILE}" "${OUTPUT_FILE}"

#Commit & Push
if [ -z "$(git status --porcelain)" ]; then
  echo "No changes in dependencies, nothing to commit."
else
  git add "${OUTPUT_FILE}"
  git commit -m "${COMMIT_MESSAGE}"
  echo "Push branch to bonita-doc."
  git push "https://${GITHUB_USERNAME}:${GITHUB_API_TOKEN}@github.com/bonitasoft/bonita-doc.git" ${BRANCH}
fi

popd
