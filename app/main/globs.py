from .engine.game import Game
from .engine.formats import StandardFormat

game = Game(StandardFormat())
seats = [False] * game.form.num_players
playing = False
history = []
