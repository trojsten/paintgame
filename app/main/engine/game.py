from pygame import Surface
from .player import Team, Player

class Game:
  """
  The state of the game. Is determined by the state of the canvas, the
  list of player states, the list of team states, and the game format.
  """
  
  def __init__(self, form, canvas = None):
    if canvas:
      self.canvas = canvas
    else:
      self.canvas = Surface(form.canvas_size)
    self.canvas.fill(form.bg_color)
    self.form = form
    self.teams = [Team(i) for i in range(form.num_teams)]
    self.players = [Player(i, self) for i in range(form.num_players)]
    self.rounds = form.rounds
  
  def clear(self, pid):
    """Player <pid> wants to clear his area and score points."""
    self.players[pid].action = 'D'
  
  def steer(self, pid, cid, action):
    """Player <pid>'s cursor <cid> wants to either steer or stop."""
    self.players[pid].cursors[cid].action = action

  def step(self):
    """Advance the game state."""
    if self.rounds > 0:
      for i in range(self.form.granularity):
        for player in self.players:
          player.step()
      self.rounds -= 1
      return True
    return False
