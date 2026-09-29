# 모바일 지원 설계 문서

- 작성일: 2026-09-29
- 상태: 검토 대기
- 기반 문서: `2026-09-28-tetris-design.md` (게임 규칙은 그 문서를 따른다)

## 1. 개요

기존 PC용 테트리스를 휴대폰 세로 화면에서도 플레이할 수 있게 한다.

| 항목 | 결정 |
|---|---|
| 방향 | 세로만 지원. 가로로 눕히면 안내를 띄우고 일시정지 |
| 조작 | 화면 버튼 + 보드 제스처(드래그 추적형) 동시 지원 |
| 구현 방식 | Pointer Events 어댑터를 `platform`에 추가. 외부 의존성 없음 |
| 게임 규칙 | 변경 없음. `src/core`는 수정하지 않는다 |
| PC | 기존 배치와 키보드 조작을 그대로 유지 |

### 범위에서 제외

가로 모드 레이아웃, 진동 피드백, 조작 설정 화면, PWA 설치·오프라인 지원, 태블릿 전용 배치.

## 2. 아키텍처

### 2.1 추가·변경 모듈

```
src/
  platform/
    gestures.ts    (신규) 순수 로직. 포인터 좌표·시각 흐름 → InputEvent 목록
    touch.ts       (신규) Pointer Events를 받아 gestures와 버튼 처리에 연결
    input-hub.ts   (신규) 이벤트 큐, 여러 입력원 합치기, tap 도우미
  render/
    layout.ts      (신규) 순수 함수. 칸 크기 계산, 미디어 쿼리 상수
    canvas.ts      (변경) layout.ts로 칸 크기 계산, 현재 칸 크기 제공
    overlay.ts     (변경) 터치 기기용 안내 문구
  main.ts          (변경) 입력 합치기, 오버레이 탭, 가로 방향 처리
  style.css        (변경) CSS 그리드 배치, 모바일 배치, 버튼, 안전 영역
index.html         (변경) 그리드용 구조, 일시정지 버튼, 버튼 영역, 회전 안내
```

### 2.2 데이터 흐름

1. 화면 버튼과 보드 제스처가 `touch.ts`를 거쳐 기존과 같은 `InputEvent`(press, release, focusLost)로 바뀐다.
2. 오버레이 탭과 가로 방향 전환은 `main.ts`가 시스템 큐에 이벤트를 넣는다.
3. `input-hub.ts`가 키보드, 터치, 시스템 큐를 이 순서대로 이어 붙인다. 한 틱(약 16ms) 안에서의 순서라 게임에는 영향이 없다.
4. 게임 루프는 틱마다 `touch.tick(now)`로 제스처 시간을 진행시킨 뒤, 합친 이벤트를 `core/game.step`에 넘긴다.

### 2.3 원칙

- **core 불변:** 터치 입력도 기존 `InputEvent`만 쓴다. 버튼을 꾹 누르면 press만 보내고 떼면 release를 보내므로, DAS/ARR은 core가 그대로 처리한다.
- **판정은 순수 로직:** 제스처 판정(`gestures.ts`)과 칸 크기 계산(`layout.ts`)은 DOM 없이 입력과 출력만으로 테스트한다.
- **시계 주입:** 제스처와 틱은 같은 시계(`performance.now()`)를 주입받는다. 테스트에서는 가짜 시계를 넣는다.
- **배치는 CSS가, 크기 측정은 DOM이:** 상단 바, 버튼, 안전 영역 크기는 CSS만 알고 있다. JS는 보드가 들어갈 빈칸(`board-slot`)의 실제 크기를 재서 칸 크기를 정한다. `#board-slot`은 `ResizeObserver`로 감시하므로, 창 크기 변화 없이 빈칸 크기만 바뀌어도(점수판 줄바꿈, 주소창 표시, 폰트 로드 등) 다시 잰다.
- **수치는 상수:** 제스처 기준값은 `gestures.ts` 상단에 모아 기기 테스트 후 조정한다.

## 3. 화면 배치

### 3.1 공통 구조

`index.html`의 요소를 CSS 그리드 영역으로 배치한다. PC와 모바일은 같은 요소를 영역만 바꿔 배치한다.

| 요소 | 그리드 영역 |
|---|---|
| 점수판 `dl.stats` | stats |
| 일시정지 버튼 `#pause-btn` | pause (모바일에서만 보임) |
| HOLD `section.hold-box` | hold |
| 보드 빈칸 `#board-slot` (안에 보드와 오버레이) | board |
| NEXT `section.next-box` | next |
| 버튼 영역 `#controls` | controls (모바일 터치 기기에서만 보임) |

