### 📧 backend/services/email_service.py
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import os
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class EmailService:
    """
    Servicio de email para InteliBotX.
    Maneja verificación de email y recuperación de contraseñas.
    """
    
    def __init__(self):
        # Configuración SMTP desde variables de entorno
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("FROM_EMAIL", self.smtp_username)
        self.from_name = os.getenv("FROM_NAME", "InteliBotX")
        
        # URLs frontend
        self.frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5176")
        
        if not self.smtp_username or not self.smtp_password:
            logger.warning("⚠️ Email service not configured - SMTP credentials missing")
            self.is_configured = False
        else:
            self.is_configured = True
            logger.info("✅ Email service configured")
    
    async def send_verification_email(self, user_email: str, user_name: str, verification_token: str) -> bool:
        """
        Envía email de verificación a usuario recién registrado.
        """
        if not self.is_configured:
            logger.error("❌ Cannot send verification email - service not configured")
            return False
        
        try:
            # URL de verificación
            verification_url = f"{self.frontend_url}/verify-email?token={verification_token}"
            
            # Contenido del email
            subject = "🔐 Verify your InteliBotX account"
            
            html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">🤖 InteliBotX</h1>
                        <p style="color: #e8e8e8; margin: 10px 0 0 0;">Professional Trading Platform</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 40px 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #333; margin-bottom: 20px;">Welcome {user_name}!</h2>
                        
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                            Thank you for registering with InteliBotX. To complete your account setup and start using our advanced trading algorithms, please verify your email address.
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{verification_url}" 
                               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                      color: white; 
                                      padding: 15px 30px; 
                                      text-decoration: none; 
                                      border-radius: 25px; 
                                      font-weight: bold; 
                                      display: inline-block;">
                                🔐 Verify Email Address
                            </a>
                        </div>
                        
                        <p style="color: #999; font-size: 14px; line-height: 1.5;">
                            If the button doesn't work, copy and paste this link in your browser:<br>
                            <span style="background: #e9ecef; padding: 5px; border-radius: 3px; word-break: break-all;">
                                {verification_url}
                            </span>
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                        
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            This verification link expires in 24 hours.<br>
                            If you didn't create an account with InteliBotX, please ignore this email.
                        </p>
                    </div>
                </body>
            </html>
            """
            
            text_body = f"""
            Welcome to InteliBotX!
            
            Hello {user_name},
            
            Thank you for registering with InteliBotX. To complete your account setup, please verify your email address by clicking the link below:
            
            {verification_url}
            
            This verification link expires in 24 hours.
            
            If you didn't create an account with InteliBotX, please ignore this email.
            
            Best regards,
            The InteliBotX Team
            """
            
            return await self._send_email(
                to_email=user_email,
                subject=subject,
                text_body=text_body,
                html_body=html_body
            )
            
        except Exception as e:
            logger.error(f"❌ Error sending verification email to {user_email}: {str(e)}")
            return False
    
    async def send_password_reset_email(self, user_email: str, user_name: str, reset_token: str) -> bool:
        """
        Envía email de recuperación de contraseña.
        """
        if not self.is_configured:
            logger.error("❌ Cannot send password reset email - service not configured")
            return False
        
        try:
            # URL de reset
            reset_url = f"{self.frontend_url}/reset-password?token={reset_token}"
            
            subject = "🔑 Reset your InteliBotX password"
            
            html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">🔑 Password Reset</h1>
                        <p style="color: #ffe8e8; margin: 10px 0 0 0;">InteliBotX Security</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 40px 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #333; margin-bottom: 20px;">Hello {user_name}</h2>
                        
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                            We received a request to reset your InteliBotX account password. Click the button below to create a new password:
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{reset_url}" 
                               style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); 
                                      color: white; 
                                      padding: 15px 30px; 
                                      text-decoration: none; 
                                      border-radius: 25px; 
                                      font-weight: bold; 
                                      display: inline-block;">
                                🔑 Reset Password
                            </a>
                        </div>
                        
                        <p style="color: #999; font-size: 14px; line-height: 1.5;">
                            If the button doesn't work, copy and paste this link in your browser:<br>
                            <span style="background: #e9ecef; padding: 5px; border-radius: 3px; word-break: break-all;">
                                {reset_url}
                            </span>
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                        
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            This password reset link expires in 1 hour.<br>
                            If you didn't request this reset, please ignore this email and your password will remain unchanged.
                        </p>
                    </div>
                </body>
            </html>
            """
            
            text_body = f"""
            Password Reset Request
            
            Hello {user_name},
            
            We received a request to reset your InteliBotX account password. Click the link below to create a new password:
            
            {reset_url}
            
            This password reset link expires in 1 hour.
            
            If you didn't request this reset, please ignore this email and your password will remain unchanged.
            
            Best regards,
            The InteliBotX Team
            """
            
            return await self._send_email(
                to_email=user_email,
                subject=subject,
                text_body=text_body,
                html_body=html_body
            )
            
        except Exception as e:
            logger.error(f"❌ Error sending password reset email to {user_email}: {str(e)}")
            return False
    
    async def _send_email(self, to_email: str, subject: str, text_body: str, html_body: str) -> bool:
        """
        Método interno para enviar emails via SMTP.
        """
        try:
            # Crear mensaje
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = to_email
            
            # Agregar contenido text y HTML
            text_part = MIMEText(text_body, "plain")
            html_part = MIMEText(html_body, "html")
            
            message.attach(text_part)
            message.attach(html_part)
            
            # Crear conexión SMTP segura
            context = ssl.create_default_context()
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.smtp_username, self.smtp_password)
                server.sendmail(self.from_email, to_email, message.as_string())
            
            logger.info(f"✅ Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"❌ SMTP error sending email to {to_email}: {str(e)}")
            return False
    
    def test_connection(self) -> bool:
        """
        Prueba la conexión SMTP sin enviar email.
        """
        if not self.is_configured:
            return False
        
        try:
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.smtp_username, self.smtp_password)
            
            logger.info("✅ SMTP connection test successful")
            return True
            
        except Exception as e:
            logger.error(f"❌ SMTP connection test failed: {str(e)}")
            return False

# Instancia global del servicio
email_service = EmailService()