# AI Chat — FastAPI + Gemini + MySQL

![Python](https://img.shields.io/badge/Python-3.11+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.116+-009688)
![MySQL](https://img.shields.io/badge/MySQL-8.x-orange)
![License](https://img.shields.io/badge/License-MIT-green)

A modern AI chat application built with **FastAPI**, **Google Gemini**, **MySQL**, and **Vanilla JavaScript**. It features JWT authentication, persistent conversations, streaming AI responses, and a responsive single-page interface.

---

## 🌟 Key Features

### 1. Advanced Architecture
*   **FastAPI Backend:** Lightweight, high-performance asynchronous API layer.
*   **Token-Based JWT Security:** Stateless authorization containing password hashing via `bcrypt` and session tokens with `PyJWT`.
*   **Persistent Chat History:** Automatic database schema generation and full one-to-many model mappings for `users`, `conversations`, and `messages` using **SQLAlchemy** and **MySQL**.
*   **Real-time Streaming:** Seamless server-sent streaming chunk-by-chunk using FastAPI `StreamingResponse` to eliminate response lag.
*   **Stateful AI Memory:** Automatically aggregates and builds a sliding contextual memory window of recent message history to provide stateful, interactive conversations.

### 2. Responsive Frontend SPA
*   **Fluid Responsive UX:** Custom Vanilla CSS Grid & Flexbox system. Built-in sidebar drawer for mobile viewports ($\le 680\text{px}$) with overlay dismissals.
*   **Adaptive Glassmorphism & Theme Toggle:** Seamless switching between sleeker Deep Purple Dark Mode and vibrant Ice-Blue Light Mode, saving user preferences automatically via `localStorage`.
*   **Intelligent Hash Routing:** Integrated HTML5 hash routing (`#/c/{id}`, `#/new`) that coordinates with browser navigation. Re-opening links or reloading the page keeps the exact active conversation.
*   **Client & Server-Side Validation:** Inline validation on authentication forms. Parse Pydantic `422 Unprocessable Entity` payload arrays gracefully into clear human-friendly notices.
*   **Micro-interactive Confirmations:** In-app overlay modals for sensitive actions (e.g. permanent chat deletion or signing out) with fluid transition animations.

---

## 📁 Project Structure

```text
ai-chat-fastapi-python/
├── routes/
│   ├── auth_routes.py      # User registration, login, and token generation
│   └── chat_routes.py      # Stateful chat streams, message & conversation DB endpoints
├── static/
│   ├── app.js              # State management, routing, validation, UI rendering
│   ├── index.html          # Clean HTML layout
│   └── style.css           # Premium responsive custom theme system
├── .env                    # System-wide secrets & parameters
├── .gitignore              # Ignored local files (.env, .venv, etc.)
├── app.py                  # Primary application bootstrapper & static mounts
├── auth.py                 # Core JWT verification, passwords, and security dependencies
├── database.py             # SQLAlchemy engine pool config & active thread sessions
├── models.py               # Declarative ORM schemas (Users, Conversations, Messages)
├── pyproject.toml          # uv configuration & core project packaging details
└── schemas.py              # Pydantic schema schemas (ChatRequest, UserAuth, etc.)
```

---

## 🚀 Getting Started

### 1. Prerequisites
*   Python 3.11+
*   MySQL Server running locally or remotely
*   [uv](https://github.com/astral-sh/uv) (Extremely fast Python package installer and runner)

### 2. Database Setup
Create an empty MySQL database named `ai_chat`:
```sql
CREATE DATABASE ai_chat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Environment Configurations
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-2.5-flash"

# Database Configuration (MySQL)
DATABASE_URL="mysql+pymysql://<user>:<password>@localhost:3306/ai_chat"

# JWT Token Secret Key
SECRET_KEY="generate-a-secure-secret-key"
```

### 4. Running the Application
Install dependencies and run the server instantly using `uv`:
```bash
uv run uvicorn app:app --reload
```
Once uvicorn is running, open the application in your browser:
🔗 **http://127.0.0.1:8000**

---

## 🛠️ Built With

*   **FastAPI** - Python web framework for APIs.
*   **SQLAlchemy** - Database Toolkit & ORM.
*   **PyMySQL & Cryptography** - MySQL connector and data layer encryption.
*   **Bcrypt** - Industry standard password hashing.
*   **Google GenAI Client** - Integration with Gemini 2.5 Flash.
*   **Vanilla JS, CSS & HTML5** - Responsive frontend SPA.
