from __future__ import annotations

import os
import smtplib
from email.message import EmailMessage


def send_notification(to_email: str, subject: str, body: str) -> None:
    host = os.getenv('SMTP_HOST')
    if not host:
        print(f'[notify] {to_email}: {subject}')
        return

    message = EmailMessage()
    message['From'] = os.getenv('SMTP_FROM', 'alerts@layofftracker.local')
    message['To'] = to_email
    message['Subject'] = subject
    message.set_content(body)

    with smtplib.SMTP(host, int(os.getenv('SMTP_PORT', '587'))) as smtp:
        if os.getenv('SMTP_USER') and os.getenv('SMTP_PASS'):
            smtp.starttls()
            smtp.login(os.getenv('SMTP_USER'), os.getenv('SMTP_PASS'))
        smtp.send_message(message)
