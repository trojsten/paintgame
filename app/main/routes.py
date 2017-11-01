from flask import session, redirect, url_for, render_template, request
from . import main

@main.route('/', methods = ["GET", "POST"])
def index():
  session["my_key"] = "alibaba"
  return render_template("index.html")

@main.route('/play')
def game():
  return render_template("game.html")
