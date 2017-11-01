import json
from .formats import StandardFormat
from .cursor import Cursor
from .player import Team, Player
from .game import Game

def rect_to_json(rect):
  return [rect.left, rect.top, rect.right, rect.bottom]

def color_to_json(color):
  return [color.r, color.g, color.b]

def form_def(form):
  res = {}
  res["canvas_size"] = list(form.canvas_size)
  res["image_files"] = form.image_files
  res["bg_color"] = color_to_json(form.bg_color)
  res["num_players"] = form.num_players
  res["num_cursors"] = form.num_cursors
  res["num_teams"] = form.num_teams
  res["team_of"] = [form.team_of(pid) for pid in range(form.num_players)]
  res["area_of"] = [rect_to_json(form.area_of(pid)) for pid in range(form.num_players)]
  res["color_of"] = [color_to_json(form.color_of(cid)) for cid in range(form.num_cursors)]
  return res

def cursor_update(cursor):
  return {"x": cursor.x, "y": cursor.y, "direction": cursor.direction}

def team_update(team):
  return {"score": team.score}

def player_update(player):
  cursors = [cursor_update(c) for c in player.cursors]
  return {"cursors": cursors, "score": player.score, "current_quest": player.current_quest}

def game_update(game):
  teams = [team_update(t) for t in game.teams]
  players = [player_update(p) for p in game.players]
  return {"teams": teams, "players": players}  

class GameEncoder(json.JSONEncoder):
  """
  Is able to serialize updates to game data: game format, teams,
  players and their cursors.
  """
  
  def default(self, obj):
    if isinstance(obj, StandardFormat):
      return form_def(obj)
    elif isinstance(obj, Cursor):
      return cursor_update(obj)
    elif isinstance(obj, Team):
      return team_update(obj)
    elif isinstance(obj, Player):
      return player_update(obj)
    elif isinstance(obj, Game):
      return game_update(obj)
    
    # Let the base class default method raise the TypeError
    return json.JSONEncoder.default(self, obj)

def encode(obj):
  """Returns a json representation of the object."""
  return json.dumps(obj, cls = GameEncoder)
