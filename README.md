# PROJECT_TITLE: Auction Management System

# Overview: An auction management system - which have three roles: Admin, Seller, and Bidder. The application allows bidders (end user) to bid on

auction created by seller ( product approved by admin), and find a winner after auction close along with feedback system.

# GitHub https://github.com/masumkhan081/auction-platform

---

# Description (Role Wise)

# Admin:
1. Approves products added by seller, or cancel product request with a review note rather than disapprove.
2. view bidder-list, seller-list, auction-list etc.
3. manage product-categories

# Seller
1. create product request; every product must belong to a category, default status - PENDING
2. create auction with approved product only giving a valid auction s.t and e.t. , and can cancel it until auction is OPEN
3. can delete an auction if cancelled or pending (complete delete)
4. can delete a unsold auction only to deactivate it (Record will be available in db)
5. can give feedback on a closed auction to a bidder
6. can see profile detail, update profile, and view auction history

# Bidder: 
1. register as bidder, login, recover account ( forget password )
2. can place bids even below treshold, but must above - current highest+minimum required increment
3. a bid/bidder would not be declared winner if bid is below 50% of start price would be flagged for review
4. auction would be flagged if final price is below treshold
5. can give feedback on a closed auction to a seller
6. can see profile detail, update profile, and view bid history



# Tech Used
* node, express, mongodb, nodemailer, node-cron, multer, jwt, bcrypt, cryptojs


# DB Models
* User 
* Profile
* Category
* Product
* Auction
* Bid
* Feedback


# Authentication & Validations

- post & patch body validation with zod
- access controll with auth middleware based on role
- controll of status transition (from one status to another status) regarding product status/ auction status etc
- Auction time validations (start/end times) while converting it to standard utc time from given user time and time zone.
- Bid amount validation in the context of current highest, minimum increment value.

---

# Unhandled concerns/ Could be better

1. prevent sudden update of auction end time to prevent unfair advantage
2. notification could have sent to winner bidder at winning, to seller at auction start and end, to admin at new product request etc


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

