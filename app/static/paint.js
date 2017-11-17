function info(msg) {
  $("#log").append(msg);
  $("#log").append("\n");
  $("#log").scrollTop($("#log")[0].scrollHeight);
}

var socket;

// Helper vars.
var dirToWord = {"l": "left", "r": "right"};

// Default values for vars:
// player = spectator, cursor default controls.
var player = -1;
var cursors = [{"l": 49, "r": 81},
              {"l": 90, "r": 88},
              {"l": 86, "r": 66},
              {"l": 188, "r": 190},
              {"l": 102, "r": 105}];
var finisher = 13;
var format;
var seats;

// Format paint: where is each player and what team he belongs to.
var teamColors = ["orange", "darkblue", "cyan", "pink", "forestgreen", "lightgrey"];
function fpaint() {
  var fcanvas = $("#fcanvas")[0];
  var fctx = fcanvas.getContext("2d");
  fctx.fillStyle = "black";
  for (var pid = 0; pid < format.num_players; pid++) {
    var rect = format.area_of[pid];
    var fontsize = Math.min(0.5*rect[2], 0.5*rect[3]);
    var fw = format.cursor_width;
    fctx.font = fontsize.toString() + "px Arial";
    fctx.fillText(pid.toString(), rect[0] + rect[2]/2, rect[1] + rect[3]/2);
    fctx.strokeStyle = teamColors[format.team_of[pid]];
    fctx.lineWidth = fw;
    fctx.beginPath();
    fctx.rect(rect[0] + fw/2, rect[1] + fw/2, rect[2] - fw, rect[3] - fw);
    fctx.stroke();
  }
}

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
  $("#" + type + cid.toString()).html(dirToWord[type] + " = " + String.fromCharCode(key));
}
var curr_bind = -1;
function bind(cid, type) {
  info("bind");
  $(window).off("keydown");
  curr_bind = cid;
  $(window).on("keydown", function(event) {
    info("win keydown " + type);
    cursors[curr_bind][type] = event.which || event.keyCode;
    refreshCursorButt(curr_bind, type);
    $(window).off("keydown");
  });
}
function refreshFinishButt() {
  $("#finish").html("finish current quest = " + String.fromCharCode(finisher));
}
function bind_finish() {
  info("bind_finish");
  $(window).off("keydown");
  $(window).on("keydown", function(event) {
    info("win keydown finish");
    finisher = event.which || event.keyCode;
    refreshFinishButt();
    $(window).off("keydown");
  });
}
function save_cfg() {
  info("requesting save cfg");
  var name = $("#cfg_name").val();
  socket.emit("save_cfg", name, cursors, finisher);
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
var scanvas;
var sctx;
var popcanvas;
var popctx;

function between(x, nx, ratio) {
  return (1.0-ratio)*x + ratio*nx;
}
function colorToStr(color) {
  return "rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ")";
}
function clearRectList(rect) {
  ctx.clearRect(rect[0], rect[1], rect[2], rect[3]);
  pctx.clearRect(rect[0], rect[1], rect[2], rect[3]);
}
function drawQuest(q, rect) {
  var oldAlpha = pctx.globalAlpha;
  pctx.globalAlpha = 0.7;
  var img = $("#img" + q.toString())[0];
  // var ratio = Math.min(rect[2]/img.width, rect[3]/img.height);
  // pctx.drawImage(img, rect[0], rect[1], ratio*img.width, ratio*img.height);
  pctx.drawImage(img, rect[0], rect[1], rect[2], rect[3]);
  pctx.globalAlpha = oldAlpha;
}

