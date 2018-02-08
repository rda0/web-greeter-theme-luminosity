# Maintainer: Muhammad Sayuti <muhammad.sayuti94@gmail.com>

pkgname=lightdm-webkit-theme-luminos
_pkgname=luminos
pkgver=0.5.0
_bgver=0.6
pkgrel=1
pkgdesc="Customizable LightDM Webkit Greeter Theme"
arch=('any')
url="https://github.com/muhammadsayuti/lightdm-webkit-theme-luminos"
license=('GPLv2')
depends=('lightdm' 'lightdm-webkit2-greeter')
install=theme.install
source=("${pkgname}-${pkgver}.tar.gz::https://github.com/muhammadsayuti/${pkgname}/archive/${pkgver}.tar.gz"
        "http://antergos.com/antergos-wallpapers-${_bgver}.zip")
md5sums=('fd3885f57962eb3a6760b60fab87ed5d'
            'c996d26914e71897019c33854b0ae634')

build()
{
	cd ${srcdir}/${pkgname}-${pkgver}
      sed -i 's%/usr/share/%/usr/share/lightdm-webkit/themes/%g' index.html
}

package()
{
	cd ${pkgdir}
	mkdir -p usr/share/lightdm-webkit/themes
	cd usr/share/lightdm-webkit/themes
	cp -dpr --no-preserve=ownership ${srcdir}/${pkgname}-${pkgver} ${_pkgname}
	msg "Removing .git files"
	cd ${_pkgname}
	rm -rf .gitignore
      cp -dpr --no-preserve=ownership "${srcdir}/antergos-wallpapers-${_bgver}" wallpapers
}