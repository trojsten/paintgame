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
var finisher = 13;
var format;
var seats;

// Seat changing.
function requestPlayerChange(nplayer) {
  info("requesting player change " + nplayer.toString());
  socket.emit("request_player_change", nplayer);
}
function confirmedPlayerChange(nplayer) {
  info("confirmed player change " + nplayer.toString());
  player = nplayer;
  if (player == -1) {
    $("#pid").text("spectator");
    $("#controls").hide();
  }
  else {
    $("#pid").text("player " + nplayer.toString());
    $("#controls").show();
  }
}
function freeSeat(i) {
  $("#p" + i.toString()).html(i.toString());
}
function takeSeat(i) {
  $("#p" + i.toString()).html("TAKEN");
}

// Cursor controls changing.
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
function refreshFinishButt() {
  $("#finish").html("finish current quest = " + finisher.toString());
}
function bind_finish() {
  info("bind_finish");
  $(window).off("keydown");
  $(window).on("keydown", function(event) {
    info("win keydown finish");
    finisher = event.which;
    refreshFinishButt();
    $(window).off("keydown");
  });
}
function save_cfg() {
  info("requesting save cfg");
  var name = $("#cfg_name").val();
  socket.emit("save_cfg", name, cursors);
}
function load_cfg() {
  info("requesting load cfg");
  var name = $("#cfg_name").val();
  socket.emit("load_cfg", name);
}

// Actual game related stuff. Not just management around it.
// Things like game state, function generating base game state from format, ...
var game;

var canvas;
var ctx;
var pcanvas;
var pctx;

function between(x, nx, ratio) {
  return ratio*x + (1.0-ratio)*nx;
}
function colorToStr(color) {
  return "rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ")";
}
function clearRectList(rect) {
  pctx.clearRect(rect[0], rect[1], rect[2], rect[3]);
}
function drawQuest(q, rect) {
  var oldAlpha = pctx.globalAlpha;
  pctx.globalAlpha = 0.2;
  var img = $("#img" + q.toString())[0];
  var ratio = Math.min(rect[2]/img.width, rect[3]/img.height);
  pctx.drawImage(img, rect[0], rect[1], ratio*img.width, ratio*img.height);
  pctx.globalAlpha = oldAlpha;
}

function paintPatterns(state) {
  // Paints the first patterns. Don't use when changing patterns,
  // as it doesn't clear the area.
  for (var pid = 0; pid < format.num_players; pid++) {
    var q = state.players[pid].current_quest;
    if (q < format.image_files.length) {
      drawQuest(q, format.area_of[pid]);
    }
  }
}
function paint(state, nstate) {
  // Called whenever the state of the game changes to update canvases.
  // <state> == current state of the game, <nstate> = next state
  //
  // Change patterns.
  for (var pid = 0; pid < format.num_players; pid++) {
    var nq = nstate.players[pid].current_quest;
    if (nq != state.players[pid].current_quest) {
      clearRectList(format.area_of[pid]);
      if (nq < format.image_files.length) {
        drawQuest(nq, format.area_of[pid]);
      }
    }
  }
  // Cursors leave behind a trail.
  for (var pid = 0; pid < format.num_players; pid++) {
    for (var cid = 0; cid < format.num_cursors; cid++) {
      /*
      // Too slow of a method.
      for (var step = 1; step <= 10; step++) {
        var ratio = step/10;
        var cx = between(state.players[pid].cursors[cid].x, nstate.players[pid].cursors[cid].x, ratio);
        var cy = between(state.players[pid].cursors[cid].y, nstate.players[pid].cursors[cid].y, ratio);
        ctx.beginPath();
        ctx.arc(cx, cy, format.cursor_width/2, 0, 2*Math.PI);
        ctx.fillStyle = colorToStr(format.color_of[cid]);
        ctx.fill();
      }
      */
      ctx.lineWidth = format.cursor_width;
      ctx.lineCap = "round";
      ctx.strokeStyle = colorToStr(format.color_of[cid]);
      ctx.beginPath();
      ctx.moveTo(state.players[pid].cursors[cid].x, state.players[pid].cursors[cid].y);
      ctx.lineTo(nstate.players[pid].cursors[cid].x, nstate.players[pid].cursors[cid].y);
      ctx.stroke();
    }
  }
  // Move the cursor sprites.
}

function setKeyBindings() {
  info("setting key bindings");
  var keyAction = [];
  for (var cid = 0; cid < cursors.length; cid++) {
    for (dir in cursors[cid]) {
      var key = cursors[cid][dir];
      keyAction[key] = {"type": "cursor", "cursor": cid, "command": dir.toUpperCase()};
    }
  }
  keyAction[finisher] = {"type": "finisher"};
  $(window).on("keydown", function(event) {
    var action = keyAction[event.which];
    if (action) {
      info("user pressed a valid key");
      info(JSON.stringify(action));
      socket.emit("action", action);
    }
  });
}

$(function() {
  info("done loading page, gonna do some javascript");
  
  // Set names for cursor control buttons.
  for (var cid = 0; cid < cursors.length; cid++) {
    for (type in dirToWord) {
      refreshCursorButt(cid, type);
    }
  }
  refreshFinishButt();
  
  // Initialize canvas variables.
  canvas = $("#canvas")[0];
  ctx = canvas.getContext("2d");
  pcanvas = $("#pcanvas")[0];
  pctx = pcanvas.getContext("2d");
  
  // Socket stuff.
  socket = io();
  socket.on("connect", function() {
    socket.emit("joined");
  });
  socket.on("welcome", function(data) {
    info("got a welcome from server");
    format = JSON.parse(data.format);
    seats = JSON.parse(data.seats);
    for (var i = 0; i < seats.length; i++) {
      if (seats[i]) {
        takeSeat(i);
      }
    }
  });
  // Lobby events: player changes
  socket.on("confirmed_player_change", function(data) {
    confirmedPlayerChange(data);
  });
  socket.on("declined_player_change", function() {
    info("request for player change declined");
  });
  socket.on("free_seat", function(data) {
    freeSeat(data);
  });
  socket.on("take_seat", function(data) {
    takeSeat(data);
  });
  // Lobby events: config load and save
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
  // Lobby event: game start
  socket.on("start", function(data) {
    info("starting the game");
    socket.on("update", function(data) {
      var nstate = JSON.parse(data);
      paint(game, nstate);
      game = nstate;
    });
    var updates = [];
    for (var i = 0; i < data.length; i++) {
      updates.push(JSON.parse(data[i]));
    }
    for (var i = 0; i + 1 < updates.length; i++) {
      paint(updates[i], updates[i + 1]);
    }
    game = updates[updates.length - 1];
    paintPatterns(game);
    setKeyBindings();
    $("#lobby").hide();
    $("#game").show();
  });
});
