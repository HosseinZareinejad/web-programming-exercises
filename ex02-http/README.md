# Exercise 2: HTTP (theory)

[فارسی](#فارسی) | [English](#english)

The hands-on part (JWT reverse proxy) is in [hands-on/](hands-on/README.md).

<a id="فارسی"></a>

<div dir="rtl" align="right">

## فارسی

### سؤال ۱: نسخه‌های HTTP

- **0.9:** فقط `GET` داشت. نه هدر داشت نه status code، فقط یک صفحهٔ HTML برمی‌گشت و اتصال بسته می‌شد.
- **1.0:** هدر و status code آمد، همین‌طور `POST` و `HEAD`. با `Content-Type` می‌شد غیر از HTML هم چیز فرستاد. ولی هنوز برای هر درخواست یک اتصال TCP جدید باز می‌شد.
- **1.1:** اتصال پایدار (keep-alive) پیش‌فرض شد، هدر `Host` اضافه شد (چند سایت روی یک IP)، chunked transfer، cache بهتر و متدهای `PUT` و `DELETE` و `OPTIONS`. pipelining هم داشت ولی عملاً به خاطر head-of-line blocking به درد نمی‌خورد.
- **2:** باینری شد (دیگر متنی نیست)، multiplexing یعنی چند درخواست هم‌زمان روی یک اتصال، فشرده‌سازی هدر با HPACK، و server push.
- **3:** روی QUIC سوار است، TLS 1.3 جزو خود پروتکل است، اتصال زودتر برقرار می‌شود و streamها از هم مستقل‌اند.

**چرا HTTP/3 از UDP استفاده می‌کند؟** در HTTP/2 همهٔ streamها روی یک اتصال TCP هستند، پس اگر فقط یک بسته گم شود TCP همهٔ streamها را نگه می‌دارد تا آن بسته دوباره برسد. یعنی head-of-line blocking از لایهٔ HTTP به لایهٔ TCP رفته بود و با HTTP/2 حل نشد. راه حل این بود که TCP را عوض کنند، ولی TCP داخل کرنل سیستم‌عامل‌ها و داخل تجهیزات شبکه (NAT، فایروال و ...) است و عملاً نمی‌شود عوضش کرد. برای همین QUIC را روی UDP ساختند و قابلیت اطمینان، ترتیب و کنترل ازدحام را خودش در سطح برنامه انجام می‌دهد. نتیجه این است که گم شدن یک بسته فقط همان stream را کند می‌کند، handshake سریع‌تر است و اگر شبکه عوض شود (مثلاً از Wi-Fi به اینترنت موبایل) اتصال قطع نمی‌شود.

### سؤال ۲: stateless و stateful

الف) در ارتباط stateless سرور بین دو درخواست چیزی از کلاینت یادش نمی‌ماند و هر درخواست باید همهٔ چیزی که لازم دارد را با خودش بیاورد.
در stateful سرور وضعیت کلاینت را نگه می‌دارد (مثلاً یک session) و جواب هر درخواست می‌تواند به درخواست‌های قبلی بستگی داشته باشد، مثل FTP و SSH.

ب) HTTP در دستهٔ stateless است. مشکل این است که سرور نمی‌داند دو درخواست از یک نفر هستند، پس چیزهایی مثل لاگین و سبد خرید به‌طور مستقیم ممکن نیست. برای حلش state را بیرون از پروتکل نگه می‌داریم: یا کوکی و session (سرور یک session ID می‌دهد و کلاینت در هر درخواست برمی‌گرداند) یا توکن مثل JWT که اطلاعات کاربر داخل خود توکن است. در عوض سرور ساده‌تر است و راحت‌تر scale می‌شود، چون هر سروری می‌تواند هر درخواستی را جواب بدهد.

### سؤال ۳: چالش client/server

الف) در این مدل فقط کلاینت می‌تواند شروع‌کنندهٔ ارتباط باشد و سرور خودش نمی‌تواند وقتی اتفاقی افتاد به کلاینت پیام بدهد. ولی webhook و چت و alerting همین را لازم دارند، یعنی سرور باید همان لحظه که رویداد رخ داد خبر بدهد.

ب) راه‌هایی که پیدا کردم:

