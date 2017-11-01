import os
from pygame import Color, Surface, Rect, image, transform

class StandardFormat:
  """
  12 players, 4 teams of size 3, map size is 1360x768, each player's
  area has dimensions 340x256. Patterns are loaded from "images"
  subfolder. (Player and team ids are numbered from 0.)
  """
  
  def __init__(self):
    self.canvas_size = (1360, 768)
    self.image_files = ["{}.bmp".format(i) for i in range(5)]
    
    self.images = []
    for name in self.image_files:
      location = os.path.join(os.path.dirname(__file__), "images", name)
      img = transform.scale(image.load(location), (340, 256))
      self.images.append(img)
    
    self.bg_color = Color("white")
    self.num_players = 12
    self.num_cursors = 5
    self.num_teams = 4
    self.cursor_move_speed = 2.0
    self.cursor_angle_speed = 0.005
    self.cursor_width = 10.0
  
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
