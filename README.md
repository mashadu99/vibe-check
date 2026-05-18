# Vibe Check — יועצת הוויב שלך

סוכן AI לייעוץ זוגי/חברתי בסגנון Gen Z.

## דרישות

- Python 3.10+
- Node.js 18+
- Groq API Key (בחינם ב-console.groq.com)

## הגדרה ראשונית

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# ערוך את .env והוסף את ה-GROQ_API_KEY שלך
```

### 2. Frontend

```bash
cd frontend
npm install
```

## הרצה

**טרמינל 1 — Backend:**
```bash
cd backend
uvicorn main:app --reload
```

**טרמינל 2 — Frontend:**
```bash
cd frontend
npm run dev
```

פתח את הדפדפן ב-http://localhost:3000

## קבלת Groq API Key

1. היכנס ל-https://console.groq.com
2. Sign up / Login
3. לחץ על "API Keys" → "Create API Key"
4. העתק את המפתח ל-`backend/.env`
