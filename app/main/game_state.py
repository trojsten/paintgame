from .engine.game import Game
from .engine.formats import StandardFormat

"""The global game state, used and shared by the web-processing side."""
game_state = Game(StandardFormat())
