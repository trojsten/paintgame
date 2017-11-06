import os
from pygame import Color, Surface, Rect, image, transform
from .. import utility

class StandardFormat:
  """
  12 players, 4 teams of size 3, map size is 1360x768, each player's
  area has dimensions 340x256. Patterns are loaded from "images"
  subfolder. (Player and team ids are numbered from 0.)
  """
  
  def __init__(self):
    self.canvas_size = (1440, 720)
    
    self.image_files = []
    img_list_location = os.path.join(utility.ancestor(__file__, 3), "static/images/image_list.txt")
    with open(img_list_location, "r") as img_f:
      for line in list(img_f):
        name = line.strip()
        if name != "":
          self.image_files.append(name)
    
    self.images = []
    for name in self.image_files:
      location = os.path.join(utility.ancestor(__file__, 3), "static/images", name)
      img = transform.scale(image.load(location), (66, 44))
      self.images.append(img)
    
    self.bg_color = Color("white")
    self.num_players = 12
    self.num_cursors = 5
    self.num_teams = 4
    self.cursor_move_speed = 0.25
    self.cursor_angle_speed = 0.05
    self.cursor_width = 8
    self.color_names = ["red", "green", "blue", "yellow", "black"]
    self.granularity = 10
    self.rounds = 2880
    self.cooldown = 60.0
  
  def team_of(self, player):
    return player // 3
  
  def area_of(self, player):
    r = player // 4
    c = player % 4
    return Rect(c * 360 + 15, r * 240 + 10, 330, 220)
  
  def color_of(self, cursor):
    return Color(self.color_names[cursor])
