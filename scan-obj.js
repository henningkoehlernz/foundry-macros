function extend(prefix, sep, key) {
    return (prefix ? prefix + sep : '') + key;
}

// convert object into array of accessor strings
function flatten(obj, prefix='') {
    if (Object(obj) !== obj) // primitive type
        return [extend(prefix, ':', obj)];
    let acc = [];
    for (const key in obj) {
        const local_prefix = extend(prefix, '.', key);
        const flat_value = flatten(obj[key], local_prefix);
        if (flat_value.length === 0)
            acc.push(local_prefix);
        else
            acc.push(...flat_value);
    }
    return acc;
}

function scan(obj, keywords) {
    return flatten(obj).filter((s) => keywords.some((kw) => s.toLowerCase().includes(kw)));
}

console.log(scan(actor, ['prone', 'uncon']));
