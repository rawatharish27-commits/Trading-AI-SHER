"""
Notification Service
Multi-channel notifications for trading alerts
"""

import asyncio
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum
import aiohttp
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from loguru import logger


class NotificationChannel(str, Enum):
    """Notification channels"""
    TELEGRAM = "TELEGRAM"
    EMAIL = "EMAIL"
    WEBHOOK = "WEBHOOK"
    PUSH = "PUSH"
    SMS = "SMS"


class NotificationLevel(str, Enum):
    """Notification levels"""
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    TRADE = "TRADE"
    EXIT = "EXIT"
    PROFIT = "PROFIT"
    LOSS = "LOSS"


@dataclass
class Notification:
    """Notification data"""
    level: NotificationLevel
    title: str
    message: str
    timestamp: datetime = None
    data: Dict = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()


class TelegramNotifier:
    """
    Telegram Bot Notification
    
    Setup:
    1. Create bot via @BotFather
    2. Get bot token
    3. Get chat ID by messaging the bot
    """

    def __init__(self, bot_token: str = None, chat_id: str = None):
        self.bot_token = bot_token
        self.chat_id = chat_id
        self.api_url = f"https://api.telegram.org/bot{bot_token}" if bot_token else None

    async def send(self, notification: Notification) -> bool:
        """Send notification via Telegram"""
        if not self.bot_token or not self.chat_id:
            logger.warning("Telegram not configured")
            return False

        try:
            # Format message with emoji based on level
            emoji_map = {
                NotificationLevel.INFO: "ℹ️",
                NotificationLevel.WARNING: "⚠️",
                NotificationLevel.ERROR: "❌",
                NotificationLevel.TRADE: "🤖",
                NotificationLevel.EXIT: "📤",
                NotificationLevel.PROFIT: "💰",
                NotificationLevel.LOSS: "📉",
            }

            emoji = emoji_map.get(notification.level, "📢")

            text = f"""
{emoji} *{notification.title}*

{notification.message}

⏰ {notification.timestamp.strftime('%Y-%m-%d %H:%M:%S')}
"""

            async with aiohttp.ClientSession() as session:
                url = f"{self.api_url}/sendMessage"
                params = {
                    "chat_id": self.chat_id,
                    "text": text,
                    "parse_mode": "Markdown",
                }

                async with session.post(url, params=params) as response:
                    if response.status == 200:
                        logger.debug("Telegram notification sent")
                        return True
                    else:
                        logger.error(f"Telegram API error: {response.status}")
                        return False

        except Exception as e:
            logger.error(f"Telegram notification failed: {e}")
            return False


class EmailNotifier:
    """
    Email Notification
    
    Supports Gmail, Outlook, and custom SMTP servers
    """

    def __init__(
        self,
        smtp_server: str = "smtp.gmail.com",
        smtp_port: int = 587,
        sender_email: str = None,
        sender_password: str = None,
        recipient_email: str = None,
    ):
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.sender_email = sender_email
        self.sender_password = sender_password
        self.recipient_email = recipient_email

    async def send(self, notification: Notification) -> bool:
        """Send notification via email"""
        if not self.sender_email or not self.recipient_email:
            logger.warning("Email not configured")
            return False

        try:
            # Create message
            msg = MIMEMultipart()
            msg["From"] = self.sender_email
            msg["To"] = self.recipient_email
            msg["Subject"] = f"[{notification.level.value}] {notification.title}"

            # Email body
            body = f"""
{notification.title}

{notification.message}

Timestamp: {notification.timestamp.strftime('%Y-%m-%d %H:%M:%S')}

---
Trading AI SHER Automated Trading System
"""
            msg.attach(MIMEText(body, "plain"))

            # Send email
            def send_email():
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.sender_email, self.sender_password)
                    server.send_message(msg)

            # Run in thread pool
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, send_email)

            logger.debug("Email notification sent")
            return True

        except Exception as e:
            logger.error(f"Email notification failed: {e}")
            return False


