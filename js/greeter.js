/*
 * Copyright © 2015 Antergos
 * Copyright © 2018 Sven Mäder
 *
 * greeter.js
 *
 * This file is part of web-greeter-theme-luminosity
 *
 * web-greeter-theme-luminosity is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License,
 * or any later version.
 *
 * web-greeter-theme-luminosity is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * The following additional terms are in effect as per Section 7 of the license:
 *
 * The preservation of all legal notices and author attributions in
 * the material or in the Appropriate Legal Notices displayed
 * by works containing it is required.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/*
 * global variables
 */

let processing = false;
let theme_config = {};

let THEME_CONFIG_DEFAULTS = {
  "username_area": {
    "title": "Authentication",
    "title_locked": "Authentication",
    "comment": "Enter your Account name to sign in",
    "comment_locked": "Enter your Account name to unlock / sign in"
  },
  "password_area": {
    "comment": "Please enter your Password"
  },
  "active_sessions_label": "Locked Sessions",
  "info_top": [],
  "info_bottom": [],
  "banner": "dphys",
  "logo": "ethz",
  "styles": {
    "panel": {
      "position": "absolute",
      "width": "450px",
      "top": "50%",
      "left": "50%",
      "transform": "translate(-50%, -50%)"
    },
    "content": {
      "height": "541px"
    },
    "panels_shadow": {
      "boxShadow": "0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.12), 0 1px 5px 0 rgba(0, 0, 0, 0.2)"
    },
    "panels_color": {
      "background": "rgba(0,0,0,.7)",
      "color": "#fff"
    },
    "status_panel": {
      "background": "rgba(143,0,17,.6)",
      "color": "#fff"
    },
    "status_panel_granted": {
      "background": "rgba(66,133,244,.6)"
    },
    "status_panel_granted_green": {
      "background": "rgba(66,244,95,.6)"
    },
    "status_panel_denied": {
      "background": "rgba(143,0,17,.6)"
    },
    "contentFooter": {
      "paddingTop": "0px"
    },
    "background": {
      "backgroundPosition": "center",
      "backgroundSize": "cover"
    }
  }
};

/*
 * theme config
 */

function loadThemeConfig() {
  if (greeter_config.branding['theme'] !== undefined && greeter_config.branding['theme'] !== null ) {
    theme_config = greeter_config.branding.theme;
    const entries = Object.entries(THEME_CONFIG_DEFAULTS);
    for (const [key, value] of entries) {
      if (!theme_config.hasOwnProperty(key)) {
        theme_config[key] = value;
      }
    }
  } else {
    theme_config = THEME_CONFIG_DEFAULTS;
  }
}

/*
 * functions
 */

function sessionToggle(element) {
  let sessionText = $(element).text();
  let sessionID = $(element).attr('data-session-id');
  $(element).parents('.btn-group').find('.selected').attr('data-session-id', sessionID);
  $(element).parents('.btn-group').find('.selected').html(sessionText);
};

function handleAction(id) {
  let label = id.substr(0, 1).toUpperCase() + id.substr(1, id.length - 1);
  if ((id == 'shutdown') || (id == 'hibernate') || (id == 'suspend') || (id == 'restart')) {
    if (confirm(label + '?')) {
      eval('lightdm.' + id + '()');
    }
  }
};

function slideToPasswordArea() {
  setTabIndexUsernameArea(false);
  document.body.removeEventListener('keydown', inputUserEventHandler);
  const content = document.querySelector('.content');
  const onTransitionEnd = function () {
    document.body.addEventListener('keydown', inputPassEventHandler);
    setTabIndexPasswordArea(true);
    document.body.focus();
    content.removeEventListener('transitionend', onTransitionEnd);
  };
  content.addEventListener('transitionend', onTransitionEnd);

  $('.content').css({
    marginLeft: '-450px'
  });
  $('#actionsArea').fadeOut(125, function() {
    $('#backArea').fadeIn(125);
  });
}

function slideToUsernameArea() {
  setTabIndexPasswordArea(false);
  document.body.removeEventListener('keydown', inputPassEventHandler);
  const content = document.querySelector('.content');
  const onTransitionEnd = function () {
    document.body.addEventListener('keydown', inputUserEventHandler);
    setTabIndexUsernameArea(true);
    $('#user').focus();
    document.body.focus();
    content.removeEventListener('transitionend', onTransitionEnd);
  };
  content.addEventListener('transitionend', onTransitionEnd);

  $('.content').css({
    marginLeft: '0px'
  });
  $('#backArea').fadeOut(125, function() {
    $('#actionsArea').fadeIn(125);
  });
}

