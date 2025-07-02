# GeoTag Pro - Student Payment Gateway Implementation-1

## Overview
GeoTag Pro is a professional geo-tagged photo platform for photographers and explorers. This implementation includes a student-friendly payment gateway integration using Razorpay's test mode.

## Student-Friendly Payment Gateway

This project uses **Razorpay Test Mode** which is perfect for students who:
- Don't have a business account
- Want to implement a payment system for educational purposes
- Need to test payment flows without real transactions

## Test Payment Details

You can use the following test card details to simulate payments:

- **Card Number**: 4111 1111 1111 1111
- **Expiry Date**: Any future date
- **CVV**: Any 3 digits
- **Name**: Any name

For UPI payments, you can use any UPI ID (e.g., `test@ybl`).

## Features

- Complete payment flow simulation
- Subscription management
- Payment history tracking
- Automatic upgrade/downgrade of user privileges
- Friend code redemption system

## Technical Implementation

- Uses Razorpay's JavaScript SDK
- Supabase Edge Functions to handle payment processing
- Database tables to track payment history
- Subscription tier management

## How It Works

1. User selects a subscription plan
2. Backend creates an order using Razorpay API
3. User completes payment in test mode
4. Backend verifies payment signature
5. User's account is upgraded to premium tier
6. Payment history is recorded

All of this happens in test mode, so no actual money is transferred.

## Benefits for Students

- Learn payment integration without a business account
- Practice implementing subscription models
- Understand payment security concepts
- Create portfolio projects with real-world features
- No risk of financial transactions