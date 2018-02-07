const minimist = require('minimist');
const execSync = require('child_process').execSync;
const fs = require('fs');
const path = require('path');

const configPath = path.resolve(__dirname, '../config.json');
const config = require(configPath);
const argv = minimist(process.argv.slice(2));


if (argv.task) {
  switch (argv.task) {
    case 'image':
      config.backgrounds = [];
      execSync('mogrify -resize 102x67 -gravity center -format jpg -quality 75 -path ./img/thumbs ./img/wallpapers/*.jpg');
      fs.readdirSync('./img/wallpapers/').forEach(file => {
        const name = path.parse(file).name;
        const thumbPath = path.relative(process.cwd(), path.resolve(process.cwd(), 'img/thumbs', file));
        const filepath = path.relative(process.cwd(), path.resolve(process.cwd(), 'img/wallpapers', file));
        const background = {};
        background.name = name;
        background.thumb = thumbPath;
        background.image = filepath;
        config.backgrounds.push(background);
      });
      fs.writeFileSync(configPath, JSON.stringify(config));
      break;
  }
}
