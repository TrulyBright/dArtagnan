[Need English?](#dartagnan)
# 달타냥
**달타냥**은 [총잡이 세 명이 결투를 하면 제일 명중률이 낮은 총잡이는 목표를 일부러 빗맞히는 게 최적해라는 게임 이론](https://en.wikipedia.org/wiki/Truel#Game_theory_overview:~:text=deliberate%20missing%20may%20be%20the%20best%20strategy%20for%20a%20duelist%20with%20lower%20accuracy%20than%20both%20opponents)에 기반하여 창작된 실시간 온라인 멀티플레이어 턴제 전략게임입니다. 원작 게임은 스타크래프트 2의 아케이드 [《총잡이 이론》](https://namu.wiki/w/총잡이%20이론#s-2)으로, 참신한 게임성과 재미에도 불구하고 스2를 설치해야만 플레이할 수 있는 탓에 접근성이 떨어지는 게 안타까워 브라우저만 있으면 플레이할 수 있도록 타입스크립트로 포팅했습니다.

## 설치
### 솔루션
**달타냥**은 다음 5개 솔루션을 사용합니다.
- 패키지 매니저: pnpm
- 번들러: Turbopack
- 트랜스파일러: SWC
- 포맷터와 린터: Biomejs
- 프리-커밋: Lefthook
### 설치법
`npm i -g pnpm`으로 `pnpm`을 설치하고 프로젝트의 루트 디렉터리에서 `pnpm i`를 실행하세요.

Turbopack의 권장사항대로 `pnpm i -g turbo`로 Turbo를 글로벌로도 설치할 것을 권합니다.

프리-커밋을 사용하시려거든 `pnpm lefthook install`을 실행하세요. 이후부터는 커밋 & 푸쉬할 때마다 lefthook이 작동합니다.

## 구조
**달타냥**은 서버와 클라이언트가 둘 다 타입스크립트로 짜여 있어 `.ts` 파일을 서버와 클라이언트가 빌드 시에 공유하는 것만으로도 API가 완성됩니다. 본 모노레포는 `/server`, `/client`, `/api` 총 3개 하위 패키지로 구성되어 있으며, 각 패키지의 역할은 다음과 같습니다.
- `/api`: 서버와 클라이언트가 공유하는 스키마가 들어 있습니다. 가령 `/api/src/room.ts`에 구현된 `RoomBase`는 게임방의 스키마를 정의하는데, 서버는 이 스키마를 빌드 시에 `import` 및 `implements`하고 서버에서만 사용되는 메소드까지 덧붙여서 실사용될 클래스 `Room`으로 만듭니다. 클라이언트에서도 동일한 작업을 반복해 실사용 클래스 `Room`으로 빌드합니다.
    - 액션과 이벤트 `Action` & `Event`: `/api`에 정의된 스키마 가운데 가장 중요한 스키마입니다. 액션은 클라이언트가 하고 싶은 행위이고, 이벤트는 게임에서 실제로 일어난 사건입니다. 클라이언트는 액션을 생성해 서버로 보내고, 서버는 이를 적절히 처리한 뒤 이벤트를 클라이언트로 보냅니다. 서버와 클라이언트가 주고받는 데이터는 무조건 액션 아니면 이벤트입니다.
- `/server`: 서버의 코드가 들어 있습니다. 클라이언트가 액션을 보내면 서버는 [커맨드 패턴](https://ko.wikipedia.org/wiki/커맨드_패턴)에 의거해 액션을 커맨드로 변환하여 적절히 처리하고, 게임에서 이벤트가 일어나면 JSON으로 변환해 보냅니다. **달타냥**의 모든 게임 로직은 서버가 계산합니다.
- `/client`: 클라이언트의 코드가 들어 있습니다. 유저가 입력을 하면 클라이언트는 액션을 생성하고 JSON화해서 서버에 보내고, 서버에서 이벤트를 보내면 [옵저버 패턴](https://ko.wikipedia.org/wiki/옵서버_패턴)을 따라 UI단의 여러 옵저버에게 이벤트를 전송해 화면을 그립니다. **달타냥**에서 클라이언트는 게임 로직에 관여하지 않으며 오로지 UI만을 처리합니다.

# *d'Artagnan*
*d'Artagnan* is a real-time online multiplayer turn-based strategic game inspired by a conclusion of game theory that in the duel of three shooters each with different accuracy, the most inaccurate one [had better miss](https://en.wikipedia.org/wiki/Truel#Game_theory_overview:~:text=deliberate%20missing%20may%20be%20the%20best%20strategy%20for%20a%20duelist%20with%20lower%20accuracy%20than%20both%20opponents). The original game is an arcade in StarCraft II called [*Gunman Theory*](https://namu.wiki/w/총잡이%20이론#s-2), but is only playable via SC2, being inaccessible to the public. I ported it to TypeScript so that you can play it with just a browser.

## Installation
### Solutions
*d'Artagnan* uses the following 5 solutions.
- Package Manager: pnpm
- Bundler: Turbopack
- Transpiler: SWC
- Formatter & Linter: Biomejs
- Pre-commit: Lefthook

For the client, Svelte & Vite are used.

### How to Install
Install `pnpm` with `npm i -g pnpm` and run `pnpm i` in the root directory of the project.

It is recommended to install Turbo globally with `pnpm i -g turbo` as recommended by Turbopack.

If you want to use pre-commit, run `pnpm lefthook install`. From then on, Lefthook will work every time you commit & push.

## Structure
*d'Artagnan* is written in TypeScript on both the server and the client, so the API is completed just by sharing `.ts` files between them at build time. This monorepo consists of 3 sub-packages: `/server`, `/client`, and `/api`, each with the following roles:
- `/api`: Contains schemas shared between the server and the client. e.g., `RoomBase` in `/api/src/room.ts` defines the schema of a room. The server imports and implements this schema at build time, adding server-only methods to create a class `Room` for actual use. The client repeats the same process to build another class `Room` for actual use.
    - `Action` and `Event`: The most important schemas among those defined in `/api`. An action is what the client wants to do, and an event is what actually happens in the game. The client creates an action and sends it to the server, which processes it appropriately and sends an event back to the client. Data exchanged between the server and the client is either an action or an event.
- `/server`: Contains the server's code. When the client sends an action, the server converts it into a command according to the [command pattern](https://en.wikipedia.org/wiki/Command_pattern), processes it appropriately, and sends an event in JSON format when an event occurs in the game. All game logic in *d'Artagnan* is calculated on the server.
- `/client`: Contains the client's code. When the user inputs something, the client creates an action, converts it into JSON, and sends it to the server. When the server sends an event, the client sends the event to multiple observers in the UI according to the [observer pattern](https://en.wikipedia.org/wiki/Observer_pattern) to render the screen. In *d'Artagnan*, the client is only responsible for the UI and does not involve in the game logic.