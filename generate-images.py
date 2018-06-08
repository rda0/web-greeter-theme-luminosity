#!/usr/bin/env python3

import os
import json
import pprint
import subprocess
import collections

PATH_WALL = 'img/wallpapers'
PATH_THUMB = 'img/thumbs'

with open('config.json') as config_file:
    config = json.load(config_file, object_pairs_hook=collections.OrderedDict)

pprint.pprint(config)

subprocess.call(['mogrify',
                 '-resize', '100x56',
                 '-gravity', 'center',
                 '-format', 'jpg',
                 '-quality', '100',
                 '-path', PATH_THUMB, PATH_WALL + '/*.jpg'])

config['backgrounds'] = list()

for image in os.listdir(PATH_WALL):
    if image.endswith(".jpg"):
        print(image)
        name = image.split('.jpg', maxsplit=1)
        print(name[0])
        thumb = PATH_THUMB + '/' + image
        wall = PATH_WALL + '/' + image
        background = dict()
        background['name'] = name
        background['thumb'] = thumb
        background['image'] = image
        config['backgrounds'].append(background)

with open('config2.json', 'w') as outfile:
    json.dump(config, outfile, indent=2)
