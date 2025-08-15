function isBasicProperty(obj, prop) {
    const desc = Object.getOwnPropertyDescriptor(obj, prop);
    return desc && !desc['get'];
}

// flatten object into array of strings; filter result to keep size manageable
function flatScan(obj, filter, prefix='', depth=0) {
    // guard against infinite loops
    let acc = [];
    try {
        if (Object(obj) !== obj) { // possible primitive type
            if (typeof obj in ['number', 'string', 'boolean']) {
                let s = prefix ? prefix + ':' + obj : obj;
                if (filter(s))
                    acc.push(s);
            }
        } else {
            for (const key in obj) {
                const local_prefix = prefix ? prefix + '.' + key : key;
                if (!isBasicProperty(obj, key))
                    continue;
                const subscan = depth < 9 ? flatScan(obj[key], filter, local_prefix, depth + 1) : [];
                if (subscan.length === 0) {
                    if (filter(local_prefix))
                        acc.push(local_prefix);
                } else
                    acc.push(...subscan);
            }
        }
    } catch (error) {
        console.log(error);
    }
    return acc;
}

function kwScan(obj, keywords) {
    return flatScan(obj, (s) => keywords.some((kw) => s.toLowerCase().includes(kw)));
}

console.log(kwScan(actor, ['prone', 'uncon']));
console.log(kwScan(token.document, ['prone', 'uncon']));