- **Polling:** کلاینت هر چند ثانیه یک بار می‌پرسد چیز جدیدی هست یا نه. پیاده‌سازی‌اش ساده است ولی بیشتر درخواست‌ها بی‌فایده‌اند و پیام‌ها هم با تأخیر می‌رسند.
- **Long polling:** کلاینت درخواست می‌فرستد و سرور آن را باز نگه می‌دارد تا رویدادی بیاید. بعد جواب می‌دهد و کلاینت دوباره درخواست می‌فرستد. تأخیر کمتر از polling است.
- **SSE (Server-Sent Events):** یک اتصال HTTP باز می‌ماند و سرور هر وقت خواست داده می‌فرستد. فقط از سرور به کلاینت است.
- **WebSocket:** با یک درخواست HTTP (هدر Upgrade) شروع می‌شود و بعد اتصال دوطرفه می‌شود. برای چت از همه بهتر است.
- **Webhook:** گیرنده یک آدرس HTTP می‌دهد و سرور وقتی رویداد رخ داد به آن آدرس درخواست می‌فرستد. یعنی نقش‌ها برعکس می‌شوند و گیرنده باید خودش از بیرون در دسترس باشد.
- برای موبایل سرویس‌های push مثل FCM و APNs هستند، و پروتکلی مثل MQTT هم برای همین کار استفاده می‌شود.

### سؤال ۴: اجزای URL

`ss://asghar:1234!!@ss.myproxy.com:1234#shadowSocks1`

- scheme: `ss`
- userinfo: `asghar:1234!!` (username برابر `asghar` و password برابر `1234!!`)
- host: `ss.myproxy.com` (ساب‌دامین `ss` و دامنهٔ `myproxy.com`)
- port: `1234`
- path: ندارد
- query: ندارد
- fragment: `shadowSocks1` (بعد از `#`)

### سؤال ۵: status codeها

۱. **دیتابیس مشکل دارد و لاگین انجام نمی‌شود:** `503 Service Unavailable`، چون سرویس موقتاً کار نمی‌کند (می‌شود `Retry-After` هم گذاشت). اگر دلیلش را ندانیم `500` می‌دهیم. در هر حال تقصیر کاربر نیست پس `4xx` نمی‌شود.

۲. **نام‌کاربری وجود ندارد:** `401 Unauthorized`. `404` هم به ذهن می‌رسد ولی نباید استفاده شود چون به مهاجم می‌گوید این نام‌کاربری وجود ندارد. بهتر است جوابش با رمز اشتباه یکی باشد.

۳. **سایت به دامنهٔ دیگری رفته:** `301 Moved Permanently` و آدرس جدید در هدر `Location`. اگر بخواهیم متد درخواست (مثلاً POST) حفظ شود `308` بهتر است. اگر انتقال موقت بود `302` یا `307`.

۴. **تعداد درخواست‌های کاربر بیشتر از حد مجاز است:** `429 Too Many Requests` که معمولاً با `Retry-After` می‌آید.

۵. **تمدید JWT موفق بود و توکن جدید در هدر برگشت:** `200 OK`. درخواست درست انجام شده و منبع جدیدی ساخته نشده که `201` بخواهد. اگر بدنه‌ای نداشت `204` هم می‌شود.

۶. **کاربر از رنج IP تحریم‌شده است:** `451 Unavailable For Legal Reasons` چون دلیل محدودیت قانونی است و این کد دقیقاً برای همین ساخته شده. `403 Forbidden` هم قابل قبول است. من `451` را انتخاب می‌کنم چون دلیل را روشن‌تر می‌گوید.

### سؤال ۶: نوع پروکسی

۱. **استفاده از سرور داخلی دانشگاه به‌جای سرور مرکزی برای گرفتن پکیج‌ها:** forward proxy از نوع caching (همان mirror محلی). کلاینت‌ها داخل دانشگاه هستند و پروکسی از طرف آن‌ها پکیج را می‌گیرد و نگه می‌دارد تا دفعهٔ بعد دوباره دانلود نشود.

۲. **تقسیم درخواست‌ها بر اساس مبدأ جغرافیایی:** reverse proxy که نقش load balancer را دارد (مثل CDN). جلوی سرورها قرار می‌گیرد و درخواست را به نزدیک‌ترین سرور می‌دهد.

۳. **اضافه کردن احراز هویت به یک سرویس خیلی قدیمی:** reverse proxy به شکل gateway احراز هویت. جلوی سرویس می‌نشیند، هویت را چک می‌کند و بعد درخواست را رد می‌کند، بدون اینکه کد سرویس قدیمی عوض شود. در بخش عملی هم همین را ساختم.

### استفاده از هوش مصنوعی

برای پیش‌نویس این جواب‌ها و نوشتن کد پروکسی در بخش عملی از یک ابزار هوش مصنوعی کمک گرفته‌ام. جواب‌ها و کد را خوانده‌ام و باید بتوانم هر بخش را در جلسهٔ تحویل توضیح بدهم.

</div>

---

<a id="english"></a>

## English

### Question 1: HTTP versions

- **0.9:** Only `GET`. No headers and no status codes, the server just sent back an HTML page and closed the connection.
- **1.0:** Headers and status codes came, and also `POST` and `HEAD`. With `Content-Type` you could send things other than HTML. But it still opened a new TCP connection for every request.
- **1.1:** Persistent connections (keep-alive) by default, the `Host` header (many sites on one IP), chunked transfer, better caching, and `PUT`, `DELETE`, `OPTIONS`. It also had pipelining, but in practice it was not useful because of head-of-line blocking.
- **2:** Binary instead of text, multiplexing (many requests at once on one connection), header compression with HPACK, and server push.
- **3:** Runs on QUIC, TLS 1.3 is part of the protocol itself, the connection starts faster, and the streams are independent.

