import random
from pygame import Surface

class Team:
  def __init__(self, tid):
    self.tid = tid
    self.score = 0.0

def score(artwork, model, bg_color):
  assert artwork.get_size() == model.get_size(), "Dimensions do not match"
  num = [[0, 0], [0, 0]]
  for x in range(artwork.get_width()):
    for y in range(artwork.get_height()):
      on_bg = (1 if model.get_at((x, y)) == bg_color else 0)
      match = (1 if artwork.get_at((x, y)) == model.get_at((x, y)) else 0)
      num[on_bg][match] += 1
  return num[0][1] / (num[0][1] + num[1][0] + num[0][0])

class Player:
  """
  Contains the description of a player: their area, canvas, cursors,
  score, team, current quest, artworks, and last action.
  """
  
  def __init__(self, pid, game):
    self.pid = pid
    self.game = game
    self.area = game.form.area_of(pid)
    
    self.cursors = []
    for i in range(game.form.num_cursors):
      color = game.form.color_of(i)
      width = game.form.cursor_width
      x = random.uniform(self.area.left, self.area.right)
      y = random.uniform(self.area.top, self.area.bottom)
      direction = random.random()
      cursors.append(Cursor(color, width, (x, y), direction, self.game.canvas))
    
    self.score = 0.0
    self.team = game.teams[game.form.team_of(pid)]
    self.current_quest = 0
    self.artworks = []
    self.action = 'N' # 'N'one, quest 'D'one and move to the next quest
  
  def step(self):
    """Clear the area and score points if action is 'D'. Move cursors."""
    if self.action == 'D':
      if self.current_quest < len(self.game.form.images):
        model = self.game.form.images[self.current_quest]
        artwork = self.game.canvas.subsurface(self.area).copy()
        self.score += score(artwork, model, self.game.form.bg_color)
        self.artworks.append(artwork)
        self.game.canvas.fill(self.game.form.bg_color, self.area)
        self.current_quest += 1
      self.action = 'N'
    for c in self.cursors:
      c.step()