function inputUserEventHandler(e) {
  if (!ignoreCharacter(e.which)) {
    switch (e.which) {
      case 27:
        $('#user').val('');
        document.body.focus();
        break;
      default:
        if (!$('#user').is(':focus')) {
          $('#user').focus();
        }
    }
  }
}

function inputPassEventHandler(e) {
  if (!ignoreCharacter(e.which)) {
    switch (e.which) {
      case 27:
        $('#pass').val('');
        $('#user').val('');
        $('.backButton').trigger('click');
        break;
      default:
        if (!$('#pass').is(':focus')) {
          $('#pass').focus();
        }
    }
  }
}

function ignoreCharacter(character) {
  switch (character) {
    case 9:
    case 13:
    case 17:
    case 18:
    case 19:
    case 33:
    case 34:
    case 112:
    case 113:
    case 114:
    case 115:
    case 116:
    case 117:
    case 118:
    case 119:
    case 120:
    case 121:
    case 122:
    case 123:
    case 144:
    case 145:
      return true;
    default:
      return false;
  }
}

function showErrorPanel() {
  $('#errorPanel').show();
  $('#errorPanel').fadeTo(400, 1);
}

function showPanel() {
  $("#bg").addClass("in");
  setTimeout(() => {
    $("#panel").addClass("in");
  }, 1000);
}

function getLastUserSession(username) {
  let lastSession = null;

  for (let i in lightdm.users) {
    if (lightdm.users[i].username == username) {
      lastSession = lightdm.users[i].session;
    }
  }

  if (!lastSession) {
    lastSession = lightdm.default_session;
  }

  return lastSession;
}

function getSessionList() {
  let buttonGroup = $('#sessions');
  for (let i in lightdm.sessions) {
    let session = lightdm.sessions[i];
    let className = session.name.replace(/ /g, '');
    let button = '\n<li><a href="#" data-session-id="' +
        session.key + '" onclick="sessionToggle(this)" class="' +
        className + '">' + session.name + '</a></li>';

    $(buttonGroup).append(button);
  }
}

function setHostname() {
  let hostname = lightdm.hostname;
  $("#hostname-value").text(hostname);
}

function setLockedSessions() {
  let locked_sessions = [];
  for (let i in lightdm.users) {
    if (lightdm.users[i].logged_in) {
      if (locked_sessions.length == 0) {
        $('#info-top-left').append('</br>\n<span id="active-sessions-label">' + theme_config.active_sessions_label + '</span>');
        $('#info-top-right').append('</br>\n<span id="active-sessions-value">');
      } else {
        $('#info-top-right').append(', ');
      }
      $('#info-top-right').append(lightdm.users[i].username);
      locked_sessions.push(lightdm.users[i].username);
    }
  }

  if (locked_sessions.length != 0) {
    $('#info-top-right').append('</span>');
  }

  return locked_sessions;
}

function setHeader(activeSessions) {
  if (activeSessions.length != 0) {
    $('#username-area-title').text(theme_config.username_area.title_locked);
    $('#username-area-comment').text(theme_config.username_area.comment_locked);
  } else {
    $('#username-area-title').text(theme_config.username_area.title);
    $('#username-area-comment').text(theme_config.username_area.comment);
  }
  $('#password-area-comment').text(theme_config.password_area.comment);
}

function setInfoBlock() {
  theme_config.info_top.forEach(function (entry) {
    $('#info-top-left').append('<br/>\n<span>' + entry.label + '</span>');
    $('#info-top-right').append('<br/>\n<span>' + entry.value + '</span>');
  });
  let first_entry = true;
  theme_config.info_bottom.forEach(function (entry) {
    if (first_entry) {
      $('#info-bottom-left').append('\n<span>' + entry.label + '</span>');
      $('#info-bottom-right').append('\n<span>' + entry.value + '</span>');
      first_entry = false;
    } else {
      $('#info-bottom-left').append('<br/>\n<span>' + entry.label + '</span>');
      $('#info-bottom-right').append('<br/>\n<span>' + entry.value + '</span>');
    }
  });
}

function addActionButton(id) {
  if (eval("lightdm.can_" + id)) {
    let label = id.substr(0, 1).toUpperCase() + id.substr(1, id.length - 1);
    let id2;
    if (id == "shutdown") {
      id2 = "power-off"
    }
    if (id == "hibernate") {
      id2 = "moon"
    }
    if (id == "suspend") {
      id2 = "arrow-down"
    }
    if (id == "restart") {
      id2 = "undo-alt"
    }
    $("#actionsArea").append('\n<button type="button" class="btn btn-default ' + id +
        ' actionButton" data-toggle="tooltip" data-placement="top" title="' + label +
        '" data-container="body" onclick="handleAction(\'' + id +
        '\')"><i class="fas fa-' + id2 + '"></i></button>');
  }
}

/*
 * functions for UI initialisation
 */

