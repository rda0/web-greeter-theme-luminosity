/*
 * Copyright © 2015 Antergos
 *
 * greeter.js
 *
 * This file is part of lightdm-webkit-theme-antergos
 *
 * lightdm-webkit-theme-antergos is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License,
 * or any later version.
 *
 * lightdm-webkit-theme-antergos is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * The following additional terms are in effect as per Section 7 of this license:
 *
 * The preservation of all legal notices and author attributions in
 * the material or in the Appropriate Legal Notices displayed
 * by works containing it is required.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var DEBUG = true,
  selectedUser = null,
  authPending = null,
  users_shown = null,
  userList, animating = false;
window.config = {};

/**
 * Logs.
 */
function log(text) {
  if (DEBUG) {
    $('#logArea').append(text);
    $('#logArea').append('<br/>');
  }
}
function showPanel() {
  $("#bg").addClass("in");
  setTimeout(() => {
    $("#container").addClass("in");
  }, 500);
}

function showLog() {
  $("#logArea").show();
}


function defaultBG() {
  localStorage.setItem("bgsaved", 'img/default-bg.jpg');
  $('.bg').fadeTo('slow', 0.3, function () {
    $(".bg").css(Object.assign(config.styles.background, {
      "background-image": "url('img/default-bg.jpg')"
    }));
  }).fadeTo('slow', 1);
}

