from flask import Flask
from flask_socketio import SocketIO
import eventlet
eventlet.monkey_patch()

socketio = SocketIO()

def create_app(debug = False):
    """Create an application."""
    app = Flask(__name__)
    app.debug = debug
    app.config['SECRET_KEY'] = 'E236tCpzRqraeCv7RZVaQhSiYnlJ:yZN'
    
    from .main import main as main_blueprint
    app.register_blueprint(main_blueprint)
    
    socketio.init_app(app, async_mode="eventlet")
    return app
