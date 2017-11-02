from .engine.game import Game
from .engine.formats import StandardFormat

"""
The game state, seats status, whether the game is on, the history
of the game (list of all updates sent), and client saved cursor
controls.
"""
game = Game(StandardFormat())
seats = [False] * game.form.num_players
playing = False
history = []
configs = {}
