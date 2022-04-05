#!/usr/bin/env python3

import os
import json
import pprint
import subprocess
import collections

FORMATS = [ '.jpg', '.jpeg', '.png' ]
PATH_WALL = [ 'img/wallpapers', '/usr/share/backgrounds' ]
PATH_THUMB = 'img/thumbs'
SIZE = '100x56'

scriptpath = os.path.realpath(__file__)
dirpath = os.path.dirname(scriptpath)
abspath = os.path.abspath(dirpath)
os.chdir(abspath)

images = list()

for path in PATH_WALL:
    for root, directories, filenames in os.walk(path):
        for filename in filenames:
            filepath = os.path.join(root, filename)
            name, ext = os.path.splitext(filename)
            if ext in FORMATS:
                subprocess.call(['gm', 'convert',
                    '-size', SIZE,
                    filepath,
                    '-resize', SIZE,
                    '+profile', '*',
                    '/'.join([PATH_THUMB, filename])])