function paintAreas(state) {
  // Paints the first patterns, and surrounding colored rectangles which
  // denote which team's area it is.
  for (var pid = 0; pid < format.num_players; pid++) {
    var q = state.players[pid].current_quest;
    var rect = format.area_of[pid];
    if (q < format.image_files.length) {
      drawQuest(q, rect);
    }
    pctx.strokeStyle = teamColors[format.team_of[pid]];
    var fw = 2;
    pctx.lineWidth = fw;
    pctx.beginPath();
    pctx.rect(rect[0] - fw/2, rect[1] - fw/2, rect[2] + fw, rect[3] + fw);
    pctx.stroke();
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
      ctx.lineWidth = format.cursor_width;
      ctx.lineCap = "round";
      ctx.strokeStyle = colorToStr(format.color_of[cid]);
      ctx.beginPath();
      ctx.moveTo(state.players[pid].cursors[cid].x, state.players[pid].cursors[cid].y);
      ctx.lineTo(nstate.players[pid].cursors[cid].x, nstate.players[pid].cursors[cid].y);
      ctx.stroke();
    }
  }  
}
function paintSprites(state) {
  // At each cursor's location, draw a triangle depicting direction, and
  // with colors corresponding to the owner's team and the cursor's color.
  sctx.clearRect(0, 0, scanvas.width, scanvas.height);
  for (var pid = 0; pid < format.num_players; pid++) {
    var scale = 1;
    if (player == pid) {
       scale = scale * 3;
    }
    for (var cid = 0; cid < format.num_cursors; cid++) {
      var cursor = state.players[pid].cursors[cid];
      var unit = format.cursor_width;
      var dx1 = 1.5 * unit * Math.cos(cursor.direction * 2 * Math.PI);
      var dy1 = 1.5 * unit * Math.sin(cursor.direction * 2 * Math.PI);
      var dx2 = scale * 0.75 * unit * Math.cos((cursor.direction + 1/4) * 2 * Math.PI);
      var dy2 = scale * 0.75 * unit * Math.sin((cursor.direction + 1/4) * 2 * Math.PI);
      var dx3 = scale * 0.75 * unit * Math.cos((cursor.direction + 3/4) * 2 * Math.PI);
      var dy3 = scale * 0.75 * unit * Math.sin((cursor.direction + 3/4) * 2 * Math.PI);
      sctx.fillStyle = teamColors[format.team_of[pid]];
      if (player == pid) {
      	sctx.fillStyle = '#' + Math.random().toString(16).substr(-6);
      }
      sctx.moveTo(cursor.x + dx1, cursor.y + dy1);
      sctx.beginPath();
      sctx.lineTo(cursor.x + dx2, cursor.y + dy2);
      sctx.lineTo(cursor.x + dx3, cursor.y + dy3);
      sctx.lineTo(cursor.x + dx1, cursor.y + dy1);
      sctx.fill();
      
      var tipx2 = between(dx1, dx2, 0.4);
      var tipy2 = between(dy1, dy2, 0.4);
      var tipx3 = between(dx1, dx3, 0.4);
      var tipy3 = between(dy1, dy3, 0.4);
      sctx.fillStyle = colorToStr(format.color_of[cid]);
      sctx.moveTo(cursor.x + dx1, cursor.y + dy1);
      sctx.beginPath();
      sctx.lineTo(cursor.x + tipx2, cursor.y + tipy2);
      sctx.lineTo(cursor.x + tipx3, cursor.y + tipy3);
      sctx.lineTo(cursor.x + dx1, cursor.y + dy1);
      sctx.fill();
    }
  }
}
function paintTime(state) {
  // Draw the timebar (black bar in the lower part of the screen).
  var timebar_h = (canvas.height - format.canvas_size[1]) / (2*format.num_teams + 1);
  var timebar_w = format.canvas_size[0] * game.rounds/format.rounds;
  ctx.clearRect(0, format.canvas_size[1], format.canvas_size[0], timebar_h);
  ctx.fillStyle = "purple";
  ctx.beginPath();
  ctx.rect(0, format.canvas_size[1], timebar_w, timebar_h);
  ctx.fill();
  ctx.fillStyle = "red";
  ctx.font = (timebar_h - 2).toString() + "px Arial";
  ctx.fillText(game.rounds.toString(), 50, format.canvas_size[1] + timebar_h - 5);
}
function paintScores(state) {
  // Draw the scorebars.
  var extra_h = (canvas.height - format.canvas_size[1]);
  var timebar_h = extra_h / (2*format.num_teams + 1);
  var scorebar_h = 2*extra_h / (2*format.num_teams + 1);
  var maxscore = 0.000000001;
  for (var tid = 0; tid < format.num_teams; tid++) {
    maxscore = Math.max(game.teams[tid].score, maxscore);
  }
  ctx.clearRect(0, format.canvas_size[1]+timebar_h, format.canvas_size[0], format.num_teams*scorebar_h);
  for (var tid = 0; tid < format.num_teams; tid++) {
    var start_h = format.canvas_size[1] + timebar_h + tid*scorebar_h;
    var scorebar_w = format.canvas_size[0] * game.teams[tid].score/maxscore;
    ctx.fillStyle = teamColors[tid];
    ctx.beginPath();
    ctx.rect(0, start_h, scorebar_w, scorebar_h);
    ctx.fill();
    ctx.font = (scorebar_h - 4).toString() + "px Arial";
    ctx.fillStyle = "black";
    ctx.fillText(game.teams[tid].score.toFixed(4), 0, start_h + scorebar_h - 2);
  }
}
function alertScores(state, nstate) {
  // When a player finishes his or her quest, create a popup depicting
  // how many points they scored.
  for (var pid = 0; pid < format.num_players; pid++) {
    if (nstate.players[pid].current_quest != state.players[pid].current_quest) {
      var diff = Math.round(100 * (nstate.players[pid].score - state.players[pid].score)) / 100;
      var duration = 20;
      var x = format.area_of[pid][0];
      var y = format.area_of[pid][1];
      var maxw = format.area_of[pid][2];
      var maxh = format.area_of[pid][3];
      var h = 0.2 * maxh;
      var popup = setInterval(function() {
        popctx.clearRect(x, y, maxw, maxh);
        if (duration > 0) {
          popctx.globalAlpha = duration/20;
          var sgnChar = " ";
          popctx.fillStyle = "yellow";
          if (diff > 0) {
            sgnChar = "+";
            popctx.fillStyle = "green";
          }
          else if (diff < 0) {
            sgnChar = "-";
            popctx.fillStyle = "red";
          }
          popctx.font = h + "px Arial";
          popctx.fillText(sgnChar + diff.toString(), x, y + h, maxw);
          duration -= 1;
        }
        else {
          clearInterval(popup);
        }
      }, 50);
    }
  }
}

