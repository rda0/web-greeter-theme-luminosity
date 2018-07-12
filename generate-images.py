#!/usr/bin/env python3

import os
import json
import pprint
import subprocess
import collections

FORMATS = [ '.jpg', '.jpeg', '.png' ]
PATH_WALL = [ 'img/wallpapers', '/usr/share/backgrounds' ]
PATH_THUMB = 'img/thumbs'

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
                image = dict()
                image['name'] = name
                image['filename'] = filename
                image['filepath'] = filepath
                images.append(image)
                subprocess.call(['mogrify',
                    '-resize', '100x56',
                    '-gravity', 'center',
                    '-format', 'jpg',
                    '-quality', '100',
                    '-path', PATH_THUMB, filepath])

config = dict()
config['backgrounds'] = list()

for image in images:
    thumb = PATH_THUMB + '/' + image['name'] + '.jpg'
    background = dict()
    background['name'] = image['name']
    background['thumb'] = thumb
    background['image'] = image['filepath']
    config['backgrounds'].append(background)

with open('background.json.local', 'w') as outfile:
    json.dump(config, outfile, indent=2)
