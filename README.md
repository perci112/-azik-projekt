# System Zarządzania Dokumentami

Aplikacja React do zarządzania dokumentami Word z możliwością edycji pól przez użytkowników.

## Funkcjonalność

### Panel Administratora
- **Wgrywanie plików Word** - Administrator może wgrać pliki .docx
- **Zaznaczanie pól do edycji** - Możliwość zaznaczenia tekstu w dokumencie i utworzenia pola do wypełnienia
- **Przypisywanie użytkowników** - Wybór użytkowników, którzy mają wypełnić dokument
- **Zarządzanie dokumentami** - Przegląd statusu dokumentów i ich postępu

### Panel Użytkownika  
- **Lista dokumentów** - Przegląd przypisanych dokumentów do wypełnienia
- **Wypełnianie pól** - Prosty formularz do uzupełnienia pól bez konieczności otwierania dokumentu Word
- **Zapisywanie postępu** - Możliwość zapisania i kontynuowania pracy później
- **Wysyłanie ukończonych dokumentów** - Finalizacja wypełniania

### System Logowania
- **Role użytkowników** - Rozróżnienie między administratorem a zwykłym użytkownikiem
- **Automatyczne przekierowanie** - Na podstawie roli użytkownika

## Konta testowe

### Administrator
- **Login:** admin
- **Hasło:** admin123

### Użytkownicy
Wszyscy użytkownicy mają hasło: **user123**

**Dostępni użytkownicy:**
- user1
- user2  
- user3
- jan.kowalski
- anna.nowak
- piotr.wisniewski

## 🚀 Uruchomienie

### Backend Django (port 3001)
```bash
cd backend
C:/Users/USER/Desktop/projetklazik/.venv/Scripts/python.exe manage.py runserver 3001
```

### Frontend React (port 3000)
```bash
npm start
```

- **Frontend:** http://localhost:3000
- **Django API:** http://localhost:3001/api/
- **Django Admin:** http://localhost:3001/admin/

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
