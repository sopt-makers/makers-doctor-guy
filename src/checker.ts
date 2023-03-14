export const checkerList: CheckerEntry[] = [
  {
    name: "플레이그라운드 프로덕션 API",
    url: "https://playground.api.sopt.org",
    channel: "#makers-doctor",
    checker: checkPlaygroundAPIServer,
    mentions: "pg-be",
  },
  {
    name: "플레이그라운드 개발용 API",
    url: "https://playground.dev.sopt.org",
    channel: "#makers-doctor",
    checker: checkPlaygroundAPIServer,
    mentions: "pg-be",
  },
  {
    name: "공식홈페이지 프론트엔드 1",
    url: "https://sopt.org",
    channel: "#makers-doctor",
    checker: check200Response,
    mentions: "<@U04Q369QXLP>, <@U04QHN2DHBL>",
  },
  {
    name: "공식홈페이지 프론트엔드 2",
    url: "https://www.sopt.org",
    channel: "#makers-doctor",
    checker: check200Response,
    mentions: "<@U04Q369QXLP>, <@U04QHN2DHBL>",
  },
  {
    name: "공식홈페이지 API",
    url: "https://api.sopt.org",
    channel: "#makers-doctor",
    checker: check200Response,
    mentions: "<@U04Q369QXLP>, <@U04QHN2DHBL>",
  },
];

export interface CheckerEntry {
  name: string;
  url: string;
  channel: string;
  mentions?: string;
  checker: (url: string) => Promise<boolean>;
}

async function checkPlaygroundAPIServer(url: string) {
  try {
    const res = await fetch(url);
    const body = await res.text();

    return body.toLowerCase().includes("hello internal");
  } catch (e) {
    return false;
  }
}

async function check200Response(url: string) {
  try {
    const res = await fetch(url);

    return res.status === 200;
  } catch {
    return false;
  }
}
