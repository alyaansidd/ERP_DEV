const subscribers = new Map();
let nextSubscriberId = 1;

const safeWrite = (res, chunk) => {
  try {
    res.write(chunk);
    return true;
  } catch (error) {
    return false;
  }
};

export const subscribeAttendanceEvents = ({ res, canReceive }) => {
  const subscriberId = String(nextSubscriberId++);

  const heartbeat = setInterval(() => {
    safeWrite(res, 'event: ping\ndata: {"type":"ping"}\n\n');
  }, 25000);

  subscribers.set(subscriberId, {
    res,
    canReceive,
    heartbeat,
  });

  safeWrite(res, 'event: connected\ndata: {"type":"connected"}\n\n');

  return () => {
    const subscriber = subscribers.get(subscriberId);
    if (!subscriber) return;
    clearInterval(subscriber.heartbeat);
    subscribers.delete(subscriberId);
  };
};

export const emitAttendanceMarkedEvent = (payload) => {
  const data = JSON.stringify({
    type: 'attendance_marked',
    ...payload,
  });

  for (const [subscriberId, subscriber] of subscribers.entries()) {
    const shouldReceive = typeof subscriber.canReceive === 'function'
      ? subscriber.canReceive(payload)
      : true;

    if (!shouldReceive) continue;

    const ok = safeWrite(
      subscriber.res,
      `event: attendance_marked\ndata: ${data}\n\n`
    );

    if (!ok) {
      clearInterval(subscriber.heartbeat);
      subscribers.delete(subscriberId);
    }
  }
};
