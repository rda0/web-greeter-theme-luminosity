# lightdm-webkit-theme-luminos


## Overview

Customizable LightDM Webkit Greeter Theme based on official LightDM Webkit Greeter Theme of Antergos Linux

Original can be [found here][1]. All credit goes to the great people who 
created, run, and maintain [Antergos][2].

## Screenshots
<img src="img/Screenshot1.png" alt="screenshot1" />
<img src="img/Screenshot2.png" alt="screenshot2" />

## Prerequisites

* lightdm
* lightdm-webkit2-greeter

Enable `lightdm-webkit2-greeter` by editing `/etc/lightdm/lightdm.conf` and setting `greeter-session` property to `lightdm-webkit2-greeter` :

```
[SeatDefaults]
#greeter-session=lightdm-gtk-greeter
greeter-session=lightdm-webkit2-greeter
user-session=your-session (gnome,cinnamon,xfce...)

```

# Installation

Can be installed through the [AUR][6].

To select luminos as default theme just change the `webkit-theme=`  in `/etc/lightdm/lightdm-webkit2-greeeter.conf`
to `luminos`.

# Uninstallation

To uninstall, simply restore the `greeter-session` property of the `/etc/lightdm/lightdm.conf` file and restart your computer (or at least lightdm).

You may also want to :
* Remove the folder `luminos` which was created in `/usr/share/lightdm-webkit/themes/`
* Restore the `webkit-theme` property of the `/etc/lightdm/lightdm-webkit-greeter.conf` file

# User icons management

To change users icons, there are two options :

* Create a `.face` file in the user's home folder in which you put a `jpg` or `png` resource

Or 

* Create a resource named with the user's login in `/var/lib/AccountsService/icons/`
* Edit `/var/lib/AccountsService/users/<userLogin>` and add a property `Icon` targeting the icon resource you just created

Read more at the [ArchWiki LightDM][3] page.
