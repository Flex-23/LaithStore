# نشر التحديثات على السيرفر

كل شيء داخل مجلد المشروع. الحزمة الناتجة `deploy/store-deploy.tar.gz` مستثناة من git.

## على جهازك
```powershell
npm run pack
scp -P 2026 deploy\store-deploy.tar.gz maram@51.241.184.62:~/my-store/deploy/
```

## على السيرفر
```bash
ssh -p 2026 maram@51.241.184.62
cd ~/my-store
rm -rf .next
tar -xzf deploy/store-deploy.tar.gz
bash deploy/post-deploy.sh
pm2 restart my-store          # أو systemctl restart ... أو npm start
curl -s localhost:3000/api/health
```

## ملاحظات
- لا تشغّل `npm run build` على السيرفر؛ الناتج مبني مسبقاً.
- `.env` و`public/uploads` لا تُحزَّم ولا تُمَس على السيرفر.
- أول مرة فقط: `mkdir -p ~/my-store/deploy` على السيرفر قبل `scp`.
