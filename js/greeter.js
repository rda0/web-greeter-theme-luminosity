/*
 * global variables
 */

let DEBUG = true;
let authPending = null;
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

    var $btns = $(".bg-switch .background");
    $btns.click(function (e) {
      e.preventDefault();
      $btns.removeClass("active");
      $(".bgs .background .default").first().removeClass('active');
      $(this).addClass("active");
      var bg = $(this).data("img");
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
        var bgurl = "url('" + bg + "')";
        localStorage.setItem("bgsaved", bgurl)
      }
    });

    showPanel();

    $(".backButton").click(function (e) {
      cancelAuthentication(event);
    });

    $(".input input").focus(function () {
      $(this).parent(".input").each(function () {
        $("label", this).css({
          "line-height": "18px",
          "font-size": "18px",
          "font-weight": "100",
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
            "font-weight": "300",
            "top": "10px"
          })
        });
      }
    });

    $('.login__submit').click(function (e) {
      e.preventDefault();
      var submitPhase1 = 3000;
      var btn = e.target;
      if (animating) return;
      animating = true;
      $(this).addClass("processing");
      log("provideSecret()");
      setTimeout(() => {
        lightdm.provide_secret($('#pass').val());
        log("done");
      }, submitPhase1);
    });

    // Focus user input field on keydown
    document.body.addEventListener('keydown', inputUser);

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

    // Action buttons
    addActionLink("shutdown");
    addActionLink("hibernate");
    addActionLink("suspend");
    addActionLink("restart");
  });

  $("#bg-switch-close").click(function (e) {
    e.preventDefault();
    $("#bg-switch-wrapper").toggleClass("active");
    $(this).hide();
    $("#bg-switch-toggle").show();
  });

  $("#bg-switch-toggle").click(function (e) {
    e.preventDefault();
    $("#bg-switch-wrapper").toggleClass("active");
    $(this).hide();
    $("#bg-switch-close").show();
  });

  $('*').each(function () {
    $(this).attr('tabindex', -1);
  });

  /* 
  $('#collapseTwo').on('shown.bs.collapse', function () {
    $('#collapseTwo a').filter(':not(.dropdown-menu *)').each(function (index) {
      var i = index + 1;
      $(this).attr('tabindex', i);
    });
  });
  */

  $(window).load(function () {
    /**
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

});


/**
 * Logs.
 */

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
 
function inputUser() {
  // log('active.id: ' + document.activeElement.id);
  // log('user has focus: ' + $('#user').is(':focus'));

  if (!$('#user').is(':focus')) {
    $('#user').focus();
    log("set focus on #user");
  }
}

function inputPass(e) {
  // log('active.id: ' + document.activeElement.id);
  // log('pass has focus: ' + $('#pass').is(':focus'));

  if (!$('#pass').is(':focus')) {
    $('#pass').focus();
    log("set focus on #pass");
  }
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

function buildSessionList() {
  // Build Session List
  var btnGrp = $('#sessions');
  for (var i in lightdm.sessions) {
    var session = lightdm.sessions[i];
    var theClass = session.name.replace(/ /g, '');
    var button = '\n<li><a href="#" data-session-id="' +
        session.key + '" onclick="sessionToggle(this)" class="' +
        theClass + '">' + session.name + '</a></li>';

    $(btnGrp).append(button);
  }
  $('.dropdown-toggle').dropdown();
}

function getHostname() {
  var hostname = lightdm.hostname;
  var hostname_span = document.getElementById('hostname');
  $(hostname_span).append(hostname);
  $("#hostname-label").text(hostname);
}

/**
 * Actions management.
 */

function addActionLink(id) {
  if (eval("lightdm.can_" + id)) {
    var label = id.substr(0, 1).toUpperCase() + id.substr(1, id.length - 1);
    var id2;
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
    $("#actionsArea").append('\n<button type="button" class="btn btn-default ' + id + ' actionButton" data-toggle="tooltip" data-placement="top" title="' + label + '" data-container="body" onclick="handleAction(\'' + id + '\')"><i class="fa fa-' + id2 + '"></i></button>');
  }
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

window.handleAction = function (id) {
  log("handleAction(" + id + ")");
  eval("lightdm." + id + "()");
};

function getUserObj(username) {
  var user = null;
  for (var i = 0; i < lightdm.users.length; ++i) {
    if (lightdm.users[i].name == username) {
      user = lightdm.users[i];
      break;
    }
  }
  return user;
}

function getSessionObj(sessionname) {
  var session = null;
  for (var i = 0; i < lightdm.sessions.length; ++i) {
    if (lightdm.sessions[i].name == sessionname) {
      session = lightdm.sessions[i];
      break;
    }
  }
  return session;
}

function slideToPasswordArea(e) {
  const content = document.querySelector('.content');
  const onTransitionEnd = function (e) {
    document.body.removeEventListener('keydown', inputUser);
    document.body.addEventListener('keydown', inputPass)
    content.removeEventListener('transitionend', onTransitionEnd);
  };
  content.addEventListener('transitionend', onTransitionEnd);

  $('.content').css({
    marginLeft: '-450px'
  });
  $('#actionsArea').fadeOut(250, function() {
    $('#backArea').fadeIn(250);
  });
  $('#session-list .selected').html(e.target.getAttribute('data-session'));
}

function slideToUsernameArea(e) {
  $('.content').css({
    marginLeft: '0px'
  });
  $('#backArea').fadeOut(250, function() {
    $('#actionsArea').fadeIn(250);
  });
}

window.authenticate = function (e, username) {
  slideToPasswordArea(e);

  $("#user-login-name").text(username);
  let userSession = getLastUserSession(username);
  log('userSession: ' + userSession);
  let userSessionEl = "[data-session-id=" + userSession + "]";
  let userSessionName = $(userSessionEl).html();
  log('userSessionName: ' + userSessionName);
  $('.selected').html(userSessionName);
  $('.selected').attr('data-session-id', userSession);
  // $('.dropdown-toggle').dropdown();

  authPending = true;
  lightdm.start_authentication(username);
}

window.cancelAuthentication = function (e) {
  log("authentication cancelled for " + $('#user').val());
  $('#user').text('')
  $('#session-list .selected').html('')
  log("call: lightdm.cancel_authentication()");
  lightdm.cancel_authentication();
  authPending = false;
};

window.submitPassword = function () {
  log("call: provideSecret()");
  lightdm.provide_secret($('#passwordField').val());
  log("done: provideSecret()");
};

/*
 * Image loading management.
 */

window.sessionToggle = function (el) {
  log('sessionToggle');
  var selText = $(el).text();
  var selID = $(el).attr('data-session-id');
  var selUser = localStorage.getItem('selUser');
  $(el).parents('.btn-group').find('.selected').attr('data-session-id', selID);
  $(el).parents('.btn-group').find('.selected').html(selText);
  localStorage.setItem(selUser, selID)
};

/*
 * Lightdm Callbacks
 */

function show_prompt(text) {
  log("callback: show_prompt(): " + text);
}

function authentication_complete() {
  log("callback: authentication_complete()");
  authPending = false;
  var selSession = $('.selected').attr('data-session-id');
  if (lightdm.is_authenticated) {
    log("authentication successful!");
    lightdm.login(lightdm.authentication_user, selSession);
  } else {
    log("authentication failure!");
    $('#pass').val('');
    animating = false;
    $('.login__submit').removeClass('processing');
  }
}

function show_message(text) {
  log('callback: show_message(): ' + text)
  var msgWrap = document.getElementById('statusArea'),
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
