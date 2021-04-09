#!/usr/bin/env bash
set -euo pipefail

usage() {
    launch_command=`basename ${0}`
    echo "==========================================================================================================="
    echo "This script create a pull request based on <pr-base-branch-name>"
    echo ""
    echo "USAGE"
    echo "- ${launch_command} --repository=<repository> --github-username=<username> --github-api-token=<token> \\"
    echo "    --pr-title=<title> --pr-base-branch-name=<branch_name> --pr-head-branch-name=<branch_name> [--pr-labels=<labels>]"
    echo "- ${launch_command} --help"
    echo ""
    echo "MANDATORY ARGUMENTS"
    echo "    --repository              The Bonita repository where create the pull request"
    echo "    --github-username         The Github username"
    echo "    --github-api-token        The Github authorization token to be able to create the Pull Request"
    echo "    --pr-title                The title of the pull request"
    echo "    --pr-base-branch-name     The base branch of the pull request"
    echo "    --pr-head-branch-name     The head branch of the pull request"
    echo ""
    echo "OPTIONAL ARGUMENTS"
    echo "    --help                    Display this help"
    echo "    --pr-labels               The labels to add to the pull request"
    echo "==========================================================================================================="
    exit 1
}


# $1 bonita repository
# $2 github username
# $3 github API Key
# $4 pr's title
# $5 pr's base
# $6 pr's head
pull_request() {
    url="https://api.github.com/repos/bonitasoft/${1}/pulls"
    data=$( jq --indent 3 -n \
        --arg title "${4}" \
        --arg base "${5}" \
        --arg head "${6}" \
        '{ head: $head, base: $base, title: $title, draft: true }' )
    header_content='Content-type:application/vnd.github.v3+json'
    header_accept='Accept:application/vnd.github.shadow-cat-preview+json'

    echo "User:token = ${2}:${3}"

    curl --silent --request POST --user "${2}:${3}"  --url ${url} --header ${header_content} --header ${header_accept} --data "${data}" \
        | jq ".number"
}

# $1 bonita repository
# $2 github username
# $3 github API Key
# $4 pr's identifier
# $5 pr's labels
labels() {
    url="https://api.github.com/repos/bonitasoft/${1}/issues/${4}/labels"
    data=$( jq --indent 3 -n \
        --arg labels "${5}" \
        '{ labels: [$labels] }' )

# To use emoji in label name
    header_content='Content-type:application/json'
    header_accept='Accept:application/vnd.github.symmetra-preview+json'

    curl --silent --request POST --user "${2}:${3}" --url ${url} --header ${header_content} --header ${header_accept} --data "${data}"
}


############################################ main code #####################################"""
PR_LABELS=

for i in "$@"; do
    case $i in
        --repository=*)
            REPOSITORY="${i#*=}"
        shift
        ;;
        --github-username=*)
            GITHUB_USERNAME="${i#*=}"
        shift
        ;;
        --github-api-token=*)
            GITHUB_API_TOKEN="${i#*=}"
        shift
        ;;
        --pr-title=*)
            PR_TITLE="${i#*=}"
        shift
        ;;
        --pr-base-branch-name=*)
            PR_BASE_BRANCH_NAME="${i#*=}"
        shift
        ;;
        --pr-head-branch-name=*)
            PR_HEAD_BRANCH_NAME="${i#*=}"
        shift
        ;;
        --pr-labels=*)
            PR_LABELS="${i#*=}"
        shift
        ;;
        --help)
            usage
            exit 1
        ;;
    esac
done

if [ -z "${REPOSITORY}" ]; then echo "ERROR Bonita repository is needed"; usage; fi
if [ -z "${GITHUB_USERNAME}" ]; then echo "ERROR github username is needed"; usage; fi
if [ -z "${GITHUB_API_TOKEN}" ]; then echo "ERROR github API token is needed"; usage; fi
if [ -z "${PR_TITLE}" ]; then echo "ERROR pr's title is needed"; usage; fi
if [ -z "${PR_BASE_BRANCH_NAME}" ]; then echo "ERROR pr's base branch name is needed"; usage; fi
if [ -z "${PR_HEAD_BRANCH_NAME}" ]; then echo "ERROR pr's head branch name is needed"; usage; fi


echo "Create new pull request from ${PR_BASE_BRANCH_NAME} to ${PR_HEAD_BRANCH_NAME}"
prId=$(pull_request "${REPOSITORY}" "${GITHUB_USERNAME}" "${GITHUB_API_TOKEN}" "${PR_TITLE}" "${PR_BASE_BRANCH_NAME}" "${PR_HEAD_BRANCH_NAME}")
echo "prId: ${prId}"

if [[ -n "${PR_LABELS}" ]]
then
    echo "Add labels ${PR_LABELS} on pull request ${prId}"
    labels "${REPOSITORY}" "${GITHUB_USERNAME}" "${GITHUB_API_TOKEN}" "${prId}" "${PR_LABELS}"
fi
