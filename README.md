# SOLIVAGUS DISCORD BOT

This project features a comprehensive Discord bot with robust moderation and ticket systems, backed by a SQL database for persistent data storage.

---

## 🚀 Quick Start

### ⚙️ Installation & Setup

1.  **Clone the Repository:**
    ```bash
    git clone solivagus
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    * Copy the example file:
        ```bash
        cp .env.example .env
        ```
    * Fill in the necessary details in the newly created `.env` file:
        * **`TOKEN`** (Your Bot Token)
        * **`CLIENT_ID`** (Your Bot Client ID)
        * **`GUILD_ID`** (Your Test Server ID, keep empty for global deployment)
        * **`DATABASE_URL`** (Your SQL Database Connection String)

4.  **Database Migration:**
    * The bot will **automatically** create the `moderation_logs`, `warns`, and `temprole` tables on startup.
    * For manual review or migration details, check `utils/moderationData.js`.

5.  **Deploy Slash Commands:**
    Register all slash commands to your test guild:
    ```bash
    npm run deploy
    ```

6.  **Run the Bot:**
    ```bash
    npm start
    # Alternative: node index.js (Runs DB migrations on startup)
    ```

---

## ✨ Key Features & Commands

### 🛡️ Moderation System

This system is fully **SQL-backed**, providing persistent records for all moderation actions.

| Feature | Commands | Description |
| :--- | :--- | :--- |
| **Warning System** | `/warn` <br> `/warnlist` <br> `/delwarn` <br> `/warnsummary` <br> `/setwarnconfig` | Manage user warnings, view history, and configure warning limits. |
| **Temporary Roles** | `/temprole_add` <br> `/temprole_remove` <br> `/temprole_list` | Assign roles for a limited duration. |

### 🎫 Ticket System Configuration (Admin)

Use the `/ticket` command for all panel setup and management.

| Command | Example Use |
| :--- | :--- |
| `/ticket addbutton` | `/ticket addbutton label:"Help" custom_id:"help" style:primary` |
| `/ticket setcategory` | `/ticket setcategory <#category-channel>` |
| `/ticket sendpanel` | Sends or updates the panel in the current channel. |
| `/ticket editpanel` | Edits an existing panel configuration. |
| `/ticket ban`, `/ticket unban`, `/ticket listbans` | Manage users who are blocked from creating tickets. |

### 👥 User Flow

1.  Users click a button on the panel to **create a ticket channel**.
2.  Admins/handlers manage the discussion.
3.  Tickets can be **closed**, **deleted**, and **reopened**.

---

### ℹ️ General Command

* `/help` - Show the bot's full help guide.