### 3.2 PC 배치 (화면 폭 700px 초과)

```
"hold  board next"
"stats board next"
```

기존 모습을 유지한다. 칸 크기는 기존 공식 `max(12, ⌊창 높이 × 0.85 ÷ 20⌋)`을 쓴다. 미리보기 칸은 보드 칸의 0.7배다.

### 3.3 모바일 배치 (화면 폭 700px 이하)

```
┌──────────────────────────────┐
│ SCORE 1,200  LV 3  LINES 24 ⏸│  "stats    pause"
├──────────────────────┬───────┤
│                      │ HOLD  │  "board    hold"
│     보드 10×20        │ NEXT  │  "board    next"
│   (제스처 영역)       │ ×5    │
├──────────────────────┴───────┤
│  [홀드]  [↺]  [↻]  [하드드롭] │  "controls controls"
│   [ ← ]     [ ↓ ]     [ → ]  │
└──────────────────────────────┘
```

- 그리드 열: `minmax(0, 1fr) 76px`. 행: `auto auto minmax(0, 1fr) auto`.
- 게임 전체를 `position: fixed; inset: 0`으로 화면에 고정한다. 안쪽 여백에 안전 영역(`env(safe-area-inset-*)`)을 더한다.
- `#board-slot`에는 `min-width: 0; min-height: 0; overflow: hidden`을 준다. 빈칸 크기가 캔버스 크기에 끌려가지 않게 하기 위해서다.
- 칸 크기 = `max(12, ⌊min((빈칸 폭 − 4) ÷ 10, (빈칸 높이 − 4) ÷ 20)⌋)`. 4는 보드 테두리(좌우 또는 상하 2px씩)다.
- 미리보기 칸은 보드 칸의 0.5배다. 오른쪽 열 76px 안에 5칸 폭 미리보기가 들어간다.
- 미리보기 칸은 모바일에서 최대 15px로 제한해 76px 열을 넘지 않는다.
- 버튼 영역은 터치 기기(`pointer: coarse`)에서만 보인다. 터치가 없는 좁은 PC 창에서는 버튼 영역이 없고, 그 높이만큼 보드가 커진다.
- 버튼 높이는 최소 56px다. 첫 줄 4개, 둘째 줄 3개로 폭을 나눈다.
- 실제 휴대폰에서는 버튼 영역과 브라우저 주소창 때문에 높이가 칸 크기를 정한다. 예: 보이는 영역 390×664에서 칸 약 23px, 360×560에서 약 18px.

### 3.4 가로 방향

`(pointer: coarse) and (orientation: landscape) and (max-height: 500px)`에 해당하면 "세로로 돌려 주세요" 안내를 화면 전체에 띄운다. 이 조건이 참이 되는 순간 터치 입력을 모두 해제하고 `focusLost`를 보내 일시정지한다. 같은 쿼리 문자열을 `layout.ts` 상수와 CSS에 둔다.

### 3.5 모바일 전용 처리

- 모바일 배치에서 `html`, `body`에 `overflow: hidden; overscroll-behavior: none`을 준다. 게임 영역 전체에 `touch-action: none`을 적용해 스크롤, 당겨서 새로고침, 두 번 탭 확대를 막는다.
- 텍스트 선택과 길게 누르기 메뉴를 막는다(`user-select: none`, `-webkit-touch-callout: none`).
- `index.html` viewport에 `viewport-fit=cover`를 추가한다.
- 오버레이를 클릭하거나 탭하면 준비·게임오버에서는 `start`를, 일시정지에서는 `pause`를 보낸다. PC 마우스 클릭에서도 동작한다.
- 터치 기기에서는 오버레이 안내 문구를 터치용으로 바꾼다.

| 상태 | 키보드 기기 (기존) | 터치 기기 |
|---|---|---|
| ready | TETRIS / Enter 키로 시작 / 키 안내 2줄 | TETRIS / 화면을 탭해서 시작 / 탭 회전 · 좌우로 끌어 이동 · 아래로 끌어 소프트드롭 / 아래로 튕겨 하드드롭 · 위로 튕겨 홀드 |
| paused | 일시정지 / Esc 또는 P 키로 계속 | 일시정지 / 탭해서 계속 |
| gameover | 게임 오버 / 점수 N / Enter 키로 다시 시작 | 게임 오버 / 점수 N / 탭해서 다시 시작 |

