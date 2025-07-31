from flask import Blueprint, request, jsonify, session
from src.models.admin import Admin, db
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'error': 'Username e password são obrigatórios'}), 400

        admin = Admin.query.filter_by(username=username, is_active=True).first()
        
        if admin and admin.check_password(password):
            session['admin_id'] = admin.id
            session['admin_username'] = admin.username
            admin.update_last_login()
            
            return jsonify({
                'success': True,
                'message': 'Login realizado com sucesso',
                'admin': admin.to_dict()
            }), 200
        else:
            return jsonify({'error': 'Credenciais inválidas'}), 401

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    try:
        session.clear()
        return jsonify({'success': True, 'message': 'Logout realizado com sucesso'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/check-session', methods=['GET'])
def check_session():
    try:
        if 'admin_id' in session:
            admin = Admin.query.get(session['admin_id'])
            if admin and admin.is_active:
                return jsonify({
                    'authenticated': True,
                    'admin': admin.to_dict()
                }), 200
        
        return jsonify({'authenticated': False}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/create-admin', methods=['POST'])
def create_admin():
    try:
        # Verificar se já existe um admin
        existing_admin = Admin.query.first()
        if existing_admin:
            return jsonify({'error': 'Administrador já existe'}), 400

        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')

        if not username or not password or not email:
            return jsonify({'error': 'Username, password e email são obrigatórios'}), 400

        admin = Admin(username=username, email=email)
        admin.set_password(password)
        
        db.session.add(admin)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Administrador criado com sucesso',
            'admin': admin.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

def require_auth(f):
    """Decorator para verificar autenticação"""
    def decorated_function(*args, **kwargs):
        if 'admin_id' not in session:
            return jsonify({'error': 'Acesso não autorizado'}), 401
        
        admin = Admin.query.get(session['admin_id'])
        if not admin or not admin.is_active:
            session.clear()
            return jsonify({'error': 'Acesso não autorizado'}), 401
            
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