var old_cursor_status = [];
var cursor_status = [];
var finish_quest;
function initCursorStatus() {
  for (var cid = 0; cid < format.num_cursors; cid++) {
    old_cursor_status[cid] = {"l": false, "r": false};
    cursor_status[cid] = {"l": false, "r": false};
  }
  finish_quest = false;
}
var keyAction = [];
function setKeyBindings() {
  info("setting key bindings");
  for (var cid = 0; cid < cursors.length; cid++) {
    for (dir in cursors[cid]) {
      var key = cursors[cid][dir];
      keyAction[key] = {"cursor": cid, "command": dir};
    }
  }
  function getSetCommand(val0) {
    var val = val0;
    return function(event) {
      var key = event.which || event.keyCode;
      if (keyAction[key]) {
        var cid = keyAction[key].cursor;
        var command = keyAction[key].command;
        cursor_status[cid][command] = val;
      }
    }
  }
  $(window).on("keydown", getSetCommand(true));
  $(window).on("keyup", getSetCommand(false));
  $(window).on("keydown", function(event) {
    if ((event.which || event.keyCode) == finisher) {
      finish_quest = true;
    }
  });
}
function getCursorAction(l, r) {
  if (l && !r) {
    return 'L';
  }
  if (!l && r) {
    return 'R';
  }
  return 'N';
}
function genActions() {
  var actions = {};
  if (finish_quest) {
    actions["finish"] = true;
    finish_quest = false;
  }
  for (var cid = 0; cid < format.num_cursors; cid++) {
    var ol = old_cursor_status[cid].l;
    var or = old_cursor_status[cid].r;
    var nl = cursor_status[cid].l;
    var nr = cursor_status[cid].r;
    
    // Set old to new.
    old_cursor_status[cid].l = nl;
    old_cursor_status[cid].r = nr;
    
    // Check for changes in cursor movement.
    var oact = getCursorAction(ol, or);
    var nact = getCursorAction(nl, nr);
    if (oact == nact) {
      continue;
    }
    actions[cid] = nact;
  }
  return actions;
}

$(function() {
  info("done loading page, gonna do some javascript");
  
  // Visual stuff: set names for control buttons.
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
  scanvas = $("#scanvas")[0];
  sctx = scanvas.getContext("2d");
  popcanvas = $("#popcanvas")[0];
  popctx = popcanvas.getContext("2d");
  
  // Socket stuff.
  socket = io();
  socket.on("connect", function() {
    socket.emit("joined");
  });
  socket.on("welcome", function(data) {
    info("got a welcome from server");
    format = JSON.parse(data.format);
    fpaint();
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
    cursors = data.cursors;
    for (var cid = 0; cid < cursors.length; cid++) {
      for (type in cursors[cid]) {
        refreshCursorButt(cid, type);
      }
    }
    finisher = data.finisher;
    refreshFinishButt();
  });
  // Lobby event: game start
  socket.on("get_ready", function(data) {
    info("starting the game");
    initCursorStatus();
    socket.on("update", function(data) {
      var nstate = JSON.parse(data);
      paint(game, nstate);
      paintTime(nstate);
      paintScores(nstate);
      alertScores(game, nstate);
      paintSprites(nstate);
      game = nstate;
      
      var actions = genActions();
      if (Object.keys(actions).length > 0) {
        socket.emit("actions", actions);
      }
    });
    var updates = [];
    for (var i = 0; i < data.length; i++) {
      updates.push(JSON.parse(data[i]));
    }
    for (var i = 0; i + 1 < updates.length; i++) {
      paint(updates[i], updates[i + 1]);
    }
    game = updates[updates.length - 1];
    paintAreas(game);
    paintTime(game);
    paintScores(game);
    paintSprites(game);
    setKeyBindings();
    $("#log").hide();
    $("#lobby").hide();
    $("#game").show();
  });
});
