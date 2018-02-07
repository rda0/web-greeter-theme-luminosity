export pkgname=lightdm-webkit-theme-luminos
export _pkgname=luminos
export srcdir=$(pwd)
mkdir -p /usr/share/lightdm-webkit/themes
cd /usr/share/lightdm-webkit/themes
if [ -d $_pkgname ] 
then
  echo "Removing old theme"
  rm -rf ${_pkgname}
fi
cp -dpr --no-preserve=ownership ${srcdir} ${_pkgname}
echo "Removing .git files"
cd ${_pkgname}
rm -rf .gitignore
echo "Removing dev files"
rm -rf node_modules
rm -rf tasks
rm -f package.json
rm -f yarn.lock
rm -f PKGBUILD