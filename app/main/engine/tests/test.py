import random
from pygame import display
from time import sleep
from ..formats import StandardFormat
from ..game import Game

form = StandardFormat()
canvas = display.set_mode(form.canvas_size)
game = Game(form, canvas)

while True:
  sleep(0.05)
  for i in range(10):
    game.step()
  display.flip()
  for pid in range(form.num_players):
    for cid in range(form.num_cursors):
      if random.random() < 0.5:
        game.steer(pid, cid, ('L' if (pid + cid) % 2 == 0 else 'R'))
  if random.random() < 0.01:
    for pid in range(form.num_players):
      for cid in range(form.num_cursors):
        if random.choice([True, False]):
          game.steer(pid, cid, 'S')
  if random.random() < 0.02:
    pid = random.randint(0, form.num_players - 1)
    game.clear(pid)