$(document).ready(function () {
  function buildUserList() {
    // User list building
    var accountList = $('.account-list');
    for (var i in lightdm.users) {
      var user = lightdm.users[i];
      var tux = 'img/icons/user.png';
      var imageSrc = user.image ? user.image : tux;
      var lastSession = localStorage.getItem(user.name);
      if (lastSession == null && lastSession == undefined) {
        localStorage.setItem(user.name, lightdm.default_session);
        lastSession = localStorage.getItem(user.name);
      }
      log('Last Session (' + user.name + '): ' + lastSession);
      var item = '<li class="account">' +
        '  <div href="#' + user.name + '" class="item" onclick="authenticate(event,\'' + user.name + '\')" data-session="' + lastSession + '">' +
        '    <div class="pic" aria-hidden="true">' +
        '      <img src="' + imageSrc + '" alt="">' +
        '    </div>' +
        '    <div class="info">' +
        '      <p role="presentation" class="wpW1cb">' + user.display_name + '</p>' +
        '      <p class="uRhzae" role="heading" aria-level="2">Last Session ' + lastSession + '</p>' +
        '     </div>' +
        '  </div>' +
        '</li>';
      $(accountList).append(item);
    }
    $('.account-list .item').hover(function () {
      $(this).css(config.styles['accountListItem:hover'])
    }, function () {
      $(this).css(config.styles['accountListItem'])
    })
  }

  function buildSessionList() {
    // Build Session List
    var btnGrp = $('#sessions');
    for (var i in lightdm.sessions) {
      var session = lightdm.sessions[i];
      var theClass = session.name.replace(/ /g, '');
      var button = '\n<li><a href="#" data-session-id="' + session.key + '" onclick="sessionToggle(this)" class="' + theClass + '">' + session.name + '</a></li>';

      $(btnGrp).append(button);
    }
    $('.dropdown-toggle').dropdown();
  }

  function show_users() {
    if ($('#collapseOne').hasClass('in')) {
      $('#trigger').trigger('click');
      users_shown = true;
    }
    if ($('#user-list2 a').length <= 1) $('#user-list2 a').trigger('click');
  }
  fetch('config.json').then(async function (res) {
    config = await res.json();
    $('#container').css(config.styles.panel);
    $('.bg').css(config.styles.background);
    $('#signin-banner img').attr('src', config.banner);
    config.backgrounds.forEach(function (background) {
      $('.bgs').append(`
            <a href="#" data-img="${background.image}" class="background clearfix">
              <img src="${background.thumb}" /> 
            </a>
          `);
    });
    let style = $('.actionButton').attr('style') || '';
    for (let i in config.styles['actionButton']) {
      style += '--action-button-' + i.toLowerCase() + ':' + config.styles['actionButton'][i] + ';';
    }
    $('.actionButton').attr('style', style);
    $('.other-account').attr('style', style);
    style = $('.actionButton').attr('style') || '';
    for (let i in config.styles['actionButton:hover']) {
      style += '--action-button-hover-' + i.toLowerCase() + ':' + config.styles['actionButton:hover'][i] + ';';
    }
    $('.actionButton').attr('style', style);
    $('.other-account').attr('style', style);

    style = $('.input').attr('style') || '';
    for (let i in config.styles['inputLine']) {
      style += '--input-line-' + i.toLowerCase() + ':' + config.styles['inputLine'][i] + ';';
    }
    $('.input').attr('style', style);

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
    $(".other-account").click(function (e) {
      $('.selected-user').html("")
      $('.content').css({
        marginLeft: '0px'
      });
      $('#session-list .selected').html('')
      $('#session-list').addClass('hidden');
      lightdm.cancel_authentication();
      log("authentication cancelled for " + selectedUser);
      selectedUser = null;
      authPending = false;
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
            "font-size": "24px",
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
    // initialize_timer();
    // get_hostname();
    buildUserList();
    buildSessionList();
  });

  function get_hostname() {
    var hostname = lightdm.hostname;
    var hostname_span = document.getElementById('hostname');
    $(hostname_span).append(hostname);
  }

	/**
	 * Actions management.
	 *
	 *
	 */

  function update_time() {
    var time = document.getElementById("current_time");
    var date = new Date();
    var twelveHr = [
      'sq-al',
      'zh-cn',
      'zh-tw',
      'en-au',
      'en-bz',
      'en-ca',
      'en-cb',
      'en-jm',
      'en-ng',
      'en-nz',
      'en-ph',
      'en-us',
      'en-tt',
      'en-zw',
      'es-us',
      'es-mx'];
    var userLang = window.navigator.language;
    var is_twelveHr = twelveHr.indexOf(userLang);
    var hh = date.getHours();
    var mm = date.getMinutes();
    var suffix = "AM";
    if (hh >= 12) {
      suffix = "PM";
      if (is_twelveHr !== -1 && is_twelveHr !== 12) {
        hh = hh - 12;
      }
    }
    if (mm < 10) {
      mm = "0" + mm;
    }
    if (hh === 0 && is_twelveHr !== -1) {
      hh = 12;
    }
    if (is_twelveHr === -1) {
      suffix = "";
    }
    time.innerHTML = hh + ":" + mm + " " + suffix;
  }

  function initialize_timer() {
    var userLang = window.navigator.language;
    log(userLang);
    update_time();
    // setInterval(update_time, 60000);
  }

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
      if (config && config.styles) {
        let style = $('.actionButton').attr('style') || '';
        for (let i in config.styles['actionButton']) {
          style += '--action-button-' + i.toLowerCase() + ':' + config.styles['actionButton'][i] + ';';
        }
        $('.actionButton').attr('style', style);
        style = $('.actionButton').attr('style') || '';
        for (let i in config.styles['actionButton:hover']) {
          style += '--action-button-hover-' + i.toLowerCase() + ':' + config.styles['actionButton:hover'][i] + ';';
        }
        $('.actionButton').attr('style', style);
      }
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
  function slideContent(e) {
    const selectedUser = e.target.cloneNode(true);
    selectedUser.removeAttribute('style');
    $(selectedUser).css(config.styles.selectedUser);
    $('.selected-user').append(selectedUser);

    const content = document.querySelector('.content');
    const onTransitionEnd = function (e) {
      $('#pass').focus();
      content.removeEventListener('transitionend', onTransitionEnd);
    };
    content.addEventListener('transitionend', onTransitionEnd);

    $('.content').css({
      marginLeft: '-450px'
    });
    $('#session-list .selected').html(e.target.getAttribute('data-session'));
  }
  window.authenticate = function (e, username) {
    slideContent(e);
    if (selectedUser !== null) {
      lightdm.cancel_authentication();
      localStorage.setItem('selUser', null);
      log("authentication cancelled for " + selectedUser);
    }
    localStorage.setItem('selUser', username);


    var usrSession = localStorage.getItem(username);

    log("usrSession: " + usrSession);
    var usrSessionEl = "[data-session-id=" + usrSession + "]";
    var usrSessionName = $(usrSessionEl).html();
    log("usrSessionName: " + usrSessionName);
    $('.selected').html(usrSessionName);
    $('.selected').attr('data-session-id', usrSession);
    $('#session-list').removeClass('hidden');
    $('#session-list').show();
    $('#passwordArea').show();
    $('.dropdown-toggle').dropdown();
    authPending = true;

    lightdm.start_authentication(username);
  }

  window.cancelAuthentication = function () {
    log("cancelAuthentication()");
    $('#session-list').hide();
    lightdm.cancel_authentication();
    log("authentication cancelled for " + selectedUser);
    $('.fa-toggle-down').show();
    selectedUser = null;
    authPending = false;
    return true;
  };

  window.submitPassword = function () {
    log("provideSecret()");
    lightdm.provide_secret($('#passwordField').val());
    $('#passwordArea').hide();
    $('#timerArea').show();
    log("done");
  };

	/**
	 * Image loading management.
	 */

  window.imgNotFound = function (source) {
    source.src = 'img/logo-user.png';
    source.onerror = "";
    return true;
  };

  window.sessionToggle = function (el) {
    var selText = $(el).text();
    var theID = $(el).attr('data-session-id');
    var selUser = localStorage.getItem('selUser');
    $(el).parents('.btn-group').find('.selected').attr('data-session-id', theID);
    $(el).parents('.btn-group').find('.selected').html(selText);
    localStorage.setItem(selUser, theID)
  };
});

/**
 * Lightdm Callbacks
 */
function show_prompt(text) {
  log("show_prompt(" + text + ")");
  $('#passwordField').val("");
  $('#passwordArea').show();
  $('#passwordField').focus();
}

function authentication_complete() {
  log("authentication_complete()");
  authPending = false;
  // $('#timerArea').hide();
  var selSession = $('.selected').attr('data-session-id');
  if (lightdm.is_authenticated) {
    log("authenticated !");
    lightdm.login(lightdm.authentication_user, selSession);
  } else {
    log("not authenticated !");
    // $('#statusArea').show();
    animating = false;
    $('.login__submit').removeClass('processing');
  }
}

function show_message(text) {
  var msgWrap = document.getElementById('statusArea'),
    showMsg = document.getElementById('showMsg');
  showMsg.innerHTML = text;
  if (text.length > 0) {
    $('#passwordArea').hide();
    $(msgWrap).show();
  }
}

function show_error(text) {
  show_message(text);
}
