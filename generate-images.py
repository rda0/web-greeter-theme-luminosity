#!/usr/bin/env python3

import os
import json
import pprint
import subprocess
import collections
from ruamel.yaml import YAML

FORMATS = [ '.jpg', '.jpeg', '.png' ]
PATH_THUMB = 'img/thumbs'
PATH_CONFIG = '/etc/lightdm/web-greeter.yml'
SIZE = '100x56'

yaml = YAML(typ="rt")
paths = [ 'img/wallpapers' ]

def get_config(fpath):
    """Read yaml from file"""
    with open(fpath) as f:
        try:
            return yaml.load(f)
        except Exception as e:
            print(f"{Y}Warning: could not parse yaml file: {fpath}{A}")
            print(f"{Y}Exception: {e}{A}")
            return None

config = get_config(PATH_CONFIG)
if config and 'branding' in config and 'background_images_dir' in config['branding']:
    path = config['branding']['background_images_dir']
    if path:
        paths.append(path)

scriptpath = os.path.realpath(__file__)
dirpath = os.path.dirname(scriptpath)
abspath = os.path.abspath(dirpath)
os.chdir(abspath)

for path in paths:
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
