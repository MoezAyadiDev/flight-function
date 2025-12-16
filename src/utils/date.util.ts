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

export function isDateValid(value: number): boolean {
  try {
    const str = value.toString();

    // Must be exactly 8 digits
    if (!/^\d{8}$/.test(str)) return false;

    const year = parseInt(str.substring(0, 4), 10);
    const month = parseInt(str.substring(4, 6), 10);
    const day = parseInt(str.substring(6, 8), 10);

    // Basic checks
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    // Construct date object
    const date = new Date(year, month - 1, day);

    // Validate by checking that components match
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  } catch {
    return false;
  }
}

export function chaineToDate(madate: string) {
  return new Date(
    Number(madate.substring(0, 4)),
    Number(madate.substring(4, 6)) - 1,
    Number(madate.substring(6))
  );
}

export function chaineToDateOffset(madate: string) {
  return new Date(
    Number(madate.substring(0, 4)),
    Number(madate.substring(4, 6)) - 1,
    Number(madate.substring(6)),
    1,
    0,
    0
  );
}

export function dateToChaine(date: Date, format = "AAAA-MM-JJ") {
  var start = new Date(date);
  var mm = start.getMonth() + 1; // getMonth() is zero-based
  var dd = start.getDate();
  const joinCarac = format === "AAAA-MM-JJ" ? "-" : "";
  return [
    start.getFullYear(),
    (mm > 9 ? "" : "0") + mm,
    (dd > 9 ? "" : "0") + dd,
  ].join(joinCarac);
}

export function dateToNumber(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  return y * 10000 + m * 100 + d;
}

export function chaineToTimeTav(maDate: string) {
  const date = chaineToDateTav(maDate);
  return dateToTime(date);
}

function chaineToDateTav(maDate: string) {
  const datePart = maDate.split(" ")[0];
  const timePart = maDate.split(" ")[1];
  return new Date(
    Number(datePart.split(".")[2]),
    Number(datePart.split(".")[1]) - 1,
    Number(datePart.split(".")[0]),
    Number(timePart.split(":")[0]) + offsetHour,
    Number(timePart.split(":")[1])
  );
}

function dateToTime(date: Date) {
  var hh = date.getHours();
  var mm = date.getMinutes();
  return [(hh > 9 ? "" : "0") + hh, (mm > 9 ? "" : "0") + mm].join(":");
}

export function dateToTimeStampMinuit(date: Date) {
  const dateSearch = new Date(`${dateToChaine(date)}T01:00:00`);
  return Math.round(dateSearch.getTime() / 1000);
}

export function timeStampToNumber(date1: number) {
  return Number(timeStampToChaine(date1));
}

export function timeStampToChaine(date1: number) {
  return dateToChaine(new Date(date1 * 1000 + offset * 60 * 1000), "AAAAMMJJ");
}

export function timeStampNow() {
  return dateToTimeStamp(dateNow());
}

export function timeToNumber(time: string) {
  var tt = Number(time.split(":")[0]) * 60;
  tt += Number(time.split(":")[1]);
  return tt;
}

export function timeCompareNow(time: string) {
  const now = dateNow();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes - timeToNumber(time);
}

export function dateDifferenceDayNow(date1: Date) {
  let date2 = dateNow();
  let Difference_In_Time = date2.getTime() - date1.getTime();
  let Difference_In_Days = Math.round(Difference_In_Time / (1000 * 3600 * 24));
  return Difference_In_Days;
}

export function dateDifferenceNow(date1: Date) {
  let date2 = dateNow();
  let Difference_In_Time = date2.getTime() - date1.getTime();
  let Difference_In_Days = Math.floor(Difference_In_Time / (1000 * 3600 * 24));
  return Difference_In_Days;
}

export function dateNowNumber() {
  return dateToNumber(new Date());
}
