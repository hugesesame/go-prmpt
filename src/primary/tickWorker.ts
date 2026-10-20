// 時刻トリガー用の時計。タブが裏に回ると Chrome はページのタイマーを最大 1 分に 1 回まで間引くが、
// Worker のタイマーは間引かれにくいので、ここで刻んだ合図をページで受け取る。
// 間隔（ミリ秒）を送ると刻む間隔を変える
let timer = setInterval(() => postMessage(null), 200);

onmessage = (e: MessageEvent<number>) => {
  clearInterval(timer);
  timer = setInterval(() => postMessage(null), e.data);
};