class WebhookNotifier:
    """
    Webhook Notification
    
    Sends POST requests to configured URL
    """

    def __init__(self, webhook_url: str = None, secret: str = None):
        self.webhook_url = webhook_url
        self.secret = secret

    async def send(self, notification: Notification) -> bool:
        """Send notification via webhook"""
        if not self.webhook_url:
            logger.warning("Webhook not configured")
            return False

        try:
            payload = {
                "level": notification.level.value,
                "title": notification.title,
                "message": notification.message,
                "timestamp": notification.timestamp.isoformat(),
                "data": notification.data,
                "secret": self.secret,
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.webhook_url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status in [200, 201, 204]:
                        logger.debug("Webhook notification sent")
                        return True
                    else:
                        logger.error(f"Webhook error: {response.status}")
                        return False

        except Exception as e:
            logger.error(f"Webhook notification failed: {e}")
            return False


class NotificationService:
    """
    Multi-channel Notification Service
    
    Supports:
    - Telegram
    - Email
    - Webhook
    - Push notifications
    """

    def __init__(self):
        """Initialize notification service"""
        self.telegram = TelegramNotifier()
        self.email = EmailNotifier()
        self.webhook = WebhookNotifier()

        self.notification_history: List[Notification] = []
        self.max_history = 1000

        logger.info("📢 Notification Service initialized")

    def configure_telegram(self, bot_token: str, chat_id: str):
        """Configure Telegram notifications"""
        self.telegram = TelegramNotifier(bot_token, chat_id)
        logger.info("Telegram configured")

    def configure_email(
        self,
        sender_email: str,
        sender_password: str,
        recipient_email: str,
        smtp_server: str = "smtp.gmail.com",
        smtp_port: int = 587,
    ):
        """Configure email notifications"""
        self.email = EmailNotifier(
            smtp_server=smtp_server,
            smtp_port=smtp_port,
            sender_email=sender_email,
            sender_password=sender_password,
            recipient_email=recipient_email,
        )
        logger.info("Email configured")

    def configure_webhook(self, webhook_url: str, secret: str = None):
        """Configure webhook notifications"""
        self.webhook = WebhookNotifier(webhook_url, secret)
        logger.info("Webhook configured")

    async def notify(
        self,
        level: NotificationLevel,
        title: str,
        message: str,
        channels: List[NotificationChannel] = None,
        data: Dict = None,
    ) -> Dict[str, bool]:
        """
        Send notification to multiple channels
        
        Args:
            level: Notification level
            title: Notification title
            message: Notification message
            channels: List of channels (default: all)
            data: Additional data
            
        Returns:
            Dict of channel -> success status
        """
        notification = Notification(
            level=level,
            title=title,
            message=message,
            data=data,
        )

        # Store in history
        self.notification_history.append(notification)
        if len(self.notification_history) > self.max_history:
            self.notification_history = self.notification_history[-self.max_history:]

        # Default to all channels
        if channels is None:
            channels = [
                NotificationChannel.TELEGRAM,
                NotificationChannel.EMAIL,
                NotificationChannel.WEBHOOK,
            ]

        results = {}

        # Send to each channel
        tasks = []

        if NotificationChannel.TELEGRAM in channels:
            tasks.append(("telegram", self.telegram.send(notification)))

        if NotificationChannel.EMAIL in channels:
            tasks.append(("email", self.email.send(notification)))

        if NotificationChannel.WEBHOOK in channels:
            tasks.append(("webhook", self.webhook.send(notification)))

        # Execute all
        for name, task in tasks:
            try:
                results[name] = await task
            except Exception as e:
                logger.error(f"Notification failed for {name}: {e}")
                results[name] = False

        return results

    # Convenience methods
    async def notify_trade(self, title: str, message: str, data: Dict = None):
        """Send trade notification"""
        return await self.notify(
            level=NotificationLevel.TRADE,
            title=title,
            message=message,
            data=data,
        )

    async def notify_exit(self, title: str, message: str, data: Dict = None):
        """Send exit notification"""
        return await self.notify(
            level=NotificationLevel.EXIT,
            title=title,
            message=message,
            data=data,
        )

    async def notify_warning(self, title: str, message: str, data: Dict = None):
        """Send warning notification"""
        return await self.notify(
            level=NotificationLevel.WARNING,
            title=title,
            message=message,
            data=data,
        )

    async def notify_error(self, title: str, message: str, data: Dict = None):
        """Send error notification"""
        return await self.notify(
            level=NotificationLevel.ERROR,
            title=title,
            message=message,
            data=data,
        )

    def get_recent_notifications(self, limit: int = 50) -> List[Dict]:
        """Get recent notifications"""
        recent = self.notification_history[-limit:]
        return [
            {
                "level": n.level.value,
                "title": n.title,
                "message": n.message,
                "timestamp": n.timestamp.isoformat(),
                "data": n.data,
            }
            for n in recent
        ]


# Singleton instance
notification_service = NotificationService()
