#!/bin/bash

TEMP=/tmp/st-temp
PACKAGE=package.json

function bump() {
  local version="$1"
  echo "Bumping version to v$version"

  sed "3s/: \".*\"/: \"${version}\"/" "$PACKAGE" > "$TEMP"
  mv "$TEMP" "$PACKAGE"

  npm run build

  git add $PACKAGE dist
  git commit -m "$version"
  git tag "v$version"

  git --no-pager show
  echo "Tag v$version ready to be published!"
}

if [[ $# -eq 1 ]]; then
  version="$1"
  read -p "Bump to version $version?" yn
  case $yn in
    [Yy]* ) bump "$version";;
    [Nn]* ) exit;;
    * ) echo "Please answer yes or no.";;
  esac
fi
