# Dooble Base Jump — гра (без токена)

Це чиста версія гри: Doodle Jump-клон, готовий як Farcaster/Base Mini App,
без жодного блокчейн-функціоналу. Токен і винагороди можна додати пізніше
окремим кроком (є готовий контракт у попередній версії проєкту).

```
dbj-game/
  index.html                  # уся гра — HTML/CSS/JS в одному файлі
  .well-known/farcaster.json  # маніфест Mini App
```

## Локальний перегляд

```bash
cd dbj-game
python3 -m http.server 8080
# відкрити http://localhost:8080
```

## Деплой (найшвидший шлях — Vercel)

1. Заливаєш цю папку в GitHub-репозиторій (або перетягуєш напряму у Vercel — є drag&drop деплой без git).
2. На https://vercel.com → New Project → імпортуєш репозиторій → Deploy.
   Жодних build-налаштувань не треба, це статичний HTML.
3. Vercel дасть домен типу `dooble-base-jump.vercel.app` з готовим HTTPS.
4. У `index.html` (рядок з `fc:miniapp`) і в `.well-known/farcaster.json`
   заміни всі `YOUR_DOMAIN` на цей реальний домен.
5. Redeploy (Vercel робить це автоматично при новому пуші в git, або
   вручну кнопкою "Redeploy").
6. Перевір, що `https://твій-домен/.well-known/farcaster.json` реально
   відкривається в браузері — без цього Base App/Farcaster не визнає
   застосунок як Mini App.

## Підключення до Base App / Farcaster

1. Відкрий Warpcast → Settings → Developer Tools → Manifest Tool
   (інструмент може називатись трохи інакше залежно від поточної версії
   Warpcast — шукай "Mini App Manifest" в Developer Tools).
2. Вкажи свій домен, інструмент згенерує `accountAssociation`
   (`header`/`payload`/`signature`) — встав ці значення в
   `.well-known/farcaster.json` замість `REPLACE_WITH_YOUR_HEADER` і т.д.
3. Redeploy ще раз із фінальним маніфестом.
4. Постни в Farcaster посилання на свій домен — має розгорнутись
   як Mini App картка з кнопкою "🕹️ Play Dooble Base Jump".

## Далі, коли захочеш повернути токен

У попередній версії проєкту вже готові:
- `DoobleBaseJumpToken.sol` — ERC-20 DBJ, фіксований саплай 1 млрд
- `GameRewards.sol` — claim з холд-бонусом 1.5x, добовим лімітом і anti-sybil підходом через Farcaster FID

Просто попроси доклеїти цей функціонал назад у цю чисту версію гри,
коли буде готовність деплоїти контракти.
