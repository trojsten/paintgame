from flask import session, redirect, url_for, render_template, request
from . import main, globs
from .forms import PasswordForm
from .. import socketio

@main.route("/")
def index():
  """Where you can join, play, and spectate."""
  return render_template("index.html", form = globs.game.form)

@main.route("/admin", methods = ["GET", "POST"])
def admin():
  """
  The whole purpose of the page is to enable starting the game
  at a qualified person's will.
  """
  globs.start()
  return redirect(url_for('.index'))
  """
  msg = ""
  form = PasswordForm()
  if form.validate_on_submit():
    # Do not do password validation in a serious application this way, please.
    if form.password.data == "abrakadabra":
      globs.start()
      return redirect(url_for('.index'))
    msg = "Wrong password."
  return render_template("admin.html", form = form, message = msg)
  """
