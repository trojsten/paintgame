import json, os
from flask import session
from flask_socketio import emit
from . import globs, utility
from .engine.writer import encode
from .. import socketio

"""Seat stuff."""
def is_free(i):
  if i == -1:
    return True
  if i in range(len(globs.seats)):
    return not globs.seats[i]
  return False

def is_taken(i):
  return not is_free(i)

def free_seat(i):
  if i in range(len(globs.seats)):
    del session["player"]
    globs.seats[i] = False
    socketio.emit("free_seat", i)

def take_seat(i):
  if i in range(len(globs.seats)):
    session["player"] = i
    globs.seats[i] = True
    socketio.emit("take_seat", i)

@socketio.on("disconnect", namespace = "/")
def disconnected():
  """Someone disconnected. If it was a player, free the seat."""
  player = session.get("player")
  if player != None:
    free_seat(player)

@socketio.on("joined", namespace = "/")
def joined():
  """
  Send data about game format and free seats. If the game is running,
  send the history of the game.
  """
  format_data = encode(globs.game.form)
  seats_data = encode(globs.seats)
  emit("welcome", {"format": format_data, "seats": seats_data})
  if len(globs.history) > 0:
    globs.send_history()

@socketio.on("request_player_change", namespace = "/")
def request_pc(nplayer):
  """Player wants to change seats. Is it free?"""
  if is_free(nplayer):
    player = session.get("player")
    if player != None:
      free_seat(player)
    take_seat(nplayer)
    emit("confirmed_player_change", nplayer)
  else:
    emit("declined_player_change")

@socketio.on("save_cfg", namespace = "/")
def save_cfg(name, cursors, finisher):
  """Save cursor controls for later retrieval."""
  if name in globs.configs:
    emit("config_name_taken")
  else:
    globs.configs[name] = {"cursors": cursors, "finisher": finisher}
    fname = os.path.join(utility.ancestor(__file__, 2), "configs", name)
    with open(fname, "w") as cfg:
      json.dump(globs.configs[name], cfg)
    emit("save_cfg_success")

@socketio.on("load_cfg", namespace = "/")
def load_cfg(name):
  """Load previously saved cursor controls."""
  if name not in globs.configs:
    emit("config_not_exist")
  else:
    emit("cfg", globs.configs[name])



@socketio.on("actions", namespace = "/")
def actions(data):
  pid = session.get("player")
  if pid not in range(globs.game.form.num_players):
    return
  for key in data:
    if key == "finish":
      globs.finish(pid)
      continue
    if not key.isdigit():
      continue
    cid = int(key)
    globs.action(pid, cid, data[key])
