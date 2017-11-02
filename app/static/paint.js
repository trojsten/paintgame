function info(msg) {
  $("#log").append(msg);
  $("#log").append("\n");
  $("#log").scrollTop($("#log")[0].scrollHeight);
}

var socket;

// Helper vars.
var dirToWord = {"l": "left", "s": "stop", "r": "right"};

// Default values for vars:
// player = spectator, cursor default controls.
var player = -1;
var cursors = [{"l": 81, "s": 65, "r": 90},
              {"l": 87, "s": 69, "r": 82},
              {"l": 89, "s": 85, "r": 73},
              {"l": 80, "s": 219, "r": 221},
              {"l": 100, "s": 101, "r": 102}];
var format;
var seats;

function requestPlayerChange(nplayer) {
  info("requesting player change " + nplayer.toString());
  socket.emit("request_player_change", nplayer);
  if (nplayer == -1) {
    confirmedPlayerChange(-1);
  }
}
function confirmedPlayerChange(nplayer) {
  info("confirmed player change " + nplayer.toString());
  player = nplayer;
  if (player == -1) {
    $("#pid").text("spectator");
    $("#cursor_controls").hide();
  }
  else {
    $("#pid").text("player " + nplayer.toString());
    $("#cursor_controls").show();
  }
}

function refreshCursorButt(cid, type) {
  var key = cursors[cid][type];
  $("#" + type + cid.toString()).html(dirToWord[type] + " = " + key.toString());
}
var curr_bind = -1;
function bind(cid, type) {
  info("bind");
  $(window).off("keydown");
  curr_bind = cid;
  $(window).on("keydown", function(event) {
    info("win keydown " + type);
    cursors[curr_bind][type] = event.which;
    refreshCursorButt(curr_bind, type);
    $(window).off("keydown");
  });
}

function save_cfg() {
  var name = $("#cfg_name").val();
  socket.emit("save_cfg", name, cursors);
}
function load_cfg() {
  var name = $("#cfg_name").val();
  socket.emit("load_cfg", name);
}

$(function() {
  info("done loading page, gonna do some javascript");
  
  // Socket startup
  socket = io();
  socket.on("connect", function() {
    socket.emit("joined");
  });
  socket.on("welcome", function(data) {
    info("got a welcome from server");
    format = JSON.parse(data.format);
    seats = JSON.parse(data.seats);
  });
  
  // Lobby events: player change, config load
  socket.on("confirmed_player_change", function(data) {
    confirmedPlayerChange(data);
  });
  socket.on("config_not_exist", function() {
    info("Config file with the given name does not exist.");
  });
  socket.on("config_name_taken", function() {
    info("Config file with the given name already exists.");
  });
  socket.on("save_cfg_success", function() {
    info("Successfully saved config.");
  });
  socket.on("cfg", function(data) {
    info("Successfully loaded config.");
    cursors = data;
    for (var cid = 0; cid < cursors.length; cid++) {
      for (type in cursors[cid]) {
        refreshCursorButt(cid, type);
      }
    }
  });
  
  // Set names for cursor control buttons.
  for (var cid = 0; cid < cursors.length; cid++) {
    for (type in dirToWord) {
      refreshCursorButt(cid, type);
    }
  }
});
