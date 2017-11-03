import random, math
from pygame import Color, draw

class Cursor:
  """
  Contains the state of a single cursor: color, brush width, position,
  orientation, and last action ('L'eft, 'R'ight, 'S'top, 'N'one).
  """
  
  def __init__(self, color, width, move_speed, angle_speed, position, direction, canvas):
    self.color = color
    self.width = width
    self.move_speed = move_speed
    self.angle_speed = angle_speed
    self.x = position[0]
    self.y = position[1]
    self.direction = direction
    self.canvas = canvas
    self.moving = True
    self.action = 'N'
  
  def step(self):
    """
    Moves the cursor one step, changes its direction based on last
    action, and updates the canvas.
    """
    if self.action == 'L':
      self.direction -= self.angle_speed
    elif self.action == 'R':
      self.direction += self.angle_speed
    self.direction %= 1.0
    if self.moving:
      self.x += self.move_speed * math.cos(self.direction * 2.0 * math.pi)
      self.x = max(0.0, min(self.canvas.get_width(), self.x))
      self.y += self.move_speed * math.sin(self.direction * 2.0 * math.pi)
      self.y = max(0.0, min(self.canvas.get_height(), self.y))
      draw.circle(self.canvas, self.color, (int(self.x), int(self.y)), self.width // 2)
    if self.action == 'S':
      self.moving = not self.moving
    self.action = 'N'
