import json
from ..game import Game
from ..formats import StandardFormat
from ..writer import GameEncoder

form = StandardFormat()
game = Game(form)

print(json.dumps(game, cls = GameEncoder))
print(json.dumps(form, cls = GameEncoder))