**Why does HTTP/3 use UDP?** In HTTP/2 all streams share one TCP connection, so if just one packet is lost TCP holds all the streams until that packet arrives again. So head-of-line blocking just moved from the HTTP layer to the TCP layer, and HTTP/2 did not fix it. The fix would be to change TCP, but TCP lives inside the OS kernel and inside network devices (NAT, firewalls, ...), so it is basically impossible to change. That is why QUIC was built on top of UDP, and it does reliability, ordering and congestion control by itself in user space. The result: a lost packet slows down only its own stream, the handshake is faster, and the connection survives a network change (for example Wi-Fi to mobile data).

### Question 2: stateless and stateful

a) In a stateless communication the server does not remember anything about the client between two requests, so every request has to carry everything it needs.
In a stateful one the server keeps the client's state (for example a session) and the answer to a request can depend on the earlier requests, like FTP and SSH.

b) HTTP is stateless. The problem is that the server does not know two requests are from the same person, so things like login and shopping carts do not work directly. To solve it we keep the state outside the protocol: either cookies and sessions (the server gives a session ID and the client sends it back with every request) or a token like JWT, where the user info is inside the token itself. The upside is that the server is simpler and scales easily, because any server can answer any request.

### Question 3: the client/server challenge

a) In this model only the client can start the communication, and the server cannot send a message to the client by itself when something happens. But webhooks, chat and alerting need exactly that, the server has to tell the client at the moment the event happens.

b) The solutions I found:

- **Polling:** the client asks every few seconds if there is anything new. It is easy to implement, but most requests are useless and messages arrive late.
- **Long polling:** the client sends a request and the server keeps it open until some event comes. Then it answers and the client sends a new request. The delay is smaller than polling.
- **SSE (Server-Sent Events):** one HTTP connection stays open and the server sends data whenever it wants. It is only server to client.
- **WebSocket:** it starts with an HTTP request (the Upgrade header) and then the connection becomes two-way. It is the best one for chat.
- **Webhook:** the receiver gives an HTTP address and when an event happens the server sends a request to that address. So the roles are reversed and the receiver itself must be reachable from outside.
- For mobile there are push services like FCM and APNs, and a protocol like MQTT is also used for this.

### Question 4: parts of the URL

`ss://asghar:1234!!@ss.myproxy.com:1234#shadowSocks1`

- scheme: `ss`
- userinfo: `asghar:1234!!` (username `asghar`, password `1234!!`)
- host: `ss.myproxy.com` (subdomain `ss`, domain `myproxy.com`)
- port: `1234`
- path: none
- query: none
- fragment: `shadowSocks1` (after `#`)

### Question 5: status codes

1. **The database has a problem and logins fail:** `503 Service Unavailable`, because the service is temporarily down (we can add `Retry-After`). If we do not know the reason we return `500`. Either way it is not the user's fault, so not `4xx`.

2. **The username does not exist:** `401 Unauthorized`. `404` comes to mind too, but it should not be used because it tells an attacker that this username does not exist. The answer should be the same as for a wrong password.

3. **The site moved to another domain:** `301 Moved Permanently` with the new address in the `Location` header. If the method (for example POST) must be kept, `308` is better. If the move is temporary, `302` or `307`.

4. **The user sent more requests than allowed:** `429 Too Many Requests`, usually with `Retry-After`.

5. **The JWT refresh worked and the new token came back in the header:** `200 OK`. The request was done correctly and no new resource was created that would need `201`. If there was no body, `204` is also possible.

6. **The user is from a sanctioned IP range:** `451 Unavailable For Legal Reasons`, because the restriction is for legal reasons and this code was made exactly for that. `403 Forbidden` is also acceptable. I choose `451` because it says the reason more clearly.

### Question 6: proxy type

1. **Using the university's internal server instead of the central server to get packages:** a forward proxy of the caching type (a local mirror). The clients are inside the university, and the proxy gets the package for them and keeps it so it does not need to be downloaded again.

2. **Splitting requests by geographic origin:** a reverse proxy acting as a load balancer (like a CDN). It sits in front of the servers and gives the request to the nearest one.

3. **Adding authentication to a very old service:** a reverse proxy as an authentication gateway. It sits in front of the service, checks the identity, and then passes the request on, without changing the old service's code. I built this in the hands-on part.

### Use of AI

I used an AI tool to help write the first draft of these answers and the proxy code in the hands-on part. I read the answers and the code, and I must be able to explain every part in the delivery session.
