# Exercise 2 (hands-on): authentication with a reverse proxy

[فارسی](#فارسی) | [English](#english)

<a id="فارسی"></a>

<div dir="rtl" align="right">

## فارسی

### ۱) چطور سرویس را فقط روی شبکهٔ داخلی اجرا کنیم؟

سرویس را طوری اجرا می‌کنم که از بیرون هیچ مسیری به آن نباشد:

- پورت سرویس را به بیرون publish نمی‌کنم. در Docker یعنی در `ports:` چیزی برای آن ننوشته‌ام، پس فقط کانتینرهای داخل همان شبکه به آن می‌رسند.
- سرویس و پروکسی را در یک شبکهٔ داخلی (`internal: true` در `docker-compose.yml`) می‌گذارم. فقط پروکسی علاوه بر آن به یک شبکهٔ عمومی هم وصل است.
- روی یک سرور معمولی (بدون Docker) یعنی سرویس را روی `127.0.0.1` یا یک IP خصوصی bind کنیم (نه `0.0.0.0`) و با فایروال پورت آن را از بیرون ببندیم.

نتیجه: تنها راه رسیدن به سرویس از اینترنت، رد شدن از پروکسی است (پورت ۸۰ به پورت ۸۰۸۱ داخلی).

### ۲) TLS Termination

در این روش پروکسی کار HTTPS را انجام می‌دهد. اتصال TLS از کلاینت تا پروکسی رمز شده است، پروکسی آن را باز می‌کند (decrypt) و درخواست را داخل شبکهٔ داخلی با HTTP ساده به سرویس می‌فرستد.

دلیل این طراحی برای سرویس legacy:

- سرویس قدیمی اغلب TLS ندارد یا نسخهٔ TLS آن قدیمی و ناامن است. اگر پروکسی TLS را تمام کند، لازم نیست به سرویس دست بزنیم.
- گواهی (certificate) فقط یک جا نصب و تمدید می‌شود، نه روی هر سرویس.
- این برای ما مهم‌تر است: JWT یک bearer token است و هر کس آن را ببیند می‌تواند از آن استفاده کند. اگر اتصال بدون TLS باشد، توکن در اینترنت به‌صورت متن ساده می‌رود و دزدیده می‌شود. پس احراز هویت با JWT بدون TLS امن نیست.
- چون پروکسی درخواست را باز می‌کند، می‌تواند هدرها را بخواند و توکن را بررسی کند.

نکته: ارتباط پروکسی و سرویس رمز نیست، پس باید فقط در شبکهٔ داخلی مورد اعتماد باشد (که در بخش ۱ همین را ساختیم).

### ۳) پیاده‌سازی

یک reverse proxy کوچک با Node.js نوشته‌ام (بدون کتابخانهٔ خارجی). سرویس هم همان `go-httpbin` است.

**ساختار:**

- `proxy/server.js`: پروکسی. توکن را از هدر `Authorization: Bearer ...` می‌خواند، اگر معتبر بود درخواست را به سرویس می‌فرستد، و اگر نه جواب `401` می‌دهد.
- `proxy/jwt.js`: بررسی و ساخت JWT با الگوریتم HS256.
- `proxy/make-token.js`: ساخت توکن برای تست.
- `proxy/test.js`: تست‌های خودکار.
- `docker-compose.yml`: اجرای `go-httpbin` روی پورت ۸۰۸۱ (فقط شبکهٔ داخلی) و پروکسی روی پورت ۸۰.

**پروکسی چه چیزهایی را چک می‌کند:**

- هدر `Authorization` وجود داشته باشد و به شکل `Bearer <token>` باشد.
- الگوریتم دقیقاً `HS256` باشد (توکن با `alg: none` رد می‌شود).
- امضا درست باشد (مقایسه با `timingSafeEqual`).
- `exp` و `nbf` را چک می‌کند (توکن منقضی رد می‌شود).
- توکن را قبل از ارسال به سرویس حذف می‌کند و نام کاربر (`sub`) را در هدر `X-Authenticated-User` می‌فرستد.
- اگر سرویس در دسترس نباشد `502` برمی‌گرداند.

**اجرا:**

<div dir="ltr">

```bash
cd ex02-http/hands-on
cp .env.example .env              # JWT_SECRET را عوض کنید
docker compose up --build -d

# ساخت توکن
TOKEN=$(JWT_SECRET=<your-secret> node proxy/make-token.js student 3600)

curl -i http://localhost/get                                   # 401
curl -i -H "Authorization: Bearer $TOKEN" http://localhost/get  # 200
curl -i http://localhost:8081/get                               # از بیرون وصل نمی‌شود
```

</div>

برای اجرای تست‌ها (فقط Node.js لازم است):

<div dir="ltr">

```bash
cd ex02-http/hands-on/proxy
node --test test.js
```

</div>

> وضعیت تست: تست‌های خودکار با یک سرویس ساختگی اجرا و پاس شدند (۷ از ۷). `docker compose` را روی سیستم خودم کامل اجرا نکرده‌ام، پس قبل از تحویل یک بار اجرایش کنید.

### استفاده از هوش مصنوعی

کد پروکسی، تست‌ها و فایل‌های Docker را با کمک یک ابزار هوش مصنوعی نوشته‌ام. کد را خوانده‌ام و باید بتوانم هر خط آن را در جلسهٔ تحویل توضیح بدهم.

</div>

---

<a id="english"></a>

## English

### 1) How to run the service only on the internal network

I run the service so that there is no way to reach it from outside:

- I do not publish the service port. In Docker this means I wrote nothing for it in `ports:`, so only containers in the same network can reach it.
- I put the service and the proxy in an internal network (`internal: true` in `docker-compose.yml`). Only the proxy is also connected to a public network.
- On a normal server (without Docker), bind the service to `127.0.0.1` or a private IP (not `0.0.0.0`) and close its port from outside with a firewall.

Result: the only way to reach the service from the internet is through the proxy (port 80 to the internal port 8081).

### 2) TLS Termination

With this method the proxy does the HTTPS work. The TLS connection is encrypted from the client to the proxy, the proxy decrypts it, and it sends the request to the service with plain HTTP inside the internal network.

Why this design is good for a legacy service:

- An old service often has no TLS, or has an old and unsafe TLS version. If the proxy ends TLS, we do not need to change the service.
- The certificate is installed and renewed in one place, not on every service.
- This is the most important reason for us: a JWT is a bearer token, and anyone who sees it can use it. Without TLS the token goes over the internet as plain text and can be stolen. So JWT authentication is not safe without TLS.
- Because the proxy decrypts the request, it can read the headers and check the token.

Note: the connection between the proxy and the service is not encrypted, so it must stay only in a trusted internal network (which we built in part 1).

### 3) Implementation

I wrote a small reverse proxy with Node.js (no external library). The service is `go-httpbin`.

**Files:**

- `proxy/server.js`: the proxy. It reads the token from the `Authorization: Bearer ...` header, forwards the request to the service if the token is valid, and answers `401` if not.
- `proxy/jwt.js`: check and create JWT with HS256.
- `proxy/make-token.js`: makes a token for testing.
- `proxy/test.js`: automatic tests.
- `docker-compose.yml`: runs `go-httpbin` on port 8081 (internal network only) and the proxy on port 80.

**What the proxy checks:**

- The `Authorization` header exists and has the form `Bearer <token>`.
- The algorithm is exactly `HS256` (a token with `alg: none` is rejected).
- The signature is correct (compared with `timingSafeEqual`).
- It checks `exp` and `nbf` (an expired token is rejected).
- It removes the token before sending the request to the service, and sends the username (`sub`) in the `X-Authenticated-User` header.
- If the service is down, it returns `502`.

**How to run:**

<div dir="ltr">

```bash
cd ex02-http/hands-on
cp .env.example .env              # change JWT_SECRET
docker compose up --build -d

# make a token
TOKEN=$(JWT_SECRET=<your-secret> node proxy/make-token.js student 3600)

curl -i http://localhost/get                                   # 401
curl -i -H "Authorization: Bearer $TOKEN" http://localhost/get  # 200
curl -i http://localhost:8081/get                               # cannot connect from outside
```

</div>

To run the tests (only Node.js is needed):

<div dir="ltr">

```bash
cd ex02-http/hands-on/proxy
node --test test.js
```

</div>

> Test status: the automatic tests ran with a fake service and passed (7 of 7). I did not run the full `docker compose` on my machine, so please run it once before you submit.

### Use of AI

I wrote the proxy code, the tests and the Docker files with the help of an AI tool. I read the code, and I must be able to explain every line in the delivery session.
