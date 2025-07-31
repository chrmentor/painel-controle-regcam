from src.models.user import db
from datetime import datetime

class Visit(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ip_address = db.Column(db.String(45), nullable=False)  # IPv6 pode ter até 45 caracteres
    user_agent = db.Column(db.Text)
    page_url = db.Column(db.String(500))
    referrer = db.Column(db.String(500))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    session_id = db.Column(db.String(100))
    is_unique = db.Column(db.Boolean, default=True)  # Se é uma visita única baseada em IP+UserAgent
    country = db.Column(db.String(100))
    city = db.Column(db.String(100))

    def __repr__(self):
        return f'<Visit {self.ip_address} at {self.timestamp}>'

    def to_dict(self):
        return {
            'id': self.id,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'page_url': self.page_url,
            'referrer': self.referrer,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'session_id': self.session_id,
            'is_unique': self.is_unique,
            'country': self.country,
            'city': self.city
        }