## 4. 터치 조작

### 4.1 화면 버튼

| 버튼 (`data-action`) | Action |
|---|---|
| ← / → / ↓ | left / right / softDrop |
| 하드드롭 | hardDrop |
| ↻ / ↺ | rotateCW / rotateCCW |
| 홀드 | hold |
| ⏸ | pause |

- `data-action` 값은 알려진 Action 목록으로 검증한다. 모르는 값이면 그 버튼은 무시한다.
- `pointerdown`이면 press를 보낸다. 같은 포인터의 `pointerup`, `pointercancel`, `pointerleave` 중 먼저 오는 것에 release를 한 번 보낸다. 모바일 브라우저는 터치를 누른 요소에 자동으로 고정하므로, 보통은 손가락을 뗄 때 release가 나간다.
- 버튼마다 누르고 있는 포인터를 따로 추적하므로 여러 손가락을 동시에 쓸 수 있다. 이미 눌린 버튼에 두 번째 손가락이 닿으면 무시한다.
- 버튼은 마우스로도 동작한다.

### 4.2 보드 제스처

보드 캔버스의 `pointerType`이 `touch` 또는 `pen`인 포인터만 처리한다. 마우스는 무시한다. `pointerdown` 때 `setPointerCapture`로 포인터를 붙잡는다. 한 번에 한 포인터만 추적하고, 추적 중에 들어온 다른 포인터는 무시한다.

| 상수 | 값 | 의미 |
|---|---|---|
| `TAP_MAX_MOVE_PX` | 10 | 탭으로 볼 최대 이동 거리이자 방향을 정하는 거리 |
| `TAP_MAX_MS` | 250 | 탭으로 볼 최대 시간 |
| `SOFT_DROP_DELAY_MS` | 120 | 세로 방향이 정해진 뒤 소프트드롭을 시작하기까지의 시간 |
| `HARD_DROP_MIN_SPEED` | 1.0 px/ms | 하드드롭으로 볼 아래 방향 최소 속도 |
| `HOLD_MIN_DISTANCE_PX` | 40 | 홀드로 볼 위 방향 최소 거리 |
| `HOLD_MIN_SPEED` | 0.5 px/ms | 홀드로 볼 위 방향 최소 속도 |
| `VELOCITY_WINDOW_MS` | 80 | 속도를 계산할 최근 구간 |

판정 규칙:

1. **방향 결정:** 시작점에서 거리 `TAP_MAX_MOVE_PX` 이상 움직인 첫 순간에 한 번만 정한다. |dx| ≥ |dy|이면 가로, 아니면 세로 모드로 고정한다.
2. **탭:** 방향이 정해지지 않은 채 시작 후 `TAP_MAX_MS` 안에 떼면 `rotateCW`를 보낸다(press 후 곧바로 release). 시간을 넘기면 아무것도 보내지 않는다.
3. **가로 드래그:** 목표 칸 수 = (현재 x − 시작 x) ÷ 한 칸 폭을 0 쪽으로 버린 정수. 이미 보낸 칸 수와의 차이만큼 해당 방향의 press·release 쌍을 보낸다. 한 칸 폭은 렌더러의 현재 칸 크기(px)다. 손가락 위치와 블록 이동량이 항상 일치하고, 되돌아오면 반대 방향 이동이 나온다.
4. **아래 드래그:** 세로 모드이고 현재 y가 시작 y보다 아래일 때, 방향이 정해진 시점부터 `SOFT_DROP_DELAY_MS`가 지나면 `softDrop` press를 보낸다. 판정은 포인터 이동과 틱 양쪽에서 한다. 떼면 release를 보낸다.
5. **아래로 튕기기:** 세로 모드에서 뗄 때 최근 `VELOCITY_WINDOW_MS` 구간의 아래 방향 속도가 `HARD_DROP_MIN_SPEED` 이상이면, 눌린 softDrop을 먼저 release하고 `hardDrop`을 보낸다.
6. **위로 튕기기:** 세로 모드에서 뗄 때 시작점보다 `HOLD_MIN_DISTANCE_PX` 이상 위에 있고 위 방향 속도가 `HOLD_MIN_SPEED` 이상이면 `hold`를 보낸다.
7. **취소:** `pointercancel`이면 눌린 softDrop을 release하고 나머지는 보내지 않는다.

