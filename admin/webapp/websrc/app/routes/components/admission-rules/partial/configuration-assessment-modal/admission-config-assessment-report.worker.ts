/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  console.log("worker server");
  const response = `worker response to ${data}`;
  postMessage(response);
});
