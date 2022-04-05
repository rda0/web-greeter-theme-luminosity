class Backgrounds {
  constructor() {
    this._localStorage = window.localStorage;
    this._defaultBackgroundArr = [
      "img/wallpapers/milky-way-robiei.jpg",
      "img/wallpapers/star-cloud-blue-red.jpg",
      "img/wallpapers/nathan-anderson-268995.jpg",
      "img/wallpapers/hugo-kemmel-289805.jpg",
      "img/wallpapers/jamison-mcandie-112376.jpg",
    ];
    this._backgroundImages = null;
    this._backgroundImagesDir = null;
    this._backgroundPath = "";
  }

  async _createBackgroundArray() {
    let images = await this._getImages();
    this._backgroundImages = this._defaultBackgroundArr.concat(images);
    return new Promise((resolve) => resolve());
  }

  _updateOnStartup() {
    this._backgroundPath =
      this._localStorage.getItem("defaultBackgroundImage") ||
      this._backgroundImages[0];
    this._updateBackgroundImages();
    this._addBackgroundButtonsHandler();
  }

  _updateBackgroundImages() {
    this._backgroundImages.forEach(function (file) {
      let background = {};
      background.image = file;
      background.thumb = 'img/thumbs/' + file.split(/(\\|\/)/g).pop();
      $('.bgs').append(`
            <a href="#" data-img="${background.image}" class="background">
              <img src="${background.thumb}" />
            </a>
          `);
    });
  }

  _addBackgroundButtonsHandler() {
  let backgroundButtons = $(".bg-switch .background");
  backgroundButtons.click(function (e) {
    e.preventDefault();
    backgroundButtons.removeClass("active");
    $(".bgs .background .default").first().removeClass('active');
    $(this).addClass("active");
    switchBackground($(this).data("img"));
  });
}

  _getImages(path) {
    this._backgroundImagesDir =
      greeter_config.branding.background_images_dir || "/usr/share/backgrounds";
    return new Promise((resolve) => {
      theme_utils.dirlist(
        path ? path : this._backgroundImagesDir,
        true,
        (result) => {
          resolve(result);
        }
      );
    });
  }

  async _init() {
    await this._createBackgroundArray();
    this._updateOnStartup();

    return new Promise((resolve) => resolve());
  }
}
