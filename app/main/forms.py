from flask_wtf import Form
from wtforms.fields import PasswordField, SubmitField
from wtforms.validators import Required

class PasswordForm(Form):
  """Accepts a password."""
  password = PasswordField("Password", validators = [Required()])
  submit = SubmitField("Start the game!")
