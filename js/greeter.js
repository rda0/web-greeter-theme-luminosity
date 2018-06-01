/*
 * global variables
 */

let DEBUG = true;
let animating = false;
window.config = {};

/*
 * document ready
 */

$(document).ready(function () {
  if (DEBUG) {
    showLog();
  }

  fetch('config.json').then(async function (res) {
    config = await res.json();
    $('#panel').css(config.styles.panel);
    $('.content-footer').css(config.styles.contentFooter);
    $('.bg').css(config.styles.background);
    $('#banner img').attr('src', `img/banners/${config.banner}.png`);
    $('#logo img').attr('src', `img/banners/${config.logo}.png`);
    config.backgrounds.forEach(function (background) {
      $('.bgs').append(`
            <a href="#" data-img="${background.image}" class="background">
              <img src="${background.thumb}" /> 
            </a>
          `);
    });

    let $btns = $(".bg-switch .background");
    $btns.click(function (e) {
      e.preventDefault();
      $btns.removeClass("active");
      $(".bgs .background .default").first().removeClass('active');
      $(this).addClass("active");
      let bg = $(this).data("img");
      if (bg == 'default') {
        localStorage.setItem("bgdefault", '1');
        defaultBG();
      } else {
        localStorage.setItem("bgdefault", '0');
        $('.bg').fadeTo('slow', 0.3, function () {
          $(".bg").css(Object.assign(config.styles.background, {
            "background-image": "url('" + bg + "')",
          }));
        }).fadeTo('slow', 1);
        let bgurl = "url('" + bg + "')";
        localStorage.setItem("bgsaved", bgurl)
      }
    });

    showPanel();

    // Focus user input field on keydown
    document.body.addEventListener('keydown', inputUser);

    // Action buttons
    addActionLink("shutdown");
    addActionLink("hibernate");
    addActionLink("suspend");
    addActionLink("restart");
  });

  $(window).load(function () {
    /*
     * UI Initialization.
     */

    if (localStorage.getItem("bgdefault") === null && (localStorage.getItem("bgsaved") === null)) {
      localStorage.setItem("bgdefault", "1");
    }

    if ((localStorage.getItem("bgsaved") !== null) && (localStorage.getItem("bgdefault") === '0')) {
      $('.bg').fadeTo('slow', 0.3, function () {
        $(".bg").css(Object.assign((config && config.styles) ? config.styles.background : {}, {
          "background-image": localStorage.bgsaved
        }));
      }).fadeTo('slow', 1);
    } else {
      defaultBG();
    }

    getHostname();
    buildSessionList();
  });

  // Set tabindex = -1 on all alements
  $('*').each(function () {
    $(this).attr('tabindex', -1);
  });

  // Events

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

  // Username submit
  $('.login__submit').click(function (e) {
    e.preventDefault();
    let submitTimeout = 2000;
    let submitButton = e.target;
    if (animating) return;
    animating = true;
    $(this).addClass("processing");
    setTimeout(() => {
      submitPassword($('#pass').val());
      log("done");
    }, submitTimeout);
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
          authenticate(event, username);
        }
        break;
    }
  });

  // Password submit when enter key is pressed
  $('#pass').keydown(function (e) {
    switch (e.which) {
      case 13:
        $('.login__submit').trigger('click');
        break;
    }
  });

  // Cancel authentication
  $(".backButton").click(function (e) {
    slideToUsernameArea(event);
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
});

/*
 * window functions
 */

window.authenticate = function (e, username) {
  slideToPasswordArea(e);

  $("#user-login-name").text(username);
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

window.cancelAuthentication = function (e) {
  log("authentication cancelled for " + $('#user').val());
  $('#pass').val('');
  $('#pass').focus();
  document.body.focus();
  log("call: lightdm.cancel_authentication()");
  lightdm.cancel_authentication();
  $('.login__submit').removeClass('processing');
  animating = false;
};

window.submitPassword = function (password) {
  log("call: lightdm.provide_secret(password)")
  lightdm.provide_secret(password);
};

window.sessionToggle = function (element) {
  log('sessionToggle');
  let sessionText = $(element).text();
  let sessionID = $(element).attr('data-session-id');
  let username = $('#user').val();
  $(element).parents('.btn-group').find('.selected').attr('data-session-id', sessionID);
  $(element).parents('.btn-group').find('.selected').html(sessionText);
  localStorage.setItem(username, sessionID)
};

window.handleAction = function (id) {
  log("handleAction(" + id + ")");
  eval("lightdm." + id + "()");
};

function slideToPasswordArea(e) {
  log('slideToPasswordArea()');
  document.body.removeEventListener('keydown', inputUser);
  const content = document.querySelector('.content');
  const onTransitionEnd = function (e) {
    document.body.addEventListener('keydown', inputPass);
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
  document.body.removeEventListener('keydown', inputPass);
  document.body.addEventListener('keydown', inputUser);

  $('.content').css({
    marginLeft: '0px'
  });
  $('#backArea').fadeOut(125, function() {
    $('#actionsArea').fadeIn(125);
  });
}

function inputUser(e) {
  // log('active.id: ' + document.activeElement.id);
  // log('user has focus: ' + $('#user').is(':focus'));

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

function inputPass(e) {
  // log('active.id: ' + document.activeElement.id);
  // log('pass has focus: ' + $('#pass').is(':focus'));

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

function buildSessionList() {
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

function defaultBG() {
  localStorage.setItem("bgsaved", 'img/default-bg.jpg');
  $('.bg').fadeTo('slow', 0.3, function () {
    $(".bg").css(Object.assign(config.styles.background, {
      "background-image": "url('img/default-bg.jpg')"
    }));
  }).fadeTo('slow', 1);
}
 
function getLastUserSession(username) {
  let lastSession = localStorage.getItem(username);
  
  if (lastSession == null && lastSession == undefined) {
    log('last user session not found. using default: ' + lightdm.default_session)
    localStorage.setItem(username, lightdm.default_session);
    return lightdm.default_session;
  }
  
  log(username + '\'s last session: ' + lastSession);
  return lastSession;
}

function addActionLink(id) {
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
  let selectedSession = $('.selected').attr('data-session-id');
  if (lightdm.is_authenticated) {
    log('authentication successful');
    log('call: lightdm.login(' + username + ', ' + selectedSession + ')');
    lightdm.login(username, selectedSession);
  } else {

    log('authentication failure: ' + username);
    cancelAuthentication();
    log('call: lightdm.start_authentication(' + username + ')');
    lightdm.start_authentication(username);
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
