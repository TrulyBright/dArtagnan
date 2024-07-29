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
    - 액션 `Action`과 이벤트 `Event`: `/api`에 정의된 스키마 가운데 가장 중요한 스키마입니다. 액션은 클라이언트가 하고 싶은 행위이고, 이벤트는 게임에서 실제로 일어난 사건입니다. 클라이언트는 액션을 생성해 서버로 보내고, 서버는 이를 적절히 처리한 뒤 이벤트를 클라이언트로 보냅니다. 서버와 클라이언트가 주고받는 데이터, 즉 네트워크를 오가는 데이터는 무조건 액션 아니면 이벤트입니다.
- `/server`: 서버의 코드가 들어 있습니다. 클라이언트가 액션을 보내면 서버는 [커맨드 패턴](https://ko.wikipedia.org/wiki/커맨드_패턴)에 의거해 액션을 커맨드로 변환하여 적절히 처리하고, 게임에서 이벤트가 일어나면 JSON으로 변환해 보냅니다. **달타냥**의 모든 게임 로직은 서버가 계산합니다.
- `/client`: 클라이언트의 코드가 들어 있습니다. 유저가 입력을 하면 클라이언트는 액션을 생성하고 JSON화해서 서버에 보내고, 서버에서 이벤트를 보내면 [옵저버 패턴](https://ko.wikipedia.org/wiki/옵서버_패턴)을 따라 UI단의 여러 옵저버에게 이벤트를 전송해 화면을 그립니다. **달타냥**에서 클라이언트는 게임 로직에 관여하지 않으며 오로지 UI만을 처리합니다.