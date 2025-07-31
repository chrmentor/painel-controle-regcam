from flask import Blueprint, request, jsonify, session
from src.models.tracking_code import TrackingCode, db
from src.routes.auth import require_auth
import os
import shutil
from datetime import datetime

tracking_bp = Blueprint('tracking', __name__)

@tracking_bp.route('/codes', methods=['GET'])
@require_auth
def get_codes():
    try:
        codes = TrackingCode.query.order_by(TrackingCode.created_at.desc()).all()
        return jsonify({
            'success': True,
            'codes': [code.to_dict() for code in codes]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tracking_bp.route('/codes', methods=['POST'])
@require_auth
def create_code():
    try:
        data = request.get_json()
        name = data.get('name')
        description = data.get('description', '')
        code_content = data.get('code_content')
        position = data.get('position')  # 'head', 'body', 'footer'

        if not name or not code_content or not position:
            return jsonify({'error': 'Nome, código e posição são obrigatórios'}), 400

        if position not in ['head', 'body', 'footer']:
            return jsonify({'error': 'Posição deve ser head, body ou footer'}), 400

        code = TrackingCode(
            name=name,
            description=description,
            code_content=code_content,
            position=position,
            created_by=session['admin_id']
        )

        db.session.add(code)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Código criado com sucesso',
            'code': code.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tracking_bp.route('/codes/<int:code_id>', methods=['PUT'])
@require_auth
def update_code(code_id):
    try:
        code = TrackingCode.query.get_or_404(code_id)
        data = request.get_json()

        code.name = data.get('name', code.name)
        code.description = data.get('description', code.description)
        code.code_content = data.get('code_content', code.code_content)
        code.position = data.get('position', code.position)
        code.is_active = data.get('is_active', code.is_active)
        code.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Código atualizado com sucesso',
            'code': code.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tracking_bp.route('/codes/<int:code_id>', methods=['DELETE'])
@require_auth
def delete_code(code_id):
    try:
        code = TrackingCode.query.get_or_404(code_id)
        db.session.delete(code)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Código excluído com sucesso'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tracking_bp.route('/codes/<int:code_id>/toggle', methods=['POST'])
@require_auth
def toggle_code(code_id):
    try:
        code = TrackingCode.query.get_or_404(code_id)
        code.is_active = not code.is_active
        code.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Código {"ativado" if code.is_active else "desativado"} com sucesso',
            'code': code.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tracking_bp.route('/apply-codes', methods=['POST'])
@require_auth
def apply_codes():
    """Aplica os códigos ativos aos arquivos HTML do site"""
    try:
        # Caminho para o site principal (assumindo que está no mesmo servidor)
        site_path = '/home/ubuntu/siteregularizacaminhoneiro/siteregularizacaminhoneiro-main'
        index_file = os.path.join(site_path, 'index.html')
        
        if not os.path.exists(index_file):
            return jsonify({'error': 'Arquivo index.html do site não encontrado'}), 404

        # Fazer backup do arquivo original
        backup_file = f"{index_file}.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        shutil.copy2(index_file, backup_file)

        # Ler o arquivo HTML atual
        with open(index_file, 'r', encoding='utf-8') as f:
            html_content = f.read()

        # Buscar códigos ativos
        active_codes = TrackingCode.query.filter_by(is_active=True).all()

        # Aplicar códigos por posição
        for code in active_codes:
            if code.position == 'head':
                # Inserir antes do </head>
                html_content = html_content.replace('</head>', f'{code.code_content}\n</head>')
            elif code.position == 'body':
                # Inserir após o <body>
                html_content = html_content.replace('<body>', f'<body>\n{code.code_content}')
            elif code.position == 'footer':
                # Inserir antes do </body>
                html_content = html_content.replace('</body>', f'{code.code_content}\n</body>')

        # Salvar o arquivo modificado
        with open(index_file, 'w', encoding='utf-8') as f:
            f.write(html_content)

        return jsonify({
            'success': True,
            'message': f'Códigos aplicados com sucesso. Backup salvo em {backup_file}',
            'applied_codes': len(active_codes),
            'backup_file': backup_file
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