function addBackgroundButtons() {
  theme_config.backgrounds.forEach(function (background) {
    $('.bgs').append(`
          <a href="#" data-img="${background.image}" class="background">
            <img src="${background.thumb}" />
          </a>
        `);
  });
}

function addBackgroundButtonsHandler() {
  let backgroundButtons = $(".bg-switch .background");
  backgroundButtons.click(function (e) {
    e.preventDefault();
    backgroundButtons.removeClass("active");
    $(".bgs .background .default").first().removeClass('active');
    $(this).addClass("active");
    switchBackground($(this).data("img"));
  });
}

function addActionButtons() {
  addActionButton("shutdown");
  addActionButton("hibernate");
  addActionButton("suspend");
  addActionButton("restart");
}

function setTabIndex() {
  // Set tabindex = -1 on all alements
  $('*').each(function () {
    $(this).attr('tabindex', -1);
  });

  setTabIndexUsernameArea(true);
}

function setTabIndexUsernameArea(active) {
  if (active) {
    $('#user').attr('tabindex', 1);
    $('.shutdown').attr('tabindex', 2);
    $('.hibernate').attr('tabindex', 3);
    $('.suspend').attr('tabindex', 4);
    $('.restart').attr('tabindex', 5);
  } else {
    $('#user').attr('tabindex', -1);
    $('.shutdown').attr('tabindex', -1);
    $('.hibernate').attr('tabindex', -1);
    $('.suspend').attr('tabindex', -1);
    $('.restart').attr('tabindex', -1);
  }
}

function setTabIndexPasswordArea(active) {
  if (active) {
    $('#pass').attr('tabindex', 1);
    $('#session-button').attr('tabindex', 2);
    $('.backButton').attr('tabindex', 3);
  } else {
    $('#pass').attr('tabindex', -1);
    $('#session-button').attr('tabindex', -1);
    $('.backButton').attr('tabindex', -1);
  }
}

function switchBackground(background) {
  if (background == 'default') {
    localStorage.setItem("bgdefault", '1');
    setDefaultBackground();
  } else {
    let backgroundUrl = "url('" + background + "')";
    localStorage.setItem("bgdefault", '0');
    $('.bg').fadeTo('slow', 0.3, function () {
      $(".bg").css(Object.assign(theme_config.styles.background, {
        "background-image": backgroundUrl,
      }));
    }).fadeTo('slow', 1);
    localStorage.setItem("bgsaved", backgroundUrl)
  }
}

function setBackground() {
  if (localStorage.getItem("bgdefault") === null && (localStorage.getItem("bgsaved") === null)) {
    localStorage.setItem("bgdefault", "1");
  }

  if ((localStorage.getItem("bgsaved") !== null) && (localStorage.getItem("bgdefault") === '0')) {
    $('.bg').fadeTo('slow', 0.3, function () {
      $(".bg").css(Object.assign((theme_config && theme_config.styles) ? theme_config.styles.background : {}, {
        "background-image": localStorage.bgsaved
      }));
    }).fadeTo('slow', 1);
  } else {
    setDefaultBackground();
  }
}

function setDefaultBackground() {
  localStorage.setItem("bgsaved", 'img/default-bg.jpg');
  $('.bg').fadeTo('slow', 0.3, function () {
    $(".bg").css(Object.assign(theme_config.styles.background, {
      "background-image": "url('img/default-bg.jpg')"
    }));
  }).fadeTo('slow', 1);
}

function addEvents() {
  // Focus user input field on keydown
  document.body.addEventListener('keydown', inputUserEventHandler);

  // Username submit
  $('#authenticateButton').click(function (e) {
    e.preventDefault();
    if (!processing) {
      processing = true;
      submitPassword();
    }
  });

  // Username submit when enter key is pressed
  $('#user').keydown(function (e) {
    switch (e.which) {
      case 13:
        submitUsername();
        break;
    }
  });

  // Password submit when enter key is pressed
  $('#pass').keydown(function (e) {
    switch (e.which) {
      case 13:
        $('#authenticateButton').trigger('click');
        break;
    }
  });

  // Cancel authentication
  $(".backButton").click(function (e) {
    slideToUsernameArea();
    $('#user').prop('disabled', false);
    $('#user').val('');
    $('#session-list .selected').html('')
    cancelAuthentication();
  });

  // Open background panel
  $("#bg-switch-toggle").click(function (e) {
    e.preventDefault();
    $("#bg-switch-wrapper").toggleClass("active");
    $(this).hide();
    $("#bg-switch-close").show();
  });

  // Close background panel
  $("#bg-switch-close").click(function (e) {
    e.preventDefault();
    $("#bg-switch-wrapper").toggleClass("active");
    $(this).hide();
    $("#bg-switch-toggle").show();
  });

  // Input focus transition
  $(".input input").focus(function () {
    $(this).parent(".input").each(function () {
      $("label", this).css({
        "line-height": "16px",
        "font-size": "16px",
        "top": "0px"
      })
      $(".spin", this).css({
        "width": "calc(100% - 80px)"
      })
    });
  }).blur(function () {
    $(".spin").css({
      "width": "0px"
    })
    if ($(this).val() == "") {
      $(this).parent(".input").each(function () {
        $("label", this).css({
          "line-height": "60px",
          "font-size": "20px",
          "top": "10px"
        })
      });
    }
  });
}

