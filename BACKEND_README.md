# 🗂️ System Zarządzania Dokumentami - Django + React

Pełny system zarządzania dokumentami Word z backendem Django i frontendem React.Następnie idź do: `http://localhost:3001/admin/`

## 🏗️ Architektura

- **Backend**: Django REST API (port 3001)
- **Frontend**: React + TypeScript (port 3000)
- **Baza danych**: SQLite (rozwój)

## 🚀 Uruchomienie

### Backend Django

1. **Przejdź do folderu backend:**
   ```bash
   cd backend
   ```

2. **Aktywuj środowisko wirtualne:**
   ```bash
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Uruchom serwer Django:**
   ```bash
   python manage.py runserver 3001
   ```
   
   Backend będzie dostępny pod: `http://localhost:3001`

### Frontend React

1. **W nowym terminalu, przejdź do głównego folderu:**
   ```bash
   # Z głównego folderu projektu
   npm start
   ```
   
   Frontend będzie dostępny pod: `http://localhost:3000`

## 🔑 Konta testowe

### Administrator
- **Login:** `admin`
- **Hasło:** `admin123`

### Użytkownicy
Wszyscy użytkownicy mają hasło: `user123`

**Dostępni użytkownicy:**
- `user1`
- `user2`
- `user3`
- `jan.kowalski`
- `anna.nowak`
- `piotr.wisniewski`

## 📋 Funkcjonalność

### 👨‍💼 Panel Administratora
- ✅ **Upload dokumentów Word** (.doc, .docx)
- ✅ **Konwersja do HTML** (mammoth.js)
- ✅ **Zaznaczanie pól do edycji**
- ✅ **Przypisywanie użytkowników**
- ✅ **Monitoring wypełnionych dokumentów**

### 👤 Panel Użytkownika
- ✅ **Lista przypisanych dokumentów**
- ✅ **Wypełnianie formularzy**
- ✅ **Zapisywanie postępu**
- ✅ **Finalizacja dokumentów**

## 🔧 API Endpoints

### Autentykacja
- `POST /api/auth/login/` - Logowanie
- `POST /api/auth/logout/` - Wylogowanie
- `GET /api/auth/current-user/` - Aktualny użytkownik

### Dokumenty
- `POST /api/documents/upload/` - Upload dokumentu
- `GET /api/documents/admin/` - Lista dokumentów admina
- `POST /api/documents/create-field/` - Tworzenie pola
- `POST /api/documents/assign/` - Przypisanie do użytkowników

### Przypisania
- `GET /api/assignments/user/` - Przypisania użytkownika
- `GET /api/assignments/completed/` - Ukończone przypisania
- `POST /api/assignments/submit-values/` - Zapisanie wartości
- `POST /api/assignments/{id}/complete/` - Finalizacja

### Użytkownicy
- `GET /api/users/` - Lista użytkowników (tylko admin)

## 🗄️ Modele bazy danych

- **UserProfile** - Profile użytkowników z rolami
- **Document** - Dokumenty Word i ich zawartość HTML
- **EditableField** - Pola do edycji w dokumentach
- **DocumentAssignment** - Przypisania dokumentów do użytkowników
- **FieldValue** - Wartości wypełnione przez użytkowników
- **DocumentVersion** - Wersje dokumentów z wypełnionymi polami

## 🛠️ Technologie

### Backend
- Django 5.2
- Django REST Framework
- django-cors-headers
- mammoth (konwersja Word → HTML)
- python-docx
 - social-auth-app-django (Discord OAuth)
 - python-dotenv (.env konfiguracja)

### Frontend
- React 18
- TypeScript
- React Router DOM
- CSS3 (responsywny design)

## 📝 Development

### Tworzenie nowych migracji
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### Dostęp do Django Admin
```bash
cd backend
python manage.py createsuperuser
```
Następnie idź do: `http://localhost:8000/admin/`

### Testowanie API
Możesz testować API używając narzędzi takich jak:
- Postman
- curl
- Django REST Framework browsable API: `http://localhost:3001/api/`

## 🔐 Logowanie przez Discord (OAuth2)

Konfiguracja logowania przez Discord w środowisku deweloperskim:

1) Utwórz aplikację w Discord Developer Portal:
   - https://discord.com/developers/applications → New Application → OAuth2 → General
   - Skopiuj Client ID i Client Secret

2) Skonfiguruj Redirect URL w aplikacji Discord:
   - Dodaj dokładnie ten adres (z portem backendu):
     - http://localhost:3001/api/oauth/complete/discord/

3) Skonfiguruj backend/.env:
   - Skopiuj plik: `backend/.env.example` → `backend/.env`
   - Uzupełnij wartości:
     - DISCORD_CLIENT_ID=123456789012345678
     - DISCORD_CLIENT_SECRET=twoj_tajemny_klucz
     - (opcjonalnie) LOGIN_REDIRECT_URL, LOGIN_ERROR_URL

4) Uruchom ponownie backend (auto-reload powinien zadziałać). W logach dev zobaczysz ostrzeżenie, jeśli brakuje danych:
   - "[Discord OAuth] WARNING: DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET is not set ..."

5) Logowanie z frontendu:
   - Kliknij „Zaloguj przez Discord” → otworzy się popup do Discorda
   - Po udanym logowaniu popup się zamknie, a sesja zostanie ustawiona po stronie Django
   - Front odpyta `/api/auth/current-user/` i pokaże odpowiedni panel (profil, użytkownik, admin)

Najczęstsze problemy:
- "client_id ... nie jest snowflake" → Client ID jest niepoprawny (musi być liczbowym ID aplikacji) albo nie jest wczytany z `.env`
- 403 CSRF przy POST → odśwież stronę, upewnij się że frontend pobrał cookie CSRF z `/api/auth/csrf/`

## 🔮 Przyszłe rozszerzenia

- [ ] Eksport wypełnionych dokumentów do Word
- [ ] System powiadomień email
- [ ] Więcej typów pól (checkbox, select, etc.)
- [ ] Historia zmian dokumentów
- [ ] Podgląd dokumentu z wypełnionymi polami
- [ ] Integracja z systemami zewnętrznymi
- [ ] Deployment na produkcję

## 🐛 Rozwiązywanie problemów

### CORS Error
Upewnij się, że Django backend działa na porcie 3001 i że `django-cors-headers` jest prawidłowo skonfigurowany.

### Błędy importu mammoth
Sprawdź czy mammoth jest zainstalowany w środowisku wirtualnym:
```bash
pip list | grep mammoth
```

### Błędy autentykacji
Sprawdź czy cookies są włączone i czy backend/frontend działają na odpowiednich portach.

---

**🎉 System jest gotowy do użycia!** 

Zaloguj się jako admin i zacznij wgrywać dokumenty! 📄✨
