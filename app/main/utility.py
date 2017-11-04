import os

def ancestor(location, x):
  """Helper function to return the directory <x> levels above."""
  for i in range(x):
    location = os.path.dirname(location)
  return location
