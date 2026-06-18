import os
from pymongo import MongoClient

# MongoDB connection

client = MongoClient(os.getenv("MONGO_URI"))

# Database name
db = client["myappdb"]


# OTP settings
OTP_EXPIRY_MINUTES = 5
