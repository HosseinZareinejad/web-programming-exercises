# Exercise 1: Git

[فارسی](#فارسی) | [English](#english)

<a id="فارسی"></a>

<div dir="rtl" align="right">

## فارسی

نام شاخه‌ها، فایل‌ها و کامیت‌ها در جواب‌ها فرضی هستند (مثل `main`، `feature`، `notes.txt` و `<commit>`).

### سؤال ۱: merge و rebase

هر دو تغییرات یک شاخه را وارد شاخهٔ دیگر می‌کنند. فرقشان در شکل تاریخچه است.

`git merge feature` (روی `main`) یک merge commit جدید با دو والد می‌سازد. کامیت‌های قبلی همان‌طور که بودند می‌مانند و تاریخچه نشان می‌دهد که دو شاخه کی به هم رسیدند.

`git rebase main` (روی `feature`) کامیت‌های `feature` را برمی‌دارد و دوباره بعد از آخرین کامیت `main` می‌چیند. این کامیت‌ها شناسهٔ جدید می‌گیرند و تاریخچه یک خط صاف می‌شود.

<div dir="ltr">

```text
merge:   A---B---C---D-----M    (main)
              \           /
               E---------F      (feature)

rebase:  A---B---C---D---E'---F'  (feature on top of main)
```

</div>

برای وارد کردن یک شاخه در `main`، یا شاخه‌ای که push شده و بقیه هم دارندش، `merge` را انتخاب می‌کنم، چون چیزی را بازنویسی نمی‌کند. برای شاخهٔ شخصی که هنوز push نکرده‌ام (مثلاً قبل از pull request که می‌خواهم از `main` عقب نباشد) از `rebase` استفاده می‌کنم، چون تاریخچه تمیزتر می‌شود. کامیت‌هایی که push شده‌اند را rebase نمی‌کنم.

### سؤال ۲: انتخاب بخشی از تغییرات

hunk یک تکه از تغییرات پشت‌سرهم در خروجی `git diff` است و با خطی مثل `@@ -10,6 +10,8 @@` شروع می‌شود. اگر در یک فایل چند تغییر نامرتبط دارم و فقط بعضی را برای کامیت بعدی می‌خواهم:

<div dir="ltr">

```bash
git add -p app.py       # hunk ها را یکی‌یکی نشان می‌دهد
git diff --staged       # چک می‌کنم چه چیزی staged شده
git commit -m "Fix null check"
```

</div>

برای هر hunk یک حرف می‌زنم: `y` یعنی اضافه کن، `n` یعنی رد کن، `s` یعنی hunk را به تکه‌های کوچک‌تر تقسیم کن، `e` یعنی دستی ویرایشش کن و `q` یعنی خروج. چیزهایی که اضافه نکردم در working tree می‌مانند و بعداً در کامیت دیگری می‌روند.

فایده‌اش این است که هر کامیت فقط یک کار انجام می‌دهد (مثلاً رفع باگ جدا از تغییر ظاهری). بررسی، revert و پیدا کردن خطا هم راحت‌تر می‌شود.

### سؤال ۳: یافتن منشأ خطا

`git bisect` با جستجوی دودویی کامیتی را پیدا می‌کند که خطا را وارد کرده. من یک کامیت بد و یک کامیت سالم به آن می‌دهم، Git کامیت وسط را checkout می‌کند، من تست می‌کنم و می‌گویم سالم است یا نه، و هر بار بازه نصف می‌شود.

<div dir="ltr">

```bash
git bisect start
git bisect bad              # کامیت فعلی خطا دارد
git bisect good v1.0        # این نسخه سالم بود
# تست کن، بعد بنویس: git bisect good  یا  git bisect bad
# تا Git بگوید "<commit> is the first bad commit"
git bisect reset            # برگشت به حالت اول
```

</div>

اگر تست خودکار دارم، `git bisect run ./test.sh` همهٔ این مراحل را خودش انجام می‌دهد.

مثال: بین `v1.0` و الان ۱۰۰۰ کامیت هست و صفحهٔ ورود خراب شده. با bisect حدود ۱۰ مرحله کافی است، نه ۱۰۰۰ مرحله. نتیجه هم یک کامیت مشخص با نویسنده و توضیح است، پس علت خطا راحت پیدا می‌شود.

### سؤال ۴: بررسی تغییرات پیش از کامیت

۱. با `git status` می‌بینم `README.md` هم در بخش staged است و هم در بخش not staged. `git diff` ویرایش‌هایی را نشان می‌دهد که بعد از `git add` انجام شده‌اند و هنوز staged نیستند. `git diff --staged` همان چیزی را نشان می‌دهد که در کامیت بعدی ثبت می‌شود. `git add` فقط یک عکس از فایل در همان لحظه می‌گیرد، برای همین دو دسته جدا هستند.

۲. با `git commit -m "..."` بدون `-a` فقط نسخهٔ staged ثبت می‌شود. ویرایش‌های بعدی در working tree می‌مانند و unstaged هستند. دلیلش این است که کامیت از staging area ساخته می‌شود نه از working tree. گزینهٔ `-a` است که فایل‌های tracked را قبل از کامیت خودکار stage می‌کند.

۳. خط `tmp/` را در فایل `.gitignore` می‌نویسم و آن را کامیت می‌کنم. اما این برای فایلی که قبلاً tracked شده کافی نیست، چون `.gitignore` فقط روی فایل‌های untracked اثر دارد. برای آن‌ها اول باید `git rm --cached <file>` (یا `git rm -r --cached tmp/` برای پوشه) بزنم و کامیت کنم. فایل روی دیسک می‌ماند ولی Git دیگر دنبالش نمی‌کند.

### سؤال ۵: merge conflict

۱. هر دو نفر یک خط را از نسخهٔ مشترک به دو شکل متفاوت عوض کرده‌اند و Git نمی‌داند کدام را نگه دارد. هر تغییر هم‌زمان conflict نمی‌شود. اگر دو نفر جاهای مختلف یک فایل را عوض کنند، Git خودش ادغام می‌کند. conflict فقط وقتی پیش می‌آید که تغییرها روی یک ناحیه باشند و فرق داشته باشند.

۲. بعد از `git merge feature-description` پیام `CONFLICT ... Merge conflict in README.md` می‌آید. `git status` هم فایل را زیر «Unmerged paths» (both modified) نشان می‌دهد. داخل فایل Git هر دو نسخه را با marker می‌گذارد:

<div dir="ltr">

```text
<<<<<<< HEAD
my version (main)
=======
teammate version (feature-description)
>>>>>>> feature-description
```

</div>

بین `<<<<<<<` و `=======` نسخهٔ من است و بین `=======` و `>>>>>>>` نسخهٔ هم‌تیمی. این خط‌ها فقط نشانه‌اند که بفهمم کجا باید تصمیم بگیرم و باید حذف شوند.

۳. مراحل:

<div dir="ltr">

```bash
# 1. README.md را باز می‌کنم، متن نهایی (هر دو تغییر را) می‌نویسم و markerها را پاک می‌کنم
git diff --check            # اگر marker جا مانده باشد گزارش می‌دهد
git add README.md           # یعنی این فایل حل شد
git status                  # چک می‌کنم چیز دیگری مانده یا نه
git commit                  # merge commit ثبت می‌شود (یا git merge --continue)
```

</div>

۴. اگر وسط کار بفهمم نباید الان merge می‌کردم، `git merge --abort` می‌زنم. این دستور merge را لغو می‌کند و همه‌چیز را به قبل از merge برمی‌گرداند. چون working tree از اول clean بود، چیزی از دست نمی‌رود.

### سؤال ۶: بازگرداندن تغییرات

۱. تغییر در `notes.txt` که staged نشده و دیگر نمی‌خواهمش:

<div dir="ltr">

```bash
git restore notes.txt
```

</div>

فایل از staging (که با آخرین کامیت یکی است) دوباره ساخته می‌شود، پس ویرایش‌هایم در working tree پاک می‌شوند. staging و تاریخچه و فایل‌های دیگر تغییر نمی‌کنند. این کار قابل برگشت نیست، پس اگر مطمئن نیستم اول `git stash push -- notes.txt` می‌زنم.

۲. تغییر `notes.txt` اشتباهی staged شده و کامیت نشده:

<div dir="ltr">

```bash
git restore --staged notes.txt
```

</div>

فایل از staging بیرون می‌آید ولی ویرایش‌هایم در working tree می‌مانند. تاریخچه هم تغییری نمی‌کند.

۳. کامیت اشتباه روی `main` که push شده و بقیه گرفته‌اند. اینجا `git revert` درست است:

<div dir="ltr">

```bash
git pull
git revert <commit>
git push origin main
```

</div>

`git revert` یک کامیت جدید می‌سازد که اثر کامیت اشتباه را خنثی می‌کند. تاریخچه دست نمی‌خورد و بقیه با یک `git pull` معمولی آن را می‌گیرند. حذف کامیت و `force push` مناسب نیست، چون تاریخچه‌ای را بازنویسی می‌کند که هم‌تیمی‌ها دارند. بعدش `main` آن‌ها با سرور فرق می‌کند، کامیت اشتباه ممکن است دوباره برگردد و حتی ممکن است کار تازهٔ کسی پاک شود.

### استفاده از هوش مصنوعی

برای ساختن ساختار مخزن و نوشتن پیش‌نویس این جواب‌ها از یک ابزار هوش مصنوعی کمک گرفته‌ام. جواب‌ها را خوانده‌ام و می‌توانم هر بخش را در جلسهٔ تحویل توضیح بدهم.

</div>

---

<a id="english"></a>

## English

The branch names, files and commit IDs here are made-up examples (like `main`, `feature`, `notes.txt` and `<commit>`).

### Question 1: merge and rebase

Both commands bring the changes of one branch into another branch. The difference is the shape of the history.

`git merge feature` (on `main`) makes a new merge commit with two parents. The old commits stay the same, and the history shows when the two branches joined.

`git rebase main` (on `feature`) takes the commits of `feature` and puts them again after the last commit of `main`. These commits get new IDs, and the history becomes one straight line.

I use `merge` when I put a branch into `main`, or when the branch is already pushed and other people have it, because it does not rewrite anything. I use `rebase` for my own branch that I did not push yet (for example, before a pull request, to be up to date with `main`), because the history is cleaner. I never rebase commits that are already pushed.

### Question 2: choosing part of the changes

A hunk is one block of connected changes in the `git diff` output. It starts with a line like `@@ -10,6 +10,8 @@`. If I have a few unrelated changes in one file and I want only some of them in the next commit:

<div dir="ltr">

```bash
git add -p app.py       # shows the hunks one by one
git diff --staged       # check what is staged
git commit -m "Fix null check"
```

</div>

For each hunk I type one letter: `y` to add it, `n` to skip it, `s` to split it into smaller hunks, `e` to edit it by hand, and `q` to quit. The changes I did not add stay in the working tree, and I can commit them later.

This is useful because each commit does one thing (for example, a bug fix separate from a style change). It is also easier to review, to revert, and to find bugs.

### Question 3: finding where a bug came from

`git bisect` uses binary search to find the commit that added the bug. I give it one bad commit and one good commit. Git checks out the commit in the middle, I test it and say good or bad, and the range gets half smaller each time.

<div dir="ltr">

```bash
git bisect start
git bisect bad              # the current commit has the bug
git bisect good v1.0        # this version was fine
# test, then type: git bisect good  or  git bisect bad
# until Git says "<commit> is the first bad commit"
git bisect reset            # go back to where I started
```

</div>

If I have an automatic test, `git bisect run ./test.sh` does all these steps by itself.

Example: there are 1000 commits between `v1.0` and now, and the login page is broken. With bisect I need about 10 steps, not 1000. The result is one exact commit with an author and a message, so it is easy to understand the cause.

### Question 4: checking changes before a commit

1. With `git status` I see `README.md` in both the staged part and the not-staged part. `git diff` shows the edits I made after `git add`, which are not staged. `git diff --staged` shows what will go into the next commit. `git add` takes a snapshot of the file at that moment, so the two parts are separate.

2. With `git commit -m "..."` and no `-a`, only the staged version is saved. The later edits stay in the working tree as unstaged. The reason is that a commit is made from the staging area, not from the working tree. The `-a` option is the one that stages tracked files automatically before the commit.

3. I write `tmp/` in the `.gitignore` file and commit it. But this is not enough for a file that is already tracked, because `.gitignore` only works for untracked files. For those files I first run `git rm --cached <file>` (or `git rm -r --cached tmp/` for a folder) and commit. The file stays on my disk, but Git stops tracking it.

### Question 5: merge conflict

1. Both people changed the same line in two different ways, so Git does not know which one to keep. Not every change at the same time makes a conflict. If two people change different places in a file, Git merges them by itself. A conflict happens only when the changes are in the same area and they are different.

2. After `git merge feature-description` I see a `CONFLICT ... Merge conflict in README.md` message, and `git status` shows the file under "Unmerged paths" (both modified). Inside the file, Git puts both versions with markers:

<div dir="ltr">

```text
<<<<<<< HEAD
my version (main)
=======
teammate version (feature-description)
>>>>>>> feature-description
```

</div>

My version is between `<<<<<<<` and `=======`, and my teammate's version is between `=======` and `>>>>>>>`. These lines are only signs that show me where to decide, and I must delete them.

3. The steps:

<div dir="ltr">

```bash
# 1. open README.md, write the final text (with both changes) and delete the markers
git diff --check            # reports markers that I forgot
git add README.md           # tells Git this file is solved
git status                  # check that nothing else is left
git commit                  # saves the merge commit (or git merge --continue)
```

</div>

4. If I understand in the middle that I should not merge now, I run `git merge --abort`. It cancels the merge and brings everything back to the state before the merge. My working tree was clean at the start, so I lose nothing.

### Question 6: undoing changes

1. A change in `notes.txt` that is not staged and I do not want anymore:

<div dir="ltr">

```bash
git restore notes.txt
```

</div>

The file is restored from the staging area (which is the same as the last commit), so my edits in the working tree are deleted. The staging area, the history and the other files do not change. I cannot undo this, so if I am not sure, I run `git stash push -- notes.txt` first.

2. The change in `notes.txt` was staged by mistake and not committed:

<div dir="ltr">

```bash
git restore --staged notes.txt
```

</div>

The file leaves the staging area, but my edits stay in the working tree. The history does not change.

3. A wrong commit on `main` that is pushed and my teammates already have it. Here `git revert` is the right choice:

<div dir="ltr">

```bash
git pull
git revert <commit>
git push origin main
```

</div>

`git revert` makes a new commit that cancels the effect of the wrong commit. The history is not changed, and my teammates get it with a normal `git pull`. Deleting the commit and using `force push` is a bad idea, because it rewrites history that my teammates already have. Then their `main` is different from the server, the wrong commit can come back, and someone's new work can even be lost.

### Use of AI

I used an AI tool to help create the repo structure and write the first draft of these answers. I read the answers, and I can explain every part in the delivery session.
