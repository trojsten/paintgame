import threading
from flask import session
from flask_socketio import emit
from .engine.game import Game
from .engine.formats import StandardFormat
from .engine.writer import encode
from .. import socketio

"""
The seats status, whether the game is on, the history
of the game (list of all updates sent), and client saved cursor
controls.
"""
game = Game(StandardFormat())
seats = [False] * game.form.num_players
history = []
configs = {}

"""
The game engine runs as a background thread. What follows is the
threading machinery.
"""
history_lock = threading.Lock()
game_lock = threading.Lock()
game_thread = None

def start():
  starting_data = encode(game)
  with history_lock:
    history.append(starting_data)
    socketio.emit("get_ready", history, namespace = "/")
  game_thread = threading.Timer(3, step)
  game_thread.start()

def send_history():
  with history_lock:
    emit("get_ready", history, namespace = "/")

def step():
  with game_lock:
    not_done = game.step()
  if not_done:
    update_data = encode(game)
    with history_lock:
      history.append(update_data)
    socketio.emit("update", update_data, namespace = "/")
    game_thread = threading.Timer(0.05, step)
    game_thread.start()

def action(pid, cid, command):
  if pid in range(game.form.num_players):
    if cid in range(game.form.num_cursors):
      with game_lock:
        game.players[pid].cursors[cid].action = command

def finish(pid):
  if pid in range(game.form.num_players):
    with game_lock:
      game.players[pid].action = 'D'
