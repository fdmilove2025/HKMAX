import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def send_login_notification_email(receiver_email, username, login_method="password"):
    """Send a login notification email to the user"""
    sender_email = "fdmpod@gmail.com"
    password = "ogpl pxob anrg ymgp"
    logger.info(f"Attempting to send login notification email to {receiver_email}")
    logger.info(f"Login method: {login_method}")

    # Create message
    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = receiver_email
    message["Subject"] = "New Login to Your Account"

    # Create HTML body
    login_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    html = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px;">
                    New Login Alert
                </h2>
                <p>Hello {username},</p>
                <p>We detected a new login to your account:</p>
                <ul style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
                    <li><strong>Time:</strong> {login_time}</li>
                    <li><strong>Login Method:</strong> {login_method}</li>
                </ul>
                <p>If this was you, you can safely ignore this email. If you didn't log in, please contact our support team immediately.</p>
                <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
                    This is an automated message, please do not reply to this email.
                </p>
            </div>
        </body>
    </html>
    """

    # Attach HTML content
    message.attach(MIMEText(html, "html"))
    logger.info("Email content prepared successfully")

    try:
        logger.info("Attempting to connect to SMTP server...")
        # Create SMTP session
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            logger.info("Connected to SMTP server successfully")

            logger.info("Attempting to login to SMTP server...")
            server.login(sender_email, password)
            logger.info("SMTP login successful")

            logger.info(f"Sending email to {receiver_email}...")
            server.sendmail(sender_email, receiver_email, message.as_string())
            logger.info(f"Email sent to {receiver_email} successfully")

            logger.info("Sending copy to sender...")
            server.sendmail(sender_email, sender_email, message.as_string())
            logger.info("Copy sent to sender successfully")

            return True
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Authentication Error: {str(e)}")
        return False
    except smtplib.SMTPException as e:
        logger.error(f"SMTP Error: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error while sending email: {str(e)}")
        return False
