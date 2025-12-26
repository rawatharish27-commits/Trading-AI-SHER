# 🔌 Angel One API Setup Guide - SHER.AI Trading Platform

## 📋 Prerequisites

1. **Angel One Trading Account** with SmartAPI enabled
2. **TOTP Authenticator App** (Google Authenticator, Authy, etc.)

## 🚀 Step-by-Step Setup

### Step 1: Enable SmartAPI in Angel One App

1. Download and open the Angel One mobile app
2. Login to your trading account
3. Go to: **Profile > SmartAPI**
4. Click on "Enable SmartAPI"
5. Accept terms and conditions

### Step 2: Get API Credentials

After enabling SmartAPI, you'll get the following credentials:

1. **API Key**: `abc123...xyz` (24-character key)
2. **Client ID**: Your trading account ID
3. **Password**: Your Angel One app password
4. **TOTP Secret**: Generated for 2FA authentication

### Step 3: Generate TOTP Secret

**Method A: Via Angel One App (Recommended)**
1. Open Angel One app
2. Go to **Profile > SmartAPI**
3. Look for "TOTP Secret" or "2FA Setup"
4. Scan QR code with your authenticator app
5. Save the secret key (usually 16-32 characters)

**Method B: Manual TOTP Setup**
1. Install Google Authenticator or Authy app
2. Add new account manually
3. Enter the secret key provided by Angel One
4. You'll get 6-digit codes every 30 seconds

### Step 4: Test API Connection

Use Postman or curl to test:

```bash
# Generate JWT token
curl -X POST https://smartapi.angelbroking.com/publisher/v1/login \
  -H "Content-Type: application/json" \
  -d '{
    "clientcode": "YOUR_CLIENT_ID",
    "password": "YOUR_PASSWORD",
    "totp": "6_DIGIT_CODE"
  }'

# Expected response:
{
  "status": true,
  "data": {
    "jwtToken": "eyJhbGciOiJIUz...",
    "feedToken": "nse_cm|...",
    "refreshToken": "..."
  }
}
```

### Step 5: Configure in SHER.AI

#### For Development (Local):

Edit `.env` file:
```env
ANGEL_ONE_API_KEY=your_api_key_here
ANGEL_ONE_CLIENT_ID=your_client_id_here
ANGEL_ONE_PASSWORD=your_password_here
ANGEL_ONE_TOTP_SECRET=your_totp_secret_here
```

#### For Production (Cloud Run):

Using Google Cloud Secrets:
```bash
# Create secret file
cat > angel-one-creds.json << EOF
{
  "API_KEY": "your_api_key_here",
  "CLIENT_ID": "your_client_id_here",
  "PASSWORD": "your_password_here",
  "TOTP_SECRET": "your_totp_secret_here"
}
EOF

# Create secret
gcloud secrets create angel-one-creds --data-file=angel-one-creds.json
```

Or via Cloud Console:
1. Go to Google Cloud Console
2. Navigate to **Secret Manager**
3. Click **Create Secret**
4. Name: `angel-one-creds`
5. Paste your JSON credentials
6. Create secret

### Step 6: Connect Broker in SHER.AI

1. Start the application
2. Login to SHER.AI
3. Go to **Settings > Broker Configuration**
4. Enter your Angel One credentials:
   - API Key
   - Client ID
   - Password
   - TOTP Secret (or current TOTP code)
5. Click "Connect"

### Step 7: Verify Connection

After connecting, you should see:
- ✅ Broker Connected status
- ✅ Portfolio data loaded
- ✅ Real-time market data streaming
- ✅ Order placement enabled

## 🔧 Testing API Integration

### Test Market Data Fetch:

```bash
# Get historical candle data
curl -X POST https://smartapi.angelbroking.com/historical/v1/getCandleData \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exchange": "NSE",
    "symboltoken": "3045",
    "interval": "ONE_MINUTE",
    "fromdate": "2024-01-01 09:15",
    "todate": "2024-01-15 15:30"
  }'
```

### Test Order Placement (PAPER MODE):

```bash
# In PAPER mode, orders are simulated
# Test without real money risk!

curl -X POST http://localhost:8080/api/orders/place \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "RELIANCE",
    "quantity": 10,
    "side": "BUY",
    "orderType": "MARKET",
    "price": 0
  }'
```

## 📊 Available API Endpoints

### Market Data:
- `/api/broker/market-data` - Live market quotes
- `/api/broker/historical` - Historical candle data
- `/api/prices/live` - Real-time price streaming

### Portfolio:
- `/api/broker/portfolio/positions` - Current positions
- `/api/broker/portfolio/holdings` - Portfolio holdings
- `/api/broker/portfolio` - Portfolio summary

### Orders:
- `/api/broker/orders/place` - Place new order
- `/api/broker/orders/book` - Order book
- `/api/broker/orders/trades` - Trade history

### Account:
- `/api/broker/profile` - Account profile
- `/api/broker/funds` - Margin and funds
- `/api/broker/logout` - Disconnect broker

## ⚠️ Important Notes

### Security:
1. **Never commit** `.env` file or credentials to Git
2. Use **Google Cloud Secrets** for production
3. Enable **2FA (TOTP)** for all accounts
4. Rotate API keys regularly
5. Monitor for unauthorized access

### Trading Safety:
1. **Start with PAPER mode** for testing
2. Use small quantities initially
3. Set proper stop-loss levels
4. Monitor positions closely
5. Keep track of margins

### Rate Limits:
- Angel One API has rate limits (typically 10-20 requests/second)
- Implement request throttling
- Cache market data to reduce API calls
- Use WebSocket for real-time data streaming

## 🐛 Troubleshooting

### Issue: Invalid TOTP Code

**Solution:**
- Sync your authenticator app time
- Use a new TOTP code (they expire every 30 seconds)
- Check if TOTP secret is correct

### Issue: JWT Token Expired

**Solution:**
- The app handles token refresh automatically
- Check token expiry time
- Ensure persistent token storage is working

### Issue: Permission Denied

**Solution:**
- Verify API key is enabled
- Check if trading is allowed during market hours
- Ensure account has sufficient margin

### Issue: Market Data Not Loading

**Solution:**
- Check internet connection
- Verify exchange tokens are correct
- Ensure market is open (9:15 AM - 3:30 PM IST)
- Check API key permissions

## 📞 Support Resources

- Angel One SmartAPI Documentation: https://smartapi.angelbroking.com/
- Angel One Support: support@angelbroking.com
- SHER.AI Docs: Check application help section

## 🔗 Useful Links

- Angel One SmartAPI: https://smartapi.angelbroking.com/
- Google Authenticator: https://support.google.com/accounts/answer/1066447
- Authy: https://authy.com/

---

**Status:** ✅ Ready for Integration
**Mode:** Start with PAPER mode for testing, switch to LIVE when ready
