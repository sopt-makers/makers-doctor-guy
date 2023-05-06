# 메이커스 의사양반

메이커스 서버들이 잘 동작 중인지 확인해주는 슬랙 봇

![select server screenshot](screenshots/server-select.png)
![server working screenshot](screenshots/result.png)

## 기능

- 서버 상태 체크 슬랙 명령어
  - 명령어 입력 시, 서버 선택 메시지 표시
  - 서버를 선택 시, 해당 서버 상태 검사
- 자동 서버 상태 체크
  - 1분 간격으로 서버들의 상태 검사
  - 서버에 문제가 있으면 슬랙에 메시지 전송
  - 오류 메시지는 30분 간격으로만 전송
  - 서버가 오류에서 회복되면 메시지 전송

## 기술 스택

- TypeScript
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Slack Web API](https://api.slack.com/docs)

## 배포 방법

1. 디펜던시 설치

```bash
yarn install
```

2. Cloudflare KV 세팅

```bash
yarn wrangler kv:namespace create main
yarn wrangler kv:namespace create main --preview
```

나온 출력의 id를 `wrangler.toml` 파일의 kv_namespaces 부분의 id로 바꾸기

3. Secret 세팅

```bash
yarn wrangler secret put SLACK_BOT_API_TOKEN
yarn wrangler secret put SLACK_SIGNING_SECRET
```

각각 명령어 실행 후, Secret 값 입력하기

4. 배포

```bash
yarn deploy
```
