from flask import session
from flask_socketio import emit, join_room, leave_room
from . import globs
from .engine.writer import encode
from .. import socketio

@socketio.on("joined", namespace = "/")
def joined():
  """
  Send data about game format and free seats. If the game is running,
  send the history of the game.
  """
  format_data = encode(globs.game.form)
  seats_data = encode(globs.seats)
  emit("welcome", {"format": format_data, "seats": seats_data})

@socketio.on("request_player_change", namespace = "/")
def request_pc(nplayer):
  """Player wants to change seats. Is it free?"""
  if nplayer >= 0 and nplayer < globs.game.form.num_players:
    emit("confirmed_player_change", nplayer)

@socketio.on("save_cfg", namespace = "/")
def save_cfg(name, cursors):
  """Save cursor controls for later retrieval."""
  if name in globs.configs:
    emit("config_name_taken")
  else:
    globs.configs[name] = cursors
    emit("save_cfg_success")

@socketio.on("load_cfg", namespace = "/")
def load_cfg(name):
  """Load previously saved cursor controls."""
  if name not in globs.configs:
    emit("config_not_exist")
  else:
    emit("cfg", globs.configs[name])
