/*
 * global variables
 */

let DEBUG = true;
let processing = false;
let theme_config = {};

/*
 * document ready
 */

$(document).ready(function () {
  if (greeter_config.greeter.debug_mode && DEBUG) {
    showLogPanel();
  }

  for (let key in greeter_config.greeter) {
    debug(key + ': ' + greeter_config.greeter[key]);
  }

  loadThemeConfig();

  // Focus user input field on keydown
  document.body.addEventListener('keydown', inputUserEventHandler);

  $(window).load(function () {
    setBackground();
    getHostname();
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
        if (username == null) {
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
});

/*
 * functions
 */

function authenticate(e, username) {
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
  debug("authentication cancelled for " + $('#user').val());
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
  let submitTimeout = 2000;
  let submitButton = e.target;
  $('#authenticateButton').addClass("processing");
  $('#pass').prop('disabled', true);
  setTimeout(() => {
    debug("call: lightdm.respond(password)")
    lightdm.respond($('#pass').val());
  }, submitTimeout);
};

function sessionToggle(element) {
  debug('sessionToggle');
  let sessionText = $(element).text();
  let sessionID = $(element).attr('data-session-id');
  let username = $('#user').val();
  $(element).parents('.btn-group').find('.selected').attr('data-session-id', sessionID);
  $(element).parents('.btn-group').find('.selected').html(sessionText);
};

function handleAction(id) {
  debug("handleAction(" + id + ")");
  eval("lightdm." + id + "()");
};

function slideToPasswordArea(e) {
  debug('slideToPasswordArea()');
  document.body.removeEventListener('keydown', inputUserEventHandler);
  const content = document.querySelector('.content');
  const onTransitionEnd = function (e) {
    document.body.addEventListener('keydown', inputPassEventHandler);
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
  document.body.removeEventListener('keydown', inputPassEventHandler);
  const content = document.querySelector('.content');
  const onTransitionEnd = function (e) {
    document.body.addEventListener('keydown', inputUserEventHandler);
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
  switch (e.which) {
    case 27:
      debug('keydown: esc');
      $('#user').val('');
      document.body.focus();
      break;
    default:
      if (!$('#user').is(':focus')) {
        $('#user').focus();
        debug("set focus on #user");
      }
  }
}

function inputPassEventHandler(e) {
  switch (e.which) {
    case 27:
      debug('keydown: esc');
      $('#pass').val('');
      $('#user').val('');
      $('#user').focus();
      document.body.focus();
      $('.backButton').trigger('click');
      break;
    default:
      if (!$('#pass').is(':focus')) {
        $('#pass').focus();
        debug("set focus on #pass");
      }
  }
}

function debug(text) {
  if (DEBUG) {
    $('#debugArea').append(text);
    $('#debugArea').append('<br/>');
  }
}

function message(text) {
  if (DEBUG) {
    // $('#messageArea').append(text);
    // $('#messageArea').append('<br/>');
  }
}

function showLogPanel() {
  $("#debugPanel").show().css('display', 'flex');
  // $("#messagePanel").show().css('display', 'flex');
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

function getHostname() {
  let hostname = lightdm.hostname;
  let hostname_span = document.getElementById('hostname');
  $(hostname_span).append(hostname);
  $("#hostname-label").text(hostname);
  debug('hostname: ' + hostname);
}

function addActionButton(id) {
  if (eval("lightdm.can_" + id)) {
    let label = id.substr(0, 1).toUpperCase() + id.substr(1, id.length - 1);
    let id2;
    if (id == "shutdown") {
      id2 = "power-off"
    }
    if (id == "hibernate") {
      id2 = "asterisk"
    }
    if (id == "suspend") {
      id2 = "arrow-down"
    }
    if (id == "restart") {
      id2 = "refresh"
    }
    $("#actionsArea").append('\n<button type="button" class="btn btn-default ' + id +
        ' actionButton" data-toggle="tooltip" data-placement="top" title="' + label +
        '" data-container="body" onclick="handleAction(\'' + id +
        '\')"><i class="fa fa-' + id2 + '"></i></button>');
    debug('lightdm.can: ' + id);
  }
}

/*
 * Lightdm Callbacks
 */

function show_prompt(text) {
  debug("callback: show_prompt(): " + text);
}

function authentication_complete() {
  debug('callback: authentication_complete()');
  let username = lightdm.authentication_user;
  username = 'rdatest';
  let selectedSession = $('.selected').attr('data-session-id');
  if (lightdm.is_authenticated) {
    debug('authentication successful');
    setTimeout(() => {
      debug('call: lightdm.start_session(' + selectedSession + ')');
      lightdm.start_session(selectedSession);
    }, 2000);
  } else {

    debug('authentication failure: ' + username);
    cancelAuthentication();
    debug('call: lightdm.authenticate(' + username + ')');
    lightdm.authenticate(username);
  }
}

function show_message(text) {
  debug('callback: show_message(): ' + text)
  message(text);
}

function show_error(text) {
  debug('callback: show_error(): ' + text)
  show_message('error: ' + text);
}

/*
 * functions for UI initialisation
 */

function loadThemeConfig() {
  fetch('config.json').then(async function (res) {
    theme_config = await res.json();

    $('#panel').css(theme_config.styles.panel);
    $('.content-footer').css(theme_config.styles.contentFooter);
    $('.bg').css(theme_config.styles.background);
    $('#banner img').attr('src', `img/banners/${theme_config.banner}.png`);
    $('#logo img').attr('src', `img/banners/${theme_config.logo}.png`);

    addBackgroundButtons();
    addBackgroundButtonsHandler();
    addActionButtons();
    setTabIndex();
    showPanel();
  });
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
  // Add background buttons handler
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
