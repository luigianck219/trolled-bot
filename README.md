# 🃏 TROLLED BOT

Bot Discord per la gestione di clip con votazioni ⭐ e classifica punti 🏆.

---

## 📋 Funzionalità

| Comando | Descrizione | Chi può usarlo |
|---|---|---|
| `/post` | Pubblica una clip con votazioni | Solo Staff |
| `/punti [@utente]` | Vedi i punti tuoi o di un altro | Tutti |
| `/leaderboard mostra` | Mostra la classifica top 10 | Tutti |
| `/leaderboard imposta` | Imposta il canale leaderboard | Solo Admin |

---

## 🚀 Setup

### 1. Crea il Bot su Discord

1. Vai su [discord.com/developers/applications](https://discord.com/developers/applications)
2. Clicca **New Application** → dai un nome (es. `Trolled Bot`)
3. Vai su **Bot** → clicca **Add Bot**
4. Copia il **Token** (serve dopo)
5. In **Privileged Gateway Intents**, abilita:
   - ✅ `SERVER MEMBERS INTENT`
   - ✅ `MESSAGE CONTENT INTENT`
6. Vai su **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Send Messages`, `Embed Links`, `Read Message History`, `View Channels`
7. Usa il link generato per invitare il bot nel tuo server

---

### 2. Configura il Server Discord

1. Crea un ruolo chiamato **Staff** (o il nome che preferisci)
2. Assegna il ruolo agli utenti che possono usare `/post`
3. Crea un canale per i post (es. `#clip`)
4. Crea un canale per la leaderboard (es. `#classifica`)
5. Copia gli **ID** dei canali (click destro → Copia ID, serve la Modalità Developer nelle impostazioni Discord)

---

### 3. Deploy su Railway

1. **Fork** questo repository su GitHub
2. Vai su [railway.app](https://railway.app) e accedi con GitHub
3. Clicca **New Project → Deploy from GitHub repo**
4. Seleziona il tuo fork
5. Vai su **Variables** e aggiungi:

| Variabile | Valore | Note |
|---|---|---|
| `DISCORD_TOKEN` | `il-tuo-token` | Obbligatorio |
| `STAFF_ROLE_NAME` | `Staff` | Nome esatto del ruolo staff |
| `POST_CHANNEL_ID` | `1234567890` | ID del canale clip (opzionale) |

6. Railway farà il deploy automaticamente ✅

> **Nota Railway:** Railway offre un piano gratuito limitato. Per un bot sempre online usa il piano **Hobby** (~$5/mese) oppure aggiungi una carta di credito per avere più ore gratuite.

---

### 4. Prima configurazione nel server

Dopo che il bot è online:

1. Vai nel canale dove vuoi la **leaderboard**
2. Usa il comando: `/leaderboard imposta`
3. Il bot creerà il messaggio e lo aggiornerà automaticamente ogni 10 minuti

Per pubblicare una clip:

```
/post titolo:Nome della clip video:https://youtube.com/... utente:@nomeutente
```

---

## 📊 Sistema Punti

- Ogni clip pubblicata con `/post` riceve **5 pulsanti** di voto (⭐1 - ⭐5)
- Ogni utente può votare **una sola volta** per clip
- Non puoi votare le **tue stesse clip**
- I punti dell'utente taggato aumentano del valore del voto dato

**Esempio:**
```
Clip di @Mario riceve: 5⭐ + 4⭐ + 3⭐
Mario accumula: 12 punti totali
```

---

## 🗂️ Struttura File

```
trolled-bot/
├── src/
│   ├── index.js              # Entry point
│   ├── database.js           # SQLite database
│   ├── deploy-commands.js    # Registrazione comandi slash
│   ├── commands/
│   │   ├── post.js           # Comando /post
│   │   ├── punti.js          # Comando /punti
│   │   └── leaderboard.js    # Comando /leaderboard
│   ├── handlers/
│   │   ├── voteHandler.js    # Gestione pulsanti voto
│   │   └── leaderboardUpdater.js  # Auto-aggiornamento classifica
│   └── utils/
│       └── embeds.js         # Builder embed Discord
├── .env.example              # Template variabili d'ambiente
├── .gitignore
├── package.json
├── railway.toml              # Config Railway
└── README.md
```

---

## 🛠️ Sviluppo Locale

```bash
# Clona il repo
git clone https://github.com/tuoutente/trolled-bot
cd trolled-bot

# Installa dipendenze
npm install

# Copia e configura le variabili
cp .env.example .env
# Modifica .env con il tuo token

# Avvia in sviluppo
npm run dev
```

---

## ❓ FAQ

**Il bot non risponde ai comandi slash?**
I comandi slash globali possono impiegare fino a 1 ora per propagarsi. Aspetta un po' dopo il primo avvio.

**Come cambio il nome del ruolo staff?**
Imposta la variabile `STAFF_ROLE_NAME` con il nome esatto del ruolo (case-insensitive).

**La leaderboard non si aggiorna?**
Usa `/leaderboard imposta` nel canale desiderato per inizializzarla. Si aggiorna ogni 10 minuti.

**Dove sono salvati i dati?**
In un database SQLite nella cartella `data/`. Su Railway i dati persistono nel volume del container.