function applyConfig() {
  $('#panel').css(theme_config.styles.panel);
  $('.panels').css(theme_config.styles.panels_color);
  $('.panels').css(theme_config.styles.panels_shadow);
  $('.content').css(theme_config.styles.content);
  $('#statusPanel').css(theme_config.styles.panels_shadow);
  $('#statusPanel').css(theme_config.styles.status_panel);
  $('.content-footer').css(theme_config.styles.contentFooter);
  $('.bg').css(theme_config.styles.background);
  $('#banner img').attr('src', `img/banners/${theme_config.banner}.png`);
  $('#logo img').attr('src', `img/banners/${theme_config.logo}.png`);

  addBackgroundButtons();
  addBackgroundButtonsHandler();
  addActionButtons();
  activeSessions = setLockedSessions();
  setHeader(activeSessions);
  setInfoBlock();
  setTabIndex();
  setBackground();
  setHostname();
  getSessionList();
  showPanel();
  addEvents();
  autoSubmitUsername(activeSessions);
}

/*
 * Lightdm Callbacks
 */

function autologin_timer_expired() {
}

window.authentication_complete = function() {
  let username = lightdm.authentication_user;
  let selectedSession = $('.selected').attr('data-session-id');
  if (lightdm.is_authenticated) {
    $('#statusMessage').html('ACCESS GRANTED');
    $('#unlocked').show();
    $('#locked').hide();
    $('#statusPanel').css(theme_config.styles.status_panel_granted);
    $('#statusPanel').show();
    $('#statusPanel').fadeTo(200, 1, function () {
      setTimeout(() => {
        $('#statusPanel').fadeTo(200, 0, function () {
          $('#statusPanel').hide();
          setTimeout(() => {
            lightdm.start_session(selectedSession);
          }, 200);
        });
      }, 300);
    });
  } else {
    cancelAuthentication();
    $('#statusMessage').html('ACCESS DENIED');
    $('#locked').show();
    $('#unlocked').hide();
    $('#statusPanel').css(theme_config.styles.status_panel_denied);
    $('#statusPanel').show();
    $('#statusPanel').fadeTo(400, 1, function () {
      setTimeout(() => {
        $('#statusPanel').fadeTo(400, 0, function () {
          $('#statusPanel').hide();
        });
      }, 1000);
    });
    //lightdm.authenticate(username);
  }
};

/*
 * greeter authentication
 */

function authenticate(username) {
  $("#user-login-name").text(username);
  $('#user').prop('disabled', true);
  let userSession = getLastUserSession(username);
  let userSessionEl = "#sessions [data-session-id=" + userSession + "]";
  let userSessionName = $(userSessionEl).html();
  $('#session-list .selected').html(userSessionName);
  $('#session-list .selected').attr('data-session-id', userSession);
}

function cancelAuthentication() {
  $('#pass').prop('disabled', false);
  $('#pass').val('');
  $('#pass').focus();
  document.body.focus();
  lightdm.cancel_authentication();
  $('#authenticateButton').removeClass('processing');
  processing = false;
};

function submitPassword() {
  let submitTimeout = 1000;
  $('#authenticateButton').addClass("processing");
  $('#pass').prop('disabled', true);
  let username = $('#user').val();
  //lightdm.start_authentication(username);
  lightdm.authenticate(username);
  setTimeout(() => {
    lightdm.respond($('#pass').val());
  }, submitTimeout);
};

function autoSubmitUsername(activeSessions) {
  if (activeSessions.length == 1) {
    $('#user').val(activeSessions[0]);
    submitUsername();
  }
}

function submitUsername() {
  let username = $('#user').val();
  if (username == '') {
  } else {
    slideToPasswordArea();
    authenticate(username);
  }
}

/*
 * greeter ready
 */

function initGreeter() {
  theme_config = THEME_CONFIG_DEFAULTS;
  theme_config.backgrounds = [];
  lightdm.authentication_complete.connect(authentication_complete);
  lightdm.autologin_timer_expired.connect(autologin_timer_expired);
  loadThemeConfig();
  applyConfig();
}

window.addEventListener("GreeterReady", initGreeter);

