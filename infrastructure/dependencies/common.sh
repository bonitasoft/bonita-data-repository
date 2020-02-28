#!/bin/bash
set -euo pipefail

discrete_echo() {
    echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
    echo "$1"
    echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
}

merge() {
    FROM=$1
    INTO=$2
    discrete_echo "Merging branch '${FROM}' into '${INTO}'"

    git checkout ${INTO} && git pull
    git merge origin/${FROM} -m "Merge '${FROM}' into '${INTO}'"
    git push origin ${INTO}

    echo "Merge completed"
}

prepare_directory() {
    dir=$1
    if [ -d $dir ]; then
        rm -rf $dir
    fi
    mkdir -pv $dir
}

git_clone() {
    git clone "https://github.com/bonitasoft/${1}.git"
}

# $1 repository
# $2 branch
git_clone_single_branch() {
    git clone --single-branch -b ${2} "https://github.com/bonitasoft/${1}.git" --depth 1
}

pushd() {
  command pushd $* > /dev/null
}

popd() {
  command popd $* > /dev/null
}
