# PROJECT_TITLE: Auction Management System

# Overview: An auction management system - which have three roles: Admin, Seller, and Bidder. The application allows bidders (end user) to bid on

auction created by seller ( product approved by admin), and find a winner after auction close along with feedback system.

# GitHub https://github.com/masumkhan081/auction-platform

---

# Features (Role Wise)

# Admin: Manages users, approves auctions, and monitors auction activities.

# Seller: Can create and manage auctions, view bids.

# Bidder: Can place bids, view available auctions, and track their bid status

---

# Tech Used

---

# DB Models

User
Profile
Category
Product
Auction
Bid


# Authentication & Validations

- post & patch body validation with zod
- access control with auth middleware based on role
- control of status transition (from one status to another status) regarding product status/ auction status etc
- Auction time validations (start/end times) while converting it to standard utc time from given user time and time zone.
- Bid amount validation in the context of current highest, minimum increment value.

---

# Unhandled concerns/ Could be better

1. prevent sudden update of auction end time.
2.

---

# Setup Instructions

1. Clone the repository.
2. Install dependencies.
3. Run the application.

# API Endpoints
