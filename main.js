const accumulatedTimeEl = document.getElementById('accumulated-time');
const sessionsEl = document.getElementById('sessions-list');
const sessionRowTemplateEl = document.getElementById('session-tmpl');
const consumeButtonEl = document.getElementById('consume');
const topUpButtonEl = document.getElementById('top-up');
const stopButtonEl = document.getElementById('stop');

let timeCredit = 0;

class Timer {
  constructor(interval, onUpdate) {
    this.interval = interval;
    this.onUpdate = onUpdate;
    this.startTime = 0;
    this.currentTime = 0;
    this.setIntervalRef = 0;
  }

  get elapsedTime() {
    return this.currentTime - this.startTime;
  }

  step = () => {
    this.currentTime = Date.now();
    this.onUpdate(this.elapsedTime);
  }

  start() {
    this.startTime = Date.now();
    this.currentTime = this.startTime;
    this.setIntervalRef = setInterval(this.step, this.interval);
  }

  stop() {
    clearInterval(this.setIntervalRef);
  }
}

function formatElapsedTime(elapsedTime, direction = elapsedTime) {
  const sign = direction >= 0 ? '+' : '-';

  const absElapsedTime = Math.abs(elapsedTime);
  const parts = {
    h: Math.floor(absElapsedTime / (1000 * 60 * 60)),
    m: Math.floor(absElapsedTime / (1000 * 60)) % 60,
    s: Math.floor(absElapsedTime / 1000) % 60
  }
  const timerString = Object
    .keys(parts)
    .map(key => parts[key].toString().padStart(2, '0'))
    .join(':');

  return `${sign}${timerString}`;
}

const timestampFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
    day: "numeric",
    month: 'short',
    hour: "numeric",
    minute: "numeric",
    second: 'numeric',
});

function formatTimestamp(dateTime) {
  return timestampFormatter.format(dateTime);
}

const timerButtonListener = (direction) => () => {
  let sessionTime = 0;
  let sessionStart = new Date();

  const sessionEl = sessionRowTemplateEl.content.cloneNode(true);
  const sessionTimeEl = sessionEl.querySelector('.session-time');
  if (direction === 1) {
    sessionTimeEl.classList.add('positive');
  } else {
    sessionTimeEl.classList.add('negative');
  }

  const timer = new Timer(1000, (elapsedTime) => {
    sessionTime = elapsedTime * direction;
    sessionTimeEl.textContent = formatElapsedTime(sessionTime, direction);
    
    const currentCredit = timeCredit + sessionTime
    accumulatedTimeEl.textContent = formatElapsedTime(currentCredit);

    if (currentCredit > 0 && !accumulatedTimeEl.classList.contains('positive')) {
      accumulatedTimeEl.classList.add('positive');
      accumulatedTimeEl.classList.remove('negative');
    }
    else if (currentCredit < 0 && !accumulatedTimeEl.classList.contains('negative')) {
      accumulatedTimeEl.classList.add('negative');
      accumulatedTimeEl.classList.remove('positive');
    }
  });

  sessionTimeEl.textContent = formatElapsedTime(timer.elapsedTime, direction);
  accumulatedTimeEl.textContent = formatElapsedTime(timeCredit);

  sessionEl.querySelector('.session-start').textContent = formatTimestamp(sessionStart)
  sessionsEl.prepend(sessionEl);

  timer.start();

  consumeButtonEl.classList.add('hidden');
  topUpButtonEl.classList.add('hidden');
  stopButtonEl.classList.remove('hidden');

  const stopButtonHandler = () => {
    timer.stop();
    timeCredit += timer.elapsedTime * direction;
    stopButtonEl.removeEventListener('click', stopButtonHandler);

    consumeButtonEl.classList.remove('hidden');
    topUpButtonEl.classList.remove('hidden')
    stopButtonEl.classList.add('hidden');

    saveSession({
      time: sessionTime,
      start: sessionStart.getTime(),
    });
  }

  stopButtonEl.addEventListener('click', stopButtonHandler);
}

consumeButtonEl.addEventListener('click', timerButtonListener(-1));
topUpButtonEl.addEventListener('click', timerButtonListener(1));

// ---

(function loadData() {
  const dataStr = localStorage.getItem('credits');

  const { totalCredit, sessions } = (dataStr !== null) ? JSON.parse(dataStr) : {
    totalCredit: 0,
    sessions: [],
  };

  timeCredit = totalCredit;
  accumulatedTimeEl.textContent = formatElapsedTime(timeCredit);
  if (timeCredit >= 0) {
    accumulatedTimeEl.classList.add('positive');
  } else {
    accumulatedTimeEl.classList.add('negative');
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const weekSessions = sessions.filter(session => {
    const sessionTimeStamp = new Date(session.start);
    return sessionTimeStamp > sevenDaysAgo;
  });

  weekSessions.forEach(session => {
    const sessionEl = sessionRowTemplateEl.content.cloneNode(true);
    const sessionTimeEl = sessionEl.querySelector('.session-time');
    const sessionStartEl = sessionEl.querySelector('.session-start');

    sessionTimeEl.textContent = formatElapsedTime(session.time);

    if (session.time >= 0) {
      sessionTimeEl.classList.add('positive');
    } else {
      sessionTimeEl.classList.add('negative');
    }

    sessionStartEl.textContent = formatTimestamp(session.start);

    sessionsEl.prepend(sessionEl);
  });

  localStorage.setItem('credits', JSON.stringify({
    totalCredit,
    sessions: weekSessions,
  }));
})();

function saveSession(session) {
  const { sessions } = JSON.parse(localStorage.getItem('credits'));

  localStorage.setItem('credits', JSON.stringify({
    totalCredit: timeCredit,
    sessions: [...sessions, session],
  }));
}