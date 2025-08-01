import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.user import db
from src.models.admin import Admin
from src.models.tracking_code import TrackingCode
from src.models.visit import Visit
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.tracking import tracking_bp
from src.routes.analytics import analytics_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'RegularizaCaminhoneiro2024#PainelControle$Seguro!'

# Habilitar CORS para todas as rotas
CORS(app)

# Registrar blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(tracking_bp, url_prefix='/api/tracking')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')

# Configuração do banco de dados
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    db.create_all()
    
    # Criar admin padrão se não existir
    if not Admin.query.first():
        default_admin = Admin(
            username='admin',
            email='admin@regularizacaminhoneiro.com'
        )
        default_admin.set_password('admin123')
        db.session.add(default_admin)
        db.session.commit()
        print("Admin padrão criado: admin/admin123")

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
