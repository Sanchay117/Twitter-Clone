# Twitter Clone

A full-stack Twitter clone built with Node.js, Express, EJS, and Supabase for database functionality. This application replicates core Twitter features including posting, following users, messaging, and notifications.

## Live Demo

Access the deployed application at: [https://twit-8g9x.onrender.com/login](https://twit-8g9x.onrender.com/login)

## Features

### Core Functionality

-   **User Authentication**: Secure login and signup system
-   **Post Creation**: Create and view posts (tweets) with character limits
-   **Social Interactions**: Like, comment, and share posts
-   **User Relationships**: Follow other users and view friend relationships
-   **Real-time Messaging**: Private chat functionality between users
-   **Notifications**: Get alerts for likes, comments, and follows

### Additional Features

-   **Content Moderation**: Report inappropriate posts
-   **User Profiles**: View detailed profiles with post history
-   **Responsive Design**: Works on desktop and mobile devices
-   **Dark/Light Mode**: Theme switching capability

## Technologies Used

-   **Frontend**:

    -   EJS (Embedded JavaScript templates)
    -   Bootstrap 5 for responsive design
    -   Vanilla JavaScript for client-side functionality

-   **Backend**:

    -   Node.js with Express.js
    -   Supabase (PostgreSQL) for database operations
    -   Express-session for user authentication

-   **Database**:
    -   PostgreSQL relational database
    -   Comprehensive schema with tables for users, posts, comments, etc.

## Project Structure

```
Twitter-Clone/
├── public/                  # Static files and assets
├── views/                   # EJS templates for all pages
├── server.js                # Main application backend
├── createDB.sql             # Database schema definition
└── PopulateDB.sql           # Sample data for testing
```

## License

This project is licensed under the ISC License.
