import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.config import settings


print("✅ Configurations Loaded Successfully!")

print(f"Project Name: {settings.LANGSMITH_PROJECT}")