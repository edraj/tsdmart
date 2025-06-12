export const GetParamsAsString = (urlParams: any, joinArray = false): string => {
  const s = new URLSearchParams();

  // for every key, if value is undefined, or null, or false, exclude
  Object.keys(urlParams).forEach(n => {
    const v = urlParams[n];
    if (v) {
      if (v instanceof Array) {
        if (v.length) {
          // filter out empty strings
          if (joinArray) {
            const _v = v.filter(x => x && x !== '').join(',');
            if (_v) { s.append(n, _v); }
          } else {
            // lookout for this, it might need an [] in the key
            // append multiple if joinArray is false
            v.filter(x => x !== '').forEach(f => s.append(n, f));
          }
        }
      } else {
        // append key and value
        s.append(n, v);
      }
    }
  });
  return s.toString();

};
