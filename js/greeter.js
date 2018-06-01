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
  if (DEBUG) {
    showLog();
  }

  loadThemeConfig();

  // Focus user input field on keydown
  document.body.addEventListener('keydown', inputUserEventHandler);

  $(window).load(function () {
    setBackground();
    getHostname();
    getSessionList();
  });

  // Set tabindex = -1 on all alements
  $('*').each(function () {
    $(this).attr('tabindex', -1);
  });

  // Events

  // Username submit
  $('#authenticateButton').click(function (e) {
    e.preventDefault();
    if (!processing) {
      log('authenticateButton.click()');
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
          log('username: null!');
        } else {
          log('username: ' + username)
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
  log('userSession: ' + userSession);
  let userSessionEl = "#sessions [data-session-id=" + userSession + "]";
  let userSessionName = $(userSessionEl).html();
  log('userSessionName: ' + userSessionName);
  $('#session-list .selected').html(userSessionName);
  $('#session-list .selected').attr('data-session-id', userSession);
  log('call: lightdm.start_authentication(' + username + ')');
  lightdm.start_authentication(username);
}

function cancelAuthentication(e) {
  log("authentication cancelled for " + $('#user').val());
  $('#pass').prop('disabled', false);
  $('#pass').val('');
  $('#pass').focus();
  document.body.focus();
  log("call: lightdm.cancel_authentication()");
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
    log("call: lightdm.respond(password)")
    lightdm.respond($('#pass').val());
  }, submitTimeout);
};

function sessionToggle(element) {
  log('sessionToggle');
  let sessionText = $(element).text();
  let sessionID = $(element).attr('data-session-id');
  let username = $('#user').val();
  $(element).parents('.btn-group').find('.selected').attr('data-session-id', sessionID);
  $(element).parents('.btn-group').find('.selected').html(sessionText);
};

function handleAction(id) {
  log("handleAction(" + id + ")");
  eval("lightdm." + id + "()");
};

function slideToPasswordArea(e) {
  log('slideToPasswordArea()');
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
  log('slideToUsernameArea()');
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
      log('keydown: esc');
      $('#user').val('');
      document.body.focus();
      break;
    default:
      if (!$('#user').is(':focus')) {
        $('#user').focus();
        log("set focus on #user");
      }
  }
}

function inputPassEventHandler(e) {
  switch (e.which) {
    case 27:
      log('keydown: esc');
      $('#pass').val('');
      $('#user').val('');
      $('#user').focus();
      document.body.focus();
      $('.backButton').trigger('click');
      break;
    default:
      if (!$('#pass').is(':focus')) {
        $('#pass').focus();
        log("set focus on #pass");
      }
  }
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

function getHostname() {
  let hostname = lightdm.hostname;
  let hostname_span = document.getElementById('hostname');
  $(hostname_span).append(hostname);
  $("#hostname-label").text(hostname);
}

function log(text) {
  if (DEBUG) {
    $('#logArea').append(text);
    $('#logArea').append('<br/>');
  }
}

function showLog() {
  $("#logWrap").show().css('display', 'flex');
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
    log('last session not found. using default: ' + lightdm.default_session)
    lastSession = lightdm.default_session;
  }
  
  log(username + '\'s last session: ' + lastSession);
  return lastSession;
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
  }
}

/*
 * Lightdm Callbacks
 */

function show_prompt(text) {
  log("callback: show_prompt(): " + text);
}

function authentication_complete() {
  log('callback: authentication_complete()');
  let username = lightdm.authentication_user;
  username = 'rdatest';
  let selectedSession = $('.selected').attr('data-session-id');
  if (lightdm.is_authenticated) {
    log('authentication successful');
    setTimeout(() => {
      log('call: lightdm.start_session(' + selectedSession + ')');
      lightdm.start_session(selectedSession);
    }, 2000);
  } else {

    log('authentication failure: ' + username);
    cancelAuthentication();
    log('call: lightdm.authenticate(' + username + ')');
    lightdm.authenticate(username);
  }
}

function show_message(text) {
  log('callback: show_message(): ' + text)
  let msgWrap = document.getElementById('statusArea'),
    showMsg = document.getElementById('showMsg');
  showMsg.innerHTML = text;
  if (text.length > 0) {
    $('#passwordArea').hide();
    $(msgWrap).show();
  }
}

function show_error(text) {
  log('callback: show_error(): ' + text)
  show_message(text);
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

    theme_config.backgrounds.forEach(function (background) {
      $('.bgs').append(`
            <a href="#" data-img="${background.image}" class="background">
              <img src="${background.thumb}" />
            </a>
          `);
    });

    // Add background buttons handler
    let backgroundButtons = $(".bg-switch .background");
    backgroundButtons.click(function (e) {
      e.preventDefault();
      backgroundButtons.removeClass("active");
      $(".bgs .background .default").first().removeClass('active');
      $(this).addClass("active");
      switchBackground($(this).data("img"));
    });

    addActionButton("shutdown");
    addActionButton("hibernate");
    addActionButton("suspend");
    addActionButton("restart");

    showPanel();
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
 
