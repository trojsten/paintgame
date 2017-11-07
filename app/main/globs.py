from __future__ import print_function

import threading, os, json, pygame, datetime, sys
from flask import session
from flask_socketio import emit
from . import utility
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

# Load configs that are saved on the disk.
cfg_path = os.path.join(utility.ancestor(__file__, 2), "configs")
for name in os.listdir(cfg_path):
  f_path = os.path.join(cfg_path, name)
  if not os.path.isfile(f_path):
    continue
  with open(f_path, "r") as f:
    configs[name] = json.load(f)

# Load team scores from previous games.
scores_path = os.path.join(utility.ancestor(__file__, 2), "scores")

def load_scores():
  """A method that loads team scores from previous games."""
  team_scores = {}
  try:
    with open(scores_path, "r") as scores_f:
      team_scores = json.load(scores_f)
  except IOError:
    print("couldn't load scores, assuming it's first game", file=sys.stderr)
  for tid in range(game.form.num_teams):
    game.teams[tid].score = team_scores.get(str(tid), 0.0)

load_scores()

def save_scores():
  """Saves the team scores to the disk, will be used in further games."""
  team_scores = {}
  for tid in range(game.form.num_teams):
    team_scores[tid] = game.teams[tid].score
  with open(scores_path, "w") as scores_f:
    json.dump(team_scores, scores_f)

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
  else:
    # Save artworks to the disk.
    game_folder = str(datetime.datetime.now())
    art_path = os.path.join(utility.ancestor(__file__, 2), "artworks", game_folder)
    if not os.path.exists(art_path):
      os.makedirs(art_path)
    for pid in range(game.form.num_players):
      p_path = os.path.join(art_path, str(pid))
      if not os.path.exists(p_path):
        os.makedirs(p_path)
      for i in range(len(game.players[pid].artworks)):
        img_path = os.path.join(p_path, "{}.bmp".format(i))
        pygame.image.save(game.players[pid].artworks[i], img_path)
    # Save scores to the disk.
    save_scores()

def action(pid, cid, command):
  if pid in range(game.form.num_players):
    if cid in range(game.form.num_cursors):
      with game_lock:
        game.players[pid].cursors[cid].action = command

def finish(pid):
  if pid in range(game.form.num_players):
    with game_lock:
      game.players[pid].action = 'D'
