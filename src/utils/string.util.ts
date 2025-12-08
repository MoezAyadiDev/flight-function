export function compares(s1: string, s2: string[]) {
  for (let i = 0; i < s2.length; i++) {
    if (chaineInclude(s1, s2[i])) {
      return { text: s2[i], index: i, percent: 100 };
    }
  }
  const tableResult = [];
  let index = -1;
  let max = 0;
  for (let i = 0; i < s2.length; i++) {
    const compareResult = levenshtein(s1, s2[i]);
    if (max < compareResult) {
      index = i;
      max = compareResult;
    }
    tableResult.push({
      text: s2[i],
      index: i,
      percent: levenshtein(s1, s2[i]),
    });
  }
  if (max != 0) {
    return {
      text: s2[index],
      index: index,
      percent: max,
    };
  } else {
    return undefined;
  }
}

function chaineInclude(s1: string, s2: string) {
  const s1InS2 = s1.toUpperCase().indexOf(s2.toUpperCase());
  if (s1InS2 === -1) {
    const s2InS1 = s2.toUpperCase().indexOf(s1.toUpperCase());
    if (s2InS1 === -1) {
      return false;
    }
  }
  return true;
}

function levenshtein(s1: string, s2: string) {
  return (
    Math.round(similarity(s1.toUpperCase(), s2.toUpperCase()) * 10000) / 100
  );
}

function similarity(s1: string, s2: string) {
  let longer = s1;
  let shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  const longerLength = longer.length;
  if (longerLength === 0) {
    return 1.0;
  }
  return (
    (longerLength - editDistance(longer, shorter)) /
    parseFloat(longerLength.toString())
  );
}

function editDistance(s1: string, s2: string) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i == 0) costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

export function encodeQuery(data: any) {
  const ret = [];
  for (const d in data)
    ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
  return ret.join("&");
}

export function occurence(arrayList: string[]): {
  key: string | number;
  count: number;
} {
  const counts: any = {};

  for (const num of arrayList) {
    counts[num] = counts[num] ? counts[num] + 1 : 1;
  }

  const keys = Object.keys(counts);
  let max = 0;
  let maxKey = "";
  keys.forEach((item) => {
    if (max < counts[item]) {
      max = counts[item];
      maxKey = item;
    }
  });
  return { key: maxKey, count: max };
}
