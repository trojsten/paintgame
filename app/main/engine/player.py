import random
from pygame import Surface, transform
from .cursor import Cursor

class Team:
  def __init__(self, tid):
    self.tid = tid
    self.score = 0.0

def score(artwork, model, bg_color):
  artwork = transform.scale(artwork, (artwork.get_width()//5, artwork.get_height()//5)) # Downscale to fasten this operation
  assert artwork.get_size() == model.get_size(), "Dimensions do not match"
  num = [[0, 0], [0, 0]]
  for x in range(artwork.get_width()):
    for y in range(artwork.get_height()):
      model_color = model.get_at((x, y))
      if model_color.a == 0:
        model_color = bg_color
      on_bg = (1 if model_color == bg_color else 0)
      match = (1 if artwork.get_at((x, y)) == model_color else 0)
      num[on_bg][match] += 1
  return 100.0 * float(num[0][1]) / float(num[0][1] + num[1][0] + num[0][0])

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
      move_speed = game.form.cursor_move_speed
      angle_speed = game.form.cursor_angle_speed
      x = random.uniform(self.area.left, self.area.right)
      y = random.uniform(self.area.top, self.area.bottom)
      direction = random.random()
      self.cursors.append(Cursor(color, width, move_speed, angle_speed, (x, y), direction, self.game.canvas))
    
    self.score = 0.0
    self.team = game.teams[game.form.team_of(pid)]
    self.current_quest = random.randint(0, len(game.form.images) - 1)
    self.artworks = []
    self.action = 'N' # 'N'one, quest 'D'one and move to the next quest
    self.cooldown = 0
  
  def step(self):
    """Clear the area and score points if action is 'D'. Move cursors."""
    if self.cooldown <= 0.0:
      if self.action == 'D':
        if self.current_quest < len(self.game.form.images):
          model = self.game.form.images[self.current_quest]
          artwork = self.game.canvas.subsurface(self.area).copy()
          self.artworks.append(artwork)
          
          points = score(artwork, model, self.game.form.bg_color)
          self.score += points
          self.team.score += points
          self.game.canvas.fill(self.game.form.bg_color, self.area)
          
          # Must generate a DIFFERENT quest
          nq = self.current_quest
          while nq == self.current_quest:
            nq = random.randint(0, len(self.game.form.images) - 1)
          self.current_quest = nq
          
          self.cooldown = self.game.form.cooldown
    else:
      self.cooldown -= 1.0/self.game.form.granularity
    self.action = 'N'
    for c in self.cursors:
      c.step()
