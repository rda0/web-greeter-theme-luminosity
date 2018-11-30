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

let DEBUG = true;
let processing = false;
let theme_config = {};
let greeter_error = false;

/*
 * document ready
 */

$(document).ready(function () {
  /*let random = Math.floor(Math.random() * 2);
  debug('random: ' + random);

  if (random == 1) {
    delete lightdm;
    delete greeter_config;
    delete theme_utils;
  }*/

  if ('object' !== typeof(lightdm)) {
    greeter_error = true;
    debug('lightdm: not an object');
  }

  if ('object' !== typeof(greeter_config)) {
    greeter_error = true;
    debug('greeter_config: not an object');
  }

  if ('object' !== typeof(theme_utils)) {
    greeter_error = true;
    debug('theme_utils: not an object');
  }

  if ('object' !== typeof(localStorage)) {
    greeter_error = true;
    debug('localStorage: not an object');
  }

  if (greeter_error) {
    console.error('Theme: greeter error');
    //console.error('Theme: greeter error, trying to reload in 5s...');
    showErrorPanel();
    /*setTimeout(function() {
      $(document.location.reload(true));
    }, (5 * 1000));*/
  } else {
    if (greeter_config.greeter.debug_mode && DEBUG) {
      showDebugPanel();
    }

    for (let key in greeter_config.greeter) {
      debug(key + ': ' + greeter_config.greeter[key]);
    }

    loadThemeConfigLocal();

    // Focus user input field on keydown
    document.body.addEventListener('keydown', inputUserEventHandler);

    $(window).on('load', function () {
      debug('window.on(load)');
      setBackground();
      setHostname();
      getSessionList();
    });

    // Events

    // Username submit
    $('#authenticateButton').click(function (e) {
      e.preventDefault();
      if (!processing) {
        debug('authenticateButton.click()');
        processing = true;
        submitPassword(e);
      }
    });

    // Username submit when enter key is pressed
    $('#user').keydown(function (e) {
      switch (e.which) {
        case 13:
          let username = $('#user').val();
          if (username == '') {
            debug('username: null!');
          } else {
            debug('username: ' + username)
            slideToPasswordArea(e);
            authenticate(event, username);
          }
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
      slideToUsernameArea(event);
      $('#user').prop('disabled', false);
      $('#user').val('');
      $('#session-list .selected').html('')
      cancelAuthentication(event);
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
});

/*
 * functions
 */

function authenticate(e, username) {
  debug('authenticate(' + username + ')');
  $("#user-login-name").text(username);
  $('#user').prop('disabled', true);
  let userSession = getLastUserSession(username);
  debug('userSession: ' + userSession);
  let userSessionEl = "#sessions [data-session-id=" + userSession + "]";
  let userSessionName = $(userSessionEl).html();
  debug('userSessionName: ' + userSessionName);
  $('#session-list .selected').html(userSessionName);
  $('#session-list .selected').attr('data-session-id', userSession);
  debug('call: lightdm.start_authentication(' + username + ')');
  lightdm.start_authentication(username);
}

function cancelAuthentication(e) {
  debug('cancelAuthentication()');
  $('#pass').prop('disabled', false);
  $('#pass').val('');
  $('#pass').focus();
  document.body.focus();
  debug("call: lightdm.cancel_authentication()");
  lightdm.cancel_authentication();
  $('#authenticateButton').removeClass('processing');
  processing = false;
};

function submitPassword(e) {
  debug('submitPassword()');
  let submitTimeout = 600;
  let submitButton = e.target;
  $('#authenticateButton').addClass("processing");
  $('#pass').prop('disabled', true);
  setTimeout(() => {
    debug("call: lightdm.respond(password)")
    lightdm.respond($('#pass').val());
  }, submitTimeout);
};

function sessionToggle(element) {
  debug('sessionToggle()');
  let sessionText = $(element).text();
  let sessionID = $(element).attr('data-session-id');
  $(element).parents('.btn-group').find('.selected').attr('data-session-id', sessionID);
  $(element).parents('.btn-group').find('.selected').html(sessionText);
};

function handleAction(id) {
  let label = id.substr(0, 1).toUpperCase() + id.substr(1, id.length - 1);
  if ((id == 'shutdown') || (id == 'hibernate') || (id == 'suspend') || (id == 'restart')) {
    if (confirm(label + '?')) {
      debug('handleAction(' + id + ')');
      eval('lightdm.' + id + '()');
    }
  }
};

function slideToPasswordArea(e) {
  debug('slideToPasswordArea()');
  setTabIndexUsernameArea(false);
  document.body.removeEventListener('keydown', inputUserEventHandler);
  const content = document.querySelector('.content');
  const onTransitionEnd = function (e) {
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

function slideToUsernameArea(e) {
  debug('slideToUsernameArea()');
  setTabIndexPasswordArea(false);
  document.body.removeEventListener('keydown', inputPassEventHandler);
  const content = document.querySelector('.content');
  const onTransitionEnd = function (e) {
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

function debug(text) {
  if (DEBUG) {
    console.debug('Theme: ' + text);
    $('#debugArea').append(text);
    $('#debugArea').append('<br/>');
  }
}

function showErrorPanel() {
  $('#errorPanel').show();
  $('#errorPanel').fadeTo(400, 1);
}

function showDebugPanel() {
  $("#debugPanel").show().css('display', 'flex');
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
    debug('last session not found. using default: ' + lightdm.default_session)
    lastSession = lightdm.default_session;
  }
  
  debug(username + '\'s last session: ' + lastSession);
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
    debug('session: ' + session.key);
  }
}

function setHostname() {
  let hostname = lightdm.hostname;
  $("#hostname-value").text(hostname);
  debug('hostname: ' + hostname);
}

function setLockedSessions() {
  let first_locked_user = true;
  for (let i in lightdm.users) {
    if (lightdm.users[i].logged_in) {
      if (first_locked_user) {
        first_locked_user = false;
        $('#info-top-left').append('</br>\n<span id="active-sessions-label">' + theme_config.active_sessions_label + '</span>');
        $('#info-top-right').append('</br>\n<span id="active-sessions-value">');
      } else {
        $('#info-top-right').append(', ');
      }
      $('#info-top-right').append(lightdm.users[i].username);
    }
  }

  if (!first_locked_user) {
    $('#info-top-right').append('</span>');
    return true;
  }

  return false;
}

function setHeader(activeSessions) {
  if (activeSessions) {
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
      id2 = "sync-alt"
    }
    $("#actionsArea").append('\n<button type="button" class="btn btn-default ' + id +
        ' actionButton" data-toggle="tooltip" data-placement="top" title="' + label +
        '" data-container="body" onclick="handleAction(\'' + id +
        '\')"><i class="fas fa-' + id2 + '"></i></button>');
    debug('lightdm.can: ' + id);
  }
}

/*
 * Lightdm Callbacks
 */

function show_prompt(text, type) {
  debug('callback: show_prompt(' + type + '): ' + text);
}

function show_message(text, type) {
  debug('callback: show_message(' + type + '): ' + text);
}

function authentication_complete() {
  debug('callback: authentication_complete()');
  let username = lightdm.authentication_user;
  debug('lightdm.authentication_user: ' + username);
  let selectedSession = $('.selected').attr('data-session-id');
  debug('selectedSession: ' + selectedSession);
  if (lightdm.is_authenticated) {
    debug('authentication successful');
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
            debug('call: lightdm.start_session(' + selectedSession + ')');
            lightdm.start_session(selectedSession);
          }, 200);
        });
      }, 300); 
    });
  } else {
    debug('authentication failure: ' + username);
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
    debug('call: lightdm.authenticate(' + username + ')');
    lightdm.authenticate(username);
  }
}

