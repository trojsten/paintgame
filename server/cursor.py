import random, math
from pygame import Color, draw

class Cursor:
  """
  Contains the state of a single cursor: color, brush width, position,
  orientation, and last action ('L'eft, 'R'ight, 'S'top, 'N'one).
  """
  
  def __init__(self, color, width, position, direction, canvas):
    self.color = color
    self.width = width
    self.x = position[0]
    self.y = position[1]
    self.direction = direction
    self.canvas = canvas
    self.action = 'N'
  
  def step(self):
    """
    Moves the cursor one step, changes its direction based on last
    action, and updates the canvas.
    """
    if self.action == 'L':
      self.direction -= angle_speed
    elif self.action == 'R':
      self.direction += angle_speed
    self.direction %= 2 * math.pi
    if self.action != 'S':
      nx = self.x + move_speed * math.cos(self.direction)
      nx = max(0.0, min(self.canvas.get_width(), nx))
      ny = self.y + move_speed * math.sin(self.direction)
      ny = max(0.0, min(self.canvas.get_height(), ny))
      draw.line(self.canvas, self.color, (self.x, self.y), (nx, ny), self.width)
      self.x = nx
      self.y = ny
      self.action = 'N'
