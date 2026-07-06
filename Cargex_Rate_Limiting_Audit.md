# Cargex Platform: API Rate Limiting Security Audit

This document presents a comprehensive analysis of the API rate limiting configurations and policies implemented across all components of the Cargex project workspace.

---

## 1. High-Level Summary of Current Implementation

The Cargex project implements a single, unified rate limiter on the main server. The web portals and mobile applications (iOS and Android client-side projects) do not contain rate-limiting middleware or client-side request throttles, as they communicate directly with this central backend.

### The Global Rate Limiter
The Express backend server uses the standard `express-rate-limit` package to throttle incoming API calls globally.

* **File Location**: [server/server.js](file:///c:/Users/akash/OneDrive/Desktop/Projects/Cargex/server/server.js#L198-L204)
* **Library Used**: `express-rate-limit` (v6+ standard Node.js package)
* **Protected Endpoints**: Applied globally to all routes prefix-matched under `/api` (e.g. `/api/auth/*`, `/api/users/*`, `/api/drivers/*`, `/api/fare/*`, `/api/payments/*`, `/api/agency/*`).
* **Active Configuration**:
  * `windowMs`: `15 * 60 * 1000` (15-minute sliding window)
  * `max`: `300` maximum requests permitted per IP within the window duration.
  * `message`: JSON response body:
    ```json
    { "message": "Too many requests generated from this IP, please try again after 15 minutes" }
    ```
* **Store**: In-memory `MemoryStore` (default fallback, stores request hits in the server process RAM).
* **Trust Proxy**: **Not Configured** (Express setting `app.set('trust proxy', ...)` is missing from `server.js`).

---

## 2. Endpoint Protection Summary Table

Since there are no custom route-level overrides, all API paths share the same global limit bucket of 300 requests per IP per 15 minutes.

| Endpoint Path | Rate Limited | Method Used | Limit | Window | File Path |
|---|:---:|---|---|---|---|
| `/api/auth/login` | **Yes (Global)** | `express-rate-limit` | 300 requests | 15 mins | [server/server.js](file:///c:/Users/akash/OneDrive/Desktop/Projects/Cargex/server/server.js#L204) |
| `/api/auth/register` | **Yes (Global)** | `express-rate-limit` | 300 requests | 15 mins | [server/server.js](file:///c:/Users/akash/OneDrive/Desktop/Projects/Cargex/server/server.js#L204) |
| `/api/auth/google` | **Yes (Global)** | `express-rate-limit` | 300 requests | 15 mins | [server/server.js](file:///c:/Users/akash/OneDrive/Desktop/Projects/Cargex/server/server.js#L204) |
| `/api/users/bookings` (POST) | **Yes (Global)** | `express-rate-limit` | 300 requests | 15 mins | [server/server.js](file:///c:/Users/akash/OneDrive/Desktop/Projects/Cargex/server/server.js#L204) |
| `/api/users/bookings/:id/cancel` | **Yes (Global)** | `express-rate-limit` | 300 requests | 15 mins | [server/server.js](file:///c:/Users/akash/OneDrive/Desktop/Projects/Cargex/server/server.js#L204) |
| `/api/driver/accept` | **Yes (Global)** | `express-rate-limit` | 300 requests | 15 mins | [server/server.js](file:///c:/Users/akash/OneDrive/Desktop/Projects/Cargex/server/server.js#L204) |
| `/api/driver/start` | **Yes (Global)** | `express-rate-limit` | 300 requests | 15 mins | [server/server.js](file:///c:/Users/akash/OneDrive/Desktop/Projects/Cargex/server/server.js#L204) |
| `/api/driver/complete` | **Yes (Global)** | `express-rate-limit` | 300 requests | 15 mins | [server/server.js](file:///c:/Users/akash/OneDrive/Desktop/Projects/Cargex/server/server.js#L204) |
| `/api/driver/location` (POST) | **Yes (Global)** | `express-rate-limit` | 300 requests | 15 mins | [server/server.js](file:///c:/Users/akash/OneDrive/Desktop/Projects/Cargex/server/server.js#L204) |
| `/api/driver/update-profile` | **Yes (Global)** | `express-rate-limit` | 300 requests | 15 mins | [server/server.js](file:///c:/Users/akash/OneDrive/Desktop/Projects/Cargex/server/server.js#L204) |
| `/api/fare/calculate` | **Yes (Global)** | `express-rate-limit` | 300 requests | 15 mins | [server/server.js](file:///c:/Users/akash/OneDrive/Desktop/Projects/Cargex/server/server.js#L204) |
| `/api/payments/razorpay` | **Yes (Global)** | `express-rate-limit` | 300 requests | 15 mins | [server/server.js](file:///c:/Users/akash/OneDrive/Desktop/Projects/Cargex/server/server.js#L204) |
| `/api/admin/verify-driver` | **Yes (Global)** | `express-rate-limit` | 300 requests | 15 mins | [server/server.js](file:///c:/Users/akash/OneDrive/Desktop/Projects/Cargex/server/server.js#L204) |

---

## 3. Limit Exceeded Client Behavior

When a client IP exceeds the 300 requests limit within the 15-minute window, the Express server responds with:

* **HTTP Status Code**: `429 Too Many Requests`
* **Response Body**:
  ```json
  { "message": "Too many requests generated from this IP, please try again after 15 minutes" }
  ```
* **Response Headers**:
  * `X-RateLimit-Limit`: `300`
  * `X-RateLimit-Remaining`: `0`
  * `X-RateLimit-Reset`: Unix epoch timestamp when the 15-minute window resets and accepts requests again.
  * `Retry-After`: Time remaining (in seconds) until the reset timestamp.

---

## 4. Production Suitability Rating & Detailed Review

### **Production Suitability Rating: 3 / 10**
While having a basic global rate limiter is better than having none, the current implementation has several critical gaps that make it unsuitable for production environments.

### 📈 Strengths
* **Basic DoS Protection**: Prevents basic, un-coordinated denial of service attacks from a single client machine.
* **Low Initial Overhead**: The in-memory tracker is fast, requiring zero network calls to database/cache instances to validate count states.

### 📉 Weaknesses & Vulnerabilities
1. **Critical Reverse-Proxy Bug (No `trust proxy` Configuration)**:
   * **Problem**: Because `app.set('trust proxy', ...)` is not configured in `server.js`, Express does not read the `X-Forwarded-For` headers added by Nginx, Cloudflare, AWS Load Balancer, or Vercel routers.
   * **Consequence**: `req.ip` resolves to the local IP of your reverse proxy or gateway server rather than the client's actual IP. The rate limiter registers all global traffic under this single proxy IP, causing the limit to trigger globally and **block all legitimate users** from using the apps once 300 combined requests hit the server.
2. **In-Memory Volatility (Non-Scalable)**:
   * **Problem**: Uses `MemoryStore` to save IP hit counts.
   * **Consequence**: If the server restarts or if you deploy multiple server instances (e.g. behind a load balancer, PM2 cluster, or Vercel serverless functions), the rate limit state is not shared. Each instance tracks its own counts, allowing users to bypass limits by hitting different servers, and exhausting server RAM under distributed brute-forcing.
3. **No Specific Route-Level Limits**:
   * Critical endpoints (like Login, Registration, dynamic fare estimation) share the same high ceiling (300 requests/15 mins) as light telemetry fetches. This leaves your login system vulnerable to brute-force attacks.
4. **Unprotected Socket.io Events**:
   * Socket connections and events (like driver coordinate streams `driver_location_update` or chat events `send_message`) completely bypass Express middleware. An attacker can spawn high-frequency WebSocket traffic to exhaust server resources.
5. **OTP Verification Security Vulnerability**:
   * The actual pickup/dropoff verification codes (`pickupOtp`, `dropOtp`) are sent in plain text in the JSON payloads of active rides. Furthermore, the validation is performed client-side on the driver's device rather than server-side. An attacker can bypass the OTP screen entirely and post directly to `/api/driver/start` or `/api/driver/complete`.

---

## 5. Vulnerability & Abuse Recommendations

To transition the platform to production-grade security, we recommend replacing the global blanket limit with custom tiers:

### A. Authentication (Login / Registration)
* **Current Status**: Shared global limit (300 requests/15 mins).
* **Abuse Scenario**: Botnets performing distributed credential stuffing and password guessing.
* **Recommendation**: Limit to `5 requests per 5 minutes` per IP address and account email. Support IP-based progressive delays (`express-slow-down`) on repeated failures.

### B. dynamic Fare Engine scraping (/api/fare/calculate)
* **Current Status**: Shared global limit.
* **Abuse Scenario**: Competitors scripting price queries with varying weights and coordinates to scrape your pricing algorithm.
* **Recommendation**: Limit to `15 requests per 15 minutes` per authenticated user.

### C. Booking Creation requests (/api/users/bookings - POST)
* **Current Status**: Shared global limit.
* **Abuse Scenario**: Creating fake bookings to occupy drivers and manipulate local surge multipliers.
* **Recommendation**: Limit to `5 requests per 5 minutes` per authenticated user.

### D. File Vetting Uploads (/api/driver/update-profile)
* **Current Status**: Shared global limit.
* **Abuse Scenario**: Uploading massive files repeatedly to fill server storage or inflate cloud costs.
* **Recommendation**: Limit to `3 uploads per 10 minutes` and validate file sizes (limit payload to `5MB` for documents).

---

## 6. Audit Summary Checklist

* **Is my backend protected?**  
  * **Partially**. There is a basic `express-rate-limit` global middleware, but it is vulnerable to proxy IP grouping bugs and scales poorly across clustered server configurations.
* **Are login APIs protected?**  
  * **Weakly**. They share the generic global pool of 300 requests, which is too high to protect against brute-force attacks.
* **Are booking APIs protected?**  
  * **Weakly**. They share the generic global pool of 300 requests.
* **Are OTP APIs protected?**  
  * **No**. Verification codes are verified client-side; the server endpoints do not perform verification checks or apply validation rate limits.
* **Are upload APIs protected?**  
  * **Weakly**. They share the generic global pool of 300 requests.
* **Are payment APIs protected?**  
  * **Weakly**. They share the generic global pool of 300 requests.
  * **Are Socket.IO events protected?**  
  * **No**. WebSockets bypass Express middlewares completely. High-frequency telemetry updates have no rate limits.
* **Are mobile apps protected?**  
  * **No**. Mobile apps lack client-side throttle bounds.
* **Are website APIs protected?**  
  * **Weakly**. They connect to the same server and share the same global limit pool.