function autologin_timer_expired() {
  debug('callback: autologin_timer_expired()');
}

/*
 * functions for UI initialisation
 */

function loadThemeConfigLocal() {
  debug('loadThemeConfigLocal()');
  fetch('config.json.local').then(async function (res) {
    theme_config = await res.json();
    loadBackgroundConfigLocal();
  }).catch(function(error) {
    debug('failed loading config.json.local: ' + error.message);
    loadThemeConfig();
  });
}

function loadThemeConfig() {
  debug('loadThemeConfig()');
  fetch('config.json').then(async function (res) {
    theme_config = await res.json();
    loadBackgroundConfigLocal();
  }).catch(function(error) {
    debug('failed loading config.json: ' + error.message);
    throw new Error('Theme error');
  });
}

function loadBackgroundConfigLocal() {
  debug('loadBackgroundConfigLocal()');
  fetch('background.json.local').then(async function (res) {
    bg_config = await res.json();
    theme_config.backgrounds = bg_config.backgrounds;
    applyConfig();
  }).catch(function(error) {
    debug('failed loading background.json.local: ' + error.message);
    loadBackgroundConfig();
  });
}

function loadBackgroundConfig() {
  debug('loadBackgroundConfig()');
  fetch('background.json').then(async function (res) {
    bg_config = await res.json();
    theme_config.backgrounds = bg_config.backgrounds;
    applyConfig();
  }).catch(function(error) {
    debug('failed loading background.json: ' + error.message);
    theme_config.backgrounds = [];
    applyConfig();
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
  showPanel();
}

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
