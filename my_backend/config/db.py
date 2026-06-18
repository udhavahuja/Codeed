from pymongo import MongoClient

# MongoDB connection
MONGO_URI = "mongodb://localhost:27017/"

client = MongoClient(MONGO_URI)

# Database name
db = client["myappdb"]


# OTP settings
OTP_EXPIRY_MINUTES = 5
