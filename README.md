# LuxuryStays Project - Full Stack App

This is my full stack LuxuryStays booking application. In this project, users can list their property, book other properties, login using Google, and much more. I've used simple and clean code so anyone can understand it. Below are all the main features and tech I used.

Also, I want to mention that I took help from AI (like ChatGPT,COPILOT,DEEPSEEK) during the development of this project. It really helped me debug problems, structure the app, and improve code quality.

---

## Features

### 1. Property Listing

* Users can create, edit, delete, and view property listings.
* Every listing shows location on map using Google Maps API.
* Users can review properties after booking.

### 2. Booking System

* Complex logic to manage date overlaps, booking conflicts, and availability.
* Booking confirmation is sent by email.
* Users can cancel their bookings too.

### 3. Admin Dashboard

* Admin can approve or reject property listings.
* Admin can see all bookings, users, and logs.

### 4. Authentication

* Google OAuth for login/signup.
* JWT used to manage secure user sessions using HTTP-only cookies.
* Admin routes are protected using JWT and NGINX layer.

### 5. Deployment

* Project is containerized using Docker.
* Image pushed to AWS ECR.
* Then pulled and run on EC2 instance.
* Used NGINX as reverse proxy and Certbot for HTTPS.

### 6. Logs & Alerts

* Used Winston for logging all events and errors.
* If any error happens, I send the log using Nodemailer to my email and also to a Telegram bot.

### 7. Email System

* Used Nodemailer to send:

  * Booking confirmation
  * Contact us queries
  * Error notifications

### 8. Contact Form

* If a user faces any problem, they can contact us via a simple form.
* Message will go to my email and Telegram.

### 9. Google Maps

* Used Google Maps API to show listing location.
* Used address auto-fill and coordinates.

### 10. Frontend Animations

* Used GSAP to make animations like page transitions, smooth loading, etc.

### 11. Review System with Pagination

* Each listing shows reviews added by users.
* Only first 5 reviews are loaded initially to reduce database load.
* User can load more if they want.

### 12. Indexing and Pagination

* Added MongoDB indexes to speed up queries.
* Used pagination on listing pages, search and filters  to improve performance.

### 13. Chatbot (Planned)

* I’m planning to add a Dialogflow-based chatbot to help users with bookings and queries.

---

## Tech Stack

### Frontend

* HTML, CSS, JavaScript
* EJS (for views)
* GSAP (for animations)
* Bootstrap(for css)

### Backend

* Node.js
* Express.js
* MongoDB with Mongoose
* Redis (for caching)
* JWT + Google OAuth
* Nodemailer + Telegram Bot
* Winston (for logging)

### DevOps / Deployment

* Docker
* AWS EC2
* AWS ECR
* NGINX + Certbot
* Domain: `luxurystays.site`, Purchased From: Godaddy
* Elastic IP 

## Future Plans

* Add chatbot for user support
* Add payment system (Stripe or PayPal)
* Setup CI/CD pipeline using GitHub Actions

---

## My Info

Built by: Ayush Soni
GitHub: [@Ayush-soni-12](https://github.com/Ayush-soni-12)
Website Link : https://luxurystays.site/show


---



Thanks for reading!
