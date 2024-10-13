const Pusher = require("pusher");
export const usePusher = () => {
  return new Pusher({
    appId: '1656287',
    key: '5dc49dcb74cc1f84b5fc',
    secret: '97cb2c2b4d8d50851953',
    cluster: 'eu',
    useTLS: true
  });
};
