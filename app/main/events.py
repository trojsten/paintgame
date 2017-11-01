from flask import session
from flask_socketio import emit, join_room, leave_room
from . import globs
from .engine.writer import encode
from .. import socketio

@socketio.on("joined", namespace = "/")
def joined():
  # Send data about game format and free seats.
  format_data = encode(globs.game.form)
  seats_data = encode(globs.seats)
  emit("welcome", {"format": format_data, "seats": seats_data})

@socketio.on("request_player_change", namespace = "")
def request_pc(nplayer):
  if nplayer >= 0 and nplayer < globs.game.form.num_players:
    emit("confirmed_player_change", nplayer)
