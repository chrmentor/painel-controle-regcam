from flask import Blueprint, request, jsonify
from src.models.visit import Visit, db
from src.models.tracking_code import TrackingCode
from src.routes.auth import require_auth
from datetime import datetime, timedelta
from sqlalchemy import func, and_
import hashlib

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/track-visit', methods=['POST'])
def track_visit():
    """Endpoint público para registrar visitas do site"""
    try:
        data = request.get_json()
        ip_address = request.remote_addr
        user_agent = request.headers.get('User-Agent', '')
        page_url = data.get('page_url', '')
        referrer = data.get('referrer', '')

        # Criar um hash único baseado em IP + User Agent para identificar visitas únicas
        unique_hash = hashlib.md5(f"{ip_address}{user_agent}".encode()).hexdigest()
        
        # Verificar se já existe uma visita com esse hash nas últimas 24 horas
        yesterday = datetime.utcnow() - timedelta(days=1)
        existing_visit = Visit.query.filter(
            and_(
                Visit.session_id == unique_hash,
                Visit.timestamp >= yesterday
            )
        ).first()

        is_unique = existing_visit is None

        visit = Visit(
            ip_address=ip_address,
            user_agent=user_agent,
            page_url=page_url,
            referrer=referrer,
            session_id=unique_hash,
            is_unique=is_unique
        )

        db.session.add(visit)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Visita registrada com sucesso'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/dashboard-stats', methods=['GET'])
@require_auth
def get_dashboard_stats():
    """Retorna estatísticas para o dashboard"""
    try:
        now = datetime.utcnow()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Visitas hoje
        visits_today = Visit.query.filter(Visit.timestamp >= today).count()
        
        # Visitas únicas hoje
        unique_visits_today = Visit.query.filter(
            and_(Visit.timestamp >= today, Visit.is_unique == True)
        ).count()

        # Visitas este mês
        visits_this_month = Visit.query.filter(Visit.timestamp >= this_month).count()

        # Visitas únicas este mês
        unique_visits_this_month = Visit.query.filter(
            and_(Visit.timestamp >= this_month, Visit.is_unique == True)
        ).count()

        # Total de visitas
        total_visits = Visit.query.count()

        # Códigos ativos
        active_codes = TrackingCode.query.filter_by(is_active=True).count()

        # Última visita
        last_visit = Visit.query.order_by(Visit.timestamp.desc()).first()

        return jsonify({
            'success': True,
            'stats': {
                'visits_today': visits_today,
                'unique_visits_today': unique_visits_today,
                'visits_this_month': visits_this_month,
                'unique_visits_this_month': unique_visits_this_month,
                'total_visits': total_visits,
                'active_codes': active_codes,
                'last_visit': last_visit.to_dict() if last_visit else None
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/visits-chart', methods=['GET'])
@require_auth
def get_visits_chart():
    """Retorna dados para gráfico de visitas dos últimos 30 dias"""
    try:
        days = int(request.args.get('days', 30))
        start_date = datetime.utcnow() - timedelta(days=days)

        # Agrupar visitas por dia
        visits_by_day = db.session.query(
            func.date(Visit.timestamp).label('date'),
            func.count(Visit.id).label('total_visits'),
            func.sum(func.cast(Visit.is_unique, db.Integer)).label('unique_visits')
        ).filter(
            Visit.timestamp >= start_date
        ).group_by(
            func.date(Visit.timestamp)
        ).order_by('date').all()

        chart_data = []
        for visit_day in visits_by_day:
            chart_data.append({
                'date': visit_day.date.isoformat(),
                'total_visits': visit_day.total_visits,
                'unique_visits': visit_day.unique_visits or 0
            })

        return jsonify({
            'success': True,
            'chart_data': chart_data
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/visits', methods=['GET'])
@require_auth
def get_visits():
    """Retorna lista de visitas com paginação"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))
        
        visits = Visit.query.order_by(Visit.timestamp.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        return jsonify({
            'success': True,
            'visits': [visit.to_dict() for visit in visits.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': visits.total,
                'pages': visits.pages,
                'has_next': visits.has_next,
                'has_prev': visits.has_prev
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/visits/export', methods=['GET'])
@require_auth
def export_visits():
    """Exporta visitas em formato CSV"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = Visit.query
        
        if start_date:
            query = query.filter(Visit.timestamp >= datetime.fromisoformat(start_date))
        if end_date:
            query = query.filter(Visit.timestamp <= datetime.fromisoformat(end_date))
            
        visits = query.order_by(Visit.timestamp.desc()).all()
        
        # Criar CSV
        csv_data = "ID,IP,Data/Hora,Página,Referrer,Única\n"
        for visit in visits:
            csv_data += f"{visit.id},{visit.ip_address},{visit.timestamp},{visit.page_url},{visit.referrer},{visit.is_unique}\n"

        return jsonify({
            'success': True,
            'csv_data': csv_data,
            'total_records': len(visits)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

