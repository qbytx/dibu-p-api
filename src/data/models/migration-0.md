# Dibumon User Schema

## Users Table

| Field                       | Type        | Description                                           |
|-----------------------------|-------------|-------------------------------------------------------|
| `user_id`                   | UUID        | Unique identifier for each user.                      |
| `username`                  | string      | Username for the Dibumon app.                         |
| `email`                     | string      | Hashed email address.                                 |
| `password`                  | string      | Hashed password for non-oauth.                        |
| `created_at`                | timestamp   | When the user account was created.                    |
| `updated_at`                | timestamp   | When the user account was last updated.               |
| `last_login`                | timestamp   | Timestamp of the last login.                          |
| `email_verified`            | boolean     | Indicates if the user's email is verified.            |
| `is_active`                 | boolean     | true if user was active in last 180 days.             |
| `is_online`                 | boolean     | true if user is online.                               |
| `created_by`                | integer     | (0 = client, 1 = admin).                              |
| `friends`                   | JSON        | Array of user's friends.                              |
| `log_activity`              | JSON        | User activity logs.                                   |
| `data_acccount`             | JSON        | User-specific account data.                           |
| `data_settings`             | JSON        | User-specific settings data.                          |
| `data_discord`              | JSON        | JSON object for Discord-specific data.                |
| `data_google`               | JSON        | JSON object for Google-specific data.                 |
| `data_user`                 | JSON        | JSON object for user-related data.                    |
| `data_dibumon`              | JSON        | JSON object storing dibumon-related data.             |
| `oauth_token_discord`       | string      | OAuth token for Discord API interactions.             |
| `oauth_token_google`        | string      | OAuth token for Google API interactions.              |

---

## User Data JSON Schema

```json
{
  "inventory": [
    {
      "item_id": "string", // Unique identifier for the item.
      "item_quantity": "integer" // Quantity of the item owned.
    }
  ],
  "stats": {
    "stars": "integer", // Any other relevant stats can be added here.
    "coins": "integer", // Any other relevant stats can be added here.
    "level": "integer", // User's level.
    "experience": "integer", // Experience points the user has earned.
    "achievements": "JSON", // Track achievements or milestones reached by the user.
    "badges": "JSON" // Track achievements or milestones reached by the user.
  },
  "profile": {
    "emoji": "string", // Emoji selected by the user.
    "color": "string", // Color selected by the user.
    "img_url": "string", // URL of the user's custom image (from Dicebear).
    "img_str": "string" // String used to create custom image (from Dicebear).
  }
}
```

## Discord Data Schema

```json
{
  "discord_user_id": "string",           // Unique identifier from Discord.
  "discord_username": "string",           // Discord username (e.g., `User#1234`).
  "avatar_url": "string",                 // URL to the Discord profile picture.
  "account_link_date": "timestamp",        // When the Discord account was linked to Dibumon.
  "account_unlink_date": "timestamp",     // When the Discord account was unlinked from Dibumon.
  "permissions": "JSON",                   // Store Discord-specific permissions for the app.
  "linked_channels": "JSON",              // Track linked Discord channels for notifications.
  "guild_id": "string",                   // ID of the Discord guild (server) where the user is connected.
  "settings": "JSON",                     // Store user-specific Discord settings.
  "status": "string"                      // Track the user’s online status (e.g., online, idle).
}
```
