export const checkerList: CheckerEntry[] = [
  {
    name: "플레이그라운드 프로덕션",
    url: "https://playground.api.sopt.org",
    channel: "#makers-doctor",
    checker: checkPlaygroundAPIServer,
  },
  {
    name: "플레이그라운드 개발용",
    url: "https://playground.dev.sopt.org",
    channel: "#makers-doctor",
    checker: checkPlaygroundAPIServer,
  },
];

interface CheckerEntry {
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