속도 = (마지막 샘플 y − 기준 샘플 y) ÷ 두 샘플의 시간 차이. 기준 샘플은 "마지막 시각 − `VELOCITY_WINDOW_MS`" 이전의 샘플 중 가장 늦은 것이다. 없으면 첫 샘플을 쓴다.

### 4.3 입력 합치기와 해제

- `input-hub.ts`는 `createEventQueue()`(push, drain), `mergeSources(...)`(여러 입력원을 이어 붙인 drain), `tap(action)`(press·release 쌍)을 제공한다.
- 창이 포커스를 잃거나 탭이 숨겨지면 키보드는 기존처럼 release와 `focusLost`를 보낸다. 터치 모듈도 눌린 버튼과 진행 중인 제스처를 모두 release로 정리한다.
- 같은 동작을 키보드와 터치로 동시에 누르다가 한쪽을 떼면 그 동작은 해제된다. 동시 사용은 드문 경우라 따로 처리하지 않는다.

## 5. 테스트와 품질

### 5.1 단위 테스트 (Vitest, DOM 없음)

- `gestures.ts`:
  - 10px 미만 이동, 250ms 안에 떼면 `rotateCW`. 10px 이상 움직이거나 250ms를 넘기면 회전하지 않는다.
  - 칸 폭 30px에서 오른쪽으로 95px 드래그하면 `right` 3회. 시작점 기준 35px 위치로 되돌아오면 `left` 2회.
  - 가로 모드로 고정된 뒤 세로로 흔들어도 `softDrop`이 나오지 않는다.
  - 아래로 천천히 끌면 방향 결정 120ms 뒤 `softDrop` press, 떼면 release.
  - 아래로 빠르게 튕기면 `hardDrop`만 나오고 `softDrop`은 나오지 않는다.
  - 오래 끌다가 마지막에 빠르게 튕겨도 `hardDrop`으로 인식한다.
  - 위로 튕기면 `hold`. 속도가 기준에 못 미치면 아무것도 보내지 않는다.
  - 두 번째 포인터는 무시한다. 취소하면 눌린 softDrop을 해제한다.
- `layout.ts`: 빈칸 크기 → 칸 크기(정수, 최소 12, 빈칸을 넘지 않음), PC 공식, 미리보기 칸 배율, 모바일 폭 경계(700 / 701).
- `input-hub.ts`: 큐 push·drain, 여러 입력원을 순서대로 합치기, `tap`.
- `touch.ts` (가짜 EventTarget과 가짜 시계): 버튼 press·release, 같은 버튼 두 번째 손가락 무시, `pointerleave` 해제, 보드 터치 탭 → 회전, 마우스 무시, blur 시 전부 해제, dispose, `data-action` 검증.
- 기존 테스트는 모두 통과해야 하며 `src/core`는 수정하지 않는다.

### 5.2 수동 확인

- 헤드리스 Edge를 모바일 에뮬레이션(390×844, dpr 3)과 PC(1000×800)로 띄워 준비 화면을 캡처한다. 가로 스크롤이 없고 모든 요소가 보이는지, PC 모습이 이전과 같은지 확인한다.
- 실제 휴대폰 (같은 와이파이에서 `npm run dev -- --host`로 띄운 주소로 접속):
  - 탭 회전, 드래그 이동, 소프트드롭, 튕겨서 하드드롭·홀드의 판정 느낌
  - 버튼을 꾹 누를 때 반복 이동
  - 스크롤, 당겨서 새로고침, 두 번 탭 확대가 일어나지 않는다
  - 가로로 눕히면 안내가 뜨고 일시정지된다
  - 노치와 홈 바에 요소가 가리지 않는다
  - 앱 전환 후 돌아오면 일시정지돼 있고 눌린 입력이 남지 않는다

### 5.3 품질 기준

- 기존 기준을 유지한다: TypeScript strict, ESLint, Prettier, `npm run check` 통과.
- 커버리지 설정의 대상에 `src/platform/gestures.ts`, `src/platform/input-hub.ts`, `src/render/layout.ts`를 추가한다. 대상 전체 라인 커버리지 90% 이상.

## 6. 완성 기준

- 폭 360~430px 세로 화면에서 가로 스크롤 없이 보드, HOLD, NEXT 5개, 버튼이 모두 보인다.
- 터치만으로 시작부터 게임오버, 재시작까지 할 수 있다.
- PC 배치와 키보드 조작이 이전과 똑같이 동작한다. PC에서 마우스로 보드를 클릭해도 블록이 움직이지 않는다.
- `npm run check`가 통과한다.
