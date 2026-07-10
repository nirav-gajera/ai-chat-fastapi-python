# def main():
#     print("Hello from ai-chat-fastapi-python!")


# if __name__ == "__main__":
#     main()


from dotenv import load_dotenv
from google import genai
import os

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Explain LangGraph in one sentence"
)

print(response.text)