import smtplib
from email.message import EmailMessage

EMAIL_ADDRESS = "udhav19ahuja@gmail.com"
EMAIL_PASSWORD = "xwfwruqqyfowprkq"

def send_otp_email(to_email, otp):
    msg = EmailMessage()
    msg["Subject"] = "Password Reset OTP"
    msg["From"] = EMAIL_ADDRESS
    msg["To"] = to_email

    msg.set_content(
        f"""
Your OTP for password reset is: {otp}

Do not share this OTP with anyone.
"""
    )

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.send_message(msg)
