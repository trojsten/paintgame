import os
from pygame import Color, Surface, Rect, image

class StandardFormat:
  """
  12 players, 4 teams of size 3, map size is 1360x768, each player's
  area has dimensions 340x256. Patterns are loaded from "pattern"
  subfolder. (Player and team ids are numbered from 0.)
  """
  
  def __init__(self):
    self.image_files = ["{}.bmp".format(i) for i in range(5)]
    self.images = [image.load(os.path.join("images", name)) for name in image_files]
    self.canvas_size = (1360, 768)
    self.bg_color = Color("white")
    self.num_players = 12
    self.num_cursors = 5
    self.num_teams = 4
    self.cursor_move_speed = 10
    self.cursor_angle_speed = 0.05
    self.cursor_width = 20
  
  def team_of(self, player):
    return player // 3
  
  def area_of(self, player):
    r = player // 4
    c = player % 4
    return Rect(c * 340, r * 256, 340, 256)
  
  def color_of(self, cursor):
    if cursor < 3:
      return Color("black")
    return Color("white")
