from pymongo import MongoClient
import certifi
from datetime import datetime

uri = "mongodb+srv://samanthaadorno30:12345678teodio@clusterezread.uaroijo.mongodb.net/?retryWrites=true&w=majority"

# Use certifi's CA bundle for TLS verification
client = MongoClient(
    uri,
    tls=True,
    tlsCAFile=certifi.where()
)

try:
    db = client["ezread"]
    test = db["test"]
    result = test.insert_one({"test": "connection success", "timestamp": datetime.utcnow()})
    print(" Successfully connected and inserted:", result.inserted_id)
except Exception as e:
    print(" Connection failed:", e)
