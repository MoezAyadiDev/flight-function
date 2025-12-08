const offset = 60;
const offsetHour = offset / 60;

export function dateToTimeStamp(date: Date) {
  return Math.round(date.getTime() / 1000);
}

export function timeStampDifferenceNow(date1: number) {
  const dateDeb = toDate(date1);
  const dateFin = dateNow();

  var difference =
    dateFin > dateDeb
      ? dateFin.getTime() - dateDeb.getTime()
      : dateDeb.getTime() - dateFin.getTime();

  var daysDifference = Math.floor(difference / 1000 / 60 / 60 / 24);
  difference -= daysDifference * 1000 * 60 * 60 * 24;

  var hoursDifference = Math.floor(difference / 1000 / 60 / 60);
  difference -= hoursDifference * 1000 * 60 * 60;

  var minutesDifference = Math.floor(difference / 1000 / 60);
  difference -= minutesDifference * 1000 * 60;

  var secondsDifference = Math.floor(difference / 1000);

  return hoursDifference * 60 * 60 + minutesDifference * 60 + secondsDifference;
}

export function delay(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

function toDate(timeZone: number) {
  const date = new Date(timeZone * 1000);
  return new Date(
    date.getTime() + (offset + date.getTimezoneOffset()) * 60 * 1000
  );
}

export function dateNow() {
  const date = new Date();
  return new Date(
    date.getTime() + (offset + date.getTimezoneOffset()) * 60 * 1000
  );
}

//Average Time
export function avgTime(durations: number[]) {
  if (durations.length === 0) return undefined;
  var sum = 0;
  for (var i = 0; i < durations.length; i++) {
    sum += durations[i];
  }

  var avg = Math.round(sum / durations.length);

  // Math.floor(avg / 60);
  const finalHour = Math.floor(avg / (60 * 60));
  const finalMinut = Math.floor((avg - finalHour * 60 * 60) / 60);
  return {
    duration: avg,
    time: `${finalHour > 9 ? finalHour : "0" + finalHour}:${
      finalMinut > 9 ? finalMinut : "0" + finalMinut
    }`,
  };
}

export function timeStampToTime(date: number) {
  const maDate = toDate(date);
  var hh = maDate.getHours(); // getMonth() is zero-based
  var mm = maDate.getMinutes();
  return [(hh > 9 ? "" : "0") + hh, (mm > 9 ? "" : "0") + mm].join(":");
}

export function timeStampDifferenceMinute(date1: number, date2: number) {
  var difference = date2 - date1;

  var daysDifference = Math.floor(difference / 60 / 60 / 24);
  difference -= daysDifference * 60 * 60 * 24;

  var hoursDifference = Math.floor(difference / 60 / 60);
  difference -= hoursDifference * 60 * 60;

  var minutesDifference = Math.floor(difference / 60);
  difference -= minutesDifference * 60;

  return hoursDifference * 60 * 60 + minutesDifference * 60;
}

export function durationToChaine(duration: number) {
  const finalHour = Math.floor(duration / (60 * 60));
  const finalMinute = Math.round((duration - finalHour * 60 * 60) / 60);
  return `${finalHour > 9 ? finalHour : "0" + finalHour}:${
    finalMinute > 9 ? finalMinute : "0" + finalMinute
  }`;
}
