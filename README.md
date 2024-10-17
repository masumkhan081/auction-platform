# PROJECT_TITLE: Auction Management System

# Overview: An auction management system - which have three roles: Admin, Seller, and Bidder. The application allows bidders (end user) to bid on

auction created by seller ( product approved by admin), and find a winner after auction close along with feedback system.

# GitHub https://github.com/masumkhan081/auction-platform

---

# Features (Role Wise)

# Admin:
1. Approves products added by seller, view bidder-list, seller-list, auction-list etc.
2. 

# Seller
1. create product request
2. create auction with approved product giving a valid auc. start time and end time
3. can give feedback on a closed auction to a bidder

# Bidder: 
1. register as bidder, login, recover account ( forget password )
2. can place bids
3. can give feedback on a closed auction to a seller
---

# Tech Used
* node, express, mongodb, nodemailer, node-cron, multer, jwt, bcrypt, cryptojs
---

# DB Models

User
Profile
Category
Product
Auction
Bid
Feedback


# Authentication & Validations

- post & patch body validation with zod
- access controll with auth middleware based on role
- controll of status transition (from one status to another status) regarding product status/ auction status etc
- Auction time validations (start/end times) while converting it to standard utc time from given user time and time zone.
- Bid amount validation in the context of current highest, minimum increment value.

---

# Unhandled concerns/ Could be better

1. prevent sudden update of auction end time to prevent unfair advantage
2.

---

# Setup Instructions

1. Clone the repository.
2. copy whole .env.example to create a new .env file 
3. npm install
4. npm run dev
5. import postman collection which is also to be found in git repo
6. an admin as user with role: ADMIN along with profile detail is already in db
7. For user wth role: SELLER or BIDDER  - register - veryfy mail - login - get token / generate test auth token to set it in p.m. header
8. postman environments preety much self explanatory

